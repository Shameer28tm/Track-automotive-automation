import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.conf import settings

from .serializers import ChatRequestSerializer
from .services import get_ai_service

logger = logging.getLogger(__name__)

class ChatbotView(APIView):
    """
    AI Chatbot API for automotive advice, maintenance questions, and garage guide.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data['message']
        history = serializer.validated_data.get('history', [])
        user_name = request.user.full_name or request.user.email.split('@')[0]

        ai_service = get_ai_service()
        provider_name = getattr(settings, 'AI_PROVIDER', 'mock')

        try:
            response_text = ai_service.generate_response(
                message=message,
                history=history,
                user_name=user_name
            )
            return Response({
                'response': response_text,
                'provider': provider_name
            }, status=status.HTTP_200_OK)

        except ValueError as val_err:
            logger.warning(f"AI chatbot service warning: {val_err}")
            return Response({
                'response': f"AI Assistant notice: {str(val_err)}",
                'provider': provider_name,
                'error': True
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Unexpected error in AI chatbot: {e}", exc_info=True)
            return Response({
                'response': "Our AI automotive advisor is temporarily unavailable. Please try again shortly or contact the garage front desk directly.",
                'provider': provider_name,
                'error': True
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
