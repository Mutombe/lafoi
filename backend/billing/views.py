from django.db import transaction
from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from compliance.permissions import HasModuleAccess

from .models import Invoice, InvoiceItem, Quotation, QuotationItem, Receipt, _generate_number
from .pdf import render_invoice_pdf, render_quotation_pdf, render_receipt_pdf
from .serializers import InvoiceSerializer, QuotationSerializer, ReceiptSerializer


def _invoice_from_quotation(quotation, *, kind, user):
    """Copy a quotation's recipient, meta and line items into a new Invoice of
    the given kind. Shared by convert-to-invoice and convert-to-proforma so the
    two documents stay identical apart from their kind (and number series)."""
    invoice = Invoice.objects.create(
        project=quotation.project,
        customer=quotation.customer,
        recipient_name=quotation.recipient_name,
        recipient_contact=quotation.recipient_contact,
        recipient_email=quotation.recipient_email,
        recipient_phone=quotation.recipient_phone,
        recipient_address=quotation.recipient_address,
        recipient_vat=quotation.recipient_vat,
        recipient_tin=quotation.recipient_tin,
        quotation=quotation,
        kind=kind,
        status=Invoice.Status.DRAFT,
        subject=quotation.subject,
        notes=quotation.notes,
        terms=quotation.terms,
        tax_rate=quotation.tax_rate,
        discount_amount=quotation.discount_amount,
        currency=quotation.currency,
        created_by=user,
    )
    for it in quotation.items.all():
        InvoiceItem.objects.create(
            invoice=invoice,
            section=it.section,
            description=it.description,
            quantity=it.quantity,
            unit=it.unit,
            unit_price=it.unit_price,
            sort_order=it.sort_order,
        )
    invoice.recompute_totals()
    invoice.recompute_balance()
    invoice.save()
    return invoice


