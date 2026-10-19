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
from .services import verify_google_or_firebase_token, AuthenticationVerificationError

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
    Google & Firebase OAuth 2.0 Sign-In and Sign-Up verification endpoint.
    Strictly validates token cryptographic signature, issuer, audience/project ID,
    expiry, and verified email status using Google's authoritative public certs.
    Completely rejects unverified tokens or client-supplied credentials.
    New users created via Google Sign-In strictly receive the CUSTOMER role.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']

        try:
            verified_claims = verify_google_or_firebase_token(token)
        except AuthenticationVerificationError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected token verification failure: {e}")
            return Response(
                {"detail": "Authentication token verification failed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        email = verified_claims['email']
        google_id = verified_claims['sub']
        name = verified_claims['name']
        picture = verified_claims['picture']

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
