from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RepairJobViewSet, VehicleFaultViewSet, DashboardSummaryView

app_name = 'services'

router = DefaultRouter()
router.register(r'jobs', RepairJobViewSet, basename='repair-job')
router.register(r'faults', VehicleFaultViewSet, basename='fault')

urlpatterns = [
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('', include(router.urls)),
]
