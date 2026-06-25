from django.urls import path
from .views import predict_sequence

from .views import (
    PredictionDashboardSummaryView,
    PredictionDeleteView,
    PredictionDetailView,
    PredictionHistoryView,
    PredictionPinView,
    PredictionUploadView,
    SendPredictionResultEmailView,
)

urlpatterns = [
    path("upload/", PredictionUploadView.as_view(), name="prediction-upload"),
    path("history/", PredictionHistoryView.as_view(), name="prediction-history"),
    path("<int:prediction_id>/", PredictionDetailView.as_view(), name="prediction-detail"),
    path("<int:prediction_id>/pin/", PredictionPinView.as_view(), name="prediction-pin"),
    path("<int:prediction_id>/delete/", PredictionDeleteView.as_view(), name="prediction-delete"),
    path("dashboard-summary/", PredictionDashboardSummaryView.as_view(), name="prediction-dashboard-summary"),
    path("send-result-email/", SendPredictionResultEmailView.as_view(), name="prediction-send-result-email"),
    path('predict/', predict_sequence, name='predict_sequence'),
]
