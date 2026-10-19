from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({
        'status': 'healthy',
        'service': 'Track Automotive Automation API',
        'version': '1.0.0'
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health-check'),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/customers/', include('apps.customers.urls')),
    path('api/vehicles/', include('apps.vehicles.urls')),
    path('api/appointments/', include('apps.appointments.urls')),
    path('api/services/', include('apps.services.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/chatbot/', include('apps.chatbot.urls')),
]
