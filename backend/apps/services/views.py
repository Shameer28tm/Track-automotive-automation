from decimal import Decimal
from django.db.models import Q, Sum, Count
from django.utils import timezone
from rest_framework import viewsets, permissions, status, generics
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import RepairJob, RepairPart, InspectionItem, VehicleFault
from .serializers import (
    RepairJobSerializer,
    RepairJobCreateUpdateSerializer,
    RepairPartSerializer,
    InspectionItemSerializer,
    VehicleFaultSerializer
)
from apps.accounts.permissions import IsOwnerOrStaff, IsMechanicAssignedOrAdmin, IsAdminUser
from apps.accounts.models import User
from apps.vehicles.models import Vehicle
from apps.appointments.models import Appointment
from apps.notifications.services import send_notification
from apps.notifications.models import Notification


class RepairJobViewSet(viewsets.ModelViewSet):
    """
    Repair Jobs API.
    - Customers: view jobs for their vehicles.
    - Mechanics: view & update jobs assigned to them.
    - Admins: full access to create, assign, and manage all jobs.
    """
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaff]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return RepairJobCreateUpdateSerializer
        return RepairJobSerializer

    def get_queryset(self):
        user = self.request.user
        status_param = self.request.query_params.get('status')
        vehicle_id = self.request.query_params.get('vehicle')

        if user.is_admin:
            queryset = RepairJob.objects.all().select_related('vehicle', 'vehicle__owner', 'mechanic', 'appointment')
        elif user.is_mechanic:
            queryset = RepairJob.objects.filter(mechanic=user).select_related('vehicle', 'vehicle__owner', 'mechanic', 'appointment')
        else:
            queryset = RepairJob.objects.filter(vehicle__owner=user).select_related('vehicle', 'vehicle__owner', 'mechanic', 'appointment')

        if status_param:
            queryset = queryset.filter(status=status_param)
        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)

        return queryset.prefetch_related('parts', 'inspections').order_by('-created_at')

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        # If writing/updating, enforce mechanic assignment or admin
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            if not request.user.is_admin and obj.mechanic != request.user:
                self.permission_denied(request, message="You can only modify repair jobs assigned to you.")

    def perform_create(self, serializer):
        user = self.request.user
        job = serializer.save()

        # Send notification to vehicle owner
        send_notification(
            recipient=job.vehicle.owner,
            title="Repair Job Opened",
            message=f"A repair job has been opened for your {job.vehicle.make} {job.vehicle.model} ({job.vehicle.license_plate}): {job.title}",
            notification_type=Notification.NotificationType.REPAIR,
            link_url=f"/services/{job.id}"
        )

        # Send notification to mechanic if assigned
        if job.mechanic:
            send_notification(
                recipient=job.mechanic,
                title="Assigned to Repair Job",
                message=f"You have been assigned to repair job #{job.id} for {job.vehicle.license_plate}.",
                notification_type=Notification.NotificationType.MECHANIC_ASSIGNMENT,
                link_url=f"/services/{job.id}"
            )

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_status = old_instance.status
        job = serializer.save()

        if job.status != old_status:
            if job.status == RepairJob.Status.COMPLETED and not job.completed_at:
                job.completed_at = timezone.now()
                job.save(update_fields=['completed_at'])

            send_notification(
                recipient=job.vehicle.owner,
                title="Repair Job Status Update",
                message=f"Your vehicle {job.vehicle.license_plate} service status changed to: {job.get_status_display()}.",
                notification_type=Notification.NotificationType.REPAIR,
                link_url=f"/services/{job.id}"
            )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def add_part(self, request, pk=None):
        """Add a replacement part to this repair job."""
        job = self.get_object()
        if not request.user.is_admin and job.mechanic != request.user:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        serializer = RepairPartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(repair_job=job)
        return Response(RepairJobSerializer(job).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def add_inspection(self, request, pk=None):
        """Add an inspection checklist item to this repair job."""
        job = self.get_object()
        if not request.user.is_admin and job.mechanic != request.user:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        serializer = InspectionItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(repair_job=job)
        return Response(RepairJobSerializer(job).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def receipt(self, request, pk=None):
        """Generate full receipt/invoice breakdown for this job."""
        job = self.get_object()
        data = {
            'job_id': job.id,
            'title': job.title,
            'date': job.created_at.strftime('%Y-%m-%d'),
            'vehicle': {
                'license_plate': job.vehicle.license_plate,
                'make': job.vehicle.make,
                'model': job.vehicle.model,
                'year': job.vehicle.year,
                'current_mileage': job.vehicle.current_mileage,
            },
            'customer': {
                'name': job.vehicle.owner.full_name or job.vehicle.owner.email,
                'email': job.vehicle.owner.email,
                'phone': job.vehicle.owner.phone_number,
            },
            'mechanic': {
                'name': job.mechanic.full_name if job.mechanic else "Unassigned",
            },
            'customer_request': job.customer_request,
            'action_taken': job.action_taken,
            'parts': [
                {
                    'name': p.part_name,
                    'part_number': p.part_number,
                    'quantity': p.quantity,
                    'unit_price': str(p.unit_price),
                    'total': str(p.total_amount)
                } for p in job.parts.all()
            ],
            'inspections': [
                {
                    'item': i.item_name,
                    'result': i.result,
                    'status': i.status,
                    'recommendation': i.recommendation
                } for i in job.inspections.all()
            ],
            'financials': {
                'parts_subtotal': str(job.parts_subtotal),
                'labor_fee': str(job.labor_fee),
                'tax_rate': str(job.tax_rate),
                'tax_amount': str(job.tax_amount),
                'total_amount_payable': str(job.total_amount_payable),
                'payment_mode': job.get_payment_mode_display(),
            },
            'next_service': {
                'next_km': job.next_service_km,
                'next_date': job.next_service_date.strftime('%Y-%m-%d') if job.next_service_date else None,
                'advice': job.next_service_advice,
            }
        }
        return Response(data)


class VehicleFaultViewSet(viewsets.ModelViewSet):
    """
    API for reporting and tracking vehicle faults.
    Customers report faults; Mechanics & Admins update diagnosis and resolution.
    """
    serializer_class = VehicleFaultSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaff]

    def get_queryset(self):
        user = self.request.user
        vehicle_id = self.request.query_params.get('vehicle')
        status_param = self.request.query_params.get('status')

        if user.is_admin:
            queryset = VehicleFault.objects.all().select_related('vehicle', 'reported_by', 'assigned_mechanic')
        elif user.is_mechanic:
            queryset = VehicleFault.objects.filter(
                Q(assigned_mechanic=user) | Q(status=VehicleFault.Status.REPORTED)
            ).select_related('vehicle', 'reported_by', 'assigned_mechanic')
        else:
            queryset = VehicleFault.objects.filter(reported_by=user).select_related('vehicle', 'reported_by', 'assigned_mechanic')

        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)
        if status_param:
            queryset = queryset.filter(status=status_param)

        return queryset.order_by('-date_reported')

    def perform_create(self, serializer):
        user = self.request.user
        vehicle = serializer.validated_data.get('vehicle')

        # Check vehicle ownership for regular customers
        if not user.is_admin and vehicle.owner != user:
            raise permissions.exceptions.PermissionDenied("You can only report faults for your own vehicles.")

        fault = serializer.save(reported_by=user)

        # Notify garage admins
        admins = User.objects.filter(role=User.Role.ADMIN)
        for admin_user in admins:
            send_notification(
                recipient=admin_user,
                title="New Fault Reported",
                message=f"Fault reported on {vehicle.license_plate}: {fault.description[:80]}...",
                notification_type=Notification.NotificationType.FAULT,
                link_url=f"/faults/{fault.id}"
            )

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_status = old_instance.status
        fault = serializer.save()

        if fault.status != old_status:
            if fault.status == VehicleFault.Status.RESOLVED and not fault.resolved_at:
                fault.resolved_at = timezone.now()
                fault.save(update_fields=['resolved_at'])

            send_notification(
                recipient=fault.reported_by,
                title="Fault Diagnosis Updated",
                message=f"The reported fault for {fault.vehicle.license_plate} is now marked as {fault.get_status_display()}.",
                notification_type=Notification.NotificationType.FAULT,
                link_url=f"/faults/{fault.id}"
            )


