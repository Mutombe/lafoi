from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import ContentBlockViewSet, site_content

router = DefaultRouter()
router.register("content-blocks", ContentBlockViewSet, basename="content-block")

urlpatterns = router.urls + [
    path("public/site-content/", site_content, name="site-content"),
]
