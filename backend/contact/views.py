"""Public contact message creation endpoint."""

from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .serializers import ContactMessageSerializer


class ContactMessageCreateView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "contact"

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user if request.user.is_authenticated else None
        contact_message = serializer.save(user=user)

        return Response(
            {
                "message": "Your message has been recorded successfully.",
                "id": contact_message.pk,
                "created_at": serializer.data["created_at"],
            },
            status=status.HTTP_201_CREATED,
        )