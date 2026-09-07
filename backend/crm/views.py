from django.db.models import Count, Sum
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from compliance.permissions import HasModuleAccess

from .models import (
    CatalogItem, Customer, CustomerFile, DesignShare, DesignShareView,
    ExpensePayment, Income, Project, ProjectCost, ProjectFile, ProjectUpdate,
)
from .serializers import (
    CatalogItemSerializer,
    CustomerDetailSerializer,
    CustomerFileSerializer,
    CustomerSerializer,
    DesignShareSerializer,
    ExpensePaymentSerializer,
    IncomeSerializer,
    ProjectCostSerializer,
    ProjectDetailSerializer,
    ProjectFileSerializer,
    ProjectSerializer,
    ProjectUpdateSerializer,
    _asset_kind,
)
from . import watermark as wm


class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    queryset = Customer.objects.all()
    permission_classes = [HasModuleAccess.for_module("customers")]
    filterset_fields = ("customer_type", "city", "country", "site_visit_status")
    search_fields = ("name", "contact_person", "email", "phone", "city", "address")
    ordering_fields = ("created_at", "name")

    def get_serializer_class(self):
        # Detail view nests the customer's uploaded files.
        if self.action == "retrieve":
            return CustomerDetailSerializer
        return CustomerSerializer

    def get_queryset(self):
        qs = Customer.objects.annotate(project_count=Count("projects")).order_by("-created_at")
        if self.action == "retrieve":
            qs = qs.prefetch_related("files", "files__uploaded_by")
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)


class CustomerFileViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerFileSerializer
    queryset = CustomerFile.objects.select_related("customer", "uploaded_by").all()
    permission_classes = [HasModuleAccess.for_module("customers")]
    filterset_fields = ("customer", "kind")
    ordering_fields = ("uploaded_at",)
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user if self.request.user.is_authenticated else None)


class ExpensePaymentViewSet(viewsets.ModelViewSet):
    serializer_class = ExpensePaymentSerializer
    queryset = ExpensePayment.objects.select_related("expense", "created_by").all()
    permission_classes = [HasModuleAccess.for_module("expenses")]
    filterset_fields = ("expense",)
    ordering_fields = ("paid_on", "created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.select_related("customer", "project_manager").all()
    permission_classes = [HasModuleAccess.for_module("projects")]
    filterset_fields = ("status", "category", "customer", "project_manager")
    search_fields = ("code", "title", "description", "site_address", "customer__name")
    ordering_fields = ("created_at", "start_date", "target_end_date", "progress")
    parser_classes = (JSONParser, FormParser, MultiPartParser)

    def get_queryset(self):
        qs = (
            Project.objects.select_related("customer", "project_manager")
            .annotate(files_count=Count("files", distinct=True), updates_count=Count("updates", distinct=True))
        )
        return qs.order_by("-created_at")

    def get_serializer_class(self):
        if self.action in ("retrieve", "update", "partial_update"):
            return ProjectDetailSerializer
        return ProjectSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)

    @action(detail=False, methods=["get"], url_path="map")
    def map(self, request):
        """Lightweight payload for the studio map view — only id, code, title,
        status, progress, latitude, longitude, customer_name. Filters out
        projects without coordinates."""
        qs = (
            Project.objects.select_related("customer")
            .filter(latitude__isnull=False, longitude__isnull=False)
        )
        data = [
            {
                "id": p.id, "code": p.code, "title": p.title,
                "status": p.status, "progress": p.progress,
                "latitude": float(p.latitude), "longitude": float(p.longitude),
                "site_address": p.site_address,
                "customer_name": p.customer.name if p.customer_id else None,
                "category": p.category,
            }
            for p in qs
        ]
        return Response(data)


