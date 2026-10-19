import logging
from .models import Notification

logger = logging.getLogger(__name__)

def send_notification(recipient, title, message, notification_type=Notification.NotificationType.SYSTEM, link_url=''):
    """
    Creates an in-app notification for the recipient.
    Designed for seamless Phase 2 extension with asynchronous Celery tasks.
    """
    if not recipient:
        logger.warning("Attempted to send notification without a valid recipient.")
        return None
    try:
        notification = Notification.objects.create(
            recipient=recipient,
            title=title,
            message=message,
            notification_type=notification_type,
            link_url=link_url
        )
        return notification
    except Exception as e:
        logger.error(f"Error creating in-app notification: {e}")
        return None
