from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import ContentBlockViewSet, MediaAssetViewSet, site_content

router = DefaultRouter()
router.register("content-blocks", ContentBlockViewSet, basename="content-block")
router.register("media-assets", MediaAssetViewSet, basename="media-asset")

urlpatterns = router.urls + [
    path("public/site-content/", site_content, name="site-content"),
]
