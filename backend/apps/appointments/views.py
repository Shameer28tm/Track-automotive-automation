from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Appointment
from .serializers import AppointmentSerializer
from apps.accounts.permissions import IsOwnerOrStaff
from apps.accounts.models import User
from apps.notifications.services import send_notification
from apps.notifications.models import Notification

class AppointmentViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Service Appointments with role enforcement and in-app notifications.
    """
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaff]

    def get_queryset(self):
        user = self.request.user
        status_param = self.request.query_params.get('status')
        date_param = self.request.query_params.get('date')
        mechanic_param = self.request.query_params.get('mechanic')

        if user.is_admin:
            queryset = Appointment.objects.all().select_related('customer', 'vehicle', 'mechanic')
            if mechanic_param:
                queryset = queryset.filter(mechanic_id=mechanic_param)
        elif user.is_mechanic:
            queryset = Appointment.objects.filter(mechanic=user).select_related('customer', 'vehicle', 'mechanic')
        else:
            queryset = Appointment.objects.filter(customer=user).select_related('customer', 'vehicle', 'mechanic')

        if status_param:
            queryset = queryset.filter(status=status_param)
        if date_param:
            queryset = queryset.filter(appointment_date=date_param)

        return queryset.order_by('appointment_date', 'appointment_time')

    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_admin:
            # Customers are forced as customer of the appointment
            appointment = serializer.save(customer=user, status=Appointment.Status.PENDING)
        else:
            customer = serializer.validated_data.get('customer', user)
            appointment = serializer.save(customer=customer)

        # Send in-app notification to customer
        send_notification(
            recipient=appointment.customer,
            title="Appointment Request Submitted",
            message=f"Your appointment request for {appointment.vehicle.make} {appointment.vehicle.model} ({appointment.vehicle.license_plate}) on {appointment.appointment_date} at {appointment.appointment_time} is pending confirmation.",
            notification_type=Notification.NotificationType.APPOINTMENT,
            link_url=f"/appointments/{appointment.id}"
        )

        # Notify assigned mechanic if assigned immediately
        if appointment.mechanic:
            send_notification(
                recipient=appointment.mechanic,
                title="New Service Assignment",
                message=f"You have been assigned an appointment for {appointment.vehicle.license_plate} on {appointment.appointment_date} at {appointment.appointment_time}.",
                notification_type=Notification.NotificationType.MECHANIC_ASSIGNMENT,
                link_url=f"/appointments/{appointment.id}"
            )

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_status = old_instance.status
        old_mechanic = old_instance.mechanic

        appointment = serializer.save()

        # Check if status changed
        if appointment.status != old_status:
            send_notification(
                recipient=appointment.customer,
                title="Appointment Status Updated",
                message=f"Your appointment for {appointment.vehicle.license_plate} has been updated to: {appointment.get_status_display()}.",
                notification_type=Notification.NotificationType.APPOINTMENT,
                link_url=f"/appointments/{appointment.id}"
            )

        # Check if mechanic newly assigned
        if appointment.mechanic and appointment.mechanic != old_mechanic:
            send_notification(
                recipient=appointment.mechanic,
                title="Assigned to Service Appointment",
                message=f"You have been assigned to service {appointment.vehicle.license_plate} on {appointment.appointment_date} at {appointment.appointment_time}.",
                notification_type=Notification.NotificationType.MECHANIC_ASSIGNMENT,
                link_url=f"/appointments/{appointment.id}"
            )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def cancel(self, request, pk=None):
        """Cancel an appointment."""
        appointment = self.get_object()
        user = request.user
        if not user.is_admin and appointment.customer != user:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        appointment.status = Appointment.Status.CANCELLED
        appointment.save(update_fields=['status', 'updated_at'])

        send_notification(
            recipient=appointment.customer,
            title="Appointment Cancelled",
            message=f"Your appointment for {appointment.vehicle.license_plate} on {appointment.appointment_date} has been cancelled.",
            notification_type=Notification.NotificationType.APPOINTMENT,
            link_url=f"/appointments/{appointment.id}"
        )

        return Response(AppointmentSerializer(appointment, context={'request': request}).data)
