from rest_framework.routers import DefaultRouter

from .views import (
    AuditLogViewSet,
    ExchangeRateViewSet,
    StatutoryRateViewSet,
    TaxBracketSetViewSet,
)

router = DefaultRouter()
router.register("tax-bracket-sets", TaxBracketSetViewSet, basename="tax-bracket-set")
router.register("statutory-rates", StatutoryRateViewSet, basename="statutory-rate")
router.register("exchange-rates", ExchangeRateViewSet, basename="exchange-rate")
router.register("audit-logs", AuditLogViewSet, basename="audit-log")

urlpatterns = router.urls
