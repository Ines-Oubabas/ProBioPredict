# backend/predictions/views.py

"""Secure prediction APIs (mocked inference for now, production-ready structure)."""

from __future__ import annotations

import csv
import io
import re

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import Prediction, PredictionResult
from .services import run_inference


DNA_PATTERN = re.compile(r"^[ACGT]+$")
CSV_INJECTION_PREFIXES = ("=", "+", "-", "@")

DEFAULT_ALLOWED_EXTENSIONS = [".csv"]
DEFAULT_ALLOWED_MIME_TYPES = [
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "text/plain",
]
DEFAULT_EXPECTED_COLUMNS = ["sequence_id", "truncated_dna"]
DEFAULT_MAX_BYTES = 512 * 1024
DEFAULT_MAX_ROWS = 5000
DEFAULT_FREE_PLAN_LIMIT = 3


def _normalize_columns(values):
    return [str(v).strip().lower() for v in values if str(v).strip()]


def _map_result_label(predicted_class: str) -> str:
    normalized = str(predicted_class or "").strip().lower()
    if "safe" in normalized or "probiotic" in normalized:
        return "Probiotic"
    return "Non-probiotic"


class PredictionUploadView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "prediction_upload"
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        free_limit = int(getattr(settings, "PREDICTION_FREE_PLAN_LIMIT", DEFAULT_FREE_PLAN_LIMIT))
        user_prediction_count = Prediction.objects.filter(user=request.user).count()
        if user_prediction_count >= free_limit:
            return Response(
                {
                    "detail": (
                        f"Free plan limit reached: maximum {free_limit} predictions. "
                        "Please upgrade your plan to continue."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        dna_file = request.FILES.get("dna_file")
        if not dna_file:
            return Response(
                {"detail": "Missing required file field: dna_file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        max_bytes = int(getattr(settings, "PREDICTION_UPLOAD_MAX_BYTES", DEFAULT_MAX_BYTES))
        if dna_file.size > max_bytes:
            return Response(
                {"detail": f"File too large. Maximum allowed size is {max_bytes} bytes."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed_extensions = getattr(
            settings,
            "PREDICTION_UPLOAD_ALLOWED_EXTENSIONS",
            DEFAULT_ALLOWED_EXTENSIONS,
        )
        filename = str(dna_file.name or "").strip()
        lower_name = filename.lower()
        if not any(lower_name.endswith(ext.lower()) for ext in allowed_extensions):
            return Response(
                {"detail": "Invalid file extension. Only .csv files are allowed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed_mime_types = {
            str(v).strip().lower()
            for v in getattr(
                settings,
                "PREDICTION_UPLOAD_ALLOWED_MIME_TYPES",
                DEFAULT_ALLOWED_MIME_TYPES,
            )
            if str(v).strip()
        }
        incoming_mime = str(getattr(dna_file, "content_type", "") or "").strip().lower()
        if incoming_mime and incoming_mime not in allowed_mime_types:
            return Response(
                {"detail": "Invalid MIME type. Allowed types: " + ", ".join(sorted(allowed_mime_types))},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            decoded = dna_file.read().decode("utf-8-sig")
        except UnicodeDecodeError:
            return Response(
                {"detail": "CSV must be UTF-8 encoded."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not decoded.strip():
            return Response(
                {"detail": "CSV file is empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        stream = io.StringIO(decoded)
        reader = csv.DictReader(stream)

        expected_columns = _normalize_columns(
            getattr(
                settings,
                "PREDICTION_UPLOAD_EXPECTED_COLUMNS",
                DEFAULT_EXPECTED_COLUMNS,
            )
        )
        received_columns = _normalize_columns(reader.fieldnames or [])
        if received_columns != expected_columns:
            return Response(
                {"detail": "Invalid CSV columns. Expected exactly: " + ", ".join(expected_columns)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        max_rows = int(getattr(settings, "PREDICTION_UPLOAD_MAX_ROWS", DEFAULT_MAX_ROWS))
        validated_rows = []
        for index, row in enumerate(reader, start=2):
            if len(validated_rows) >= max_rows:
                return Response(
                    {"detail": f"Too many rows. Maximum allowed is {max_rows}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            sequence_id = str((row.get("sequence_id") or "")).strip()
            truncated_dna = str((row.get("truncated_dna") or "")).strip().upper()

            if not sequence_id:
                return Response(
                    {"detail": f"Row {index}: sequence_id is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not truncated_dna:
                return Response(
                    {"detail": f"Row {index}: truncated_dna is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if sequence_id.startswith(CSV_INJECTION_PREFIXES) or truncated_dna.startswith(
                CSV_INJECTION_PREFIXES
            ):
                return Response(
                    {
                        "detail": (
                            f"Row {index}: potential CSV injection detected in "
                            "sequence_id or truncated_dna."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not DNA_PATTERN.fullmatch(truncated_dna):
                return Response(
                    {
                        "detail": (
                            f"Row {index}: truncated_dna contains invalid characters. "
                            "Only A, C, G, T are allowed."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            validated_rows.append(
                {
                    "sequence_id": sequence_id,
                    "truncated_dna": truncated_dna,
                }
            )

        if not validated_rows:
            return Response(
                {"detail": "CSV contains no data rows."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            prediction = Prediction.objects.create(
                user=request.user,
                file_name=filename or "uploaded.csv",
                status=Prediction.STATUS_PENDING,
                model_mode=Prediction.MODEL_MODE_MOCK,
                row_count=len(validated_rows),
            )

            try:
                inference_results = run_inference(validated_rows)

                result_instances = []
                for item in inference_results:
                    result_instances.append(
                        PredictionResult(
                            prediction=prediction,
                            sequence_id=str(item.get("sequence_id") or "").strip(),
                            predicted_class=str(item.get("predicted_class") or "unknown").strip(),
                            confidence=float(item.get("confidence", 0.0)),
                            raw_output=item.get("raw_output"),
                        )
                    )

                PredictionResult.objects.bulk_create(result_instances)
                prediction.status = Prediction.STATUS_COMPLETED
                prediction.save(update_fields=["status"])
            except Exception:
                prediction.status = Prediction.STATUS_FAILED
                prediction.save(update_fields=["status"])
                raise

        results = [
            {
                "sequence_id": item["sequence_id"],
                "predicted_class": item["predicted_class"],
                "confidence": item["confidence"],
            }
            for item in inference_results
        ]

        return Response(
            {
                "message": "CSV validated successfully. Prediction is currently mocked.",
                "summary": {
                    "rows_received": len(validated_rows),
                    "columns": expected_columns,
                    "model_mode": "mock",
                    "prediction_id": prediction.id,
                },
                "results": results,
            },
            status=status.HTTP_200_OK,
        )


class PredictionHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        predictions = (
            Prediction.objects.filter(user=request.user)
            .prefetch_related("results")
            .order_by("-submitted_at")
        )

        payload = []
        for prediction in predictions:
            payload.append(
                {
                    "id": prediction.id,
                    "file_name": prediction.file_name,
                    "status": prediction.status,
                    "submitted_at": prediction.submitted_at,
                    "model_mode": prediction.model_mode,
                    "row_count": prediction.row_count,
                    "results": [
                        {
                            "id": result.id,
                            "sequence_id": result.sequence_id,
                            "predicted_class": result.predicted_class,
                            "confidence": result.confidence,
                            "created_at": result.created_at,
                        }
                        for result in prediction.results.all()
                    ],
                }
            )

        return Response({"count": len(payload), "predictions": payload}, status=status.HTTP_200_OK)


class PredictionDashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        free_limit = int(getattr(settings, "PREDICTION_FREE_PLAN_LIMIT", DEFAULT_FREE_PLAN_LIMIT))
        predictions_qs = (
            Prediction.objects.filter(user=request.user)
            .prefetch_related("results")
            .order_by("-submitted_at")
        )

        predictions = list(predictions_qs)
        used = len(predictions)
        remaining = max(free_limit - used, 0)

        latest_prediction = predictions[0] if predictions else None
        latest_result = latest_prediction.results.all()[0] if latest_prediction and latest_prediction.results.exists() else None

        recent_items = []
        for prediction in predictions[:5]:
            for result in prediction.results.all():
                recent_items.append(
                    {
                        "prediction_id": prediction.id,
                        "file_name": prediction.file_name,
                        "submitted_at": prediction.submitted_at,
                        "status": prediction.status,
                        "sequence_id": result.sequence_id,
                        "predicted_class": result.predicted_class,
                        "result_label": _map_result_label(result.predicted_class),
                        "confidence": result.confidence,
                    }
                )

        response_payload = {
            "plan": {
                "name": "Free",
                "limit": free_limit,
                "used": used,
                "remaining": remaining,
            },
            "latest_prediction": None,
            "latest_result": None,
            "recent_history": recent_items[:5],
        }

        if latest_prediction:
            response_payload["latest_prediction"] = {
                "id": latest_prediction.id,
                "file_name": latest_prediction.file_name,
                "status": latest_prediction.status,
                "submitted_at": latest_prediction.submitted_at,
                "model_mode": latest_prediction.model_mode,
                "row_count": latest_prediction.row_count,
            }

        if latest_result:
            response_payload["latest_result"] = {
                "prediction_id": latest_prediction.id,
                "sequence_id": latest_result.sequence_id,
                "predicted_class": latest_result.predicted_class,
                "result_label": _map_result_label(latest_result.predicted_class),
                "confidence": latest_result.confidence,
            }

        return Response(response_payload, status=status.HTTP_200_OK)


class SendPredictionResultEmailView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def post(self, request):
        payload = request.data if isinstance(request.data, dict) else {}

        summary = payload.get("summary") or {}
        results = payload.get("results")
        submitted_file_name = str(payload.get("submittedFileName") or "").strip()
        submitted_sequence_id = str(payload.get("submittedSequenceId") or "").strip()

        if not isinstance(results, list) or len(results) == 0:
            return Response(
                {"detail": "Invalid payload: results must be a non-empty list."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_email = str(getattr(request.user, "email", "") or "").strip()
        if not user_email:
            return Response(
                {"detail": "No email is configured for the authenticated account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rows_received = summary.get("rows_received")
        model_mode = str(summary.get("model_mode") or "mock").strip() or "mock"
        rows_label = rows_received if isinstance(rows_received, int) else len(results)

        subject = "ProBioPredict - Prediction result (mock mode)"
        body_lines = [
            "Project: ProBioPredict",
            f"Rows processed: {rows_label}",
            f"Mode: {model_mode}",
            "Info: prediction is currently mocked.",
            "Info: the real ML model will be integrated in a future version.",
        ]
        if submitted_file_name:
            body_lines.append(f"Submitted file: {submitted_file_name}")
        if submitted_sequence_id:
            body_lines.append(f"Sequence ID label: {submitted_sequence_id}")

        send_mail(
            subject=subject,
            message="\n".join(body_lines),
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=[user_email],
            fail_silently=False,
        )

        return Response(
            {
                "message": "Prediction result email sent successfully (dev backend mode).",
                "email_requested": True,
                "email_sent": True,
            },
            status=status.HTTP_200_OK,
        )