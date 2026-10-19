from rest_framework import serializers
from .models import RepairJob, RepairPart, InspectionItem, VehicleFault
from apps.vehicles.serializers import VehicleSerializer
from apps.accounts.serializers import UserSerializer

class RepairPartSerializer(serializers.ModelSerializer):
    repair_job = serializers.PrimaryKeyRelatedField(read_only=True)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = RepairPart
        fields = ['id', 'repair_job', 'part_name', 'part_number', 'unit_price', 'quantity', 'total_amount']
        read_only_fields = ['id', 'repair_job', 'total_amount']


class InspectionItemSerializer(serializers.ModelSerializer):
    repair_job = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = InspectionItem
        fields = ['id', 'repair_job', 'item_name', 'result', 'status', 'recommendation']
        read_only_fields = ['id', 'repair_job']


class VehicleFaultSerializer(serializers.ModelSerializer):
    reported_by = serializers.PrimaryKeyRelatedField(read_only=True)
    vehicle_plate = serializers.CharField(source='vehicle.license_plate', read_only=True)
    vehicle_info = serializers.SerializerMethodField()
    reported_by_name = serializers.CharField(source='reported_by.full_name', read_only=True)
    assigned_mechanic_name = serializers.CharField(source='assigned_mechanic.full_name', read_only=True)

    class Meta:
        model = VehicleFault
        fields = [
            'id', 'vehicle', 'vehicle_plate', 'vehicle_info',
            'reported_by', 'reported_by_name',
            'assigned_mechanic', 'assigned_mechanic_name',
            'repair_job', 'description', 'severity', 'status',
            'diagnosis', 'resolution_notes', 'date_reported', 'resolved_at'
        ]
        read_only_fields = ['id', 'date_reported']

    def get_vehicle_info(self, obj):
        if obj.vehicle:
            return f"{obj.vehicle.year} {obj.vehicle.make} {obj.vehicle.model}"
        return ""


class RepairJobSerializer(serializers.ModelSerializer):
    vehicle_details = VehicleSerializer(source='vehicle', read_only=True)
    vehicle_plate = serializers.CharField(source='vehicle.license_plate', read_only=True)
    customer_name = serializers.CharField(source='vehicle.owner.full_name', read_only=True)
    customer_email = serializers.EmailField(source='vehicle.owner.email', read_only=True)
    mechanic_details = UserSerializer(source='mechanic', read_only=True)
    mechanic_name = serializers.CharField(source='mechanic.full_name', read_only=True)

    parts = RepairPartSerializer(many=True, read_only=True)
    inspections = InspectionItemSerializer(many=True, read_only=True)

    parts_subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    tax_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_amount_payable = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = RepairJob
        fields = [
            'id', 'vehicle', 'vehicle_details', 'vehicle_plate', 'customer_name', 'customer_email',
            'appointment', 'mechanic', 'mechanic_details', 'mechanic_name',
            'title', 'description', 'mechanic_notes', 'customer_request', 'action_taken',
            'status', 'labor_fee', 'tax_rate', 'payment_mode',
            'next_service_km', 'next_service_date', 'next_service_advice',
            'parts', 'inspections', 'parts_subtotal', 'tax_amount', 'total_amount_payable',
            'started_at', 'completed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'parts_subtotal', 'tax_amount', 'total_amount_payable',
            'created_at', 'updated_at'
        ]


class RepairJobCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer used for creating and updating repair jobs with validation."""
    class Meta:
        model = RepairJob
        fields = [
            'id', 'vehicle', 'appointment', 'mechanic',
            'title', 'description', 'mechanic_notes', 'customer_request', 'action_taken',
            'status', 'labor_fee', 'tax_rate', 'payment_mode',
            'next_service_km', 'next_service_date', 'next_service_advice',
            'started_at', 'completed_at'
        ]
