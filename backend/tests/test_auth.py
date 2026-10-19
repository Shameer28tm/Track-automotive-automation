import pytest
from unittest.mock import patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.accounts.services import (
    verify_google_or_firebase_token,
    AuthenticationVerificationError
)
from google.auth.exceptions import GoogleAuthError


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

    # =========================================================================
    # GOOGLE & FIREBASE AUTHENTICATION SECURITY TESTS
    # =========================================================================

    def test_google_auth_missing_token_rejected(self):
        """Requests with missing or empty token fields are strictly rejected."""
        url = reverse('accounts:google-auth')
        
        # Missing payload entirely
        response = self.client.post(url, {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Only client-supplied identity fields without a cryptographic token
        response = self.client.post(url, {
            'email': 'attacker@example.com',
            'name': 'Attacker',
            'role': 'ADMIN'
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'credential' in response.data

    def test_google_auth_blank_token_rejected(self):
        """Tokens containing only whitespace are rejected with 400 Bad Request."""
        url = reverse('accounts:google-auth')
        response = self.client.post(url, {'credential': '   '})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_google_auth_invalid_malformed_token_rejected(self):
        """Malformed or completely invalid tokens are rejected by cryptographic verification."""
        url = reverse('accounts:google-auth')
        response = self.client.post(url, {'credential': 'malformed.token.garbage'})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'detail' in response.data

    @patch('apps.accounts.services.google_id_token.verify_firebase_token')
    def test_google_auth_expired_token_rejected(self, mock_verify):
        """Expired tokens are detected and rejected with a clear error."""
        mock_verify.side_effect = GoogleAuthError("Token used too late: token has expired")
        url = reverse('accounts:google-auth')

        response = self.client.post(url, {'credential': 'expired.test.jwt.token'})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'expired' in response.data['detail'].lower()

    @patch('apps.accounts.services.google_id_token.verify_firebase_token')
    def test_google_auth_forged_signature_rejected(self, mock_verify):
        """Tokens with forged cryptographic signatures are rejected."""
        mock_verify.side_effect = ValueError("Invalid token signature or certificate not found")
        url = reverse('accounts:google-auth')

        response = self.client.post(url, {'credential': 'forged.signature.token'})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'detail' in response.data

    @patch('apps.accounts.services.google_id_token.verify_firebase_token')
    def test_google_auth_wrong_project_rejected(self, mock_verify):
        """Tokens issued for a different Google/Firebase project are strictly rejected."""
        # Returns claims for a rogue project
        mock_verify.return_value = {
            'iss': 'https://securetoken.google.com/malicious-project',
            'aud': 'malicious-project',
            'sub': 'malicious-user-999',
            'email': 'evil@example.com',
            'email_verified': True
        }
        url = reverse('accounts:google-auth')

        response = self.client.post(url, {'credential': 'token.from.wrong.project'})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'project' in response.data['detail'].lower() or 'audience' in response.data['detail'].lower()

    @patch('apps.accounts.services.google_id_token.verify_firebase_token')
    def test_google_auth_unverified_email_rejected(self, mock_verify):
        """Accounts with unverified email addresses are strictly rejected."""
        mock_verify.return_value = {
            'iss': 'https://securetoken.google.com/track-automotive',
            'aud': 'track-automotive',
            'sub': 'unverified-user-123',
            'email': 'unverified@example.com',
            'email_verified': False  # Email not verified by Google
        }
        url = reverse('accounts:google-auth')

        response = self.client.post(url, {'credential': 'valid.sig.but.unverified.email'})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'not verified' in response.data['detail'].lower()

    @patch('apps.accounts.services.google_id_token.verify_firebase_token')
    def test_google_auth_client_supplied_spoofing_ignored(self, mock_verify):
        """
        Client-supplied email, name, role, and sub parameters are completely stripped.
        Identity is extracted exclusively from the verified token claims.
        """
        mock_verify.return_value = {
            'iss': 'https://securetoken.google.com/track-automotive',
            'aud': 'track-automotive',
            'sub': 'verified-google-sub-789',
            'email': 'legit_customer@example.com',
            'name': 'Verified Customer',
            'email_verified': True
        }
        url = reverse('accounts:google-auth')

        # Malicious client sends spoofed fields in request body
        response = self.client.post(url, {
            'credential': 'valid.verified.token',
            'email': 'spoofed_admin@trackautomotive.com',
            'role': 'ADMIN',
            'name': 'Hacker Admin',
            'sub': 'fake-sub'
        })

        assert response.status_code == status.HTTP_200_OK
        # Must match verified token, NOT the client's spoofed body fields
        assert response.data['user']['email'] == 'legit_customer@example.com'
        assert response.data['user']['role'] == 'CUSTOMER'

        # Verify DB integrity
        user = User.objects.get(email='legit_customer@example.com')
        assert user.role == User.Role.CUSTOMER
        assert user.google_id == 'verified-google-sub-789'
        assert not User.objects.filter(email='spoofed_admin@trackautomotive.com').exists()

    @patch('apps.accounts.services.google_id_token.verify_firebase_token')
    def test_google_auth_creates_customer_role_only(self, mock_verify):
        """Legitimate Google sign-in creates ONLY CUSTOMER accounts by default."""
        mock_verify.return_value = {
            'iss': 'https://securetoken.google.com/track-automotive',
            'aud': 'track-automotive',
            'sub': 'new-google-user-111',
            'email': 'brandnew@example.com',
            'name': 'Brand New Customer',
            'picture': 'https://example.com/avatar.png',
            'email_verified': True
        }
        url = reverse('accounts:google-auth')

        response = self.client.post(url, {'credential': 'valid.token.for.new.user'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user']['role'] == 'CUSTOMER'

        created_user = User.objects.get(email='brandnew@example.com')
        assert created_user.role == User.Role.CUSTOMER
        assert not created_user.is_staff
        assert not created_user.is_superuser
        assert created_user.google_id == 'new-google-user-111'
        assert created_user.avatar_url == 'https://example.com/avatar.png'

    @patch('apps.accounts.services.google_id_token.verify_firebase_token')
    def test_google_auth_existing_user_preserves_role(self, mock_verify):
        """When an existing user (e.g. MECHANIC) signs in via Google, their role is preserved."""
        mechanic = User.objects.create_user(
            email='mechanic.john@garage.com',
            password='SecurePass123!',
            full_name='John Mechanic',
            role=User.Role.MECHANIC
        )

        mock_verify.return_value = {
            'iss': 'https://securetoken.google.com/track-automotive',
            'aud': 'track-automotive',
            'sub': 'mechanic-google-id-456',
            'email': 'mechanic.john@garage.com',
            'email_verified': True
        }
        url = reverse('accounts:google-auth')

        response = self.client.post(url, {'credential': 'valid.token.mechanic'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user']['role'] == 'MECHANIC'

        mechanic.refresh_from_db()
        assert mechanic.role == User.Role.MECHANIC
        assert mechanic.google_id == 'mechanic-google-id-456'

    # =========================================================================
    # DIRECT SERVICE UNIT TESTS FOR VERIFICATION
    # =========================================================================

    def test_service_rejects_missing_or_blank_token(self):
        with pytest.raises(AuthenticationVerificationError, match="required"):
            verify_google_or_firebase_token(None)
        with pytest.raises(AuthenticationVerificationError, match="required"):
            verify_google_or_firebase_token("")
        with pytest.raises(AuthenticationVerificationError, match="blank"):
            verify_google_or_firebase_token("    ")

    @patch('apps.accounts.services.google_id_token.verify_firebase_token')
    def test_service_unverified_email_raises_error(self, mock_verify):
        mock_verify.return_value = {
            'iss': 'https://securetoken.google.com/track-automotive',
            'aud': 'track-automotive',
            'sub': 'some-sub',
            'email': 'unverified@example.com',
            'email_verified': False
        }
        with pytest.raises(AuthenticationVerificationError, match="not verified"):
            verify_google_or_firebase_token("fake-token")

    @patch('apps.accounts.services.google_id_token.verify_firebase_token')
    def test_service_wrong_project_audience_raises_error(self, mock_verify):
        mock_verify.return_value = {
            'iss': 'https://securetoken.google.com/other-project',
            'aud': 'other-project',
            'sub': 'some-sub',
            'email': 'user@example.com',
            'email_verified': True
        }
        with pytest.raises(AuthenticationVerificationError, match="unauthorized Firebase project"):
            verify_google_or_firebase_token("fake-token")

    @patch('apps.accounts.services.google_id_token.verify_firebase_token')
    def test_service_valid_token_returns_expected_claims(self, mock_verify):
        mock_verify.return_value = {
            'iss': 'https://securetoken.google.com/track-automotive',
            'aud': 'track-automotive',
            'sub': 'verified-uid-888',
            'email': 'VALID_USER@example.com',
            'name': 'Valid User',
            'picture': 'https://example.com/photo.jpg',
            'email_verified': True
        }
        claims = verify_google_or_firebase_token("valid-jwt-token")
        assert claims['email'] == 'valid_user@example.com'  # Lowercased
        assert claims['sub'] == 'verified-uid-888'
        assert claims['name'] == 'Valid User'
        assert claims['picture'] == 'https://example.com/photo.jpg'

    # =========================================================================
    # ROLE MANAGEMENT TESTS
    # =========================================================================

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
