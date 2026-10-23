"""Prediction APIs: one CSV, one sequence, one Prediction, one result."""

from __future__ import annotations

import csv
import io
import logging
import math
import re

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from billing.models import UserSubscription, get_or_create_user_subscription

from .models import Prediction, PredictionResult


logger = logging.getLogger("predictions")

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


class InferenceFailure(Exception):
    """The inference service failed or returned an invalid result."""


def run_inference(rows):
    """Delegate unchanged to the existing service, imported only when needed."""
    from .services import run_inference as service_run_inference

    return service_run_inference(rows)


def _normalize_columns(values):
    return [str(value).strip().lower() for value in values]


def _map_result_label(predicted_class):
    normalized = str(predicted_class or "").strip().lower()

    if (
        "non-probiotic" in normalized
        or "non probiotic" in normalized
        or "nonprobiotic" in normalized
    ):
        return "Non-probiotic"

    if "safe" in normalized or "probiotic" in normalized:
        return "Probiotic"

    return "Non-probiotic"


def _plan_display_name(plan_key):
    if plan_key == UserSubscription.PLAN_PRO:
        return "Pro"
    if plan_key == UserSubscription.PLAN_LAB:
        return "Lab"
    return "Free"


def _get_user_plan_usage(user):
    subscription = get_or_create_user_subscription(user)
    used = Prediction.objects.filter(user=user).count()

    limit = subscription.prediction_limit
    is_unlimited = limit is None
    remaining = None if is_unlimited else max(int(limit) - used, 0)

    effective_plan_key = (
        subscription.plan
        if subscription.is_premium
        else UserSubscription.PLAN_FREE
    )

    return {
        "subscription": subscription,
        "plan_key": effective_plan_key,
        "plan_name": _plan_display_name(effective_plan_key),
        "status": subscription.status,
        "is_premium": subscription.is_premium,
        "limit": limit,
        "limit_label": subscription.prediction_limit_label,
        "used": used,
        "remaining": remaining,
        "is_unlimited": is_unlimited,
    }


def _serialize_plan_payload(plan_usage):
    return {
        "key": plan_usage["plan_key"],
        "name": plan_usage["plan_name"],
        "status": plan_usage["status"],
        "is_premium": plan_usage["is_premium"],
        "limit": plan_usage["limit"],
        "limit_label": plan_usage["limit_label"],
        "used": plan_usage["used"],
        "remaining": plan_usage["remaining"],
        "is_unlimited": plan_usage["is_unlimited"],
    }


