"""Billing — Quotation → Invoice → Receipt with line items.

Document numbering is centralised: each document type carries its own running
counter using a `<PREFIX>-<YYYY>-<####>` format generated at save() time.
"""
from datetime import date
from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone

from crm.models import Project


def _generate_number(prefix: str, model: type) -> str:
    """Return the next document number for the given model + year."""
    year = timezone.now().year
    count = model.objects.filter(number__startswith=f"{prefix}-{year}-").count() + 1
    return f"{prefix}-{year}-{count:04d}"


class _MoneyMixin(models.Model):
    """Common monetary fields (USD).

    Totals are persisted (not computed on read) so PDF rendering is fast and
    historical values are preserved if a tax rate changes.
    """

    currency = models.CharField(max_length=8, default="USD")
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0"), help_text="Percent — e.g. 14.50")
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))

    class Meta:
        abstract = True

    def recompute_totals(self) -> None:
        items = list(self.items.all())  # type: ignore[attr-defined]
        sub = sum((i.line_total for i in items), Decimal("0"))
        self.subtotal = sub
        self.tax_amount = (sub - self.discount_amount) * (self.tax_rate or Decimal("0")) / Decimal("100")
        self.total = sub - self.discount_amount + self.tax_amount


# ============================================================================
# QUOTATION
# ============================================================================

class Quotation(_MoneyMixin, models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SENT = "sent", "Sent"
        ACCEPTED = "accepted", "Accepted"
        DECLINED = "declined", "Declined"
        EXPIRED = "expired", "Expired"
        CONVERTED = "converted", "Converted to Invoice"

    number = models.CharField(max_length=24, unique=True, blank=True)
    # Recipient is one of three shapes: an existing project, an existing
    # customer (no project yet), or a free-form recipient (lead /
    # prospect). All three FKs/fields are optional; the serializer
    # enforces that at least one shape is present.
    project = models.ForeignKey(
        Project, on_delete=models.PROTECT, related_name="quotations",
        null=True, blank=True,
    )
    customer = models.ForeignKey(
        "crm.Customer", on_delete=models.PROTECT, related_name="quotations",
        null=True, blank=True,
        help_text="Customer the quotation is for, when no project has been opened yet.",
    )
    recipient_name = models.CharField(
        max_length=200, blank=True,
        help_text="Free-form recipient when neither project nor customer is set.",
    )
    recipient_contact = models.CharField(max_length=200, blank=True)
    recipient_email = models.EmailField(blank=True)
    recipient_phone = models.CharField(max_length=32, blank=True)
    recipient_address = models.TextField(blank=True)
    recipient_vat = models.CharField(max_length=40, blank=True, help_text="Free-form recipient VAT number.")
    recipient_tin = models.CharField(max_length=40, blank=True, help_text="Free-form recipient TIN / BP number.")

    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)

    issue_date = models.DateField(default=date.today)
    expiry_date = models.DateField(null=True, blank=True)

    subject = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True, help_text="Visible on the document — payment terms, scope summary, etc.")
    terms = models.TextField(blank=True, help_text="Visible on the document — terms & conditions.")

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quotations_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-issue_date", "-created_at")
        indexes = [models.Index(fields=["number"]), models.Index(fields=["status"])]

    def save(self, *args, **kwargs):
        if not self.number:
            self.number = _generate_number("QT", Quotation)
        super().save(*args, **kwargs)

    def __str__(self) -> str:  # pragma: no cover
        return self.number


class QuotationItem(models.Model):
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name="items")
    section = models.CharField(
        max_length=80, blank=True,
        help_text="Optional grouping label, e.g. 'Bathroom', 'Lounge', 'Master Suite'. Items sharing a section render under one subheader on the PDF.",
    )
    description = models.CharField(max_length=400)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("1"))
    unit = models.CharField(max_length=24, default="unit", help_text="e.g. m², unit, hours")
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    line_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ("sort_order", "id")

    def save(self, *args, **kwargs):
        self.line_total = (self.quantity or Decimal("0")) * (self.unit_price or Decimal("0"))
        super().save(*args, **kwargs)


# ============================================================================
# INVOICE
# ============================================================================

