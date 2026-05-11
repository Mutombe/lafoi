from rest_framework.routers import DefaultRouter

from .views import (
    CustomerViewSet,
    ProjectCostViewSet,
    ProjectFileViewSet,
    ProjectUpdateViewSet,
    ProjectViewSet,
)

router = DefaultRouter()
router.register("customers", CustomerViewSet, basename="customer")
router.register("projects", ProjectViewSet, basename="project")
router.register("project-updates", ProjectUpdateViewSet, basename="project-update")
router.register("project-files", ProjectFileViewSet, basename="project-file")
router.register("expenses", ProjectCostViewSet, basename="expense")
# Legacy alias so existing dashboard builds don't 404 mid-deploy.
router.register("project-costs", ProjectCostViewSet, basename="project-cost")

urlpatterns = router.urls
