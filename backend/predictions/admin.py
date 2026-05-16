# backend/predictions/admin.py

from django.contrib import admin
from .models import Prediction, PredictionResult


class PredictionResultInline(admin.TabularInline):
    model = PredictionResult
    extra = 0
    readonly_fields = ("sequence_id", "predicted_class", "confidence", "created_at")
    can_delete = False


@admin.register(Prediction)
class PredictionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "file_name",
        "status",
        "model_mode",
        "row_count",
        "is_pinned",
        "submitted_at",
    )
    list_filter = (
        "status",
        "model_mode",
        "is_pinned",
        "submitted_at",
    )
    search_fields = (
        "id",
        "file_name",
        "user__email",
        "user__full_name",
    )
    ordering = ("-is_pinned", "-submitted_at")
    list_editable = ("is_pinned",)
    readonly_fields = ("submitted_at",)
    inlines = [PredictionResultInline]


@admin.register(PredictionResult)
class PredictionResultAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "prediction",
        "sequence_id",
        "predicted_class",
        "confidence",
        "created_at",
    )
    list_filter = ("predicted_class", "created_at")
    search_fields = (
        "sequence_id",
        "predicted_class",
        "prediction__file_name",
        "prediction__user__email",
    )
    ordering = ("-created_at",)