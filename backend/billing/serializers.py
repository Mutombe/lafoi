from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from .models import Invoice, InvoiceItem, Quotation, QuotationItem, Receipt


class _LineItemBaseSerializer(serializers.ModelSerializer):
    class Meta:
        fields = ("id", "section", "description", "quantity", "unit", "unit_price", "line_total", "sort_order")
        read_only_fields = ("id", "line_total")


class QuotationItemSerializer(_LineItemBaseSerializer):
    class Meta(_LineItemBaseSerializer.Meta):
        model = QuotationItem


class InvoiceItemSerializer(_LineItemBaseSerializer):
    class Meta(_LineItemBaseSerializer.Meta):
        model = InvoiceItem


# ---------------------------------------------------------------------------
# QUOTATION
# ---------------------------------------------------------------------------

class QuotationSerializer(serializers.ModelSerializer):
    items = QuotationItemSerializer(many=True, required=False)
    project_code = serializers.CharField(source="project.code", read_only=True)
    project_title = serializers.CharField(source="project.title", read_only=True)
    # customer_name resolves from project.customer when set, otherwise the
    # standalone customer FK, otherwise the free-form recipient_name.
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = Quotation
        fields = (
            "id", "number",
            "project", "project_code", "project_title",
            "customer", "customer_name",
            "recipient_name", "recipient_contact", "recipient_email",
            "recipient_phone", "recipient_address", "recipient_vat", "recipient_tin",
            "status", "issue_date", "expiry_date", "subject",
            "currency", "subtotal", "tax_rate", "tax_amount", "discount_amount", "total",
            "notes", "terms", "items", "created_at", "updated_at",
        )
        read_only_fields = ("id", "number", "subtotal", "tax_amount", "total", "created_at", "updated_at",
                             "project_code", "project_title", "customer_name")

    def get_customer_name(self, obj):
        if obj.project_id and obj.project.customer_id:
            return obj.project.customer.name
        if obj.customer_id:
            return obj.customer.name
        return obj.recipient_name or ""

    def validate(self, attrs):
        # Treat self.instance fields as fall-back when a PATCH doesn't include
        # the recipient fields — partial updates must remain valid.
        get = lambda key: attrs.get(key, getattr(self.instance, key, None) if self.instance else None)
        if not (get("project") or get("customer") or (get("recipient_name") or "").strip()):
            raise serializers.ValidationError(
                "Pick a project, pick a customer, or fill the free-form recipient name."
            )
        return attrs

    def _save_items(self, quotation: Quotation, items_data):
        if items_data is None:
            return
        # Replace all items on update — simpler + matches "edit" UX
        quotation.items.all().delete()
        for idx, item in enumerate(items_data):
            QuotationItem.objects.create(quotation=quotation, sort_order=idx, **item)

    @transaction.atomic
    def create(self, validated):
        items_data = validated.pop("items", [])
        quotation = Quotation.objects.create(**validated)
        self._save_items(quotation, items_data)
        quotation.recompute_totals()
        quotation.save(update_fields=["subtotal", "tax_amount", "total", "updated_at"])
        return quotation

    @transaction.atomic
    def update(self, instance, validated):
        items_data = validated.pop("items", None)
        for k, v in validated.items():
            setattr(instance, k, v)
        instance.save()
        if items_data is not None:
            self._save_items(instance, items_data)
        instance.recompute_totals()
        instance.save(update_fields=["subtotal", "tax_amount", "total", "updated_at"])
        return instance


# ---------------------------------------------------------------------------
# INVOICE
# ---------------------------------------------------------------------------

class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, required=False)
    project_code = serializers.CharField(source="project.code", read_only=True)
    project_title = serializers.CharField(source="project.title", read_only=True)
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = (
            "id", "number",
            "project", "project_code", "project_title",
            "customer", "customer_name",
            "recipient_name", "recipient_contact", "recipient_email",
            "recipient_phone", "recipient_address", "recipient_vat", "recipient_tin",
            "quotation", "status", "issue_date", "due_date", "subject",
            "currency", "subtotal", "tax_rate", "tax_amount", "discount_amount", "total",
            "amount_paid", "balance_due",
            "notes", "terms", "items", "created_at", "updated_at",
        )
        read_only_fields = (
            "id", "number", "subtotal", "tax_amount", "total", "amount_paid", "balance_due",
            "created_at", "updated_at", "project_code", "project_title", "customer_name",
        )

    def get_customer_name(self, obj):
        if obj.project_id and obj.project.customer_id:
            return obj.project.customer.name
        if obj.customer_id:
            return obj.customer.name
        return obj.recipient_name or ""

    def validate(self, attrs):
        get = lambda key: attrs.get(key, getattr(self.instance, key, None) if self.instance else None)
        if not (get("project") or get("customer") or (get("recipient_name") or "").strip()):
            raise serializers.ValidationError(
                "Pick a project, pick a customer, or fill the free-form recipient name."
            )
        return attrs

    def _save_items(self, invoice: Invoice, items_data):
        if items_data is None:
            return
        invoice.items.all().delete()
        for idx, item in enumerate(items_data):
            InvoiceItem.objects.create(invoice=invoice, sort_order=idx, **item)

    @transaction.atomic
    def create(self, validated):
        items_data = validated.pop("items", [])
        invoice = Invoice.objects.create(**validated)
        self._save_items(invoice, items_data)
        invoice.recompute_totals()
        invoice.recompute_balance()
        invoice.save()
        return invoice

    @transaction.atomic
    def update(self, instance, validated):
        items_data = validated.pop("items", None)
        for k, v in validated.items():
            setattr(instance, k, v)
        instance.save()
        if items_data is not None:
            self._save_items(instance, items_data)
        instance.recompute_totals()
        instance.recompute_balance()
        instance.save()
        return instance


# ---------------------------------------------------------------------------
# RECEIPT
# ---------------------------------------------------------------------------

class ReceiptSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(source="invoice.number", read_only=True)
    project_code = serializers.CharField(source="invoice.project.code", read_only=True)
    customer_name = serializers.CharField(source="invoice.project.customer.name", read_only=True)

    class Meta:
        model = Receipt
        fields = (
            "id", "number", "invoice", "invoice_number", "project_code", "customer_name",
            "amount", "method", "reference", "received_at", "notes", "created_at",
        )
        read_only_fields = ("id", "number", "created_at", "invoice_number", "project_code", "customer_name")
