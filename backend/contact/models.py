"""Database model for contact messages."""

from django.conf import settings
from django.core.validators import MaxLengthValidator
from django.db import models


class ContactMessage(models.Model):
    TOPIC_SUPPORT = "support"
    TOPIC_FEEDBACK = "feedback"
    TOPIC_COLLABORATION = "collaboration"

    TOPIC_CHOICES = [
        (TOPIC_SUPPORT, "Support request"),
        (TOPIC_FEEDBACK, "Product feedback"),
        (TOPIC_COLLABORATION, "Collaboration"),
    ]

    full_name = models.CharField(max_length=150)
    email = models.EmailField(max_length=254)
    topic = models.CharField(max_length=20, choices=TOPIC_CHOICES)
    subject = models.CharField(max_length=200)
    message = models.TextField(validators=[MaxLengthValidator(5000)])
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="contact_messages",
    )

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"Contact message #{self.pk}"