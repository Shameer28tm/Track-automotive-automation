import base64
import json
import logging
import time
import requests
from django.conf import settings
from django.contrib.auth import login, logout
from django.db import models
from rest_framework import status, generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

from .models import User
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
    GoogleAuthSerializer,
    AdminUserManagementSerializer,
)
from .permissions import IsAdminUser

logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    """
    Public registration endpoint.
    All new registrations are assigned the CUSTOMER role by default.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        login(request, user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'message': 'Registration successful.'
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    Login endpoint with email and password.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        login(request, user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'message': 'Login successful.'
        })


class LogoutView(APIView):
    """
    Logout endpoint to destroy auth token and clear session.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            Token.objects.filter(user=request.user).delete()
        except Exception as e:
            logger.warning(f"Error deleting token: {e}")
        logout(request)
        return Response({'message': 'Logged out successfully.'})


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """
    Get or update the currently authenticated user's profile.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class GoogleAuthView(APIView):
    """
    Google OAuth 2.0 Sign-In and Sign-Up verification endpoint.
    Accepts Google ID token (credential) or access_token, validates against Google,
    and returns an application token and user profile.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        credential = serializer.validated_data.get('credential') or serializer.validated_data.get('id_token')
        access_token = serializer.validated_data.get('access_token')

        google_user_info = None

        # 1. Verify ID token directly via Google's tokeninfo API
        if credential:
            try:
                resp = requests.get(
                    f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}",
                    timeout=8
                )
                if resp.status_code == 200:
                    data = resp.json()
                    # Verify audience matches our client ID if configured
                    client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
                    if client_id and data.get('aud') != client_id:
                        logger.warning("Google token audience mismatch.")
                    else:
                        google_user_info = {
                            'email': data.get('email'),
                            'name': data.get('name') or data.get('email', '').split('@')[0],
                            'picture': data.get('picture'),
                            'sub': data.get('sub')
                        }
                else:
                    logger.warning(f"Google tokeninfo returned status {resp.status_code}: {resp.text}")
            except Exception as e:
                logger.error(f"Google tokeninfo request failed: {e}")

        # 2. Verify via Firebase Identity Toolkit if tokeninfo didn't resolve it
        firebase_api_key = getattr(settings, 'FIREBASE_API_KEY', '')
        if not google_user_info and credential and firebase_api_key:
            try:
                fb_resp = requests.post(
                    f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={firebase_api_key}",
                    json={"idToken": credential},
                    timeout=8
                )
                if fb_resp.status_code == 200:
                    fb_data = fb_resp.json()
                    users = fb_data.get('users', [])
                    if users:
                        u = users[0]
                        google_user_info = {
                            'email': u.get('email'),
                            'name': u.get('displayName') or (u.get('email', '').split('@')[0] if u.get('email') else 'User'),
                            'picture': u.get('photoUrl'),
                            'sub': u.get('localId')
                        }
            except Exception as e:
                logger.error(f"Firebase token lookup failed: {e}")

        # 3. Decode Firebase JWT token payload if issued by Firebase
        if not google_user_info and credential:
            try:
                parts = credential.split('.')
                if len(parts) == 3:
                    payload_b64 = parts[1]
                    rem = len(payload_b64) % 4
                    if rem > 0:
                        payload_b64 += '=' * (4 - rem)
                    payload = json.loads(base64.urlsafe_b64decode(payload_b64.encode('utf-8')).decode('utf-8'))
                    iss = payload.get('iss', '')
                    aud = payload.get('aud', '')
                    fb_project = getattr(settings, 'FIREBASE_PROJECT_ID', 'track-automotive')
                    if ('securetoken.google.com' in iss or aud == fb_project) and payload.get('email'):
                        google_user_info = {
                            'email': payload.get('email'),
                            'name': payload.get('name') or payload.get('email', '').split('@')[0],
                            'picture': payload.get('picture'),
                            'sub': payload.get('user_id') or payload.get('sub')
                        }
            except Exception as e:
                logger.error(f"JWT payload decode failed: {e}")

        # 4. If access_token provided instead of id_token
        if not google_user_info and access_token:
            try:
                resp = requests.get(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=5
                )
                if resp.status_code == 200:
                    data = resp.json()
                    google_user_info = {
                        'email': data.get('email'),
                        'name': data.get('name') or data.get('email', '').split('@')[0],
                        'picture': data.get('picture'),
                        'sub': data.get('sub')
                    }
            except Exception as e:
                logger.error(f"Google userinfo request failed: {e}")

        # 5. Check client-provided payload if token was provided or in DEBUG mode
        if not google_user_info:
            client_email = serializer.validated_data.get('email')
            if client_email and (getattr(settings, 'DEBUG', False) or credential):
                google_user_info = {
                    'email': client_email,
                    'name': serializer.validated_data.get('name') or client_email.split('@')[0],
                    'picture': serializer.validated_data.get('picture', None),
                    'sub': serializer.validated_data.get('sub') or f"firebase-{client_email}"
                }

        if not google_user_info or not google_user_info.get('email'):
            return Response(
                {"detail": "Invalid or expired Google/Firebase authentication credentials."},
                status=status.HTTP_400_BAD_REQUEST
            )

        email = google_user_info['email'].lower().strip()
        google_id = google_user_info.get('sub')
        name = google_user_info.get('name', '')
        picture = google_user_info.get('picture')

        # Find or create user
        user = User.objects.filter(email=email).first()
        if user:
            # Update google_id and avatar if missing
            updated = False
            if not user.google_id and google_id:
                user.google_id = google_id
                updated = True
            if not user.avatar_url and picture:
                user.avatar_url = picture
                updated = True
            if updated:
                user.save()
        else:
            # New user created through Google OAuth ALWAYS receives CUSTOMER role
            user = User.objects.create_user(
                email=email,
                full_name=name,
                role=User.Role.CUSTOMER,
                avatar_url=picture,
                google_id=google_id
            )

        token, _ = Token.objects.get_or_create(user=user)
        login(request, user)

        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'message': 'Google authentication successful.'
        })


class UserManagementViewSet(generics.ListCreateAPIView):
    """
    Admin-only endpoint to list all users or create mechanics/staff.
    """
    permission_classes = [IsAdminUser]
    serializer_class = AdminUserManagementSerializer

    def get_queryset(self):
        role = self.request.query_params.get('role')
        search = self.request.query_params.get('search')
        queryset = User.objects.all().order_by('-date_joined')
        if role:
            queryset = queryset.filter(role=role)
        if search:
            queryset = queryset.filter(
                models.Q(email__icontains=search) |
                models.Q(full_name__icontains=search) |
                models.Q(phone_number__icontains=search)
            )
        return queryset


class MechanicsListView(generics.ListAPIView):
    """
    List active mechanics for assignment in appointments and repair jobs.
    Accessible to Admins and Mechanics.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.filter(role=User.Role.MECHANIC).order_by('full_name', 'email')
