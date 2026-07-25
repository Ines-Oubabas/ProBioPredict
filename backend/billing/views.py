"""Stripe Checkout and webhook views for ProBioPredict billing."""

from collections.abc import Mapping, Sequence
from datetime import datetime, timezone

import stripe
from stripe import SignatureVerificationError, StripeError
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserSubscription, get_or_create_user_subscription
from .serializers import CreateCheckoutSessionSerializer, SubscriptionSerializer

User = get_user_model()


def _stripe_configured():
    """Return True when the minimum Stripe settings are present."""
    return bool(getattr(settings, "STRIPE_SECRET_KEY", ""))


def _set_stripe_api_key():
    """Configure Stripe SDK with the backend-only secret key."""
    stripe.api_key = settings.STRIPE_SECRET_KEY


def _price_id_for_plan(plan):
    """Return the configured Stripe Price ID for a paid plan."""
    if plan == UserSubscription.PLAN_PRO:
        return getattr(settings, "STRIPE_PRICE_PRO", "")
    if plan == UserSubscription.PLAN_LAB:
        return getattr(settings, "STRIPE_PRICE_LAB", "")
    return ""


def _plan_for_price_id(price_id):
    """Map a Stripe Price ID back to the internal plan key."""
    if price_id and price_id == getattr(settings, "STRIPE_PRICE_PRO", ""):
        return UserSubscription.PLAN_PRO
    if price_id and price_id == getattr(settings, "STRIPE_PRICE_LAB", ""):
        return UserSubscription.PLAN_LAB
    return UserSubscription.PLAN_FREE


def _datetime_from_timestamp(value):
    """Convert a Stripe timestamp to a timezone-aware datetime."""
    if not value:
        return None

    try:
        return datetime.fromtimestamp(int(value), tz=timezone.utc)
    except (TypeError, ValueError, OverflowError):
        return None


def _safe_get_nested(data, path, default=None):
    """
    Safely read nested values from Stripe objects, mappings, and lists.

    Stripe objects are dict-like, while paths may include integer indexes such
    as ["items", "data", 0, "price", "id"]. Integer keys must be handled as
    sequence indexes rather than attribute names.
    """
    current = data

    for key in path:
        if current is None:
            return default

        if isinstance(key, int):
            if (
                isinstance(current, Sequence)
                and not isinstance(current, (str, bytes, bytearray))
                and 0 <= key < len(current)
            ):
                current = current[key]
                continue

            return default

        if isinstance(current, Mapping):
            current = current.get(key, default)
            continue

        get_method = getattr(current, "get", None)
        if callable(get_method):
            try:
                current = get_method(key, default)
                continue
            except TypeError:
                pass

        current = getattr(current, key, default)

    return current if current is not None else default


class CurrentSubscriptionView(APIView):
    """Return the authenticated user's current subscription."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return safe subscription data for frontend display."""
        subscription = get_or_create_user_subscription(request.user)

        return Response(
            SubscriptionSerializer(subscription).data,
            status=status.HTTP_200_OK,
        )


