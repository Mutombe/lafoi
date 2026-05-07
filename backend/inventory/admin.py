from django.contrib import admin

from .models import (
    Category,
    Item,
    Movement,
    Notification,
    NotificationRule,
    PurchaseOrder,
    PurchaseOrderItem,
    Stock,
    StockLocation,
    Supplier,
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'sort_order', 'is_active', 'updated_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(StockLocation)
class StockLocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'is_default', 'is_active', 'updated_at')
    list_filter = ('is_active', 'is_default')
    search_fields = ('name', 'address')


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'email', 'phone', 'lead_time_days', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'contact_person', 'email', 'phone')


class StockInline(admin.TabularInline):
    model = Stock
    extra = 0
    readonly_fields = ('updated_at',)


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ('sku', 'name', 'category', 'supplier', 'unit', 'cost_price', 'sale_price', 'is_active')
    list_filter = ('category', 'supplier', 'is_active', 'unit')
    search_fields = ('sku', 'barcode', 'name', 'description')
    readonly_fields = ('sku', 'created_at', 'updated_at')
    inlines = (StockInline,)


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ('item', 'location', 'quantity', 'updated_at')
    list_filter = ('location',)
    search_fields = ('item__sku', 'item__name')


@admin.register(Movement)
class MovementAdmin(admin.ModelAdmin):
    list_display = ('item', 'location', 'quantity', 'reason', 'reference', 'occurred_at', 'performed_by')
    list_filter = ('reason', 'location')
    search_fields = ('item__sku', 'item__name', 'reference', 'notes')
    readonly_fields = ('created_at',)


class POItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 0
    readonly_fields = ('line_total',)


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ('reference', 'supplier', 'status', 'expected_date', 'total', 'created_at')
    list_filter = ('status',)
    search_fields = ('reference', 'supplier__name', 'notes')
    readonly_fields = ('reference', 'total', 'pdf_url', 'created_at', 'updated_at')
    inlines = (POItemInline,)


@admin.register(NotificationRule)
class NotificationRuleAdmin(admin.ModelAdmin):
    list_display = ('name', 'event', 'channel', 'recipient_email', 'recipient_phone', 'is_active')
    list_filter = ('event', 'channel', 'is_active')
    search_fields = ('name', 'recipient_email', 'recipient_phone', 'notes')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('event', 'channel', 'recipient', 'item', 'status', 'sent_at', 'created_at')
    list_filter = ('event', 'channel', 'status')
    search_fields = ('recipient', 'subject', 'body', 'error', 'item__sku', 'item__name')
    readonly_fields = ('rule', 'item', 'event', 'channel', 'recipient', 'subject', 'body',
                       'status', 'error', 'sent_at', 'created_at')
