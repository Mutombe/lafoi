"""Top-level URL routes for the La Foi dashboard backend."""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def healthz(_request):
    """Lightweight liveness probe for Render's health check."""
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("healthz", healthz),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("crm.urls")),
    path("api/", include("billing.urls")),
    path("api/", include("payroll.urls")),
    path("api/", include("compliance.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