def _quota_error_response(plan_usage):
    if (
        not plan_usage["is_unlimited"]
        and plan_usage["used"] >= int(plan_usage["limit"])
    ):
        return Response(
            {
                "detail": (
                    f"{plan_usage['plan_name']} plan limit reached: maximum "
                    f"{plan_usage['limit_label']} predictions. "
                    "Please upgrade your plan to continue."
                ),
                "plan": _serialize_plan_payload(plan_usage),
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    return None


def _get_prediction_result(prediction):
    try:
        return prediction.result
    except PredictionResult.DoesNotExist:
        return None


def _serialize_result(result):
    if result is None:
        return None

    return {
        "id": result.id,
        "sequence_id": result.sequence_id,
        "predicted_class": result.predicted_class,
        "confidence": result.confidence,
        "created_at": result.created_at,
    }


def _serialize_prediction_detail(prediction):
    return {
        "message": "Prediction loaded successfully.",
        "summary": {
            "rows_received": prediction.row_count,
            "columns": DEFAULT_EXPECTED_COLUMNS,
            "model_mode": prediction.model_mode,
            "prediction_id": prediction.id,
            "file_name": prediction.file_name,
            "status": prediction.status,
            "submitted_at": prediction.submitted_at,
            "is_pinned": prediction.is_pinned,
        },
        "result": _serialize_result(_get_prediction_result(prediction)),
    }


def _validate_inference_result(inference_results, expected_sequence_id):
    if not isinstance(inference_results, list) or len(inference_results) != 1:
        raise InferenceFailure(
            "The inference service must return exactly one result."
        )

    item = inference_results[0]
    if not isinstance(item, dict):
        raise InferenceFailure("The inference result must be an object.")

    sequence_id = item.get("sequence_id")
    if (
        not isinstance(sequence_id, str)
        or sequence_id.strip() != expected_sequence_id
    ):
        raise InferenceFailure("The inference sequence identifier is invalid.")

    predicted_class = item.get("predicted_class")
    if (
        not isinstance(predicted_class, str)
        or not predicted_class.strip()
        or len(predicted_class.strip()) > 100
    ):
        raise InferenceFailure("The inference classification is invalid.")

    confidence = item.get("confidence")
    if isinstance(confidence, bool) or not isinstance(confidence, (int, float)):
        raise InferenceFailure("The inference confidence is invalid.")

    confidence = float(confidence)
    if not math.isfinite(confidence) or not 0 <= confidence <= 1:
        raise InferenceFailure("The inference confidence must be between 0 and 1.")

    return {
        "sequence_id": sequence_id.strip(),
        "predicted_class": predicted_class.strip(),
        "confidence": confidence,
        "raw_output": item.get("raw_output"),
    }


class PredictionUploadView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "prediction_upload"
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        plan_usage = _get_user_plan_usage(request.user)
        quota_error = _quota_error_response(plan_usage)
        if quota_error is not None:
            return quota_error

        dna_files = request.FILES.getlist("dna_file")
        if len(dna_files) != 1 or len(request.FILES) != 1:
            return Response(
                {"detail": "Exactly one file is required in the dna_file field."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        dna_file = dna_files[0]
        max_bytes = int(
            getattr(settings, "PREDICTION_UPLOAD_MAX_BYTES", DEFAULT_MAX_BYTES)
        )

        if dna_file.size > max_bytes:
            return Response(
                {
                    "detail": (
                        f"File too large. Maximum allowed size is {max_bytes} bytes."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed_extensions = getattr(
            settings,
            "PREDICTION_UPLOAD_ALLOWED_EXTENSIONS",
            DEFAULT_ALLOWED_EXTENSIONS,
        )
        filename = str(dna_file.name or "").strip()

        if not any(
            filename.lower().endswith(extension.lower())
            for extension in allowed_extensions
        ):
            return Response(
                {"detail": "Invalid file extension. Only .csv files are allowed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed_mime_types = {
            str(value).strip().lower()
            for value in getattr(
                settings,
                "PREDICTION_UPLOAD_ALLOWED_MIME_TYPES",
                DEFAULT_ALLOWED_MIME_TYPES,
            )
            if str(value).strip()
        }
        incoming_mime = str(
            getattr(dna_file, "content_type", "") or ""
        ).strip().lower()

        if incoming_mime and incoming_mime not in allowed_mime_types:
            return Response(
                {
                    "detail": (
                        "Invalid MIME type. Allowed types: "
                        + ", ".join(sorted(allowed_mime_types))
                    )
                },
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

        expected_columns = _normalize_columns(
            getattr(
                settings,
                "PREDICTION_UPLOAD_EXPECTED_COLUMNS",
                DEFAULT_EXPECTED_COLUMNS,
            )
        )

        try:
            reader = csv.DictReader(io.StringIO(decoded), strict=True)
            received_columns = _normalize_columns(reader.fieldnames or [])

            if received_columns != expected_columns:
                return Response(
                    {
                        "detail": (
                            "Invalid CSV columns. Expected exactly: "
                            + ", ".join(expected_columns)
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Apply the same normalization to the actual dictionary keys.
            reader.fieldnames = received_columns
            validated_rows = []

            for index, row in enumerate(reader, start=2):
                # Business invariant: independent of configurable limits.
                if validated_rows:
                    return Response(
                        {
                            "detail": (
                                "CSV must contain exactly one data row. "
                                "Multiple sequences are not allowed."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if None in row or any(value is None for value in row.values()):
                    return Response(
                        {
                            "detail": (
                                f"Row {index}: expected exactly "
                                f"{len(expected_columns)} CSV fields."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                sequence_id = str(row.get("sequence_id") or "").strip()
                truncated_dna = str(
                    row.get("truncated_dna") or ""
                ).strip().upper()

                if not sequence_id:
                    return Response(
                        {"detail": f"Row {index}: sequence_id is required."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if len(sequence_id) > 255:
                    return Response(
                        {
                            "detail": (
                                f"Row {index}: sequence_id must not exceed "
                                "255 characters."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if not truncated_dna:
                    return Response(
                        {"detail": f"Row {index}: truncated_dna is required."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if sequence_id.startswith(
                    CSV_INJECTION_PREFIXES
                ) or truncated_dna.startswith(CSV_INJECTION_PREFIXES):
                    return Response(
                        {
                            "detail": (
                                f"Row {index}: potential CSV injection detected "
                                "in sequence_id or truncated_dna."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if not DNA_PATTERN.fullmatch(truncated_dna):
                    return Response(
                        {
                            "detail": (
                                f"Row {index}: truncated_dna contains invalid "
                                "characters. Only A, C, G, T are allowed."
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

        except csv.Error:
            return Response(
                {"detail": "Malformed CSV file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(validated_rows) != 1:
            return Response(
                {"detail": "CSV must contain exactly one data row."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                # Serialize uploads for this user before checking the quota.
                user = (
                    get_user_model()
                    .objects.select_for_update()
                    .get(pk=request.user.pk)
                )

                plan_usage = _get_user_plan_usage(user)
                quota_error = _quota_error_response(plan_usage)
                if quota_error is not None:
                    return quota_error

                prediction = Prediction.objects.create(
                    user=user,
                    file_name=filename or "uploaded.csv",
                    status=Prediction.STATUS_PENDING,
                    model_mode=Prediction.MODEL_MODE_REAL,
                    row_count=1,
                )

                try:
                    inference_results = run_inference(validated_rows)
                except Exception as exc:
                    raise InferenceFailure(
                        "The inference service failed."
                    ) from exc

                result_data = _validate_inference_result(
                    inference_results,
                    validated_rows[0]["sequence_id"],
                )

                PredictionResult.objects.create(
                    prediction=prediction,
                    **result_data,
                )

                prediction.status = Prediction.STATUS_COMPLETED
                prediction.save(update_fields=["status"])

                payload = _serialize_prediction_detail(prediction)
                payload["message"] = (
                    "CSV validated successfully. Prediction completed."
                )
                payload["plan"] = _serialize_plan_payload(
                    _get_user_plan_usage(user)
                )

        except InferenceFailure:
            logger.exception(
                "Prediction inference failed for user %s.",
                request.user.pk,
            )
            return Response(
                {
                    "detail": (
                        "Prediction could not be completed. "
                        "No prediction was saved and no quota was consumed. "
                        "Please try again later."
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(payload, status=status.HTTP_200_OK)


class PredictionHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        predictions = (
            Prediction.objects.filter(user=request.user)
            .select_related("result")
            .order_by("-is_pinned", "-submitted_at")
        )

        payload = [
            {
                "id": prediction.id,
                "display_label": f"Prediction #{prediction.id}",
                "file_name": prediction.file_name,
                "status": prediction.status,
                "submitted_at": prediction.submitted_at,
                "model_mode": prediction.model_mode,
                "row_count": prediction.row_count,
                "is_pinned": prediction.is_pinned,
                "result": _serialize_result(
                    _get_prediction_result(prediction)
                ),
            }
            for prediction in predictions
        ]

        return Response(
            {"count": len(payload), "predictions": payload},
            status=status.HTTP_200_OK,
        )


class PredictionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, prediction_id):
        prediction = get_object_or_404(
            Prediction.objects.select_related("result"),
            id=prediction_id,
            user=request.user,
        )
        return Response(
            _serialize_prediction_detail(prediction),
            status=status.HTTP_200_OK,
        )


class PredictionPinView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def patch(self, request, prediction_id):
        prediction = get_object_or_404(
            Prediction,
            id=prediction_id,
            user=request.user,
        )

        payload = request.data if isinstance(request.data, dict) else {}
        desired = payload.get("is_pinned")

        if not isinstance(desired, bool):
            return Response(
                {"detail": "Invalid payload: is_pinned must be a boolean."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        prediction.is_pinned = desired
        prediction.save(update_fields=["is_pinned"])

        return Response(
            {
                "id": prediction.id,
                "is_pinned": prediction.is_pinned,
                "message": (
                    "Prediction pinned."
                    if prediction.is_pinned
                    else "Prediction unpinned."
                ),
            },
            status=status.HTTP_200_OK,
        )


class PredictionDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, prediction_id):
        prediction = get_object_or_404(
            Prediction,
            id=prediction_id,
            user=request.user,
        )
        prediction.delete()

        return Response(
            {"message": "Prediction deleted successfully."},
            status=status.HTTP_200_OK,
        )


class PredictionDashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        plan_usage = _get_user_plan_usage(request.user)
        predictions = list(
            Prediction.objects.filter(user=request.user)
            .select_related("result")
            .order_by("-submitted_at")
        )

        latest_prediction = predictions[0] if predictions else None
        latest_result = (
            _get_prediction_result(latest_prediction)
            if latest_prediction is not None
            else None
        )

        recent_items = []
        for prediction in predictions:
            result = _get_prediction_result(prediction)
            if result is None:
                continue

            recent_items.append(
                {
                    "prediction_id": prediction.id,
                    "file_name": prediction.file_name,
                    "submitted_at": prediction.submitted_at,
                    "status": prediction.status,
                    "sequence_id": result.sequence_id,
                    "predicted_class": result.predicted_class,
                    "result_label": _map_result_label(
                        result.predicted_class
                    ),
                    "confidence": result.confidence,
                }
            )

            if len(recent_items) == 5:
                break

        response_payload = {
            "plan": _serialize_plan_payload(plan_usage),
            "latest_prediction": None,
            "latest_result": None,
            "recent_history": recent_items,
        }

        if latest_prediction is not None:
            response_payload["latest_prediction"] = {
                "id": latest_prediction.id,
                "file_name": latest_prediction.file_name,
                "status": latest_prediction.status,
                "submitted_at": latest_prediction.submitted_at,
                "model_mode": latest_prediction.model_mode,
                "row_count": latest_prediction.row_count,
            }

        if latest_result is not None:
            response_payload["latest_result"] = {
                "prediction_id": latest_prediction.id,
                "sequence_id": latest_result.sequence_id,
                "predicted_class": latest_result.predicted_class,
                "result_label": _map_result_label(
                    latest_result.predicted_class
                ),
                "confidence": latest_result.confidence,
            }

        return Response(
            response_payload,
            status=status.HTTP_200_OK,
        )


class SendPredictionResultEmailView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def post(self, request):
        payload = request.data if isinstance(request.data, dict) else {}
        summary = payload.get("summary")
        submitted_result = payload.get("result")

        if "results" in payload:
            return Response(
                {"detail": "Use result, not results."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(summary, dict):
            return Response(
                {"detail": "Invalid payload: summary must be an object."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        prediction_id = summary.get("prediction_id")
        if (
            isinstance(prediction_id, bool)
            or not isinstance(prediction_id, int)
            or prediction_id <= 0
        ):
            return Response(
                {
                    "detail": (
                        "Invalid payload: summary.prediction_id "
                        "must be a positive integer."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(submitted_result, dict) or not submitted_result:
            return Response(
                {
                    "detail": (
                        "Invalid payload: result must be a non-empty object."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        prediction = get_object_or_404(
            Prediction.objects.select_related("result"),
            id=prediction_id,
            user=request.user,
        )
        result = _get_prediction_result(prediction)

        if result is None:
            return Response(
                {"detail": "This Prediction has no result to send."},
                status=status.HTTP_409_CONFLICT,
            )

        user_email = str(
            getattr(request.user, "email", "") or ""
        ).strip()
        if not user_email:
            return Response(
                {
                    "detail": (
                        "No email is configured for the authenticated account."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Use stored data only; client-provided result fields are not trusted.
        subject = (
            f"ProBioPredict | Prediction result | {prediction.file_name}"
        )
        body_lines = [
            "Project: ProBioPredict",
            f"Prediction ID: {prediction.id}",
            f"File: {prediction.file_name}",
            f"Rows processed: {prediction.row_count}",
            f"Model mode: {prediction.model_mode}",
            "",
            "Prediction result:",
            (
                f"- sequence_id={result.sequence_id} | "
                f"predicted_class={result.predicted_class} | "
                f"confidence={result.confidence:.4f}"
            ),
            "",
            (
                "Note: ProBioPredict returns a final classification "
                "for the submitted bacterium sequence data."
            ),
            (
                "The result indicates whether the bacterium "
                "is predicted as probiotic or non-probiotic."
            ),
        ]

        send_mail(
            subject=subject,
            message="\n".join(body_lines),
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=[user_email],
            fail_silently=False,
        )

        backend_name = str(
            getattr(settings, "EMAIL_BACKEND", "")
        ).lower()
        is_console_backend = "console" in backend_name

        return Response(
            {
                "message": (
                    "Email generated successfully in backend console mode. "
                    "Check the backend terminal output."
                    if is_console_backend
                    else "Prediction result email sent successfully."
                ),
                "email_requested": True,
                "email_sent": True,
                "delivery_mode": (
                    "console" if is_console_backend else "smtp"
                ),
            },
            status=status.HTTP_200_OK,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def predict_sequence(request):
    """Retired direct endpoint: all predictions must originate from one CSV."""
    return Response(
        {
            "detail": (
                "Direct sequence prediction is no longer available. "
                "Upload one CSV containing exactly one sequence through "
                "/api/predictions/upload/."
            )
        },
        status=status.HTTP_410_GONE,
    )