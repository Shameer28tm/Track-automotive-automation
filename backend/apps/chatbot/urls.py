from django.urls import path
from .views import ChatbotView

app_name = 'chatbot'

urlpatterns = [
    path('chat/', ChatbotView.as_view(), name='chat'),
]
