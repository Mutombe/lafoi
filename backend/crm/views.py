from django.db.models import Count, Sum
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from .models import Customer, Project, ProjectCost, ProjectFile, ProjectUpdate
from .serializers import (
    CustomerSerializer,
    ProjectCostSerializer,
    ProjectDetailSerializer,
    ProjectFileSerializer,
    ProjectSerializer,
    ProjectUpdateSerializer,
)


class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    queryset = Customer.objects.all()
    filterset_fields = ("customer_type", "city", "country")
    search_fields = ("name", "contact_person", "email", "phone", "city", "address")
    ordering_fields = ("created_at", "name")

    def get_queryset(self):
        return Customer.objects.annotate(project_count=Count("projects")).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.select_related("customer", "project_manager").all()
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
    filterset_fields = ("project", "kind")
    ordering_fields = ("uploaded_at",)
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user if self.request.user.is_authenticated else None)
