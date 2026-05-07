"""Inventory viewsets — catalogue, suppliers, POs, stock movements + analytics.

Custom actions:
  GET   /api/items/lookup/?barcode=…           — resolve a scanned barcode to an Item
  GET   /api/items/?low_stock=true             — filter to items at/under threshold
  GET   /api/items/export_csv/                 — full catalogue CSV
  POST  /api/items/import_csv/  (multipart)    — upsert by SKU; returns counts
  GET   /api/movements/burn-rate/?days=30      — top movers / slowest / dead stock
  POST  /api/purchase-orders/<id>/receive/     — receive PO lines into a Location
"""
import csv
import io
from datetime import timedelta
from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.db.models import F, Max, Q, Sum
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

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
from .serializers import (
    CategorySerializer,
    ItemSerializer,
    MovementSerializer,
    PurchaseOrderSerializer,
    StockLocationSerializer,
    StockSerializer,
    SupplierSerializer,
)


def _to_decimal(raw, field_name=None) -> Decimal:
    if raw in (None, ''):
        return Decimal('0')
    try:
        return Decimal(str(raw))
    except (InvalidOperation, ValueError):
        if field_name:
            raise ValidationError({field_name: f"Not a number: {raw!r}"})
        raise ValidationError({"detail": f"Not a number: {raw!r}"})


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.select_related('parent').all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ('is_active', 'parent')
    search_fields = ('name', 'slug')
    ordering_fields = ('sort_order', 'name', 'created_at')


class StockLocationViewSet(viewsets.ModelViewSet):
    queryset = StockLocation.objects.all()
    serializer_class = StockLocationSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ('is_active', 'is_default')
    search_fields = ('name', 'address')
    ordering_fields = ('name', 'created_at')


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ('is_active',)
    search_fields = ('name', 'contact_person', 'email', 'phone', 'notes')
    ordering_fields = ('name', 'lead_time_days', 'created_at')


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.select_related('category', 'supplier').prefetch_related('stocks', 'stocks__location').all()
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    filterset_fields = ('category', 'supplier', 'is_active', 'unit', 'currency')
    search_fields = ('sku', 'barcode', 'name', 'description')
    ordering_fields = ('name', 'sku', 'cost_price', 'sale_price', 'created_at')

    def get_queryset(self):
        qs = super().get_queryset()
        low_stock = self.request.query_params.get('low_stock')
        if low_stock and str(low_stock).lower() in ('1', 'true', 'yes'):
            # Compute on_hand at the SQL level so this filter scales beyond a
            # few thousand items. Items with no stock rows resolve to 0.
            qs = qs.annotate(_on_hand=Sum('stocks__quantity'))
            # NOTE: Coalesce — items with no stock rows have _on_hand = NULL.
            #       NULL is treated as 0 for the threshold check.
            qs = qs.filter(reorder_threshold__gt=0).filter(
                Q(_on_hand__lte=F('reorder_threshold')) | Q(_on_hand__isnull=True)
            ).order_by('name')
        return qs

    @action(detail=False, methods=['get'], url_path='lookup')
    def lookup(self, request):
        """Resolve a scanned barcode (or SKU) to an Item.

        Query params: `barcode=` or `sku=`. Returns 404 if not found.
        """
        barcode = (request.query_params.get('barcode') or '').strip()
        sku = (request.query_params.get('sku') or '').strip()
        if not barcode and not sku:
            raise ValidationError({"detail": "Pass `barcode` or `sku`."})
        item = None
        if barcode:
            item = Item.objects.filter(barcode=barcode).first()
            if not item:
                # Some scanners emit the SKU as the QR payload — fall back to it.
                item = Item.objects.filter(sku=barcode).first()
        if not item and sku:
            item = Item.objects.filter(sku=sku).first()
        if not item:
            return Response({"detail": "No item matches that code."}, status=status.HTTP_404_NOT_FOUND)
        return Response(ItemSerializer(item).data)

    @action(detail=False, methods=['get'], url_path='export_csv')
    def export_csv(self, request):
        """Stream the full catalogue as CSV."""
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow([
            'sku', 'name', 'barcode', 'category', 'supplier', 'unit',
            'cost_price', 'sale_price', 'currency',
            'on_hand', 'reorder_threshold', 'reorder_quantity', 'is_active',
        ])
        for item in self.get_queryset():
            writer.writerow([
                item.sku,
                item.name,
                item.barcode or '',
                item.category.name if item.category_id else '',
                item.supplier.name if item.supplier_id else '',
                item.unit,
                f"{item.cost_price}",
                f"{item.sale_price}",
                item.currency,
                f"{item.on_hand}",
                f"{item.reorder_threshold}",
                f"{item.reorder_quantity}",
                'true' if item.is_active else 'false',
            ])
        resp = HttpResponse(buf.getvalue(), content_type='text/csv')
        resp['Content-Disposition'] = 'attachment; filename="inventory.csv"'
        return resp

    @action(detail=False, methods=['post'], url_path='import_csv', parser_classes=[MultiPartParser, FormParser])
    def import_csv(self, request):
        """Upsert items by SKU from a CSV upload.

        Recognised columns (header-driven, all optional except SKU + name):
          sku, name, barcode, category, supplier, unit,
          cost_price, sale_price, currency,
          reorder_threshold, reorder_quantity, is_active

        Returns: {created: N, updated: N, errors: [{row, error}]}.
        """
        upload = request.FILES.get('file') or request.FILES.get('csv')
        if not upload:
            raise ValidationError({"file": "Upload a CSV under field name `file`."})
        try:
            text = upload.read().decode('utf-8-sig')
        except UnicodeDecodeError:
            raise ValidationError({"file": "File must be UTF-8 encoded."})

        reader = csv.DictReader(io.StringIO(text))
        created = 0
        updated = 0
        errors = []

        # Build name → instance lookups once so we don't query per row.
        cat_by_name = {c.name.lower(): c for c in Category.objects.all()}
        sup_by_name = {s.name.lower(): s for s in Supplier.objects.all()}

        for idx, raw_row in enumerate(reader, start=2):  # row 1 = header
            row = {(k or '').strip().lower(): (v or '').strip() for k, v in raw_row.items() if k}
            sku = row.get('sku') or ''
            name = row.get('name') or ''
            if not name:
                errors.append({"row": idx, "error": "Missing `name` column."})
                continue

            cat = cat_by_name.get(row.get('category', '').lower()) if row.get('category') else None
            sup = sup_by_name.get(row.get('supplier', '').lower()) if row.get('supplier') else None
            try:
                payload = {
                    'name': name,
                    'barcode': row.get('barcode', '') or '',
                    'unit': row.get('unit') or 'piece',
                    'currency': row.get('currency') or 'USD',
                    'cost_price': _to_decimal(row.get('cost_price'), 'cost_price'),
                    'sale_price': _to_decimal(row.get('sale_price'), 'sale_price'),
                    'reorder_threshold': _to_decimal(row.get('reorder_threshold'), 'reorder_threshold'),
                    'reorder_quantity': _to_decimal(row.get('reorder_quantity'), 'reorder_quantity'),
                    'category': cat,
                    'supplier': sup,
                    'is_active': row.get('is_active', 'true').lower() not in ('false', '0', 'no'),
                }
                if sku:
                    item, was_created = Item.objects.update_or_create(sku=sku, defaults=payload)
                    if was_created:
                        created += 1
                    else:
                        updated += 1
                else:
                    Item.objects.create(**payload)
                    created += 1
            except ValidationError:
                raise
            except Exception as exc:  # pragma: no cover — defence in depth
                errors.append({"row": idx, "error": str(exc)})

        return Response({"created": created, "updated": updated, "errors": errors})


class StockViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Stock.objects.select_related('item', 'location').all()
    serializer_class = StockSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ('item', 'location')
    ordering_fields = ('quantity', 'updated_at')


class MovementViewSet(viewsets.ModelViewSet):
    queryset = Movement.objects.select_related('item', 'location', 'performed_by').all()
    serializer_class = MovementSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = {
        'item': ['exact'],
        'location': ['exact'],
        'reason': ['exact'],
        'occurred_at': ['gte', 'lte'],
    }
    search_fields = (
        'item__name', 'item__sku', 'reference', 'notes',
        'location__name',
    )
    ordering_fields = ('occurred_at', 'created_at', 'quantity')

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(performed_by=user)

    @action(detail=False, methods=['get'], url_path='burn-rate')
    def burn_rate(self, request):
        """Return top movers, slowest movers, and dead stock for an item set.

        Query params:
          days       — window for top/slowest, default 30
          dead_days  — dead-stock window, default 90
          limit      — max items per list, default 10
        """
        try:
            days = max(1, int(request.query_params.get('days') or 30))
            dead_days = max(1, int(request.query_params.get('dead_days') or 90))
            limit = max(1, min(50, int(request.query_params.get('limit') or 10)))
        except (TypeError, ValueError):
            raise ValidationError({"detail": "days/dead_days/limit must be integers."})

        now = timezone.now()
        window_start = now - timedelta(days=days)
        dead_start = now - timedelta(days=dead_days)

        # Sum the absolute "out" volume per item in the window. We treat any
        # negative quantity as outgoing (issue/sale/transfer-out/negative
        # adjust) — that's "burn".
        out_qs = (
            Movement.objects
            .filter(occurred_at__gte=window_start, quantity__lt=0)
            .values('item', 'item__sku', 'item__name')
            .annotate(total_out=Sum('quantity'))
            .order_by('total_out')  # most-negative first → biggest burn
        )

        top_movers = []
        for row in out_qs[:limit]:
            top_movers.append({
                'item': row['item'],
                'sku': row['item__sku'],
                'name': row['item__name'],
                'total_out': str(abs(row['total_out'] or Decimal('0'))),
            })

        # Slowest = items with the smallest non-zero burn in the window. We
        # include only items that actually moved at all in the window so that
        # zero-movers are surfaced as "dead stock" instead.
        slowest_qs = list(out_qs.order_by('-total_out')[:limit])  # least-negative
        slowest = [
            {
                'item': r['item'],
                'sku': r['item__sku'],
                'name': r['item__name'],
                'total_out': str(abs(r['total_out'] or Decimal('0'))),
            }
            for r in slowest_qs
        ]

        # Dead stock = active items with no movement in the last `dead_days`.
        latest_movement = (
            Movement.objects.values('item').annotate(latest=Max('occurred_at'))
        )
        latest_map = {r['item']: r['latest'] for r in latest_movement}
        dead = []
        for item in Item.objects.filter(is_active=True).order_by('name'):
            last = latest_map.get(item.id)
            if last is None or last < dead_start:
                dead.append({
                    'item': item.id,
                    'sku': item.sku,
                    'name': item.name,
                    'last_movement_at': last.isoformat() if last else None,
                    'on_hand': str(item.on_hand),
                })
            if len(dead) >= limit:
                break

        return Response({
            'window_days': days,
            'dead_window_days': dead_days,
            'top_movers': top_movers,
            'slowest': slowest,
            'dead_stock': dead,
        })


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.select_related('supplier', 'created_by').prefetch_related('items', 'items__item').all()
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ('status', 'supplier')
    search_fields = ('reference', 'supplier__name', 'notes')
    ordering_fields = ('created_at', 'expected_date', 'total')

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(created_by=user)

    @action(detail=True, methods=['post'], url_path='receive')
    def receive(self, request, pk=None):
        """Receive PO lines into a location.

        Body: `{"location": <id>, "items": [{"po_item_id": N, "received_quantity": "12.5"}]}`.

        Each line increments `received_quantity` and creates a Movement
        (reason=receive, +qty). When all lines are fully received, the PO
        flips to `received`. Otherwise it sits at `partial`.
        """
        po = self.get_object()
        location_id = request.data.get('location')
        if not location_id:
            raise ValidationError({"location": "Required — pick the receiving location."})
        try:
            location = StockLocation.objects.get(pk=location_id)
        except StockLocation.DoesNotExist:
            raise ValidationError({"location": "Location not found."})

        line_payloads = request.data.get('items') or []
        if not isinstance(line_payloads, list) or not line_payloads:
            raise ValidationError({"items": "Pass at least one {po_item_id, received_quantity} entry."})

        user = request.user if request.user.is_authenticated else None
        with transaction.atomic():
            for entry in line_payloads:
                if not isinstance(entry, dict):
                    raise ValidationError({"items": "Each entry must be an object."})
                line_id = entry.get('po_item_id') or entry.get('id')
                qty_raw = entry.get('received_quantity')
                qty = _to_decimal(qty_raw, 'received_quantity')
                if qty <= 0:
                    continue  # nothing to record for this line
                try:
                    line = po.items.get(pk=line_id)
                except PurchaseOrderItem.DoesNotExist:
                    raise ValidationError({"items": f"Line {line_id} not on PO {po.reference}."})

                line.received_quantity = (line.received_quantity or Decimal('0')) + qty
                line.save(update_fields=['received_quantity', 'line_total'])

                Movement.objects.create(
                    item=line.item,
                    location=location,
                    quantity=qty,  # +qty into stock
                    reason='receive',
                    reference=po.reference,
                    notes=f"Received against PO {po.reference}",
                    performed_by=user,
                )

            # Recompute status based on whether all lines are fully received.
            # Using a fresh queryset (NOT po.items.all()) because prefetch_related
            # on the parent caches the original line state at object-fetch time.
            fresh_lines = list(PurchaseOrderItem.objects.filter(po=po))
            all_full = all(
                (line.received_quantity or Decimal('0')) >= (line.quantity or Decimal('0'))
                for line in fresh_lines
            )
            any_received = any(
                (line.received_quantity or Decimal('0')) > Decimal('0')
                for line in fresh_lines
            )
            if all_full:
                po.status = 'received'
            elif any_received:
                po.status = 'partial'
            po.save(update_fields=['status', 'updated_at'])

        return Response(PurchaseOrderSerializer(po).data)
