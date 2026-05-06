from django.contrib.auth import get_user_model
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import MODULES
from .serializers import (
    LafoiTokenObtainPairSerializer,
    UserCreateSerializer,
    UserPasswordResetSerializer,
    UserSerializer,
)

User = get_user_model()


class LafoiTokenObtainPairView(TokenObtainPairView):
    serializer_class = LafoiTokenObtainPairSerializer


def _is_admin(user):
    return bool(getattr(user, "is_superuser", False) or getattr(user, "role", "") == "admin")


class IsAdminUserOnly(permissions.BasePermission):
    """Mutations require admin role; reads any authenticated."""

    def has_permission(self, request, view):
        u = request.user
        if not u or not u.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return _is_admin(u)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("first_name", "last_name", "username")
    permission_classes = [IsAdminUserOnly]
    filterset_fields = ("role", "is_active")
    search_fields = ("username", "email", "first_name", "last_name", "phone")
    ordering_fields = ("date_joined", "last_login", "username")

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        return UserSerializer

    def perform_destroy(self, instance):
        # Don't allow deleting yourself or the last admin.
        if instance.pk == self.request.user.pk:
            raise ValidationError("You cannot delete your own account.")
        if instance.role == User.Role.ADMIN:
            others = User.objects.filter(role=User.Role.ADMIN, is_active=True).exclude(pk=instance.pk).count()
            if others == 0:
                raise ValidationError("Cannot delete the last administrator.")
        instance.delete()

    @action(detail=False, methods=["get"], url_path="me", permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        return Response(UserSerializer(request.user).data)

    @action(detail=False, methods=["get"], url_path="modules", permission_classes=[permissions.IsAuthenticated])
    def modules(self, request):
        """Registry of all module keys + display labels — used by the dashboard
        users page to render the access toggles."""
        return Response([{"key": k, "label": v} for k, v in MODULES])

    @action(detail=True, methods=["post"], url_path="set-modules")
    def set_modules(self, request, pk=None):
        """Replace the module_access map for a user. Body: { module_access: {...} }."""
        user = self.get_object()
        access = request.data.get("module_access", None)
        if not isinstance(access, dict):
            raise ValidationError({"module_access": "must be an object of module_key → bool"})
        # Validate keys against the known registry
        valid_keys = {k for k, _ in MODULES}
        cleaned = {k: bool(v) for k, v in access.items() if k in valid_keys}
        user.module_access = cleaned
        user.save(update_fields=["module_access"])
        return Response(UserSerializer(user).data)

    @action(detail=True, methods=["post"], url_path="reset-password")
    def reset_password(self, request, pk=None):
        """Admin-set new password for the user. Body: { password }."""
        user = self.get_object()
        ser = UserPasswordResetSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user.set_password(ser.validated_data["password"])
        user.save(update_fields=["password"])
        return Response({"detail": "Password updated."})

    @action(detail=True, methods=["post"], url_path="toggle-active")
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        if user.pk == request.user.pk:
            raise ValidationError("You cannot deactivate your own account.")
        user.is_active = not user.is_active
        user.save(update_fields=["is_active"])
        return Response(UserSerializer(user).data)
