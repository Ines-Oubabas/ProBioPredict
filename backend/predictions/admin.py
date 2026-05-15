# backend/predictions/admin.py

from django.contrib import admin

from .models import Prediction, PredictionResult


class PredictionResultInline(admin.TabularInline):
    model = PredictionResult
    extra = 0
    readonly_fields = ("sequence_id", "predicted_class", "confidence", "created_at", "raw_output")
    can_delete = False


@admin.register(Prediction)
class PredictionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "file_name", "status", "model_mode", "row_count", "submitted_at")
    list_filter = ("status", "model_mode", "submitted_at")
    search_fields = ("id", "user__username", "user__email", "file_name")
    readonly_fields = ("submitted_at",)
    inlines = [PredictionResultInline]


@admin.register(PredictionResult)
class PredictionResultAdmin(admin.ModelAdmin):
    list_display = ("id", "prediction", "sequence_id", "predicted_class", "confidence", "created_at")
    list_filter = ("predicted_class", "created_at")
    search_fields = ("id", "sequence_id", "predicted_class", "prediction__id", "prediction__user__email")
    readonly_fields = ("created_at",)