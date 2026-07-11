"""Serializers for billing and subscription payloads."""

from rest_framework import serializers

from .models import UserSubscription


class SubscriptionSerializer(serializers.ModelSerializer):
    """Serialize safe subscription information for frontend display."""

    is_premium = serializers.BooleanField(read_only=True)
    plan_label = serializers.CharField(read_only=True)
    prediction_limit = serializers.SerializerMethodField()
    prediction_limit_label = serializers.CharField(read_only=True)

    class Meta:
        model = UserSubscription
        fields = (
            "plan",
            "plan_label",
            "status",
            "is_premium",
            "prediction_limit",
            "prediction_limit_label",
            "current_period_end",
        )

    def get_prediction_limit(self, obj):
        """
        Return numeric prediction limit or null when unlimited.

        Lab is configured as unlimited when PREDICTION_LAB_PLAN_LIMIT=0.
        """
        return obj.prediction_limit


class CreateCheckoutSessionSerializer(serializers.Serializer):
    """Validate the requested paid plan for Stripe Checkout."""

    plan = serializers.ChoiceField(
        choices=[
            UserSubscription.PLAN_PRO,
            UserSubscription.PLAN_LAB,
        ]
    )