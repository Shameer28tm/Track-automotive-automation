from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'phone_number', 
            'role', 'avatar_url', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'role', 'created_at', 'updated_at']


class AdminUserManagementSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'phone_number', 
            'role', 'avatar_url', 'password', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['email', 'full_name', 'phone_number', 'password', 'password_confirm']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        # Public registrations are ALWAYS assigned the CUSTOMER role
        validated_data['role'] = User.Role.CUSTOMER
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email', '').lower().strip()
        password = attrs.get('password')

        if email and password:
            user = authenticate(request=self.context.get('request'), username=email, password=password)
            if not user:
                raise serializers.ValidationError({"detail": "Unable to log in with provided credentials."})
        else:
            raise serializers.ValidationError({"detail": "Must include 'email' and 'password'."})

        attrs['user'] = user
        return attrs


class GoogleAuthSerializer(serializers.Serializer):
    credential = serializers.CharField(required=False, help_text="Google ID token (credential)")
    access_token = serializers.CharField(required=False, help_text="Google OAuth access token")
    email = serializers.EmailField(required=False)
    name = serializers.CharField(required=False)
    picture = serializers.URLField(required=False)
