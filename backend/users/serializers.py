"""Serializers for user authentication and user payloads."""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serialize safe user fields for API responses."""

    full_name = serializers.SerializerMethodField()

    class Meta:
        """Metadata for user serialization."""

        model = User
        fields = ("id", "email", "full_name", "date_joined")

    def get_full_name(self, obj):
        """Return a normalized full name for frontend display."""
        full_name = obj.get_full_name().strip()
        if full_name:
            return full_name
        return obj.first_name or ""


class RegisterSerializer(serializers.Serializer):
    """Validate and create a new user account."""

    full_name = serializers.CharField(required=True, max_length=150, trim_whitespace=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, required=True, min_length=8)

    def validate_email(self, value):
        """Ensure email is unique (case-insensitive)."""
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return email

    def validate_full_name(self, value):
        """Ensure full name is present after trimming."""
        full_name = value.strip()
        if not full_name:
            raise serializers.ValidationError("Full name is required.")
        return full_name

    def validate(self, attrs):
        """Validate password confirmation and Django password rules."""
        password = attrs.get("password")
        password_confirm = attrs.get("password_confirm")

        if password != password_confirm:
            raise serializers.ValidationError(
                {"password_confirm": "Password confirmation does not match."}
            )

        # Applies Django validators (length, common password, numeric, etc.)
        validate_password(password)
        return attrs

    def create(self, validated_data):
        """Create a user with hashed password and generated unique username."""
        full_name = validated_data["full_name"].strip()
        email = validated_data["email"].strip().lower()
        password = validated_data["password"]

        parts = full_name.split(maxsplit=1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ""

        # Default Django User requires username; generate one from email.
        base_username = email.split("@")[0][:30] or "user"
        username = base_username
        counter = 1

        while User.objects.filter(username=username).exists():
            suffix = f"_{counter}"
            username = f"{base_username[:30 - len(suffix)]}{suffix}"
            counter += 1

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,  # hashed automatically by create_user
            first_name=first_name,
            last_name=last_name,
        )
        return user

    def update(self, instance, validated_data):
        """
        Register serializer is create-only.

        This method exists to satisfy Serializer abstract contract for linting.
        """
        raise NotImplementedError("RegisterSerializer does not support update().")


class LoginSerializer(serializers.Serializer):
    """Validate user credentials using email + password."""

    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        """Validate credentials and return authenticated user in attrs."""
        email = attrs.get("email", "").strip().lower()
        password = attrs.get("password", "")

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError({"detail": "Invalid email or password."}) from exc

        if not user.check_password(password):
            raise serializers.ValidationError({"detail": "Invalid email or password."})

        if not user.is_active:
            raise serializers.ValidationError({"detail": "This account is disabled."})

        attrs["user"] = user
        return attrs

    def create(self, validated_data):
        """
        Login serializer does not create database objects.

        This method exists to satisfy Serializer abstract contract for linting.
        """
        return validated_data

    def update(self, instance, validated_data):
        """
        Login serializer does not update database objects.

        This method exists to satisfy Serializer abstract contract for linting.
        """
        return instance
    