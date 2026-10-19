from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Vehicle
from .serializers import VehicleSerializer
from apps.accounts.permissions import IsOwnerOrStaff

class VehicleViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Vehicles with strict customer isolation.
    Customers see only their own vehicles.
    Admins and mechanics can view all garage vehicles.
    """
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaff]

    def get_queryset(self):
        user = self.request.user
        search = self.request.query_params.get('search')
        customer_id = self.request.query_params.get('customer')

        if user.is_admin or user.is_mechanic:
            queryset = Vehicle.objects.all().select_related('owner')
            if customer_id:
                queryset = queryset.filter(owner_id=customer_id)
        else:
            queryset = Vehicle.objects.filter(owner=user).select_related('owner')

        if search:
            queryset = queryset.filter(
                Q(license_plate__icontains=search) |
                Q(make__icontains=search) |
                Q(model__icontains=search) |
                Q(chassis_number__icontains=search) |
                Q(owner__full_name__icontains=search) |
                Q(owner__email__icontains=search)
            )

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_admin:
            # Customers are always assigned as the owner of their created vehicle
            serializer.save(owner=user)
        else:
            # Admins can specify owner, fallback to admin if not provided
            owner = serializer.validated_data.get('owner', user)
            serializer.save(owner=owner)