class DashboardSummaryView(APIView):
    """
    Returns live database statistics for the authenticated user based on their role.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.is_admin:
            total_customers = User.objects.filter(role=User.Role.CUSTOMER).count()
            total_mechanics = User.objects.filter(role=User.Role.MECHANIC).count()
            total_vehicles = Vehicle.objects.count()
            total_appointments = Appointment.objects.count()
            pending_appointments = Appointment.objects.filter(status=Appointment.Status.PENDING).count()
            jobs_in_progress = RepairJob.objects.filter(status=RepairJob.Status.IN_PROGRESS).count()
            completed_jobs = RepairJob.objects.filter(status=RepairJob.Status.COMPLETED).count()
            unresolved_faults = VehicleFault.objects.exclude(status=VehicleFault.Status.RESOLVED).count()

            recent_appointments = Appointment.objects.select_related('customer', 'vehicle').order_by('-created_at')[:5]
            recent_jobs = RepairJob.objects.select_related('vehicle', 'mechanic').order_by('-created_at')[:5]

            return Response({
                'role': 'ADMIN',
                'stats': {
                    'total_customers': total_customers,
                    'total_mechanics': total_mechanics,
                    'total_vehicles': total_vehicles,
                    'total_appointments': total_appointments,
                    'pending_appointments': pending_appointments,
                    'jobs_in_progress': jobs_in_progress,
                    'completed_jobs': completed_jobs,
                    'unresolved_faults': unresolved_faults,
                },
                'recent_appointments': [
                    {
                        'id': a.id,
                        'customer': a.customer.full_name or a.customer.email,
                        'vehicle': a.vehicle.license_plate,
                        'service_type': a.get_service_type_display(),
                        'date': str(a.appointment_date),
                        'status': a.status
                    } for a in recent_appointments
                ],
                'recent_jobs': [
                    {
                        'id': j.id,
                        'title': j.title,
                        'vehicle': j.vehicle.license_plate,
                        'mechanic': j.mechanic.full_name if j.mechanic else "Unassigned",
                        'status': j.status,
                        'total': str(j.total_amount_payable)
                    } for j in recent_jobs
                ]
            })

        elif user.is_mechanic:
            assigned_jobs = RepairJob.objects.filter(mechanic=user)
            total_jobs = assigned_jobs.count()
            in_progress = assigned_jobs.filter(status=RepairJob.Status.IN_PROGRESS).count()
            queued = assigned_jobs.filter(status=RepairJob.Status.QUEUED).count()
            completed = assigned_jobs.filter(status=RepairJob.Status.COMPLETED).count()

            upcoming_appointments = Appointment.objects.filter(
                mechanic=user,
                appointment_date__gte=timezone.now().date()
            ).exclude(status__in=[Appointment.Status.CANCELLED, Appointment.Status.COMPLETED]).count()

            assigned_faults = VehicleFault.objects.filter(assigned_mechanic=user).exclude(status=VehicleFault.Status.RESOLVED).count()

            recent_jobs = assigned_jobs.select_related('vehicle').order_by('-created_at')[:5]

            return Response({
                'role': 'MECHANIC',
                'stats': {
                    'total_assigned_jobs': total_jobs,
                    'jobs_in_progress': in_progress,
                    'jobs_queued': queued,
                    'completed_jobs': completed,
                    'upcoming_appointments': upcoming_appointments,
                    'assigned_faults': assigned_faults,
                },
                'recent_jobs': [
                    {
                        'id': j.id,
                        'title': j.title,
                        'vehicle': j.vehicle.license_plate,
                        'status': j.status,
                        'total': str(j.total_amount_payable)
                    } for j in recent_jobs
                ]
            })

        else:
            # Customer dashboard
            my_vehicles = Vehicle.objects.filter(owner=user)
            vehicles_count = my_vehicles.count()
            upcoming_appointments = Appointment.objects.filter(
                customer=user,
                appointment_date__gte=timezone.now().date()
            ).exclude(status__in=[Appointment.Status.CANCELLED, Appointment.Status.COMPLETED]).count()

            active_repairs = RepairJob.objects.filter(
                vehicle__owner=user
            ).exclude(status__in=[RepairJob.Status.COMPLETED, RepairJob.Status.CANCELLED]).count()

            completed_services = RepairJob.objects.filter(
                vehicle__owner=user,
                status=RepairJob.Status.COMPLETED
            ).count()

            reported_faults = VehicleFault.objects.filter(reported_by=user).count()

            recent_vehicles = my_vehicles[:4]
            recent_appointments = Appointment.objects.filter(customer=user).select_related('vehicle').order_by('-created_at')[:4]

            return Response({
                'role': 'CUSTOMER',
                'stats': {
                    'vehicles_count': vehicles_count,
                    'upcoming_appointments': upcoming_appointments,
                    'active_repairs': active_repairs,
                    'completed_services': completed_services,
                    'reported_faults': reported_faults,
                },
                'vehicles': [
                    {
                        'id': v.id,
                        'plate': v.license_plate,
                        'name': f"{v.year} {v.make} {v.model}",
                        'mileage': v.current_mileage
                    } for v in recent_vehicles
                ],
                'recent_appointments': [
                    {
                        'id': a.id,
                        'vehicle': a.vehicle.license_plate,
                        'service_type': a.get_service_type_display(),
                        'date': str(a.appointment_date),
                        'status': a.status
                    } for a in recent_appointments
                ]
            })
