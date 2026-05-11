"""CRM — Customers, Projects, Project lifecycle (updates + files)."""
from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone


class Customer(models.Model):
    class Type(models.TextChoices):
        INDIVIDUAL = "individual", "Individual"
        BUSINESS = "business", "Business"
        INSTITUTION = "institution", "Institution"

    name = models.CharField(max_length=200)
    customer_type = models.CharField(max_length=16, choices=Type.choices, default=Type.INDIVIDUAL)
    contact_person = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=32, blank=True)
    alt_phone = models.CharField(max_length=32, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=120, blank=True, default="Harare")
    country = models.CharField(max_length=120, blank=True, default="Zimbabwe")
    notes = models.TextField(blank=True)
    tags = models.JSONField(default=list, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="customers_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["customer_type"]),
        ]

    def __str__(self) -> str:  # pragma: no cover
        return self.name


class Project(models.Model):
    class Status(models.TextChoices):
        LEAD = "lead", "Lead"
        QUOTED = "quoted", "Quoted"
        APPROVED = "approved", "Approved"
        IN_PROGRESS = "in_progress", "In Progress"
        ON_HOLD = "on_hold", "On Hold"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    class Category(models.TextChoices):
        RESIDENTIAL = "residential", "Residential"
        COMMERCIAL = "commercial", "Commercial"
        HOSPITALITY = "hospitality", "Hospitality"
        RETAIL = "retail", "Retail"
        INSTITUTIONAL = "institutional", "Institutional"

    code = models.CharField(max_length=24, unique=True, blank=True, help_text="Auto-generated: LF-YYYY-####")
    title = models.CharField(max_length=200)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="projects")
    category = models.CharField(max_length=24, choices=Category.choices, default=Category.RESIDENTIAL)
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.LEAD)

    description = models.TextField(blank=True)
    site_address = models.TextField(blank=True)
    # Geolocation — used by the studio map.
    latitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    area_sqm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, help_text="Estimated budget in USD")

    start_date = models.DateField(null=True, blank=True)
    target_end_date = models.DateField(null=True, blank=True)
    actual_end_date = models.DateField(null=True, blank=True)

    progress = models.PositiveSmallIntegerField(default=0, help_text="0-100")

    project_manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="projects_managed",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="projects_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["code"]),
            models.Index(fields=["status"]),
            models.Index(fields=["category"]),
        ]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.code or '?'} — {self.title}"

    def save(self, *args, **kwargs):
        if not self.code:
            year = timezone.now().year
            count = Project.objects.filter(code__startswith=f"LF-{year}-").count() + 1
            self.code = f"LF-{year}-{count:04d}"
        # clamp progress
        if self.progress is not None:
            self.progress = max(0, min(100, int(self.progress)))
        super().save(*args, **kwargs)


class ProjectUpdate(models.Model):
    """A timestamped progress update on a project — narrative + optional photo + status snapshot."""

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="updates")
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    progress_snapshot = models.PositiveSmallIntegerField(null=True, blank=True, help_text="0-100 at the time of update")
    status_snapshot = models.CharField(max_length=24, choices=Project.Status.choices, blank=True)
    photo = models.ImageField(upload_to="project_updates/", blank=True, null=True)

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="project_updates",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.project.code}: {self.title}"


class ProjectFile(models.Model):
    """Plans, drawings, contracts, photos attached to a project."""

    class Kind(models.TextChoices):
        PLAN = "plan", "Plan / Drawing"
        PHOTO = "photo", "Photo"
        CONTRACT = "contract", "Contract"
        DOCUMENT = "document", "Document"
        OTHER = "other", "Other"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="files")
    kind = models.CharField(max_length=16, choices=Kind.choices, default=Kind.DOCUMENT)
    title = models.CharField(max_length=200, blank=True)
    file = models.FileField(upload_to="project_files/")
    description = models.TextField(blank=True)

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="project_files",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-uploaded_at",)

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.kind}: {self.title or self.file.name}"


class ProjectCost(models.Model):
    """A line of business expense.

    Modelled as a global expense ledger. Each expense can OPTIONALLY be
    associated with a project (project FK is nullable) so studio overhead,
    office costs, fuel, marketing etc. live alongside project-specific
    costs in one place. When project is set, the entry also surfaces on
    the project's budget-variance card.

    Categories let finance group expenses (materials/labour/transport/
    permits/equipment/subcontract/overhead/office/marketing/fuel/utilities
    /software/other).
    """

    class Category(models.TextChoices):
        MATERIALS = "materials", "Materials"
        LABOUR = "labour", "Labour"
        TRANSPORT = "transport", "Transport"
        PERMITS = "permits", "Permits & fees"
        EQUIPMENT = "equipment", "Equipment hire"
        SUBCONTRACT = "subcontract", "Subcontract"
        OVERHEAD = "overhead", "Overhead"
        OFFICE = "office", "Office"
        MARKETING = "marketing", "Marketing"
        FUEL = "fuel", "Fuel & vehicle"
        UTILITIES = "utilities", "Utilities"
        SOFTWARE = "software", "Software & subscriptions"
        ENTERTAINMENT = "entertainment", "Client entertainment"
        OTHER = "other", "Other"

    class PaymentMethod(models.TextChoices):
        CASH = "cash", "Cash"
        BANK_TRANSFER = "bank_transfer", "Bank transfer"
        MOBILE_MONEY = "mobile_money", "Mobile money"
        CARD = "card", "Card"
        CHEQUE = "cheque", "Cheque"
        OTHER = "other", "Other"

    project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="costs",
        help_text="Optional. Leave blank for global / overhead expenses.",
    )
    description = models.CharField(max_length=240)
    category = models.CharField(max_length=24, choices=Category.choices, default=Category.OTHER)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    tax_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0"),
        help_text="VAT or other tax portion of the amount, if recorded separately.",
    )
    currency = models.CharField(max_length=8, default="USD")
    incurred_on = models.DateField(help_text="Date the expense was actually incurred.")
    paid_on = models.DateField(
        null=True, blank=True,
        help_text="When the expense was paid. Leave blank for unpaid / pending.",
    )
    payment_method = models.CharField(
        max_length=16, choices=PaymentMethod.choices, default=PaymentMethod.BANK_TRANSFER,
        blank=True,
    )
    supplier = models.CharField(max_length=200, blank=True, help_text="Vendor or supplier name.")
    receipt_reference = models.CharField(
        max_length=120, blank=True,
        help_text="External receipt / invoice number, if any.",
    )
    receipt_url = models.URLField(
        blank=True,
        help_text="Link to the scanned receipt or invoice (e.g. DO Spaces upload).",
    )
    is_billable = models.BooleanField(
        default=False,
        help_text="Marks the expense as on-bill to a client (typically only when a project is attached).",
    )
    notes = models.TextField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="project_costs",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-incurred_on", "-created_at")
        indexes = [
            models.Index(fields=["project", "incurred_on"]),
            models.Index(fields=["category"]),
        ]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.project.code}: {self.description} ({self.currency} {self.amount})"
