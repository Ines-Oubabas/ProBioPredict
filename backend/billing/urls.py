"""URL routes for Stripe billing endpoints."""

from django.urls import path

from .views import (
    CreateCheckoutSessionView,
    CurrentSubscriptionView,
    StripeWebhookView,
)

app_name = "billing"

urlpatterns = [
    path(
        "subscription/",
        CurrentSubscriptionView.as_view(),
        name="current-subscription",
    ),
    path(
        "create-checkout-session/",
        CreateCheckoutSessionView.as_view(),
        name="create-checkout-session",
    ),
    path(
        "webhook/",
        StripeWebhookView.as_view(),
        name="stripe-webhook",
    ),
]