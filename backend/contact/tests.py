"""Tests for contact message creation, validation, and access control."""

from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import AccessToken

from .models import ContactMessage


User = get_user_model()


@override_settings(
    SECURE_SSL_REDIRECT=False,
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "contact-tests",
        },
    },
)
class ContactMessageAPITest(TestCase):
    def setUp(self):
        cache.clear()
        self.addCleanup(cache.clear)

        # Validation tests must not depend on the deployment's contact quota.
        throttle_patcher = patch.dict(
            ScopedRateThrottle.THROTTLE_RATES,
            {"contact": "1000/hour"},
        )
        throttle_patcher.start()
        self.addCleanup(throttle_patcher.stop)

        self.client = APIClient()
        self.url = reverse("contact:create")
        self.payload = {
            "full_name": "Amina Diallo",
            "email": "amina@gmail.com",
            "topic": "support",
            "subject": "Upload question",
            "message": "How can I prepare my CSV file?",
        }

    def create_user(self, username="contactuser"):
        return User.objects.create_user(
            username=username,
            email=f"{username}@example.com",
            password="test-password-123",
        )

    def authenticate_with_jwt(self, user):
        token = AccessToken.for_user(user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

    def submit(self, payload=None):
        return self.client.post(
            self.url,
            self.payload if payload is None else payload,
            format="json",
        )

    def assert_rejected(self, payload, field):
        count_before = ContactMessage.objects.count()

        response = self.submit(payload)

        self.assertEqual(response.status_code, 400)
        self.assertIn(field, response.data)
        self.assertEqual(ContactMessage.objects.count(), count_before)

    def test_anonymous_submission_is_saved_with_server_timestamp(self):
        before = timezone.now()

        response = self.submit()

        after = timezone.now()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ContactMessage.objects.count(), 1)

        saved = ContactMessage.objects.get()
        for field, expected_value in self.payload.items():
            self.assertEqual(getattr(saved, field), expected_value)

        self.assertIsNone(saved.user_id)
        self.assertGreaterEqual(saved.created_at, before)
        self.assertLessEqual(saved.created_at, after)
        self.assertEqual(response.data["id"], saved.pk)
        self.assertEqual(
            set(response.data),
            {"message", "id", "created_at"},
        )
        self.assertEqual(
            response.data["created_at"],
            saved.created_at.isoformat().replace("+00:00", "Z"),
        )

    def test_valid_jwt_associates_authenticated_user(self):
        user = self.create_user()
        self.authenticate_with_jwt(user)

        response = self.submit()

        self.assertEqual(response.status_code, 201)
        saved = ContactMessage.objects.get()
        self.assertEqual(saved.user_id, user.pk)

        # The supplied contact email may differ from the account email.
        self.assertEqual(saved.email, self.payload["email"])

    def test_matching_email_does_not_associate_anonymous_user(self):
        user = self.create_user()
        payload = {**self.payload, "email": user.email}

        response = self.submit(payload)

        self.assertEqual(response.status_code, 201)
        self.assertIsNone(ContactMessage.objects.get().user_id)

    def test_invalid_jwt_is_rejected(self):
        self.client.credentials(
            HTTP_AUTHORIZATION="Bearer invalid-token",
        )

        response = self.submit()

        self.assertEqual(response.status_code, 401)
        self.assertFalse(ContactMessage.objects.exists())

    def test_expired_jwt_is_rejected(self):
        user = self.create_user()
        token = AccessToken.for_user(user)
        token.set_exp(lifetime=timedelta(minutes=-1))
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        response = self.submit()

        self.assertEqual(response.status_code, 401)
        self.assertFalse(ContactMessage.objects.exists())

    def test_missing_required_fields_are_rejected(self):
        for field in self.payload:
            with self.subTest(field=field):
                payload = self.payload.copy()
                del payload[field]
                self.assert_rejected(payload, field)

    def test_blank_fields_are_rejected(self):
        for field in self.payload:
            for value in ("", "   \t\n"):
                with self.subTest(field=field, value=value):
                    payload = {**self.payload, field: value}
                    self.assert_rejected(payload, field)

    def test_null_fields_are_rejected(self):
        for field in self.payload:
            with self.subTest(field=field):
                payload = {**self.payload, field: None}
                self.assert_rejected(payload, field)

    def test_text_fields_are_trimmed(self):
        payload = {
            field: f"  {value} \n"
            for field, value in self.payload.items()
        }

        response = self.submit(payload)

        self.assertEqual(response.status_code, 201)
        saved = ContactMessage.objects.get()
        for field, expected_value in self.payload.items():
            self.assertEqual(getattr(saved, field), expected_value)

    def test_invalid_email_is_rejected(self):
        self.assert_rejected(
            {**self.payload, "email": "not-an-email"},
            "email",
        )

    def test_invalid_topic_is_rejected(self):
        self.assert_rejected(
            {**self.payload, "topic": "billing"},
            "topic",
        )

    def test_all_supported_topics_are_accepted(self):
        for topic in ("support", "feedback", "collaboration"):
            with self.subTest(topic=topic):
                response = self.submit(
                    {**self.payload, "topic": topic},
                )
                self.assertEqual(response.status_code, 201)
                self.assertTrue(
                    ContactMessage.objects.filter(topic=topic).exists()
                )

    def test_excessive_lengths_are_rejected(self):
        excessive_values = {
            "full_name": "A" * 151,
            "email": (
                f"{'a' * 64}@{'b' * 63}.{'c' * 63}.{'d' * 60}.com"
            ),
            "topic": "s" * 21,
            "subject": "S" * 201,
            "message": "M" * 5001,
        }

        self.assertEqual(len(excessive_values["email"]), 257)

        for field, value in excessive_values.items():
            with self.subTest(field=field):
                self.assert_rejected(
                    {**self.payload, field: value},
                    field,
                )

    def test_text_length_boundaries_are_accepted(self):
        payload = {
            **self.payload,
            "full_name": "A" * 150,
            "subject": "S" * 200,
            "message": "M" * 5000,
        }

        response = self.submit(payload)

        self.assertEqual(response.status_code, 201)
        saved = ContactMessage.objects.get()
        self.assertEqual(len(saved.full_name), 150)
        self.assertEqual(len(saved.subject), 200)
        self.assertEqual(len(saved.message), 5000)

    def test_anonymous_client_cannot_set_reserved_fields(self):
        other_user = self.create_user()
        forged_id = 999999
        payload = {
            **self.payload,
            "id": forged_id,
            "user": other_user.pk,
            "user_id": other_user.pk,
            "created_at": "2000-01-01T00:00:00Z",
        }
        before = timezone.now()

        response = self.submit(payload)

        self.assertEqual(response.status_code, 201)
        saved = ContactMessage.objects.get()
        self.assertNotEqual(saved.pk, forged_id)
        self.assertIsNone(saved.user_id)
        self.assertGreaterEqual(saved.created_at, before)

    def test_authenticated_client_cannot_impersonate_another_user(self):
        user = self.create_user("sender")
        other_user = self.create_user("other")
        self.authenticate_with_jwt(user)
        payload = {
            **self.payload,
            "user": other_user.pk,
            "user_id": other_user.pk,
        }

        response = self.submit(payload)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            ContactMessage.objects.get().user_id,
            user.pk,
        )

    def test_deleting_user_preserves_message_and_clears_relation(self):
        user = self.create_user()
        saved = ContactMessage.objects.create(
            user=user,
            **self.payload,
        )
        message_id = saved.pk

        user.delete()

        saved = ContactMessage.objects.get(pk=message_id)
        self.assertIsNone(saved.user_id)
        self.assertEqual(saved.message, self.payload["message"])
        self.assertEqual(saved.email, self.payload["email"])

    def test_contact_scope_returns_429_after_limit(self):
        cache.clear()

        # Patch the rates actually read by ScopedRateThrottle.
        # No clock waiting or dependency on environment variables.
        with patch.dict(
            ScopedRateThrottle.THROTTLE_RATES,
            {"contact": "2/hour"},
        ):
            first = self.submit()
            second = self.submit()
            refused = self.submit()

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 201)
        self.assertEqual(refused.status_code, 429)
        self.assertIn("Retry-After", refused)
        self.assertEqual(ContactMessage.objects.count(), 2)

    def test_collection_does_not_allow_read_update_or_delete(self):
        for method in ("get", "put", "patch", "delete"):
            with self.subTest(method=method):
                response = getattr(self.client, method)(self.url)
                self.assertEqual(response.status_code, 405)

        self.assertFalse(ContactMessage.objects.exists())

    def test_no_public_detail_endpoint_exists(self):
        saved = ContactMessage.objects.create(**self.payload)
        detail_url = f"{self.url}{saved.pk}/"

        for method in ("get", "put", "patch", "delete"):
            with self.subTest(method=method):
                response = getattr(self.client, method)(detail_url)
                self.assertEqual(response.status_code, 404)

        self.assertTrue(
            ContactMessage.objects.filter(pk=saved.pk).exists()
        )