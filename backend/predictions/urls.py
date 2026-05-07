from django.urls import path

from .views import PredictionUploadView, SendPredictionResultEmailView

urlpatterns = [
    path("upload/", PredictionUploadView.as_view(), name="prediction-upload"),
    path(
        "send-result-email/",
        SendPredictionResultEmailView.as_view(),
        name="prediction-send-result-email",
    ),
]