class QuotationViewSet(viewsets.ModelViewSet):
    queryset = Quotation.objects.select_related("project", "project__customer").prefetch_related("items").all()
    serializer_class = QuotationSerializer
    permission_classes = [HasModuleAccess.for_module("quotations")]
    filterset_fields = ("status", "project")
    search_fields = ("number", "subject", "project__code", "project__title", "project__customer__name")
    ordering_fields = ("issue_date", "created_at", "total")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)

    @action(detail=True, methods=["get"], url_path="pdf")
    def pdf(self, request, pk=None):
        quotation = self.get_object()
        pdf_bytes = render_quotation_pdf(quotation)
        resp = HttpResponse(pdf_bytes, content_type="application/pdf")
        resp["Content-Disposition"] = f'inline; filename="{quotation.number}.pdf"'
        return resp

    @action(detail=True, methods=["post"], url_path="duplicate")
    def duplicate(self, request, pk=None):
        """Clone this quotation into a fresh draft with a new number.

        The admin's usual habit is to open an old quote, tweak it and
        re-download — which reuses the same QT number every time and leaves no
        distinct record. Duplicating produces a brand-new, uniquely-numbered
        draft (QT-YYYY-#### auto-generated at save) that copies every field and
        line item, so each new quote is its own traceable document.
        """
        from django.db import transaction
        from django.utils import timezone

        original = self.get_object()
        with transaction.atomic():
            clone = Quotation.objects.create(
                project=original.project,
                customer=original.customer,
                recipient_name=original.recipient_name,
                recipient_contact=original.recipient_contact,
                recipient_email=original.recipient_email,
                recipient_phone=original.recipient_phone,
                recipient_address=original.recipient_address,
                recipient_vat=original.recipient_vat,
                recipient_tin=original.recipient_tin,
                status=Quotation.Status.DRAFT,
                # A duplicate is a new document raised today — refresh the issue
                # date but carry the recipient's validity window forward as-is.
                issue_date=timezone.now().date(),
                expiry_date=original.expiry_date,
                subject=original.subject,
                notes=original.notes,
                terms=original.terms,
                tax_rate=original.tax_rate,
                discount_amount=original.discount_amount,
                currency=original.currency,
                created_by=request.user if request.user.is_authenticated else None,
            )
            for it in original.items.all():
                QuotationItem.objects.create(
                    quotation=clone,
                    section=it.section,
                    description=it.description,
                    quantity=it.quantity,
                    unit=it.unit,
                    unit_price=it.unit_price,
                    sort_order=it.sort_order,
                )
            clone.recompute_totals()
            clone.save(update_fields=["subtotal", "tax_amount", "total", "updated_at"])
        return Response(QuotationSerializer(clone).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="convert-to-invoice")
    def convert_to_invoice(self, request, pk=None):
        """Create a real Invoice from this Quotation, copying line items + meta.

        Marks the quotation Converted — a real invoice is a firm sale.
        """
        quotation = self.get_object()
        user = request.user if request.user.is_authenticated else None
        with transaction.atomic():
            invoice = _invoice_from_quotation(quotation, kind=Invoice.Kind.INVOICE, user=user)
            quotation.status = Quotation.Status.CONVERTED
            quotation.save(update_fields=["status", "updated_at"])
        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="convert-to-proforma")
    def convert_to_proforma(self, request, pk=None):
        """Create a Proforma Invoice from this Quotation, copying line items + meta.

        A proforma is a preliminary bill, so the quotation is left OPEN (not
        marked Converted) — it can still be accepted and turned into a real
        invoice later, and the proforma itself can be promoted in place.
        """
        quotation = self.get_object()
        user = request.user if request.user.is_authenticated else None
        with transaction.atomic():
            invoice = _invoice_from_quotation(quotation, kind=Invoice.Kind.PROFORMA, user=user)
        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = (
        Invoice.objects
        .select_related("project", "project__customer", "quotation")
        .prefetch_related("items", "receipts")
        .all()
    )
    serializer_class = InvoiceSerializer
    permission_classes = [HasModuleAccess.for_module("invoices")]
    filterset_fields = ("status", "project", "quotation", "kind")
    search_fields = ("number", "subject", "project__code", "project__title", "project__customer__name")
    ordering_fields = ("issue_date", "due_date", "created_at", "total", "balance_due")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)

    @action(detail=True, methods=["get"], url_path="pdf")
    def pdf(self, request, pk=None):
        invoice = self.get_object()
        # A proforma renders the same layout under a "PROFORMA INVOICE" heading.
        pdf_bytes = render_invoice_pdf(invoice, doc_label=invoice.doc_label)
        resp = HttpResponse(pdf_bytes, content_type="application/pdf")
        resp["Content-Disposition"] = f'inline; filename="{invoice.number}.pdf"'
        return resp

    @action(detail=True, methods=["post"], url_path="promote-to-invoice")
    def promote_to_invoice(self, request, pk=None):
        """Promote a proforma into a real invoice: flip its kind and assign a
        fresh INV- number (the PI- number is retired). No-op payload for a
        document that is already a real invoice."""
        invoice = self.get_object()
        if invoice.kind != Invoice.Kind.PROFORMA:
            return Response(
                {"detail": "This is already a real invoice."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            invoice.kind = Invoice.Kind.INVOICE
            invoice.number = _generate_number("INV", Invoice)
            invoice.save(update_fields=["kind", "number", "updated_at"])
        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_200_OK)


class ReceiptViewSet(viewsets.ModelViewSet):
    queryset = Receipt.objects.select_related("invoice", "invoice__project", "invoice__project__customer").all()
    serializer_class = ReceiptSerializer
    permission_classes = [HasModuleAccess.for_module("receipts")]
    filterset_fields = ("invoice", "method")
    search_fields = ("number", "reference", "invoice__number", "invoice__project__customer__name")
    ordering_fields = ("received_at", "created_at", "amount")

    def perform_create(self, serializer):
        serializer.save(received_by=self.request.user if self.request.user.is_authenticated else None)

    @action(detail=True, methods=["get"], url_path="pdf")
    def pdf(self, request, pk=None):
        receipt = self.get_object()
        pdf_bytes = render_receipt_pdf(receipt)
        resp = HttpResponse(pdf_bytes, content_type="application/pdf")
        resp["Content-Disposition"] = f'inline; filename="{receipt.number}.pdf"'
        return resp
