import pytest
from unittest.mock import patch, MagicMock
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.chatbot.services import GeminiProvider, AutomotiveKnowledgeFallbackProvider

@pytest.mark.django_db
class TestChatbot:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email='chatuser@example.com', password='Pass123!', full_name='Chat User')
        self.client.force_authenticate(user=self.user)
        self.url = reverse('chatbot:chat')

    def test_chatbot_empty_message_validation(self):
        response = self.client.post(self.url, {'message': ''})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_chatbot_unauthenticated_blocked(self):
        self.client.logout()
        response = self.client.post(self.url, {'message': 'When should I change my oil?'})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_chatbot_fallback_domain_knowledge(self):
        """Test fallback provider responds to automotive questions with safety disclaimer."""
        response = self.client.post(self.url, {
            'message': 'When should I change my synthetic engine oil?'
        })
        assert response.status_code == status.HTTP_200_OK
        assert 'response' in response.data
        assert 'oil' in response.data['response'].lower()
        # Verify safety disclaimer is always included
        assert 'Disclaimer' in response.data['response']

    @patch('requests.post')
    def test_gemini_provider_success_mock(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'candidates': [{
                'content': {
                    'parts': [{'text': 'Your brake pads should be inspected every 20,000 km.'}]
                }
            }]
        }
        mock_post.return_value = mock_response

        provider = GeminiProvider(api_key='test-key')
        text = provider.generate_response("How often to check brakes?")
        assert 'brake pads' in text
        assert 'Disclaimer' in text

    @patch('requests.post')
    def test_gemini_provider_rate_limit_handled(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_response.text = 'Rate limit exceeded'
        mock_post.return_value = mock_response

        provider = GeminiProvider(api_key='test-key')
        with pytest.raises(ValueError) as exc:
            provider.generate_response("Question")
        assert "rate limit" in str(exc.value).lower()
