"""Validation for contact message submissions."""

from rest_framework import serializers

from .models import ContactMessage


class ContactMessageSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(
        required=True,
        allow_blank=False,
        max_length=150,
        trim_whitespace=True,
    )
    email = serializers.EmailField(
        required=True,
        allow_blank=False,
        max_length=254,
        trim_whitespace=True,
    )
    topic = serializers.CharField(
        required=True,
        allow_blank=False,
        max_length=20,
        trim_whitespace=True,
    )
    subject = serializers.CharField(
        required=True,
        allow_blank=False,
        max_length=200,
        trim_whitespace=True,
    )
    message = serializers.CharField(
        required=True,
        allow_blank=False,
        max_length=5000,
        trim_whitespace=True,
    )

    class Meta:
        model = ContactMessage
        fields = (
            "id",
            "full_name",
            "email",
            "topic",
            "subject",
            "message",
            "created_at",
            "user",
        )
        read_only_fields = ("id", "created_at", "user")

    def validate_topic(self, value):
        allowed_topics = dict(ContactMessage.TOPIC_CHOICES)
        if value not in allowed_topics:
            raise serializers.ValidationError(
                "Select a valid topic: support, feedback, or collaboration."
            )
        return value