from django.urls import path
from .views import CustomerListView, CustomerDetailView

app_name = 'customers'

urlpatterns = [
    path('', CustomerListView.as_view(), name='customer-list'),
    path('<int:pk>/', CustomerDetailView.as_view(), name='customer-detail'),
]
