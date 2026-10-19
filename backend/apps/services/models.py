from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils import timezone

class RepairJob(models.Model):
    class Status(models.TextChoices):
        QUEUED = 'QUEUED', 'Queued'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        WAITING_PARTS = 'WAITING_PARTS', 'Waiting for Parts'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class PaymentMode(models.TextChoices):
        CASH = 'CASH', 'Cash'
        CARD = 'CARD', 'Credit / Debit Card'
        ONLINE = 'ONLINE', 'Online Transfer'
        UNPAID = 'UNPAID', 'Unpaid'

    vehicle = models.ForeignKey(
        'vehicles.Vehicle',
        on_delete=models.CASCADE,
        related_name='repair_jobs'
    )
    appointment = models.OneToOneField(
        'appointments.Appointment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='repair_job'
    )
    mechanic = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='repair_jobs'
    )
    title = models.CharField(max_length=200, help_text="e.g. 10,000KM Scheduled Maintenance")
    description = models.TextField()
    mechanic_notes = models.TextField(blank=True)
    customer_request = models.TextField(blank=True)
    action_taken = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.QUEUED,
        db_index=True
    )
    labor_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )
    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('6.00'),
        help_text="Tax percentage (e.g., 6.00%)"
    )
    payment_mode = models.CharField(
        max_length=20,
        choices=PaymentMode.choices,
        default=PaymentMode.UNPAID
    )
    next_service_km = models.IntegerField(null=True, blank=True)
    next_service_date = models.DateField(null=True, blank=True)
    next_service_advice = models.TextField(blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Repair Job'
        verbose_name_plural = 'Repair Jobs'

    def __str__(self):
        return f"Job #{self.id}: {self.title} - {self.vehicle.license_plate} ({self.status})"

    @property
    def parts_subtotal(self):
        return sum(part.total_amount for part in self.parts.all())

    @property
    def tax_amount(self):
        subtotal = self.parts_subtotal + self.labor_fee
        return (subtotal * (self.tax_rate / Decimal('100.0'))).quantize(Decimal('0.01'))

    @property
    def total_amount_payable(self):
        return self.parts_subtotal + self.labor_fee + self.tax_amount

    def mark_completed(self):
        self.status = self.Status.COMPLETED
        if not self.completed_at:
            self.completed_at = timezone.now()
        self.save()


class RepairPart(models.Model):
    repair_job = models.ForeignKey(
        RepairJob,
        on_delete=models.CASCADE,
        related_name='parts'
    )
    part_name = models.CharField(max_length=150)
    part_number = models.CharField(max_length=50, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        verbose_name = 'Repair Part'
        verbose_name_plural = 'Repair Parts'

    def __str__(self):
        return f"{self.part_name} x {self.quantity}"

    @property
    def total_amount(self):
        return self.unit_price * self.quantity


class InspectionItem(models.Model):
    class Status(models.TextChoices):
        PASS = 'PASS', 'Pass'
        ATTENTION = 'ATTENTION', 'Needs Attention'
        FAIL = 'FAIL', 'Failed'

    repair_job = models.ForeignKey(
        RepairJob,
        on_delete=models.CASCADE,
        related_name='inspections'
    )
    item_name = models.CharField(max_length=100, help_text="e.g. Brake Pads, Tire Tread, Battery")
    result = models.CharField(max_length=100, help_text="e.g. 6mm, 12.6V, Good")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PASS
    )
    recommendation = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = 'Inspection Item'
        verbose_name_plural = 'Inspection Items'

    def __str__(self):
        return f"{self.item_name}: {self.result} ({self.status})"


class VehicleFault(models.Model):
    class Severity(models.TextChoices):
        LOW = 'LOW', 'Low'
        MEDIUM = 'MEDIUM', 'Medium'
        HIGH = 'HIGH', 'High'
        CRITICAL = 'CRITICAL', 'Critical / Urgent'

    class Status(models.TextChoices):
        REPORTED = 'REPORTED', 'Reported'
        DIAGNOSED = 'DIAGNOSED', 'Diagnosed'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        RESOLVED = 'RESOLVED', 'Resolved'

    vehicle = models.ForeignKey(
        'vehicles.Vehicle',
        on_delete=models.CASCADE,
        related_name='faults'
    )
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reported_faults'
    )
    assigned_mechanic = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_faults'
    )
    repair_job = models.ForeignKey(
        RepairJob,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='faults'
    )
    description = models.TextField(help_text="Detailed description of the issue or symptom")
    severity = models.CharField(
        max_length=20,
        choices=Severity.choices,
        default=Severity.MEDIUM
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.REPORTED,
        db_index=True
    )
    diagnosis = models.TextField(blank=True, help_text="Mechanic diagnosis notes")
    resolution_notes = models.TextField(blank=True, help_text="How the fault was resolved")
    date_reported = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date_reported']
        verbose_name = 'Vehicle Fault'
        verbose_name_plural = 'Vehicle Faults'

    def __str__(self):
        return f"Fault on {self.vehicle.license_plate} ({self.severity}): {self.status}"
