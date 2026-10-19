import base64
import json
import time
import pytest
from unittest.mock import patch, MagicMock
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import User

@pytest.mark.django_db
class TestAuthentication:
    def setup_method(self):
        self.client = APIClient()

    def test_user_registration_defaults_to_customer(self):
        """Public registration creates a user with role=CUSTOMER and cannot elevate role."""
        url = reverse('accounts:register')
        data = {
            'email': 'newcustomer@example.com',
            'full_name': 'New Customer',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'role': 'ADMIN'  # Attempting to elevate role
        }
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert 'token' in response.data
        assert response.data['user']['email'] == 'newcustomer@example.com'
        assert response.data['user']['role'] == 'CUSTOMER'

        # Verify in database
        user = User.objects.get(email='newcustomer@example.com')
        assert user.role == User.Role.CUSTOMER
        assert not user.is_staff
        assert not user.is_superuser

    def test_registration_password_mismatch(self):
        url = reverse('accounts:register')
        data = {
            'email': 'badpass@example.com',
            'full_name': 'Bad Pass',
            'password': 'Password123!',
            'password_confirm': 'DifferentPassword456!'
        }
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'password' in response.data

    def test_user_login_success(self):
        user = User.objects.create_user(
            email='testuser@example.com',
            password='TestPassword123!',
            full_name='Test User'
        )
        url = reverse('accounts:login')
        response = self.client.post(url, {
            'email': 'testuser@example.com',
            'password': 'TestPassword123!'
        })
        assert response.status_code == status.HTTP_200_OK
        assert 'token' in response.data
        assert response.data['user']['email'] == 'testuser@example.com'

    def test_user_login_invalid_credentials(self):
        url = reverse('accounts:login')
        response = self.client.post(url, {
            'email': 'nonexistent@example.com',
            'password': 'WrongPassword123!'
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_current_user_profile(self):
        user = User.objects.create_user(
            email='profiletest@example.com',
            password='Password123!',
            full_name='Profile Tester'
        )
        self.client.force_authenticate(user=user)
        url = reverse('accounts:current-user')
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == 'profiletest@example.com'
        assert response.data['full_name'] == 'Profile Tester'

    @patch('requests.get')
    def test_google_auth_new_user(self, mock_get):
        """Simulate Google OAuth token verification for a new user."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'email': 'googleuser@example.com',
            'name': 'Google User',
            'picture': 'https://example.com/avatar.jpg',
            'sub': 'google-uid-12345'
        }
        mock_get.return_value = mock_response

        url = reverse('accounts:google-auth')
        response = self.client.post(url, {'credential': 'fake-google-jwt-token'})

        assert response.status_code == status.HTTP_200_OK
        assert response.data['user']['email'] == 'googleuser@example.com'
        assert response.data['user']['role'] == 'CUSTOMER'
        assert response.data['user']['avatar_url'] == 'https://example.com/avatar.jpg'

        user = User.objects.get(email='googleuser@example.com')
        assert user.google_id == 'google-uid-12345'
        assert user.role == User.Role.CUSTOMER

    def test_firebase_google_auth_jwt_payload(self):
        """Simulate Firebase Auth token authentication."""
        url = reverse('accounts:google-auth')
        header = base64.urlsafe_b64encode(json.dumps({"alg": "RS256", "kid": "1234"}).encode()).decode().rstrip('=')
        payload = base64.urlsafe_b64encode(json.dumps({
            "iss": "https://securetoken.google.com/track-automotive",
            "aud": "track-automotive",
            "auth_time": int(time.time()),
            "user_id": "firebase-uid-9999",
            "sub": "firebase-uid-9999",
            "email": "firebaseuser@example.com",
            "name": "Firebase User",
            "picture": "https://example.com/fb_avatar.jpg"
        }).encode()).decode().rstrip('=')
        fake_jwt = f"{header}.{payload}.fake_signature"

        response = self.client.post(url, {
            'credential': fake_jwt,
            'email': 'firebaseuser@example.com',
            'name': 'Firebase User'
        })

        assert response.status_code == status.HTTP_200_OK
        assert response.data['user']['email'] == 'firebaseuser@example.com'
        assert response.data['user']['role'] == 'CUSTOMER'
        user = User.objects.get(email='firebaseuser@example.com')
        assert user.google_id == 'firebase-uid-9999'

    def test_admin_can_create_mechanic(self):
        admin = User.objects.create_superuser(
            email='superadmin@garage.com',
            password='AdminPassword123!',
            full_name='Super Admin'
        )
        self.client.force_authenticate(user=admin)
        url = reverse('accounts:user-list')
        data = {
            'email': 'new.mechanic@garage.com',
            'full_name': 'New Mechanic',
            'role': 'MECHANIC',
            'password': 'MechanicPass123!'
        }
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['role'] == 'MECHANIC'

    def test_non_admin_cannot_create_users_via_admin_api(self):
        customer = User.objects.create_user(
            email='regular@example.com',
            password='CustomerPass123!',
            full_name='Regular Customer'
        )
        self.client.force_authenticate(user=customer)
        url = reverse('accounts:user-list')
        response = self.client.post(url, {'email': 'hacker@example.com', 'role': 'ADMIN'})
        assert response.status_code == status.HTTP_403_FORBIDDEN
