"""Django Admin configuration for contact messages."""

from django.contrib import admin

from .models import ContactMessage


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = (
        "created_at",
        "full_name",
        "email",
        "topic",
        "subject",
    )
    list_filter = ("topic", "created_at")
    search_fields = ("full_name", "email", "subject")
    readonly_fields = ("created_at",)
    ordering = ("-created_at", "-id")