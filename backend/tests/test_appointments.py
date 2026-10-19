import pytest
from datetime import date, time, timedelta
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.vehicles.models import Vehicle
from apps.appointments.models import Appointment
from apps.notifications.models import Notification

@pytest.mark.django_db
class TestAppointments:
    def setup_method(self):
        self.client = APIClient()
        self.cust1 = User.objects.create_user(email='cust1@example.com', password='Pass123!', full_name='Customer One')
        self.cust2 = User.objects.create_user(email='cust2@example.com', password='Pass123!', full_name='Customer Two')
        self.mech = User.objects.create_user(email='mech@example.com', password='Pass123!', full_name='Mechanic Bob', role=User.Role.MECHANIC)
        self.admin = User.objects.create_superuser(email='admin@example.com', password='Pass123!', full_name='Admin User')

        self.v1 = Vehicle.objects.create(owner=self.cust1, license_plate='TEST-111', make='Toyota', model='Yaris', year=2021)
        self.v2 = Vehicle.objects.create(owner=self.cust2, license_plate='TEST-222', make='BMW', model='320i', year=2020)

    def test_customer_can_book_appointment(self):
        self.client.force_authenticate(user=self.cust1)
        url = reverse('appointments:appointment-list')
        target_date = date.today() + timedelta(days=3)
        data = {
            'vehicle': self.v1.id,
            'service_type': Appointment.ServiceType.OIL_CHANGE,
            'appointment_date': str(target_date),
            'appointment_time': '10:00:00',
            'notes': 'Please check oil level and filters.'
        }
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['status'] == Appointment.Status.PENDING
        assert response.data['customer'] == self.cust1.id

        # Verify notification created
        notif = Notification.objects.filter(recipient=self.cust1).first()
        assert notif is not None
        assert "Appointment Request Submitted" in notif.title

    def test_customer_cannot_book_for_another_customers_vehicle(self):
        self.client.force_authenticate(user=self.cust1)
        url = reverse('appointments:appointment-list')
        target_date = date.today() + timedelta(days=3)
        data = {
            'vehicle': self.v2.id,  # Owned by cust2
            'service_type': Appointment.ServiceType.OIL_CHANGE,
            'appointment_date': str(target_date),
            'appointment_time': '10:00:00',
        }
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'vehicle' in response.data

    def test_conflicting_appointment_slot_rejected(self):
        target_date = date.today() + timedelta(days=5)
        # Create existing appointment
        Appointment.objects.create(
            customer=self.cust1,
            vehicle=self.v1,
            service_type=Appointment.ServiceType.GENERAL_SERVICE,
            appointment_date=target_date,
            appointment_time=time(14, 0),
            status=Appointment.Status.CONFIRMED
        )

        # Try booking same vehicle at same date/time
        self.client.force_authenticate(user=self.cust1)
        url = reverse('appointments:appointment-list')
        data = {
            'vehicle': self.v1.id,
            'service_type': Appointment.ServiceType.BRAKE_INSPECTION,
            'appointment_date': str(target_date),
            'appointment_time': '14:00:00',
        }
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'appointment_time' in response.data

    def test_admin_confirms_and_assigns_mechanic(self):
        target_date = date.today() + timedelta(days=2)
        app = Appointment.objects.create(
            customer=self.cust1,
            vehicle=self.v1,
            service_type=Appointment.ServiceType.GENERAL_SERVICE,
            appointment_date=target_date,
            appointment_time=time(11, 0),
            status=Appointment.Status.PENDING
        )

        self.client.force_authenticate(user=self.admin)
        url = reverse('appointments:appointment-detail', kwargs={'pk': app.pk})
        response = self.client.patch(url, {
            'status': Appointment.Status.CONFIRMED,
            'mechanic': self.mech.id
        })
        assert response.status_code == status.HTTP_200_OK
        app.refresh_from_db()
        assert app.status == Appointment.Status.CONFIRMED
        assert app.mechanic == self.mech

        # Check notification sent to mechanic
        mech_notif = Notification.objects.filter(recipient=self.mech).first()
        assert mech_notif is not None
        assert "Service Appointment" in mech_notif.title or "Assigned" in mech_notif.title

    def test_customer_can_cancel_their_appointment(self):
        target_date = date.today() + timedelta(days=2)
        app = Appointment.objects.create(
            customer=self.cust1,
            vehicle=self.v1,
            service_type=Appointment.ServiceType.GENERAL_SERVICE,
            appointment_date=target_date,
            appointment_time=time(15, 0),
            status=Appointment.Status.PENDING
        )

        self.client.force_authenticate(user=self.cust1)
        url = reverse('appointments:appointment-cancel', kwargs={'pk': app.pk})
        response = self.client.post(url)
        assert response.status_code == status.HTTP_200_OK
        app.refresh_from_db()
        assert app.status == Appointment.Status.CANCELLED