class CreateCheckoutSessionView(APIView):
    """
    Create a Stripe Checkout Session for Pro or Lab.

    Security:
    - Requires JWT authentication.
    - The frontend sends only the desired plan.
    - The backend selects the actual Stripe Price ID from environment variables.
    - Premium is NOT activated here. It is activated by Stripe webhook only.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Create and return a Stripe Checkout URL."""
        serializer = CreateCheckoutSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not _stripe_configured():
            return Response(
                {"detail": "Stripe is not configured on the backend."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        plan = serializer.validated_data["plan"]
        price_id = _price_id_for_plan(plan)

        if not price_id:
            return Response(
                {
                    "detail": (
                        f"Stripe Price ID is not configured for plan '{plan}'."
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        _set_stripe_api_key()

        subscription = get_or_create_user_subscription(request.user)

        try:
            with transaction.atomic():
                if not subscription.stripe_customer_id:
                    customer = stripe.Customer.create(
                        email=request.user.email or None,
                        name=request.user.get_full_name() or request.user.username,
                        metadata={
                            "user_id": str(request.user.id),
                            "source": "probiopredict",
                        },
                    )

                    subscription.stripe_customer_id = customer["id"]
                    subscription.save(
                        update_fields=["stripe_customer_id", "updated_at"]
                    )

                checkout_session = stripe.checkout.Session.create(
                    mode="subscription",
                    customer=subscription.stripe_customer_id,
                    line_items=[
                        {
                            "price": price_id,
                            "quantity": 1,
                        }
                    ],
                    success_url=(
                        f"{settings.FRONTEND_URL}/billing/success"
                        "?session_id={CHECKOUT_SESSION_ID}"
                    ),
                    cancel_url=f"{settings.FRONTEND_URL}/billing/cancel",
                    client_reference_id=str(request.user.id),
                    metadata={
                        "user_id": str(request.user.id),
                        "plan": plan,
                    },
                    subscription_data={
                        "metadata": {
                            "user_id": str(request.user.id),
                            "plan": plan,
                        }
                    },
                    allow_promotion_codes=True,
                )
        except StripeError as exc:
            return Response(
                {"detail": f"Stripe error: {str(exc)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {
                "checkout_url": checkout_session["url"],
                "session_id": checkout_session["id"],
            },
            status=status.HTTP_200_OK,
        )


class StripeWebhookView(APIView):
    """
    Receive Stripe webhook events.

    Security:
    - No JWT authentication because Stripe sends this request.
    - Signature verification with STRIPE_WEBHOOK_SECRET is required.
    - Subscription status is changed only from verified Stripe events.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        """Verify the Stripe signature and process supported events."""
        webhook_secret = getattr(settings, "STRIPE_WEBHOOK_SECRET", "")

        if not _stripe_configured() or not webhook_secret:
            return Response(
                {"detail": "Stripe webhook is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        _set_stripe_api_key()

        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        try:
            event = stripe.Webhook.construct_event(
                payload=payload,
                sig_header=sig_header,
                secret=webhook_secret,
            )
        except ValueError:
            return Response(
                {"detail": "Invalid Stripe payload."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except SignatureVerificationError:
            return Response(
                {"detail": "Invalid Stripe signature."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        event_type = _safe_get_nested(event, ["type"], "")
        event_object = _safe_get_nested(event, ["data", "object"], {})

        if event_type == "checkout.session.completed":
            self._handle_checkout_session_completed(event_object)
        elif event_type in {
            "customer.subscription.created",
            "customer.subscription.updated",
        }:
            self._handle_subscription_upsert(event_object)
        elif event_type == "customer.subscription.deleted":
            self._handle_subscription_deleted(event_object)

        return Response({"received": True}, status=status.HTTP_200_OK)

    def _handle_checkout_session_completed(self, session):
        """
        Activate or update a paid plan after Checkout completes.

        The frontend success redirect is not trusted. This verified webhook event
        is the source of truth for local subscription state.
        """
        user_id = _safe_get_nested(session, ["metadata", "user_id"])
        if not user_id:
            user_id = _safe_get_nested(session, ["client_reference_id"])

        plan = _safe_get_nested(
            session,
            ["metadata", "plan"],
            UserSubscription.PLAN_FREE,
        )
        customer_id = _safe_get_nested(session, ["customer"], "")
        stripe_subscription_id = _safe_get_nested(session, ["subscription"], "")

        if plan not in {
            UserSubscription.PLAN_PRO,
            UserSubscription.PLAN_LAB,
        }:
            return

        if not user_id:
            return

        try:
            user = User.objects.get(id=user_id)
        except (User.DoesNotExist, TypeError, ValueError):
            return

        stripe_status = UserSubscription.STATUS_ACTIVE
        current_period_end = None
        price_id = _price_id_for_plan(plan)

        if stripe_subscription_id:
            try:
                stripe_subscription = stripe.Subscription.retrieve(
                    stripe_subscription_id
                )

                stripe_status = (
                    _safe_get_nested(
                        stripe_subscription,
                        ["status"],
                        UserSubscription.STATUS_ACTIVE,
                    )
                    or UserSubscription.STATUS_ACTIVE
                )

                current_period_end = _datetime_from_timestamp(
                    _safe_get_nested(
                        stripe_subscription,
                        ["current_period_end"],
                    )
                )

                price_id = _safe_get_nested(
                    stripe_subscription,
                    ["items", "data", 0, "price", "id"],
                    price_id,
                )
            except StripeError:
                # The verified checkout event still contains the user, plan,
                # customer and subscription identifiers. A later
                # customer.subscription.updated event will refresh details.
                pass

        with transaction.atomic():
            subscription = get_or_create_user_subscription(user)
            subscription.plan = plan
            subscription.status = stripe_status
            subscription.stripe_customer_id = (
                customer_id or subscription.stripe_customer_id
            )
            subscription.stripe_subscription_id = (
                stripe_subscription_id or subscription.stripe_subscription_id
            )
            subscription.stripe_price_id = (
                price_id or subscription.stripe_price_id
            )
            subscription.current_period_end = current_period_end
            subscription.save(
                update_fields=[
                    "plan",
                    "status",
                    "stripe_customer_id",
                    "stripe_subscription_id",
                    "stripe_price_id",
                    "current_period_end",
                    "updated_at",
                ]
            )

    def _handle_subscription_upsert(self, stripe_subscription):
        """Create or update local state from Stripe subscription events."""
        stripe_subscription_id = _safe_get_nested(
            stripe_subscription,
            ["id"],
            "",
        )
        customer_id = _safe_get_nested(stripe_subscription, ["customer"], "")
        stripe_status = _safe_get_nested(
            stripe_subscription,
            ["status"],
            UserSubscription.STATUS_INCOMPLETE,
        )
        current_period_end = _datetime_from_timestamp(
            _safe_get_nested(stripe_subscription, ["current_period_end"])
        )

        user_id = _safe_get_nested(
            stripe_subscription,
            ["metadata", "user_id"],
        )
        plan_from_metadata = _safe_get_nested(
            stripe_subscription,
            ["metadata", "plan"],
            "",
        )

        price_id = _safe_get_nested(
            stripe_subscription,
            ["items", "data", 0, "price", "id"],
            "",
        )
        plan_from_price = _plan_for_price_id(price_id)

        if plan_from_metadata in {
            UserSubscription.PLAN_PRO,
            UserSubscription.PLAN_LAB,
        }:
            plan = plan_from_metadata
        else:
            plan = plan_from_price

        subscription = None

        if user_id:
            try:
                user = User.objects.get(id=user_id)
                subscription = get_or_create_user_subscription(user)
            except (User.DoesNotExist, TypeError, ValueError):
                subscription = None

        if subscription is None and stripe_subscription_id:
            subscription = UserSubscription.objects.filter(
                stripe_subscription_id=stripe_subscription_id
            ).first()

        if subscription is None and customer_id:
            subscription = UserSubscription.objects.filter(
                stripe_customer_id=customer_id
            ).first()

        if subscription is None:
            return

        if plan not in {
            UserSubscription.PLAN_PRO,
            UserSubscription.PLAN_LAB,
        }:
            if subscription.plan in {
                UserSubscription.PLAN_PRO,
                UserSubscription.PLAN_LAB,
            }:
                plan = subscription.plan
            else:
                return

        subscription.plan = plan
        subscription.status = stripe_status
        subscription.stripe_customer_id = (
            customer_id or subscription.stripe_customer_id
        )
        subscription.stripe_subscription_id = (
            stripe_subscription_id or subscription.stripe_subscription_id
        )
        subscription.stripe_price_id = price_id or subscription.stripe_price_id
        subscription.current_period_end = current_period_end
        subscription.save(
            update_fields=[
                "plan",
                "status",
                "stripe_customer_id",
                "stripe_subscription_id",
                "stripe_price_id",
                "current_period_end",
                "updated_at",
            ]
        )

    def _handle_subscription_deleted(self, stripe_subscription):
        """Downgrade the user to Free when Stripe deletes a subscription."""
        stripe_subscription_id = _safe_get_nested(
            stripe_subscription,
            ["id"],
            "",
        )
        customer_id = _safe_get_nested(stripe_subscription, ["customer"], "")

        subscription = None

        if stripe_subscription_id:
            subscription = UserSubscription.objects.filter(
                stripe_subscription_id=stripe_subscription_id
            ).first()

        if subscription is None and customer_id:
            subscription = UserSubscription.objects.filter(
                stripe_customer_id=customer_id
            ).first()

        if subscription is None:
            return

        subscription.plan = UserSubscription.PLAN_FREE
        subscription.status = UserSubscription.STATUS_CANCELED
        subscription.stripe_subscription_id = (
            stripe_subscription_id or subscription.stripe_subscription_id
        )
        subscription.current_period_end = _datetime_from_timestamp(
            _safe_get_nested(stripe_subscription, ["current_period_end"])
        )
        subscription.save(
            update_fields=[
                "plan",
                "status",
                "stripe_subscription_id",
                "current_period_end",
                "updated_at",
            ]
        )