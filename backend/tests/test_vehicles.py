import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.vehicles.models import Vehicle

@pytest.mark.django_db
class TestVehicles:
    def setup_method(self):
        self.client = APIClient()
        self.cust1 = User.objects.create_user(email='cust1@example.com', password='Pass123!', full_name='Customer One')
        self.cust2 = User.objects.create_user(email='cust2@example.com', password='Pass123!', full_name='Customer Two')
        self.admin = User.objects.create_superuser(email='admin@example.com', password='Pass123!', full_name='Admin User')

        self.v1 = Vehicle.objects.create(
            owner=self.cust1,
            license_plate='ABC-1234',
            make='Toyota',
            model='Corolla',
            year=2021
        )

        self.v2 = Vehicle.objects.create(
            owner=self.cust2,
            license_plate='XYZ-9876',
            make='Honda',
            model='Accord',
            year=2022
        )

    def test_customer_only_sees_their_vehicles(self):
        self.client.force_authenticate(user=self.cust1)
        url = reverse('vehicles:vehicle-list')
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        plates = [v['license_plate'] for v in results]
        assert 'ABC-1234' in plates
        assert 'XYZ-9876' not in plates

    def test_admin_sees_all_vehicles(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('vehicles:vehicle-list')
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        plates = [v['license_plate'] for v in results]
        assert 'ABC-1234' in plates
        assert 'XYZ-9876' in plates

    def test_customer_cannot_view_another_customer_vehicle_detail(self):
        self.client.force_authenticate(user=self.cust1)
        url = reverse('vehicles:vehicle-detail', kwargs={'pk': self.v2.pk})
        response = self.client.get(url)
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]

    def test_duplicate_license_plate_rejected(self):
        self.client.force_authenticate(user=self.cust1)
        url = reverse('vehicles:vehicle-list')
        data = {
            'license_plate': 'abc-1234',  # Case insensitive duplicate
            'make': 'Mazda',
            'model': '3',
            'year': 2020
        }
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'license_plate' in response.data

    def test_customer_creates_vehicle_assigns_owner(self):
        self.client.force_authenticate(user=self.cust1)
        url = reverse('vehicles:vehicle-list')
        data = {
            'license_plate': 'NEW-7788',
            'make': 'Subaru',
            'model': 'Outback',
            'year': 2023,
            'owner': self.cust2.id  # Customer attempts to assign to cust2
        }
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        vehicle = Vehicle.objects.get(license_plate='NEW-7788')
        # Backend forces owner to cust1 (request.user)
        assert vehicle.owner == self.cust1
