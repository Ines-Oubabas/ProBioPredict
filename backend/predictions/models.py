# backend/predictions/models.py

from django.conf import settings
from django.db import models


class Prediction(models.Model):
    STATUS_PENDING = "pending"
    STATUS_COMPLETED = "completed"
    STATUS_FAILED = "failed"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_FAILED, "Failed"),
    ]

    MODEL_MODE_MOCK = "mock"
    MODEL_MODE_REAL = "real"

    MODEL_MODE_CHOICES = [
        (MODEL_MODE_MOCK, "Mock"),
        (MODEL_MODE_REAL, "Real"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="predictions",
    )
    file_name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    submitted_at = models.DateTimeField(auto_now_add=True)
    model_mode = models.CharField(max_length=20, choices=MODEL_MODE_CHOICES, default=MODEL_MODE_MOCK)
    row_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"Prediction #{self.pk} - {self.user} - {self.file_name}"


class PredictionResult(models.Model):
    prediction = models.ForeignKey(
        Prediction,
        on_delete=models.CASCADE,
        related_name="results",
    )
    sequence_id = models.CharField(max_length=255)
    predicted_class = models.CharField(max_length=100)
    confidence = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    raw_output = models.JSONField(blank=True, null=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"Result #{self.pk} for Prediction #{self.prediction_id}"
