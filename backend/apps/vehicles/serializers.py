from rest_framework import serializers
from .models import Vehicle
from apps.accounts.serializers import UserSerializer

class VehicleSerializer(serializers.ModelSerializer):
    owner_details = UserSerializer(source='owner', read_only=True)
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    active_jobs_count = serializers.SerializerMethodField()
    faults_count = serializers.SerializerMethodField()

    class Meta:
        model = Vehicle
        fields = [
            'id', 'owner', 'owner_details', 'owner_name', 'owner_email',
            'license_plate', 'make', 'model', 'year', 'color',
            'vehicle_type', 'fuel_type', 'chassis_number', 'current_mileage',
            'notes', 'active_jobs_count', 'faults_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'active_jobs_count', 'faults_count']

    def get_active_jobs_count(self, obj):
        return obj.repair_jobs.exclude(status='COMPLETED').count() if hasattr(obj, 'repair_jobs') else 0

    def get_faults_count(self, obj):
        return obj.faults.filter(status__in=['REPORTED', 'DIAGNOSED', 'IN_PROGRESS']).count() if hasattr(obj, 'faults') else 0

    def validate_license_plate(self, value):
        val = value.strip().upper()
        # Check uniqueness excluding self
        instance = getattr(self, 'instance', None)
        qs = Vehicle.objects.filter(license_plate__iexact=val)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A vehicle with this registration plate already exists.")
        return val
