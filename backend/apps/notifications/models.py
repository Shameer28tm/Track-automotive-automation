from django.db import models
from django.conf import settings

class Notification(models.Model):
    class NotificationType(models.TextChoices):
        APPOINTMENT = 'APPOINTMENT', 'Appointment'
        REPAIR = 'REPAIR', 'Repair & Service'
        FAULT = 'FAULT', 'Fault Report'
        MECHANIC_ASSIGNMENT = 'MECHANIC_ASSIGNMENT', 'Mechanic Assignment'
        SYSTEM = 'SYSTEM', 'System'

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    title = models.CharField(max_length=150)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=50,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM
    )
    is_read = models.BooleanField(default=False, db_index=True)
    link_url = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'

    def __str__(self):
        return f"Notification to {self.recipient.email}: {self.title}"
