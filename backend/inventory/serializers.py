from decimal import Decimal

from rest_framework import serializers

from .models import (
    Category,
    Item,
    Movement,
    PurchaseOrder,
    PurchaseOrderItem,
    Stock,
    StockLocation,
    Supplier,
)


class CategorySerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = (
            'id', 'name', 'slug', 'parent', 'parent_name',
            'sort_order', 'is_active', 'item_count',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'slug', 'parent_name', 'item_count', 'created_at', 'updated_at')

    def get_item_count(self, obj):
        return obj.items.count() if hasattr(obj, 'items') else 0


class StockLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockLocation
        fields = (
            'id', 'name', 'address', 'is_default', 'is_active',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class SupplierSerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()
    open_po_count = serializers.SerializerMethodField()

    class Meta:
        model = Supplier
        fields = (
            'id', 'name', 'contact_person', 'email', 'phone', 'address',
            'lead_time_days', 'payment_terms', 'notes', 'is_active',
            'item_count', 'open_po_count',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'item_count', 'open_po_count', 'created_at', 'updated_at')

    def get_item_count(self, obj):
        return obj.items.count() if hasattr(obj, 'items') else 0

    def get_open_po_count(self, obj):
        if not hasattr(obj, 'purchase_orders'):
            return 0
        return obj.purchase_orders.exclude(status__in=['received', 'cancelled']).count()


class StockSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_sku = serializers.CharField(source='item.sku', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)

    class Meta:
        model = Stock
        fields = (
            'id', 'item', 'item_name', 'item_sku', 'location', 'location_name',
            'quantity', 'updated_at',
        )
        read_only_fields = ('id', 'item_name', 'item_sku', 'location_name', 'updated_at')


class ItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    on_hand = serializers.SerializerMethodField()
    is_low_stock = serializers.SerializerMethodField()
    stocks = StockSerializer(many=True, read_only=True)

    class Meta:
        model = Item
        fields = (
            'id', 'sku', 'barcode', 'name',
            'category', 'category_name',
            'supplier', 'supplier_name',
            'unit', 'cost_price', 'sale_price', 'currency',
            'reorder_threshold', 'reorder_quantity',
            'description', 'image_url', 'is_active',
            'on_hand', 'is_low_stock',
            'stocks',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'sku', 'category_name', 'supplier_name',
            'on_hand', 'is_low_stock', 'stocks',
            'created_at', 'updated_at',
        )

    def get_on_hand(self, obj):
        return str(obj.on_hand)

    def get_is_low_stock(self, obj):
        return obj.is_low_stock


class MovementSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_sku = serializers.CharField(source='item.sku', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)
    performed_by_name = serializers.CharField(source='performed_by.display_name', read_only=True)

    class Meta:
        model = Movement
        fields = (
            'id', 'item', 'item_name', 'item_sku',
            'location', 'location_name',
            'quantity', 'reason', 'reference', 'notes',
            'performed_by', 'performed_by_name',
            'occurred_at', 'created_at',
        )
        read_only_fields = (
            'id', 'item_name', 'item_sku', 'location_name',
            'performed_by', 'performed_by_name', 'created_at',
        )


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_sku = serializers.CharField(source='item.sku', read_only=True)
    item_unit = serializers.CharField(source='item.unit', read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = (
            'id', 'po', 'item', 'item_name', 'item_sku', 'item_unit',
            'quantity', 'unit_cost', 'line_total', 'received_quantity', 'notes',
        )
        read_only_fields = (
            'id', 'po', 'item_name', 'item_sku', 'item_unit', 'line_total',
        )


class PurchaseOrderSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.display_name', read_only=True)
    items = PurchaseOrderItemSerializer(many=True, required=False)

    class Meta:
        model = PurchaseOrder
        fields = (
            'id', 'reference', 'supplier', 'supplier_name', 'status',
            'expected_date', 'notes', 'total', 'currency',
            'created_by', 'created_by_name',
            'items',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'reference', 'supplier_name', 'created_by',
            'created_by_name', 'total', 'created_at', 'updated_at',
        )

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        po = PurchaseOrder.objects.create(**validated_data)
        for item_data in items_data:
            # `po` is added by us; ignore any inbound `po` field on the line
            item_data.pop('po', None)
            PurchaseOrderItem.objects.create(po=po, **item_data)
        po.recompute_total()
        return po

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if items_data is not None:
            # Wipe + recreate is the simplest correctness-preserving update for
            # nested writes here. POs are short-lived and rarely have hundreds
            # of lines, so we don't pay much for the simplicity.
            instance.items.all().delete()
            for item_data in items_data:
                item_data.pop('po', None)
                PurchaseOrderItem.objects.create(po=instance, **item_data)
            instance.recompute_total()
        return instance
