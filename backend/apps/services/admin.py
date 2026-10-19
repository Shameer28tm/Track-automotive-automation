from django.contrib import admin
from .models import RepairJob, RepairPart, InspectionItem, VehicleFault

class RepairPartInline(admin.TabularInline):
    model = RepairPart
    extra = 1

class InspectionItemInline(admin.TabularInline):
    model = InspectionItem
    extra = 1

@admin.register(RepairJob)
class RepairJobAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'vehicle', 'mechanic', 'status', 'total_amount_display', 'created_at')
    list_filter = ('status', 'payment_mode', 'created_at')
    search_fields = ('title', 'vehicle__license_plate', 'mechanic__email', 'description')
    inlines = [RepairPartInline, InspectionItemInline]

    def total_amount_display(self, obj):
        return f"${obj.total_amount_payable}"
    total_amount_display.short_description = 'Total Payable'

@admin.register(VehicleFault)
class VehicleFaultAdmin(admin.ModelAdmin):
    list_display = ('id', 'vehicle', 'reported_by', 'assigned_mechanic', 'severity', 'status', 'date_reported')
    list_filter = ('severity', 'status', 'date_reported')
    search_fields = ('vehicle__license_plate', 'reported_by__email', 'description')
