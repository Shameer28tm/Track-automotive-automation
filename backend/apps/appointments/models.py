from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from datetime import date

class Appointment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Confirmation'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class ServiceType(models.TextChoices):
        GENERAL_SERVICE = 'GENERAL_SERVICE', 'General Maintenance Service'
        OIL_CHANGE = 'OIL_CHANGE', 'Engine Oil & Filter Change'
        BRAKE_INSPECTION = 'BRAKE_INSPECTION', 'Brake System Inspection & Repair'
        ENGINE_DIAGNOSTICS = 'ENGINE_DIAGNOSTICS', 'Engine Diagnostics & Tuning'
        TIRE_SUSPENSION = 'TIRE_SUSPENSION', 'Tire & Suspension Service'
        ELECTRICAL = 'ELECTRICAL', 'Battery & Electrical System'
        AIR_CONDITIONING = 'AIR_CONDITIONING', 'AC Inspection & Gas Refill'
        OTHER = 'OTHER', 'Other Custom Repair'

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='appointments'
    )
    vehicle = models.ForeignKey(
        'vehicles.Vehicle',
        on_delete=models.CASCADE,
        related_name='appointments'
    )
    mechanic = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_appointments'
    )
    service_type = models.CharField(
        max_length=50,
        choices=ServiceType.choices,
        default=ServiceType.GENERAL_SERVICE
    )
    appointment_date = models.DateField(db_index=True)
    appointment_time = models.TimeField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    notes = models.TextField(blank=True, help_text="Issue description from customer")
    admin_notes = models.TextField(blank=True, help_text="Internal notes or instructions")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['appointment_date', 'appointment_time']
        verbose_name = 'Appointment'
        verbose_name_plural = 'Appointments'

    def __str__(self):
        return f"Appointment #{self.id} - {self.vehicle.license_plate} on {self.appointment_date} ({self.status})"

    def clean(self):
        # Validate that appointment date is not in the past for new appointments
        if not self.pk and self.appointment_date and self.appointment_date < date.today():
            raise ValidationError({'appointment_date': "Appointment date cannot be in the past."})
