from django.contrib import admin
from .models import Vehicle

@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('license_plate', 'make', 'model', 'year', 'owner', 'fuel_type', 'current_mileage', 'created_at')
    list_filter = ('vehicle_type', 'fuel_type', 'year')
    search_fields = ('license_plate', 'make', 'model', 'chassis_number', 'owner__email', 'owner__full_name')
    ordering = ('-created_at',)
