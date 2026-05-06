"""Role-based DRF permissions for the dashboard.

User.role is one of: admin, manager, staff (see accounts.User).

  IsHRAdmin            — admin role only (full edit on payroll, tax tables, etc.)
  IsManagerOrAbove     — manager or admin (read all, approve workflows)
  IsAuthenticatedReadOnly — anyone signed in can GET; mutations require manager+
  IsOwnEmployeeOnly    — staff can only access their own Employee record
  HasModuleAccess(module) — module-keyed gate; admin bypasses.
"""
from rest_framework import permissions


def _role(user):
    return getattr(user, "role", None) or "staff"


class IsHRAdmin(permissions.BasePermission):
    """Full edit on payroll, tax, statutory, employee data."""

    message = "Only administrators can perform this action."

    def has_permission(self, request, view):
        u = request.user
        if not u or not u.is_authenticated:
            return False
        if u.is_superuser:
            return True
        return _role(u) == "admin"


class IsManagerOrAbove(permissions.BasePermission):
    """Manager + Admin can mutate; everyone authenticated can read."""

    message = "Only managers and administrators can perform this action."

    def has_permission(self, request, view):
        u = request.user
        if not u or not u.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        if u.is_superuser:
            return True
        return _role(u) in ("admin", "manager")


class IsAuthenticatedReadOrAdminWrite(permissions.BasePermission):
    """Read = any authenticated. Write = admin only.

    The right default for tax tables, statutory rates, exchange rates."""

    def has_permission(self, request, view):
        u = request.user
        if not u or not u.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        if u.is_superuser:
            return True
        return _role(u) == "admin"


class HasModuleAccess(permissions.BasePermission):
    """Factory-style permission. Use as a class attribute:

        permission_classes = [HasModuleAccess.for_module('payroll')]

    Admin role / superuser always pass. Otherwise we check the user's
    `module_access` JSON map for the named key.
    """

    module = None

    @classmethod
    def for_module(cls, module: str):
        return type(f"HasModuleAccess_{module}", (cls,), {"module": module})

    def has_permission(self, request, view):
        u = request.user
        if not u or not u.is_authenticated:
            return False
        if not getattr(u, "is_active", False):
            return False
        # Admin / superuser see everything
        if u.is_superuser or _role(u) == "admin":
            return True
        if not self.module:
            return True
        return bool(getattr(u, "has_module", lambda m: False)(self.module))


class IsOwnEmployeeOrManager(permissions.BasePermission):
    """Object-level: staff can read their own employee record; manager+ can read all."""

    def has_object_permission(self, request, view, obj):
        u = request.user
        if not u or not u.is_authenticated:
            return False
        if u.is_superuser:
            return True
        if _role(u) in ("admin", "manager"):
            return True
        # Staff: only if email or username matches the employee
        return bool(
            (u.email and getattr(obj, "email", "") and obj.email == u.email)
            or (getattr(obj, "user_id", None) == u.id)
        )
