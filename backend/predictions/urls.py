"""URL routes for prediction endpoints."""

from django.urls import path

from .views import PredictionUploadView

app_name = "predictions"

urlpatterns = [
    path("upload/", PredictionUploadView.as_view(), name="upload"),
]
