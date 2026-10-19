from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from apps.accounts.models import User
from apps.accounts.permissions import IsAdminUser
from .serializers import CustomerDetailSerializer, CustomerCreateUpdateSerializer

class CustomerListView(generics.ListCreateAPIView):
    """
    List all customers (with search) or create a customer.
    Admin only.
    """
    permission_classes = [IsAdminUser]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CustomerCreateUpdateSerializer
        return CustomerDetailSerializer

    def get_queryset(self):
        search = self.request.query_params.get('search')
        queryset = User.objects.filter(role=User.Role.CUSTOMER).order_by('-date_joined')
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone_number__icontains=search)
            )
        return queryset


class CustomerDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a customer profile.
    Admin can access any; customers can only access their own.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return CustomerCreateUpdateSerializer
        return CustomerDetailSerializer

    def get_queryset(self):
        if self.request.user.is_admin:
            return User.objects.filter(role=User.Role.CUSTOMER)
        return User.objects.filter(id=self.request.user.id)
