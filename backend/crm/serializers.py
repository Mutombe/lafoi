from decimal import Decimal

from rest_framework import serializers

from accounts.serializers import UserSerializer
from .models import (
    CatalogItem, Customer, CustomerFile, DesignShare, DesignShareView,
    ExpensePayment, Income, Project, ProjectCost, ProjectFile, ProjectUpdate,
)


def _asset_kind(name):
    """Classify a filename into how the secure viewer should render it."""
    n = (name or "").lower()
    if n.rsplit(".", 1)[-1] in ("jpg", "jpeg", "png", "webp", "gif", "bmp", "tif", "tiff"):
        return "image"
    if n.endswith(".pdf"):
        return "pdf"
    if n.rsplit(".", 1)[-1] in ("mp4", "webm", "mov", "m4v", "ogg"):
        return "video"
    return "other"


class ExpensePaymentSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    method_label = serializers.CharField(source="get_method_display", read_only=True)

    class Meta:
        model = ExpensePayment
        fields = (
            "id", "expense", "amount", "paid_on",
            "method", "method_label", "reference", "note",
            "created_by", "created_at",
        )
        read_only_fields = ("id", "method_label", "created_by", "created_at")


class ProjectCostSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    category_label = serializers.CharField(source="get_category_display", read_only=True)
    payment_method_label = serializers.CharField(source="get_payment_method_display", read_only=True)
    project_code = serializers.CharField(source="project.code", read_only=True)
    project_title = serializers.CharField(source="project.title", read_only=True)
    # Part-payment rollups (computed from related ExpensePayment rows).
    amount_paid = serializers.SerializerMethodField()
    balance_due = serializers.SerializerMethodField()
    payment_status = serializers.CharField(read_only=True)
    payments = ExpensePaymentSerializer(many=True, read_only=True)

    class Meta:
        model = ProjectCost
        fields = (
            "id",
            "project", "project_code", "project_title",
            "description",
            "category", "category_label",
            "amount", "tax_amount", "currency",
            "amount_paid", "balance_due", "payment_status", "payments",
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
            "amount_paid", "balance_due", "payment_status", "payments",
            "created_by", "created_at", "updated_at",
        )

    def get_amount_paid(self, obj):
        return str(obj.amount_paid)

    def get_balance_due(self, obj):
        return str(obj.balance_due)


class CustomerSerializer(serializers.ModelSerializer):
    project_count = serializers.IntegerField(read_only=True)
    site_visit_label = serializers.CharField(source="get_site_visit_status_display", read_only=True)

    class Meta:
        model = Customer
        fields = (
            "id", "name", "customer_type", "contact_person", "email", "phone",
            "alt_phone", "address", "city", "country",
            "vat_number", "tin_number",
            "site_visit_status", "site_visit_label", "site_visit_date", "site_visit_notes",
            "notes", "tags",
            "project_count", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at", "project_count", "site_visit_label")


class CustomerFileSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomerFile
        fields = (
            "id", "customer", "kind", "title", "file", "file_url", "file_name",
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


class CustomerDetailSerializer(CustomerSerializer):
    """Customer with nested files for the detail page."""
    files = CustomerFileSerializer(many=True, read_only=True)

    class Meta(CustomerSerializer.Meta):
        fields = CustomerSerializer.Meta.fields + ("files",)


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


# ---------------------------------------------------------------------------
# SECURE DESIGN SHARE
# ---------------------------------------------------------------------------

class DesignShareFileSerializer(serializers.ModelSerializer):
    file_name = serializers.SerializerMethodField()
    asset_kind = serializers.SerializerMethodField()

    class Meta:
        model = ProjectFile
        fields = ("id", "kind", "title", "file_name", "asset_kind")

    def get_file_name(self, obj):
        return obj.file.name.rsplit("/", 1)[-1] if obj.file else None

    def get_asset_kind(self, obj):
        return _asset_kind(obj.file.name if obj.file else "")


class DesignShareViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = DesignShareView
        fields = ("id", "file", "viewed_at", "ip", "user_agent")


class DesignShareSerializer(serializers.ModelSerializer):
    """Dashboard-facing: create/manage a secure share."""
    files = DesignShareFileSerializer(many=True, read_only=True)
    file_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=ProjectFile.objects.all(), source="files", required=False,
    )
    passcode = serializers.CharField(write_only=True, required=False, allow_blank=True)
    share_path = serializers.SerializerMethodField()
    project_title = serializers.CharField(source="project.title", read_only=True)
    customer_name = serializers.SerializerMethodField()
    is_active = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    recent_views = serializers.SerializerMethodField()

    class Meta:
        model = DesignShare
        fields = (
            "id", "token", "share_path", "project", "project_title", "customer", "customer_name",
            "files", "file_ids", "title", "client_name", "client_email",
            "require_passcode", "passcode", "allow_download",
            "expires_at", "is_revoked", "is_active", "is_expired",
            "view_count", "last_viewed_at", "recent_views", "created_at",
        )
        read_only_fields = (
            "id", "token", "share_path", "require_passcode", "is_active", "is_expired",
            "view_count", "last_viewed_at", "recent_views", "created_at", "project_title", "customer_name",
        )

    def get_share_path(self, obj):
        return f"/view/{obj.token}"

    def get_customer_name(self, obj):
        return obj.watermark_name

    def get_recent_views(self, obj):
        return DesignShareViewSerializer(obj.views.all()[:20], many=True).data

    def _apply_passcode(self, instance, validated):
        pc = validated.pop("passcode", None)
        if pc is not None:
            instance.set_passcode(pc)

    def create(self, validated):
        files = validated.pop("files", [])
        pc = validated.pop("passcode", None)
        share = DesignShare.objects.create(**validated)
        if pc:
            share.set_passcode(pc)
            share.save(update_fields=["passcode_hash", "require_passcode"])
        if files:
            share.files.set(files)
        return share

    def update(self, instance, validated):
        files = validated.pop("files", None)
        pc = validated.pop("passcode", None)
        for k, v in validated.items():
            setattr(instance, k, v)
        if pc is not None:
            instance.set_passcode(pc)
        instance.save()
        if files is not None:
            instance.files.set(files)
        return instance
