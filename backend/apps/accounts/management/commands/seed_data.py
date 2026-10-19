from decimal import Decimal
from datetime import date, time, timedelta
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone
from apps.accounts.models import User
from apps.vehicles.models import Vehicle
from apps.appointments.models import Appointment
from apps.services.models import RepairJob, RepairPart, InspectionItem, VehicleFault
from apps.notifications.models import Notification

class Command(BaseCommand):
    help = 'Seeds initial sample data for development and testing. Do NOT run in production.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("=== Starting Development Data Seeding ==="))

        # 1. Admin User
        admin, created = User.objects.get_or_create(
            email='admin@trackautomotive.com',
            defaults={
                'username': 'admin@trackautomotive.com',
                'full_name': 'Chief Administrator',
                'role': User.Role.ADMIN,
                'phone_number': '+1-555-0100',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin.set_password('AdminPass123!')
            admin.save()
            self.stdout.write(self.style.SUCCESS(f"Created Admin: admin@trackautomotive.com / AdminPass123!"))

        # 2. Mechanics
        mech1, created = User.objects.get_or_create(
            email='john.mechanic@trackautomotive.com',
            defaults={
                'username': 'john.mechanic@trackautomotive.com',
                'full_name': 'John Miller',
                'role': User.Role.MECHANIC,
                'phone_number': '+1-555-0101',
            }
        )
        if created:
            mech1.set_password('MechPass123!')
            mech1.save()
            self.stdout.write(self.style.SUCCESS(f"Created Mechanic: john.mechanic@trackautomotive.com / MechPass123!"))

        mech2, created = User.objects.get_or_create(
            email='mike.mechanic@trackautomotive.com',
            defaults={
                'username': 'mike.mechanic@trackautomotive.com',
                'full_name': 'Mike Vance',
                'role': User.Role.MECHANIC,
                'phone_number': '+1-555-0102',
            }
        )
        if created:
            mech2.set_password('MechPass123!')
            mech2.save()
            self.stdout.write(self.style.SUCCESS(f"Created Mechanic: mike.mechanic@trackautomotive.com / MechPass123!"))

        # 3. Customers
        cust1, created = User.objects.get_or_create(
            email='sarah.customer@example.com',
            defaults={
                'username': 'sarah.customer@example.com',
                'full_name': 'Sarah Connor',
                'role': User.Role.CUSTOMER,
                'phone_number': '+1-555-0201',
            }
        )
        if created:
            cust1.set_password('CustomerPass123!')
            cust1.save()
            self.stdout.write(self.style.SUCCESS(f"Created Customer: sarah.customer@example.com / CustomerPass123!"))

        cust2, created = User.objects.get_or_create(
            email='david.customer@example.com',
            defaults={
                'username': 'david.customer@example.com',
                'full_name': 'David Chen',
                'role': User.Role.CUSTOMER,
                'phone_number': '+1-555-0202',
            }
        )
        if created:
            cust2.set_password('CustomerPass123!')
            cust2.save()
            self.stdout.write(self.style.SUCCESS(f"Created Customer: david.customer@example.com / CustomerPass123!"))

        # 4. Vehicles
        v1, _ = Vehicle.objects.get_or_create(
            license_plate='KAB-1024',
            defaults={
                'owner': cust1,
                'make': 'Toyota',
                'model': 'RAV4',
                'year': 2022,
                'color': 'Midnight Blue',
                'vehicle_type': Vehicle.VehicleType.SUV,
                'fuel_type': Vehicle.FuelType.HYBRID,
                'chassis_number': 'JT3B1REV4NJ009182',
                'current_mileage': 28500,
            }
        )

        v2, _ = Vehicle.objects.get_or_create(
            license_plate='KCA-9932',
            defaults={
                'owner': cust1,
                'make': 'Honda',
                'model': 'Civic',
                'year': 2020,
                'color': 'Pearl White',
                'vehicle_type': Vehicle.VehicleType.SEDAN,
                'fuel_type': Vehicle.FuelType.PETROL,
                'chassis_number': '2HGFC2F60MH543210',
                'current_mileage': 45200,
            }
        )

        v3, _ = Vehicle.objects.get_or_create(
            license_plate='KBZ-5501',
            defaults={
                'owner': cust2,
                'make': 'Ford',
                'model': 'F-150',
                'year': 2021,
                'color': 'Shadow Black',
                'vehicle_type': Vehicle.VehicleType.TRUCK,
                'fuel_type': Vehicle.FuelType.PETROL,
                'chassis_number': '1FTFW1E84MFB12345',
                'current_mileage': 61000,
            }
        )
        self.stdout.write(self.style.SUCCESS(f"Created 3 Vehicles for testing."))

        # 5. Appointments
        today = date.today()
        app1, _ = Appointment.objects.get_or_create(
            vehicle=v1,
            appointment_date=today + timedelta(days=2),
            appointment_time=time(9, 30),
            defaults={
                'customer': cust1,
                'mechanic': mech1,
                'service_type': Appointment.ServiceType.GENERAL_SERVICE,
                'status': Appointment.Status.CONFIRMED,
                'notes': 'Scheduled 30,000km maintenance and tire rotation.',
                'admin_notes': 'Assigned to John Miller (Bay 1).'
            }
        )

        app2, _ = Appointment.objects.get_or_create(
            vehicle=v2,
            appointment_date=today + timedelta(days=4),
            appointment_time=time(14, 0),
            defaults={
                'customer': cust1,
                'service_type': Appointment.ServiceType.BRAKE_INSPECTION,
                'status': Appointment.Status.PENDING,
                'notes': 'Front brakes feel spongy and slight squeaking when slowing down.',
            }
        )

        app3, _ = Appointment.objects.get_or_create(
            vehicle=v3,
            appointment_date=today - timedelta(days=3),
            appointment_time=time(11, 0),
            defaults={
                'customer': cust2,
                'mechanic': mech2,
                'service_type': Appointment.ServiceType.OIL_CHANGE,
                'status': Appointment.Status.COMPLETED,
                'notes': 'Routine full synthetic oil and oil filter change.',
            }
        )
        self.stdout.write(self.style.SUCCESS(f"Created 3 Appointments."))

        # 6. Repair Jobs
        job1, _ = RepairJob.objects.get_or_create(
            vehicle=v1,
            title='30,000km Major Maintenance Service',
            defaults={
                'appointment': app1,
                'mechanic': mech1,
                'description': 'Full inspection, synthetic oil change, filter replacements, and brake pad measurement.',
                'status': RepairJob.Status.IN_PROGRESS,
                'labor_fee': Decimal('85.00'),
                'tax_rate': Decimal('6.00'),
                'payment_mode': RepairJob.PaymentMode.UNPAID,
                'customer_request': 'Inspect steering vibration and check AC coolant level.',
                'action_taken': 'Drained and replaced motor oil. Balanced front wheels. Inspected underbody.',
                'next_service_km': 40000,
                'next_service_date': today + timedelta(days=180),
                'next_service_advice': 'Recommended rear brake pad replacement at 40,000 km.',
                'started_at': timezone.now() - timedelta(hours=3),
            }
        )

        # Parts for Job 1
        RepairPart.objects.get_or_create(
            repair_job=job1,
            part_name='Full Synthetic Oil 0W-20 (4L)',
            defaults={
                'part_number': 'SYN-0W20-4L',
                'unit_price': Decimal('54.00'),
                'quantity': 1,
            }
        )
        RepairPart.objects.get_or_create(
            repair_job=job1,
            part_name='OEM Oil Filter Element',
            defaults={
                'part_number': 'FLTR-04152-YZZA1',
                'unit_price': Decimal('14.50'),
                'quantity': 1,
            }
        )
        RepairPart.objects.get_or_create(
            repair_job=job1,
            part_name='Engine Air Filter',
            defaults={
                'part_number': 'AF-17801-F0050',
                'unit_price': Decimal('22.00'),
                'quantity': 1,
            }
        )

        # Inspection Items for Job 1
        InspectionItem.objects.get_or_create(
            repair_job=job1,
            item_name='Front Brake Pad Thickness',
            defaults={
                'result': '7mm',
                'status': InspectionItem.Status.PASS,
                'recommendation': 'Good condition (over 50% remaining)'
            }
        )
        InspectionItem.objects.get_or_create(
            repair_job=job1,
            item_name='12V Auxiliary Battery Health',
            defaults={
                'result': '12.6V (540 CCA)',
                'status': InspectionItem.Status.PASS,
                'recommendation': 'Holding charge properly'
            }
        )
        InspectionItem.objects.get_or_create(
            repair_job=job1,
            item_name='Cabin Air Filter',
            defaults={
                'result': 'Dust accumulation',
                'status': InspectionItem.Status.ATTENTION,
                'recommendation': 'Cleaned out, replace next service'
            }
        )

        # Completed Job 2 for Ford F-150
        job2, _ = RepairJob.objects.get_or_create(
            vehicle=v3,
            title='60,000km Spark Plugs & Transmission Service',
            defaults={
                'appointment': app3,
                'mechanic': mech2,
                'description': 'Replaced all 6 platinum spark plugs and flushed transmission fluid.',
                'status': RepairJob.Status.COMPLETED,
                'labor_fee': Decimal('160.00'),
                'tax_rate': Decimal('6.00'),
                'payment_mode': RepairJob.PaymentMode.CARD,
                'customer_request': 'Check rough idle on cold start.',
                'action_taken': 'Diagnosed worn plugs on cylinder 3 and 5. Replaced set and cleared fault codes.',
                'next_service_km': 70000,
                'next_service_date': today + timedelta(days=120),
                'next_service_advice': 'Check differential fluid at 70,000 km.',
                'started_at': timezone.now() - timedelta(days=3),
                'completed_at': timezone.now() - timedelta(days=3, hours=-2),
            }
        )
        RepairPart.objects.get_or_create(
            repair_job=job2,
            part_name='Iridium Spark Plug (Set of 6)',
            defaults={
                'part_number': 'SP-SP548',
                'unit_price': Decimal('78.00'),
                'quantity': 1,
            }
        )
        RepairPart.objects.get_or_create(
            repair_job=job2,
            part_name='Automatic Transmission Fluid Mercon LV (8 Qts)',
            defaults={
                'part_number': 'ATF-XT-10-QLVC',
                'unit_price': Decimal('96.00'),
                'quantity': 1,
            }
        )
        self.stdout.write(self.style.SUCCESS(f"Created 2 Repair Jobs with parts and inspections."))

        # 7. Vehicle Faults
        VehicleFault.objects.get_or_create(
            vehicle=v2,
            description='Brake pedal pulsating and metallic squeak when slowing down from highway speeds.',
            defaults={
                'reported_by': cust1,
                'assigned_mechanic': mech1,
                'severity': VehicleFault.Severity.HIGH,
                'status': VehicleFault.Status.REPORTED,
                'diagnosis': 'Likely rotor warpage or front brake pads below minimum thickness limit.',
            }
        )
        VehicleFault.objects.get_or_create(
            vehicle=v3,
            description='Engine misfire code P0303 stored during cold morning start.',
            defaults={
                'reported_by': cust2,
                'assigned_mechanic': mech2,
                'repair_job': job2,
                'severity': VehicleFault.Severity.MEDIUM,
                'status': VehicleFault.Status.RESOLVED,
                'diagnosis': 'Spark plug electrode gap excessive on cylinder 3.',
                'resolution_notes': 'Installed new OEM platinum plugs. Road tested and cleared DTCs.',
                'resolved_at': timezone.now() - timedelta(days=3),
            }
        )
        self.stdout.write(self.style.SUCCESS(f"Created 2 Vehicle Fault records."))

        # 8. Notifications
        Notification.objects.get_or_create(
            recipient=cust1,
            title='Appointment Confirmed',
            message='Your appointment for Toyota RAV4 (KAB-1024) is confirmed for 9:30 AM.',
            defaults={
                'notification_type': Notification.NotificationType.APPOINTMENT,
                'is_read': False,
                'link_url': f'/appointments/{app1.id}',
            }
        )
        Notification.objects.get_or_create(
            recipient=cust1,
            title='Repair In Progress',
            message='John Miller has started work on your 30,000km Maintenance Service.',
            defaults={
                'notification_type': Notification.NotificationType.REPAIR,
                'is_read': True,
                'link_url': f'/services/{job1.id}',
            }
        )
        Notification.objects.get_or_create(
            recipient=mech1,
            title='Job Assigned',
            message='You have been assigned to repair job #1 for Toyota RAV4 (KAB-1024).',
            defaults={
                'notification_type': Notification.NotificationType.MECHANIC_ASSIGNMENT,
                'is_read': False,
                'link_url': f'/services/{job1.id}',
            }
        )
        self.stdout.write(self.style.SUCCESS(f"Created Notifications."))

        self.stdout.write(self.style.SUCCESS("=== Development Data Seeding Completed Successfully! ==="))
        self.stdout.write(self.style.SUCCESS("Credentials for testing:"))
        self.stdout.write("  Admin:    admin@trackautomotive.com / AdminPass123!")
        self.stdout.write("  Mechanic: john.mechanic@trackautomotive.com / MechPass123!")
        self.stdout.write("  Customer: sarah.customer@example.com / CustomerPass123!")
