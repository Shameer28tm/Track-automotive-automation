from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
import datetime

def current_year():
    return datetime.date.today().year

class Vehicle(models.Model):
    class VehicleType(models.TextChoices):
        SEDAN = 'SEDAN', 'Sedan'
        SUV = 'SUV', 'SUV'
        HATCHBACK = 'HATCHBACK', 'Hatchback'
        TRUCK = 'TRUCK', 'Truck / Pickup'
        VAN = 'VAN', 'Van'
        COUPE = 'COUPE', 'Coupe'
        OTHER = 'OTHER', 'Other'

    class FuelType(models.TextChoices):
        PETROL = 'PETROL', 'Petrol / Gasoline'
        DIESEL = 'DIESEL', 'Diesel'
        ELECTRIC = 'ELECTRIC', 'Electric (EV)'
        HYBRID = 'HYBRID', 'Hybrid'
        OTHER = 'OTHER', 'Other'

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='vehicles'
    )
    license_plate = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        help_text="Registration number / license plate"
    )
    make = models.CharField(max_length=50)
    model = models.CharField(max_length=50)
    year = models.PositiveIntegerField(
        validators=[
            MinValueValidator(1900),
            MaxValueValidator(current_year() + 1)
        ],
        default=current_year
    )
    color = models.CharField(max_length=30, blank=True)
    vehicle_type = models.CharField(
        max_length=20,
        choices=VehicleType.choices,
        default=VehicleType.SEDAN
    )
    fuel_type = models.CharField(
        max_length=20,
        choices=FuelType.choices,
        default=FuelType.PETROL
    )
    chassis_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="VIN or Chassis Number"
    )
    current_mileage = models.PositiveIntegerField(
        default=0,
        help_text="Current odometer reading in km"
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Vehicle'
        verbose_name_plural = 'Vehicles'

    def __str__(self):
        return f"{self.year} {self.make} {self.model} ({self.license_plate})"

    def clean(self):
        if self.license_plate:
            self.license_plate = self.license_plate.strip().upper()
