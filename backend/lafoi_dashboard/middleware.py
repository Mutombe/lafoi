"""Global service-suspension gate.

When the ``SYSTEM_SUSPENDED`` setting is true, every request is short-circuited
with a 503 and a plain ``"Lafoi system is suspended."`` payload — no login, no
API, nothing — so the whole platform can be held in a suspension state from a
single environment variable.

Two paths stay open so the switch stays observable and the host keeps the
service alive to flip it back:

  - ``/healthz``            — Render's liveness probe (else the host may stop us)
  - ``/api/system/status``  — the frontend polls this to show the suspension screen

To lift the suspension, set ``SYSTEM_SUSPENDED=false`` on the backend host and
let it restart. This gate only blocks access — it never touches or deletes data.
"""
from django.conf import settings
from django.http import JsonResponse

# Paths that must answer even while suspended. Compared without a trailing slash.
_ALLOWLIST = ("/healthz", "/api/system/status")


class SystemSuspendedMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if getattr(settings, "SYSTEM_SUSPENDED", False):
            path = request.path.rstrip("/") or "/"
            if path not in _ALLOWLIST:
                return JsonResponse(
                    {"detail": "Lafoi system is suspended.", "suspended": True},
                    status=503,
                )
        return self.get_response(request)
