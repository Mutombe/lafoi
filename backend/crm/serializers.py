from decimal import Decimal

from rest_framework import serializers

from accounts.serializers import UserSerializer
from .models import CatalogItem, Customer, Income, Project, ProjectCost, ProjectFile, ProjectUpdate


class ProjectCostSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    category_label = serializers.CharField(source="get_category_display", read_only=True)
    payment_method_label = serializers.CharField(source="get_payment_method_display", read_only=True)
    project_code = serializers.CharField(source="project.code", read_only=True)
    project_title = serializers.CharField(source="project.title", read_only=True)

    class Meta:
        model = ProjectCost
        fields = (
            "id",
            "project", "project_code", "project_title",
            "description",
            "category", "category_label",
            "amount", "tax_amount", "currency",
            "incurred_on", "paid_on",
            "payment_method", "payment_method_label",
            "supplier",
            "receipt_reference", "receipt_url",
            "is_billable",
            "notes",
            "created_by", "created_at", "updated_at",
        )
        read_only_fields = (
            "id", "category_label", "payment_method_label",
            "project_code", "project_title",
            "created_by", "created_at", "updated_at",
        )


class CustomerSerializer(serializers.ModelSerializer):
    project_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Customer
        fields = (
            "id", "name", "customer_type", "contact_person", "email", "phone",
            "alt_phone", "address", "city", "country", "notes", "tags",
            "project_count", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at", "project_count")


class ProjectFileSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()

    class Meta:
        model = ProjectFile
        fields = (
            "id", "project", "kind", "title", "file", "file_url", "file_name",
            "description", "uploaded_by", "uploaded_at",
        )
        read_only_fields = ("id", "uploaded_by", "uploaded_at", "file_url", "file_name")

    def get_file_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get("request")
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url

    def get_file_name(self, obj):
        return obj.file.name.rsplit("/", 1)[-1] if obj.file else None


class ProjectUpdateSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = ProjectUpdate
        fields = (
            "id", "project", "title", "body", "progress_snapshot", "status_snapshot",
            "photo", "photo_url", "author", "created_at",
        )
        read_only_fields = ("id", "author", "created_at", "photo_url")

    def get_photo_url(self, obj):
        if not obj.photo:
            return None
        request = self.context.get("request")
        url = obj.photo.url
        return request.build_absolute_uri(url) if request else url


class ProjectSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    project_manager_name = serializers.CharField(source="project_manager.display_name", read_only=True)
    files_count = serializers.IntegerField(read_only=True)
    updates_count = serializers.IntegerField(read_only=True)
    costs_total = serializers.SerializerMethodField()
    variance = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = (
            "id", "code", "title", "customer", "customer_name", "category", "status",
            "description", "site_address", "latitude", "longitude",
            "area_sqm", "budget",
            "start_date", "target_end_date", "actual_end_date", "progress",
            "project_manager", "project_manager_name",
            "files_count", "updates_count",
            "costs_total", "variance",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "code", "created_at", "updated_at",
                             "customer_name", "project_manager_name", "files_count", "updates_count",
                             "costs_total", "variance")

    def get_costs_total(self, obj):
        if hasattr(obj, "_costs_total"):
            return str(obj._costs_total or Decimal("0"))
        s = obj.costs.aggregate(s=__import__("django.db.models", fromlist=["Sum"]).Sum("amount"))["s"] or Decimal("0")
        return str(s)

    def get_variance(self, obj):
        if not obj.budget:
            return None
        spent = Decimal(self.get_costs_total(obj))
        return str((obj.budget or Decimal("0")) - spent)


class IncomeSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    source_label = serializers.CharField(source="get_source_display", read_only=True)
    method_label = serializers.CharField(source="get_method_display", read_only=True)
    project_code = serializers.CharField(source="project.code", read_only=True)
    project_title = serializers.CharField(source="project.title", read_only=True)
    receipt_number = serializers.CharField(source="receipt.number", read_only=True)
    invoice_number = serializers.CharField(source="receipt.invoice.number", read_only=True)

    class Meta:
        model = Income
        fields = (
            "id",
            "source", "source_label",
            "description",
            "amount", "currency",
            "received_on",
            "method", "method_label",
            "payer", "reference", "receipt_url",
            "project", "project_code", "project_title",
            "receipt", "receipt_number", "invoice_number",
            "notes",
            "created_by", "created_at", "updated_at",
        )
        read_only_fields = (
            "id", "source_label", "method_label",
            "project_code", "project_title",
            "receipt", "receipt_number", "invoice_number",
            "created_by", "created_at", "updated_at",
        )


class CatalogItemSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    kind_label = serializers.CharField(source="get_kind_display", read_only=True)

    class Meta:
        model = CatalogItem
        fields = (
            "id", "kind", "kind_label", "name", "short_code", "description",
            "default_unit", "default_unit_price", "currency",
            "image", "image_url", "tags", "is_active", "sort_order", "notes",
            "times_used", "created_at", "updated_at",
        )
        read_only_fields = (
            "id", "kind_label", "image_url", "times_used", "created_at", "updated_at",
        )

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url


class ProjectDetailSerializer(ProjectSerializer):
    """Includes nested updates + files + costs for the detail view."""

    updates = ProjectUpdateSerializer(many=True, read_only=True)
    files = ProjectFileSerializer(many=True, read_only=True)
    costs = ProjectCostSerializer(many=True, read_only=True)
    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        source="customer", queryset=Customer.objects.all(), write_only=True
    )

    class Meta(ProjectSerializer.Meta):
        fields = ProjectSerializer.Meta.fields + ("updates", "files", "costs", "customer_id")
