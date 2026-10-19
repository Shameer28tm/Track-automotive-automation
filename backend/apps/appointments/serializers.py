from rest_framework import serializers
from datetime import date
from .models import Appointment
from apps.vehicles.models import Vehicle
from apps.accounts.models import User
from apps.vehicles.serializers import VehicleSerializer
from apps.accounts.serializers import UserSerializer

class AppointmentSerializer(serializers.ModelSerializer):
    customer = serializers.PrimaryKeyRelatedField(read_only=True)
    customer_details = UserSerializer(source='customer', read_only=True)
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    customer_email = serializers.EmailField(source='customer.email', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone_number', read_only=True)

    vehicle_details = VehicleSerializer(source='vehicle', read_only=True)
    vehicle_plate = serializers.CharField(source='vehicle.license_plate', read_only=True)
    vehicle_info = serializers.SerializerMethodField()

    mechanic_details = UserSerializer(source='mechanic', read_only=True)
    mechanic_name = serializers.CharField(source='mechanic.full_name', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'customer', 'customer_details', 'customer_name', 'customer_email', 'customer_phone',
            'vehicle', 'vehicle_details', 'vehicle_plate', 'vehicle_info',
            'mechanic', 'mechanic_details', 'mechanic_name',
            'service_type', 'appointment_date', 'appointment_time',
            'status', 'notes', 'admin_notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_vehicle_info(self, obj):
        if obj.vehicle:
            return f"{obj.vehicle.year} {obj.vehicle.make} {obj.vehicle.model} ({obj.vehicle.license_plate})"
        return ""

    def validate_appointment_date(self, value):
        # Disallow scheduling appointments in the past
        if not getattr(self, 'instance', None) and value < date.today():
            raise serializers.ValidationError("Appointment date cannot be in the past.")
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user if request else None
        vehicle = attrs.get('vehicle', getattr(self.instance, 'vehicle', None))
        app_date = attrs.get('appointment_date', getattr(self.instance, 'appointment_date', None))
        app_time = attrs.get('appointment_time', getattr(self.instance, 'appointment_time', None))
        mechanic = attrs.get('mechanic', getattr(self.instance, 'mechanic', None))
        new_status = attrs.get('status', getattr(self.instance, 'status', None))

        # 1. Customer vehicle ownership check
        if user and not user.is_admin and vehicle:
            if vehicle.owner != user:
                raise serializers.ValidationError({"vehicle": "You can only book appointments for vehicles you own."})

        # 2. Check if the vehicle already has an active conflicting appointment on that same date & time
        if vehicle and app_date and app_time:
            conflicting = Appointment.objects.filter(
                vehicle=vehicle,
                appointment_date=app_date,
                appointment_time=app_time
            ).exclude(status__in=[Appointment.Status.CANCELLED, Appointment.Status.COMPLETED])

            if self.instance:
                conflicting = conflicting.exclude(pk=self.instance.pk)

            if conflicting.exists():
                raise serializers.ValidationError({"appointment_time": "This vehicle already has an appointment booked for this time."})

        # 3. Check mechanic conflict if mechanic assigned
        if mechanic and app_date and app_time:
            mechanic_conflict = Appointment.objects.filter(
                mechanic=mechanic,
                appointment_date=app_date,
                appointment_time=app_time
            ).exclude(status__in=[Appointment.Status.CANCELLED, Appointment.Status.COMPLETED])

            if self.instance:
                mechanic_conflict = mechanic_conflict.exclude(pk=self.instance.pk)

            if mechanic_conflict.exists():
                raise serializers.ValidationError({"mechanic": f"Mechanic {mechanic.full_name or mechanic.email} is already booked at this time."})

        # 4. Status permissions
        if self.instance and user:
            # Customers can only cancel their own pending/confirmed appointments
            if not user.is_admin and not user.is_mechanic:
                if 'status' in attrs and attrs['status'] != Appointment.Status.CANCELLED:
                    raise serializers.ValidationError({"status": "Customers can only cancel appointments. Contact garage for status modifications."})

        return attrs
