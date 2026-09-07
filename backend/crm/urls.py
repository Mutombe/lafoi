from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    CatalogItemViewSet,
    CustomerFileViewSet,
    CustomerViewSet,
    DesignShareViewSet,
    ExpensePaymentViewSet,
    IncomeViewSet,
    ProjectCostViewSet,
    ProjectFileViewSet,
    ProjectUpdateViewSet,
    ProjectViewSet,
    share_asset,
    share_meta,
    share_verify,
)

router = DefaultRouter()
router.register("customers", CustomerViewSet, basename="customer")
router.register("customer-files", CustomerFileViewSet, basename="customer-file")
router.register("projects", ProjectViewSet, basename="project")
router.register("project-updates", ProjectUpdateViewSet, basename="project-update")
router.register("project-files", ProjectFileViewSet, basename="project-file")
router.register("expenses", ProjectCostViewSet, basename="expense")
router.register("expense-payments", ExpensePaymentViewSet, basename="expense-payment")
# Legacy alias so existing dashboard builds don't 404 mid-deploy.
router.register("project-costs", ProjectCostViewSet, basename="project-cost")
router.register("income", IncomeViewSet, basename="income")
router.register("catalog", CatalogItemViewSet, basename="catalog")
router.register("design-shares", DesignShareViewSet, basename="design-share")

urlpatterns = router.urls + [
    # Public, unauthenticated viewer endpoints (token-gated).
    path("share/<str:token>/meta/", share_meta, name="share-meta"),
    path("share/<str:token>/verify/", share_verify, name="share-verify"),
    path("share/<str:token>/asset/<int:file_id>/", share_asset, name="share-asset"),
]
