from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .engine import compute_statutory
from .models import AuditLog, ExchangeRate, StatutoryRate, TaxBracketSet
from .permissions import HasModuleAccess, IsAuthenticatedReadOrAdminWrite
from .serializers import (
    AuditLogSerializer,
    ExchangeRateSerializer,
    PayeCalculatorSerializer,
    StatutoryRateSerializer,
    TaxBracketSetSerializer,
)


class TaxBracketSetViewSet(viewsets.ModelViewSet):
    queryset = TaxBracketSet.objects.prefetch_related("brackets").all()
    serializer_class = TaxBracketSetSerializer
    permission_classes = [IsAuthenticatedReadOrAdminWrite]
    filterset_fields = ("currency", "is_active")
    search_fields = ("name", "notes")
    ordering_fields = ("effective_from", "currency", "name", "created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)

    @action(detail=False, methods=["post"], url_path="preview")
    def preview(self, request):
        """Live PAYE / AIDS / NSSA preview for a given gross + currency + date."""
        serializer = PayeCalculatorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        on_date = data.get("on_date") or timezone.now().date()
        result = compute_statutory(
            gross=data["gross"],
            currency=data.get("currency") or "USD",
            on_date=on_date,
        )
        return Response(result.to_dict())


class StatutoryRateViewSet(viewsets.ModelViewSet):
    queryset = StatutoryRate.objects.all()
    serializer_class = StatutoryRateSerializer
    permission_classes = [IsAuthenticatedReadOrAdminWrite]
    filterset_fields = ("code", "currency", "is_active")
    ordering_fields = ("effective_from", "code", "currency")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)


class ExchangeRateViewSet(viewsets.ModelViewSet):
    queryset = ExchangeRate.objects.all()
    serializer_class = ExchangeRateSerializer
    permission_classes = [IsAuthenticatedReadOrAdminWrite]
    filterset_fields = ("base", "quote")
    ordering_fields = ("as_of", "base", "quote")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related("actor").all()
    serializer_class = AuditLogSerializer
    permission_classes = [HasModuleAccess.for_module("audit")]
    filterset_fields = ("action", "model_label", "actor")
    search_fields = ("model_label", "object_id", "actor_username", "object_repr", "summary")
    ordering_fields = ("created_at",)
