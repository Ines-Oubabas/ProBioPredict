"""Billing models for Stripe-backed subscriptions."""

from django.conf import settings
from django.db import models


class UserSubscription(models.Model):
    """
    Store the billing/subscription state controlled by Stripe webhooks.

    Security rule:
    - The frontend must never directly decide this state.
    - Premium activation must happen after Stripe webhook confirmation.
    """

    PLAN_FREE = "free"
    PLAN_PRO = "pro"
    PLAN_LAB = "lab"

    PLAN_CHOICES = [
        (PLAN_FREE, "Free"),
        (PLAN_PRO, "Pro"),
        (PLAN_LAB, "Lab"),
    ]

    STATUS_FREE = "free"
    STATUS_INCOMPLETE = "incomplete"
    STATUS_ACTIVE = "active"
    STATUS_TRIALING = "trialing"
    STATUS_PAST_DUE = "past_due"
    STATUS_CANCELED = "canceled"
    STATUS_UNPAID = "unpaid"

    STATUS_CHOICES = [
        (STATUS_FREE, "Free"),
        (STATUS_INCOMPLETE, "Incomplete"),
        (STATUS_ACTIVE, "Active"),
        (STATUS_TRIALING, "Trialing"),
        (STATUS_PAST_DUE, "Past due"),
        (STATUS_CANCELED, "Canceled"),
        (STATUS_UNPAID, "Unpaid"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscription",
    )
    plan = models.CharField(
        max_length=20,
        choices=PLAN_CHOICES,
        default=PLAN_FREE,
    )
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default=STATUS_FREE,
    )

    stripe_customer_id = models.CharField(max_length=255, blank=True, default="")
    stripe_subscription_id = models.CharField(max_length=255, blank=True, default="")
    stripe_price_id = models.CharField(max_length=255, blank=True, default="")

    current_period_end = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User subscription"
        verbose_name_plural = "User subscriptions"

    def __str__(self):
        return f"{self.user} - {self.plan} - {self.status}"

    @property
    def is_premium(self):
        """Return True only for active/trialing paid plans."""
        return self.plan in {self.PLAN_PRO, self.PLAN_LAB} and self.status in {
            self.STATUS_ACTIVE,
            self.STATUS_TRIALING,
        }

    @property
    def plan_label(self):
        """Return display label for the current plan."""
        labels = dict(self.PLAN_CHOICES)
        return labels.get(self.plan, "Free")

    @property
    def prediction_limit(self):
        """
        Return the prediction limit for this subscription.

        Convention:
        - Free: PREDICTION_FREE_PLAN_LIMIT, default 3.
        - Pro: PREDICTION_PRO_PLAN_LIMIT, default 100.
        - Lab: PREDICTION_LAB_PLAN_LIMIT.
          If Lab limit is 0, it means unlimited.
        """
        if not self.is_premium:
            return int(getattr(settings, "PREDICTION_FREE_PLAN_LIMIT", 3))

        if self.plan == self.PLAN_PRO:
            return int(getattr(settings, "PREDICTION_PRO_PLAN_LIMIT", 100))

        if self.plan == self.PLAN_LAB:
            lab_limit = int(getattr(settings, "PREDICTION_LAB_PLAN_LIMIT", 0))
            return None if lab_limit == 0 else lab_limit

        return int(getattr(settings, "PREDICTION_FREE_PLAN_LIMIT", 3))

    @property
    def prediction_limit_label(self):
        """Return a human-readable limit label."""
        limit = self.prediction_limit
        if limit is None:
            return "Unlimited"
        return str(limit)


def get_or_create_user_subscription(user):
    """Return the user's subscription, creating a Free subscription if missing."""
    subscription, _created = UserSubscription.objects.get_or_create(
        user=user,
        defaults={
            "plan": UserSubscription.PLAN_FREE,
            "status": UserSubscription.STATUS_FREE,
        },
    )
    return subscription