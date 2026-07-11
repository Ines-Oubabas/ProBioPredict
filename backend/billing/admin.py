"""Django admin registration for billing models."""

from django.contrib import admin

from .models import UserSubscription


@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "plan",
        "status",
        "stripe_customer_id",
        "stripe_subscription_id",
        "current_period_end",
        "updated_at",
    )
    list_filter = ("plan", "status")
    search_fields = (
        "user__username",
        "user__email",
        "stripe_customer_id",
        "stripe_subscription_id",
    )
    readonly_fields = ("created_at", "updated_at")