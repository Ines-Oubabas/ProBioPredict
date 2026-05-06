"""Secure prediction upload API (mocked prediction, no ML model integration yet)."""

from __future__ import annotations

import csv
import io
import re

from django.conf import settings
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView


DNA_PATTERN = re.compile(r"^[ACGT]+$")

# Cells starting with these characters can trigger formula execution in spreadsheet tools.
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


def _normalize_columns(values):
    """Normalize CSV header names for robust comparison."""
    return [str(v).strip().lower() for v in values if str(v).strip()]


class PredictionUploadView(APIView):
    """
    Authenticated CSV upload endpoint with strict validation.

    This endpoint keeps prediction result mocked for now (no ML integration here).
    """

    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "prediction_upload"
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        dna_file = request.FILES.get("dna_file")

        if not dna_file:
            return Response(
                {"detail": "Missing required file field: dna_file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------------------------
        # 1) File size validation
        # ----------------------------------------------------------------------
        max_bytes = int(getattr(settings, "PREDICTION_UPLOAD_MAX_BYTES", DEFAULT_MAX_BYTES))
        if dna_file.size > max_bytes:
            return Response(
                {
                    "detail": (
                        f"File too large. Maximum allowed size is {max_bytes} bytes."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------------------------
        # 2) Extension validation (.csv only)
        # ----------------------------------------------------------------------
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

        # ----------------------------------------------------------------------
        # 3) MIME validation
        # ----------------------------------------------------------------------
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
                {
                    "detail": (
                        "Invalid MIME type. Allowed types: "
                        + ", ".join(sorted(allowed_mime_types))
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------------------------
        # 4) Decode and parse CSV safely
        # ----------------------------------------------------------------------
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

        # ----------------------------------------------------------------------
        # 5) Header/column validation
        # ----------------------------------------------------------------------
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
                {
                    "detail": (
                        "Invalid CSV columns. Expected exactly: "
                        + ", ".join(expected_columns)
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------------------------
        # 6) Row validation: max rows, DNA chars, CSV injection
        # ----------------------------------------------------------------------
        max_rows = int(getattr(settings, "PREDICTION_UPLOAD_MAX_ROWS", DEFAULT_MAX_ROWS))
        validated_rows = []

        for index, row in enumerate(reader, start=2):  # line 1 is header
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

            # CSV injection guard (for downstream export/open in spreadsheet software)
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

            # DNA content validation: only A/C/G/T
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

        # ----------------------------------------------------------------------
        # 7) Mock prediction response (stable schema for frontend integration)
        # ----------------------------------------------------------------------
        mock_results = [
            {
                "sequence_id": item["sequence_id"],
                "predicted_class": "mock_safe",
                "confidence": 0.95,
            }
            for item in validated_rows
        ]

        return Response(
            {
                "message": "CSV validated successfully. Prediction is currently mocked.",
                "summary": {
                    "rows_received": len(validated_rows),
                    "columns": expected_columns,
                    "model_mode": "mock",
                },
                "results": mock_results,
            },
            status=status.HTTP_200_OK,
        )
