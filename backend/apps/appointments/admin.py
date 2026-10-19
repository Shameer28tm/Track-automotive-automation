from django.contrib import admin
from .models import Appointment

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'vehicle', 'mechanic', 'service_type', 'appointment_date', 'appointment_time', 'status', 'created_at')
    list_filter = ('status', 'service_type', 'appointment_date')
    search_fields = ('customer__email', 'customer__full_name', 'vehicle__license_plate', 'mechanic__email')
    ordering = ('-appointment_date', '-appointment_time')