class ProjectCostViewSet(viewsets.ModelViewSet):
    """Global expense ledger. Each row is an `Expense`; the URL is
    /api/expenses/ for clarity. project FK is optional — overhead and
    studio costs sit alongside project-specific entries.
    """
    serializer_class = ProjectCostSerializer
    queryset = ProjectCost.objects.select_related("project", "created_by").all()
    permission_classes = [HasModuleAccess.for_module("expenses")]
    filterset_fields = {
        "project": ["exact", "isnull"],
        "category": ["exact"],
        "currency": ["exact"],
        "payment_method": ["exact"],
        "is_billable": ["exact"],
        "incurred_on": ["gte", "lte"],
        "paid_on": ["gte", "lte"],
    }
    search_fields = ("description", "supplier", "receipt_reference", "notes")
    ordering_fields = ("incurred_on", "paid_on", "amount", "created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)


class ProjectUpdateViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectUpdateSerializer
    queryset = ProjectUpdate.objects.select_related("project", "author").all()
    permission_classes = [HasModuleAccess.for_module("projects")]
    filterset_fields = ("project",)
    ordering_fields = ("created_at",)
    parser_classes = (JSONParser, FormParser, MultiPartParser)

    def perform_create(self, serializer):
        instance = serializer.save(author=self.request.user if self.request.user.is_authenticated else None)
        # Sync project's progress + status if a snapshot was supplied.
        proj = instance.project
        dirty = False
        if instance.progress_snapshot is not None:
            proj.progress = instance.progress_snapshot
            dirty = True
        if instance.status_snapshot:
            proj.status = instance.status_snapshot
            dirty = True
        if dirty:
            proj.save(update_fields=["progress", "status", "updated_at"])


class ProjectFileViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectFileSerializer
    queryset = ProjectFile.objects.select_related("project", "uploaded_by").all()
    permission_classes = [HasModuleAccess.for_module("projects")]
    filterset_fields = ("project", "kind")
    ordering_fields = ("uploaded_at",)
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user if self.request.user.is_authenticated else None)


class IncomeViewSet(viewsets.ModelViewSet):
    """Global income ledger — every shilling that comes in.

    Invoice receipts mirror into this table automatically via signal so the
    Expenses dashboard can sum a single source of truth for cashflow.
    """
    serializer_class = IncomeSerializer
    queryset = Income.objects.select_related("project", "receipt", "receipt__invoice", "created_by").all()
    permission_classes = [HasModuleAccess.for_module("expenses")]
    filterset_fields = {
        "project": ["exact", "isnull"],
        "source": ["exact"],
        "currency": ["exact"],
        "method": ["exact"],
        "received_on": ["gte", "lte"],
    }
    search_fields = ("description", "payer", "reference", "notes", "receipt__number")
    ordering_fields = ("received_on", "amount", "created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)

    def get_queryset(self):
        qs = super().get_queryset()
        # `project__isnull=true` query param convenience: DRF parses string
        # "true"/"false"/"True"/"1" inconsistently across filter backends, so
        # we coerce here when present.
        only_global = self.request.query_params.get("project__isnull")
        if only_global in ("true", "True", "1"):
            qs = qs.filter(project__isnull=True)
        elif only_global in ("false", "False", "0"):
            qs = qs.filter(project__isnull=False)
        return qs


class CatalogItemViewSet(viewsets.ModelViewSet):
    """Products + services library for line-item invocation in quotations."""
    serializer_class = CatalogItemSerializer
    queryset = CatalogItem.objects.all()
    permission_classes = [HasModuleAccess.for_module("catalog")]
    filterset_fields = ("kind", "is_active")
    search_fields = ("name", "short_code", "description", "tags")
    ordering_fields = ("sort_order", "name", "default_unit_price", "times_used", "updated_at")
    parser_classes = (JSONParser, FormParser, MultiPartParser)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)

    @action(detail=True, methods=["post"], url_path="bump-usage")
    def bump_usage(self, request, pk=None):
        """Increment usage counter — called by the line-item editor when a
        catalog item is invoked into a quotation/invoice line."""
        item = self.get_object()
        CatalogItem.objects.filter(pk=item.pk).update(times_used=item.times_used + 1)
        item.refresh_from_db(fields=["times_used"])
        return Response({"times_used": item.times_used})


# ============================================================================
# SECURE DESIGN SHARE
# ============================================================================

