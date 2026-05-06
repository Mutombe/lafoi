from django.contrib import admin

from .models import Invoice, InvoiceItem, Quotation, QuotationItem, Receipt


class QuotationItemInline(admin.TabularInline):
    model = QuotationItem
    extra = 0


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 0


@admin.register(Quotation)
class QuotationAdmin(admin.ModelAdmin):
    list_display = ("number", "project", "status", "issue_date", "total", "currency")
    list_filter = ("status",)
    search_fields = ("number", "project__code", "project__title")
    readonly_fields = ("number", "subtotal", "tax_amount", "total", "created_at", "updated_at")
    inlines = (QuotationItemInline,)


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("number", "project", "status", "issue_date", "due_date", "total", "amount_paid", "balance_due")
    list_filter = ("status",)
    search_fields = ("number", "project__code", "project__title")
    readonly_fields = ("number", "subtotal", "tax_amount", "total", "amount_paid", "balance_due", "created_at", "updated_at")
    inlines = (InvoiceItemInline,)


@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ("number", "invoice", "amount", "method", "received_at")
    list_filter = ("method",)
    search_fields = ("number", "reference", "invoice__number")
    readonly_fields = ("number", "created_at")
