from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """Allows access only to admin users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)


class IsMechanicUser(permissions.BasePermission):
    """Allows access to mechanics and admins."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.is_mechanic or request.user.is_admin))


class IsCustomerUser(permissions.BasePermission):
    """Allows access to customer users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_customer)


class IsOwnerOrStaff(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object, assigned mechanic, or admins to view/edit it.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_admin:
            return True
        # Check owner attribute
        owner = getattr(obj, 'owner', None) or getattr(obj, 'customer', None) or getattr(obj, 'reported_by', None) or getattr(obj, 'user', None)
        if owner and owner == request.user:
            return True
        # Check mechanic assignment or staff permissions for faults/inspections
        mechanic = getattr(obj, 'mechanic', None) or getattr(obj, 'assigned_mechanic', None)
        if mechanic and mechanic == request.user:
            return True
        # Mechanics can view and diagnose reported vehicle faults
        if request.user.is_mechanic and hasattr(obj, 'severity'):
            return True
        return False


class IsMechanicAssignedOrAdmin(permissions.BasePermission):
    """
    Object-level permission: mechanics can only modify jobs assigned to them; admins can modify any.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_admin:
            return True
        mechanic = getattr(obj, 'mechanic', None) or getattr(obj, 'assigned_mechanic', None)
        return mechanic == request.user
