"""API views for authentication: register, login, and current user."""

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import LoginSerializer, RegisterSerializer, UserSerializer


def _get_tokens_for_user(user):
    """Generate access and refresh JWT tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


class RegisterView(APIView):
    """Handle user registration and return JWT tokens + user payload."""

    permission_classes = [AllowAny]

    def post(self, request):
        """Create a user account from validated payload."""
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()
        tokens = _get_tokens_for_user(user)

        return Response(
            {
                "user": UserSerializer(user).data,
                "access": tokens["access"],
                "refresh": tokens["refresh"],
                "message": "Account created successfully.",
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """Handle user login and return JWT tokens + user payload."""

    permission_classes = [AllowAny]

    def post(self, request):
        """Validate credentials and return auth tokens."""
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        tokens = _get_tokens_for_user(user)

        return Response(
            {
                "user": UserSerializer(user).data,
                "access": tokens["access"],
                "refresh": tokens["refresh"],
                "message": "Login successful.",
            },
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    """Return currently authenticated user profile."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return safe user data for the authenticated request user."""
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)
    