class DesignShareViewSet(viewsets.ModelViewSet):
    """Studio-side: create and manage view-only, watermarked share links."""
    serializer_class = DesignShareSerializer
    queryset = (
        DesignShare.objects.select_related("project", "customer", "created_by")
        .prefetch_related("files", "views").all()
    )
    permission_classes = [HasModuleAccess.for_module("projects")]
    filterset_fields = ("project", "customer", "is_revoked")
    ordering_fields = ("created_at",)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)

    @action(detail=True, methods=["post"], url_path="revoke")
    def revoke(self, request, pk=None):
        share = self.get_object()
        share.is_revoked = True
        share.save(update_fields=["is_revoked", "updated_at"])
        return Response(DesignShareSerializer(share, context={"request": request}).data)


def _client_ip(request):
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    return (xff.split(",")[0].strip() if xff else request.META.get("REMOTE_ADDR")) or None


def _check_view_token(share, request):
    if not share.require_passcode:
        return True
    vt = request.GET.get("vt") or request.headers.get("X-Share-Token", "")
    if not vt:
        return False
    from django.core import signing
    try:
        return signing.loads(vt, salt="designshare", max_age=60 * 60 * 8).get("t") == share.token
    except Exception:
        return False


@api_view(["GET"])
@permission_classes([AllowAny])
def share_meta(request, token):
    """Public: what the viewer needs to render — no raw file URLs, ever."""
    share = DesignShare.objects.prefetch_related("files").filter(token=token).first()
    if not share:
        return Response({"status": "not_found"}, status=status.HTTP_404_NOT_FOUND)
    if share.is_revoked:
        return Response({"status": "revoked"})
    if share.is_expired:
        return Response({"status": "expired"})
    files = []
    for f in share.files.all():
        kind = _asset_kind(f.file.name if f.file else "")
        item = {"id": f.id, "kind": kind, "title": f.title or (f.file.name.rsplit("/", 1)[-1] if f.file else "")}
        if kind == "pdf":
            try:
                data = f.file.read(); f.file.close()
                item["pages"] = wm.pdf_page_count(data)
            except Exception:
                item["pages"] = 1
        files.append(item)
    # count one view per open
    DesignShareView.objects.create(share=share, ip=_client_ip(request), user_agent=request.META.get("HTTP_USER_AGENT", "")[:300])
    DesignShare.objects.filter(pk=share.pk).update(view_count=share.view_count + 1, last_viewed_at=timezone.now())
    return Response({
        "status": "active",
        "title": share.title or "Design preview",
        "client_name": share.watermark_name,
        "project_title": share.project.title if share.project_id else None,
        "require_passcode": share.require_passcode,
        "files": files,
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def share_verify(request, token):
    share = DesignShare.objects.filter(token=token).first()
    if not share or not share.is_active:
        return Response({"detail": "unavailable"}, status=status.HTTP_404_NOT_FOUND)
    if share.check_passcode(request.data.get("passcode", "")):
        from django.core import signing
        return Response({"ok": True, "vt": signing.dumps({"t": token}, salt="designshare")})
    return Response({"ok": False, "detail": "Incorrect passcode."}, status=status.HTTP_403_FORBIDDEN)


@api_view(["GET"])
@permission_classes([AllowAny])
def share_asset(request, token, file_id):
    """Public: stream ONE asset, watermarked + re-encoded. Never the original."""
    share = DesignShare.objects.filter(token=token).first()
    if not share or not share.is_active:
        raise Http404
    if not _check_view_token(share, request):
        return Response({"detail": "locked"}, status=status.HTTP_403_FORBIDDEN)
    f = share.files.filter(id=file_id).first()
    if not f or not f.file:
        raise Http404
    kind = _asset_kind(f.file.name)
    label = wm.label_for(share.watermark_name)
    try:
        raw = f.file.read(); f.file.close()
    except Exception:
        raise Http404
    if kind == "image":
        out, ctype = wm.watermark_image_bytes(raw, label), "image/jpeg"
    elif kind == "pdf":
        out, ctype = wm.watermark_pdf_page_bytes(raw, int(request.GET.get("page", 0)), label), "image/jpeg"
    elif kind == "video":
        ext = f.file.name.rsplit(".", 1)[-1].lower()
        out, ctype = raw, {"webm": "video/webm", "ogg": "video/ogg"}.get(ext, "video/mp4")
    else:
        raise Http404
    resp = HttpResponse(out, content_type=ctype)
    resp["Content-Disposition"] = "inline"
    resp["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
    resp["X-Content-Type-Options"] = "nosniff"
    return resp
