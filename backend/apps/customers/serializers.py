from rest_framework import serializers
from apps.accounts.models import User

class CustomerDetailSerializer(serializers.ModelSerializer):
    vehicles_count = serializers.SerializerMethodField()
    appointments_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'phone_number',
            'avatar_url', 'created_at', 'vehicles_count', 'appointments_count'
        ]
        read_only_fields = ['id', 'created_at', 'vehicles_count', 'appointments_count']

    def get_vehicles_count(self, obj):
        return obj.vehicles.count()

    def get_appointments_count(self, obj):
        return obj.appointments.count()


class CustomerCreateUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'phone_number', 'password']
        read_only_fields = ['id']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        validated_data['role'] = User.Role.CUSTOMER
        user = User.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user
