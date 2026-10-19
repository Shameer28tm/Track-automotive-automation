from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    CurrentUserView,
    GoogleAuthView,
    UserManagementViewSet,
    MechanicsListView,
)

app_name = 'accounts'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('google/', GoogleAuthView.as_view(), name='google-auth'),
    path('users/', UserManagementViewSet.as_view(), name='user-list'),
    path('mechanics/', MechanicsListView.as_view(), name='mechanics-list'),
]
