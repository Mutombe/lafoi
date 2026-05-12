from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from compliance.permissions import HasModuleAccess

from .models import Invoice, Quotation, Receipt
from .pdf import render_invoice_pdf, render_quotation_pdf, render_receipt_pdf
from .serializers import InvoiceSerializer, QuotationSerializer, ReceiptSerializer


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

    @action(detail=True, methods=["post"], url_path="convert-to-invoice")
    def convert_to_invoice(self, request, pk=None):
        """Create an Invoice from this Quotation, copying line items + meta."""
        from .models import Invoice, InvoiceItem
        from django.db import transaction

        quotation = self.get_object()
        with transaction.atomic():
            invoice = Invoice.objects.create(
                project=quotation.project,
                customer=quotation.customer,
                recipient_name=quotation.recipient_name,
                recipient_contact=quotation.recipient_contact,
                recipient_email=quotation.recipient_email,
                recipient_phone=quotation.recipient_phone,
                recipient_address=quotation.recipient_address,
                quotation=quotation,
                status=Invoice.Status.DRAFT,
                subject=quotation.subject,
                notes=quotation.notes,
                terms=quotation.terms,
                tax_rate=quotation.tax_rate,
                discount_amount=quotation.discount_amount,
                currency=quotation.currency,
                created_by=request.user if request.user.is_authenticated else None,
            )
            for it in quotation.items.all():
                InvoiceItem.objects.create(
                    invoice=invoice,
                    description=it.description,
                    quantity=it.quantity,
                    unit=it.unit,
                    unit_price=it.unit_price,
                    sort_order=it.sort_order,
                )
            invoice.recompute_totals()
            invoice.recompute_balance()
            invoice.save()
            quotation.status = Quotation.Status.CONVERTED
            quotation.save(update_fields=["status", "updated_at"])
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
    filterset_fields = ("status", "project", "quotation")
    search_fields = ("number", "subject", "project__code", "project__title", "project__customer__name")
    ordering_fields = ("issue_date", "due_date", "created_at", "total", "balance_due")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)

    @action(detail=True, methods=["get"], url_path="pdf")
    def pdf(self, request, pk=None):
        invoice = self.get_object()
        pdf_bytes = render_invoice_pdf(invoice)
        resp = HttpResponse(pdf_bytes, content_type="application/pdf")
        resp["Content-Disposition"] = f'inline; filename="{invoice.number}.pdf"'
        return resp


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
