import pytest
from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.vehicles.models import Vehicle
from apps.services.models import RepairJob, RepairPart, InspectionItem, VehicleFault

@pytest.mark.django_db
class TestServicesAndRepairJobs:
    def setup_method(self):
        self.client = APIClient()
        self.cust = User.objects.create_user(email='customer@example.com', password='Pass123!', full_name='Customer Joe')
        self.mech1 = User.objects.create_user(email='mech1@example.com', password='Pass123!', full_name='Mechanic One', role=User.Role.MECHANIC)
        self.mech2 = User.objects.create_user(email='mech2@example.com', password='Pass123!', full_name='Mechanic Two', role=User.Role.MECHANIC)
        self.admin = User.objects.create_superuser(email='admin@example.com', password='Pass123!', full_name='Admin Boss')

        self.vehicle = Vehicle.objects.create(owner=self.cust, license_plate='REP-999', make='Honda', model='CR-V', year=2020)

        self.job = RepairJob.objects.create(
            vehicle=self.vehicle,
            mechanic=self.mech1,
            title='Front Brake Replacement',
            description='Replace front pads and rotors',
            labor_fee=Decimal('100.00'),
            tax_rate=Decimal('6.00')
        )

    def test_mechanic_can_update_own_job(self):
        self.client.force_authenticate(user=self.mech1)
        url = reverse('services:repair-job-detail', kwargs={'pk': self.job.pk})
        response = self.client.patch(url, {'status': RepairJob.Status.IN_PROGRESS})
        assert response.status_code == status.HTTP_200_OK
        self.job.refresh_from_db()
        assert self.job.status == RepairJob.Status.IN_PROGRESS

    def test_mechanic_cannot_modify_another_mechanics_job(self):
        self.client.force_authenticate(user=self.mech2)
        url = reverse('services:repair-job-detail', kwargs={'pk': self.job.pk})
        response = self.client.patch(url, {'status': RepairJob.Status.COMPLETED})
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]

    def test_receipt_calculation_and_parts_addition(self):
        self.client.force_authenticate(user=self.mech1)
        add_part_url = reverse('services:repair-job-add-part', kwargs={'pk': self.job.pk})
        response = self.client.post(add_part_url, {
            'part_name': 'Ceramic Brake Pads',
            'part_number': 'BP-101',
            'unit_price': '45.00',
            'quantity': 2
        })
        assert response.status_code == status.HTTP_201_CREATED

        # Fetch receipt
        receipt_url = reverse('services:repair-job-receipt', kwargs={'pk': self.job.pk})
        receipt_res = self.client.get(receipt_url)
        assert receipt_res.status_code == status.HTTP_200_OK

        financials = receipt_res.data['financials']
        # Parts = 45 * 2 = 90.00
        assert financials['parts_subtotal'] == '90.00'
        # Labor = 100.00
        # Tax = (90 + 100) * 0.06 = 11.40
        assert financials['tax_amount'] == '11.40'
        # Total = 90 + 100 + 11.40 = 201.40
        assert financials['total_amount_payable'] == '201.40'

    def test_vehicle_fault_reporting_and_status(self):
        self.client.force_authenticate(user=self.cust)
        url = reverse('services:fault-list')
        data = {
            'vehicle': self.vehicle.id,
            'description': 'Strange knocking sound from front suspension on bumps',
            'severity': VehicleFault.Severity.HIGH
        }
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['status'] == VehicleFault.Status.REPORTED

        fault_id = response.data['id']

        # Mechanic resolves the fault
        self.client.force_authenticate(user=self.mech1)
        fault_detail_url = reverse('services:fault-detail', kwargs={'pk': fault_id})
        update_res = self.client.patch(fault_detail_url, {
            'status': VehicleFault.Status.RESOLVED,
            'diagnosis': 'Worn sway bar end link',
            'resolution_notes': 'Replaced link and torqued to factory spec.'
        })
        assert update_res.status_code == status.HTTP_200_OK
        assert update_res.data['status'] == VehicleFault.Status.RESOLVED

    def test_dashboard_summary_returns_real_metrics_for_admin(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('services:dashboard-summary')
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['role'] == 'ADMIN'
        stats = response.data['stats']
        assert stats['total_customers'] >= 1
        assert stats['total_vehicles'] >= 1