class Invoice(_MoneyMixin, models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SENT = "sent", "Sent"
        PARTIAL = "partial", "Partially Paid"
        PAID = "paid", "Paid"
        OVERDUE = "overdue", "Overdue"
        VOID = "void", "Void"

    number = models.CharField(max_length=24, unique=True, blank=True)
    # Recipient is one of three shapes (matches Quotation): an existing
    # project, an existing customer, or a free-form recipient.
    project = models.ForeignKey(
        Project, on_delete=models.PROTECT, related_name="invoices",
        null=True, blank=True,
    )
    customer = models.ForeignKey(
        "crm.Customer", on_delete=models.PROTECT, related_name="invoices",
        null=True, blank=True,
    )
    recipient_name = models.CharField(max_length=200, blank=True)
    recipient_contact = models.CharField(max_length=200, blank=True)
    recipient_email = models.EmailField(blank=True)
    recipient_phone = models.CharField(max_length=32, blank=True)
    recipient_address = models.TextField(blank=True)
    recipient_vat = models.CharField(max_length=40, blank=True)
    recipient_tin = models.CharField(max_length=40, blank=True)

    quotation = models.ForeignKey(Quotation, on_delete=models.SET_NULL, null=True, blank=True, related_name="invoices")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)

    issue_date = models.DateField(default=date.today)
    due_date = models.DateField(null=True, blank=True)

    subject = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    terms = models.TextField(blank=True)

    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    balance_due = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoices_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-issue_date", "-created_at")
        indexes = [models.Index(fields=["number"]), models.Index(fields=["status"])]

    def save(self, *args, **kwargs):
        if not self.number:
            self.number = _generate_number("INV", Invoice)
        super().save(*args, **kwargs)

    def recompute_balance(self) -> None:
        paid = self.receipts.aggregate(  # type: ignore[attr-defined]
            s=models.Sum("amount")
        )["s"] or Decimal("0")
        self.amount_paid = paid
        self.balance_due = (self.total or Decimal("0")) - paid
        if self.balance_due <= Decimal("0"):
            self.status = self.Status.PAID
        elif paid > Decimal("0"):
            self.status = self.Status.PARTIAL

    def __str__(self) -> str:  # pragma: no cover
        return self.number


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="items")
    section = models.CharField(
        max_length=80, blank=True,
        help_text="Optional grouping label (Bathroom, Lounge, …). Items in the same section render under one subheader on the PDF.",
    )
    description = models.CharField(max_length=400)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("1"))
    unit = models.CharField(max_length=24, default="unit")
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    line_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ("sort_order", "id")

    def save(self, *args, **kwargs):
        self.line_total = (self.quantity or Decimal("0")) * (self.unit_price or Decimal("0"))
        super().save(*args, **kwargs)


# ============================================================================
# RECEIPT (Payment record against an invoice)
# ============================================================================

class Receipt(models.Model):
    class Method(models.TextChoices):
        CASH = "cash", "Cash"
        BANK_TRANSFER = "bank_transfer", "Bank Transfer"
        ECOCASH = "ecocash", "EcoCash / Mobile Money"
        CHEQUE = "cheque", "Cheque"
        CARD = "card", "Card"
        OTHER = "other", "Other"

    number = models.CharField(max_length=24, unique=True, blank=True)
    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name="receipts")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=16, choices=Method.choices, default=Method.BANK_TRANSFER)
    reference = models.CharField(max_length=120, blank=True, help_text="Bank reference, txn id, cheque number, etc.")
    received_at = models.DateField(default=date.today)
    notes = models.TextField(blank=True)

    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="receipts_received",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-received_at", "-created_at")
        indexes = [models.Index(fields=["number"])]

    def save(self, *args, **kwargs):
        if not self.number:
            self.number = _generate_number("RCP", Receipt)
        super().save(*args, **kwargs)
        # Update invoice balance + status
        if self.invoice_id:
            self.invoice.recompute_balance()
            self.invoice.save(update_fields=["amount_paid", "balance_due", "status", "updated_at"])

    def __str__(self) -> str:  # pragma: no cover
        return self.number
