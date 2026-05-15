# backend/predictions/urls.py

from django.urls import path

from .views import PredictionHistoryView, PredictionUploadView, SendPredictionResultEmailView

urlpatterns = [
    path("upload/", PredictionUploadView.as_view(), name="prediction-upload"),
    path("history/", PredictionHistoryView.as_view(), name="prediction-history"),
    path(
        "send-result-email/",
        SendPredictionResultEmailView.as_view(),
        name="prediction-send-result-email",
    ),
]
