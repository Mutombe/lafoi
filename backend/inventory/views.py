"""Inventory viewsets — catalogue, suppliers, POs, stock movements + analytics.

Custom actions:
  GET   /api/items/lookup/?barcode=…              — resolve a scanned barcode to an Item
  GET   /api/items/?low_stock=true                — filter to items at/under threshold
  GET   /api/items/export_csv/                    — full catalogue CSV
  POST  /api/items/import_csv/  (multipart)       — upsert by SKU; returns counts
  POST  /api/items/<id>/quick_reorder/            — one-click PO + optional supplier email
  GET   /api/movements/burn-rate/?days=30         — top movers / slowest / dead stock
  POST  /api/purchase-orders/<id>/receive/        — receive PO lines into a Location
  POST  /api/notification-rules/<id>/test/        — send a test message via the rule
"""
import csv
import io
import logging
from datetime import timedelta
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import F, Max, Q, Sum
from django.http import HttpResponse
from django.utils import timezone
from decouple import config
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from compliance.permissions import HasModuleAccess

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
from .notifications import send_test_alert
from .po_pdf import store_purchase_order_pdf
from .serializers import (
    CategorySerializer,
    ItemSerializer,
    MovementSerializer,
    NotificationRuleSerializer,
    NotificationSerializer,
    PurchaseOrderSerializer,
    StockLocationSerializer,
    StockSerializer,
    SupplierSerializer,
)

logger = logging.getLogger(__name__)


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
    permission_classes = [HasModuleAccess.for_module("inventory")]
    filterset_fields = ('is_active', 'parent')
    search_fields = ('name', 'slug')
    ordering_fields = ('sort_order', 'name', 'created_at')


class StockLocationViewSet(viewsets.ModelViewSet):
    queryset = StockLocation.objects.all()
    serializer_class = StockLocationSerializer
    permission_classes = [HasModuleAccess.for_module("inventory")]
    filterset_fields = ('is_active', 'is_default')
    search_fields = ('name', 'address')
    ordering_fields = ('name', 'created_at')


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [HasModuleAccess.for_module("inventory")]
    filterset_fields = ('is_active',)
    search_fields = ('name', 'contact_person', 'email', 'phone', 'notes')
    ordering_fields = ('name', 'lead_time_days', 'created_at')


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.select_related('category', 'supplier').prefetch_related('stocks', 'stocks__location').all()
    serializer_class = ItemSerializer
    permission_classes = [HasModuleAccess.for_module("inventory")]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    filterset_fields = ('category', 'supplier', 'is_active', 'unit', 'currency')
    search_fields = ('sku', 'barcode', 'name', 'description')
    ordering_fields = ('name', 'sku', 'cost_price', 'sale_price', 'created_at')

    def get_queryset(self):
        qs = super().get_queryset()
        # Compute on_hand + the In/Out aggregates the serializer surfaces, all
        # at the SQL layer with conditional aggregates. One query covers the
        # whole list — without this, the serializer's per-row aggregate calls
        # ran 4 round-trips per item which made a 50-row page take 12-20s on
        # the remote Neon DB.
        qs = qs.annotate(
            ann_on_hand=Sum('stocks__quantity', distinct=False),
            ann_total_in=Sum('movements__quantity', filter=Q(movements__quantity__gt=0)),
            ann_total_out_signed=Sum('movements__quantity', filter=Q(movements__quantity__lt=0)),
            ann_last_in=Max('movements__occurred_at', filter=Q(movements__quantity__gt=0)),
            ann_last_out=Max('movements__occurred_at', filter=Q(movements__quantity__lt=0)),
        )
        low_stock = self.request.query_params.get('low_stock')
        if low_stock and str(low_stock).lower() in ('1', 'true', 'yes'):
            qs = qs.filter(reorder_threshold__gt=0).filter(
                Q(ann_on_hand__lte=F('reorder_threshold')) | Q(ann_on_hand__isnull=True)
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

    @action(detail=True, methods=['post'], url_path='quick_reorder')
    def quick_reorder(self, request, pk=None):
        """One-click reorder — drafts a PO, optionally PDFs + emails the supplier.

        Body (all optional):
          {
            "quantity":  Decimal,        # default: item.reorder_quantity or threshold * 2
            "supplier":  <id>,           # default: item.supplier
            "location":  <id>,           # default: first default StockLocation
            "send_email": bool,          # default false; if True + supplier email,
                                          #   render a PDF + email the supplier and
                                          #   mark the PO status as 'sent'
            "currency":  'USD'           # default: item.currency
          }

        Returns the new PurchaseOrder, including pdf_url if rendered.
        """
        item = self.get_object()

        # Resolve quantity
        qty_raw = request.data.get('quantity')
        if qty_raw not in (None, ''):
            quantity = _to_decimal(qty_raw, 'quantity')
        else:
            if item.reorder_quantity and item.reorder_quantity > 0:
                quantity = item.reorder_quantity
            else:
                quantity = (item.reorder_threshold or Decimal('0')) * Decimal('2')
            if quantity <= 0:
                quantity = Decimal('1')

        # Resolve supplier
        supplier_id = request.data.get('supplier') or item.supplier_id
        if not supplier_id:
            raise ValidationError({"supplier": "No supplier on the item — pass `supplier` explicitly."})
        try:
            supplier = Supplier.objects.get(pk=supplier_id)
        except Supplier.DoesNotExist:
            raise ValidationError({"supplier": "Supplier not found."})

        currency = request.data.get('currency') or item.currency or 'USD'
        send_email_flag = bool(request.data.get('send_email'))

        # Create the PO + line atomically. status starts as 'draft', flips to
        # 'sent' below if we successfully email the supplier.
        with transaction.atomic():
            po = PurchaseOrder.objects.create(
                supplier=supplier,
                status='draft',
                currency=currency,
                notes=f"Quick reorder for {item.sku} — {item.name}",
                created_by=request.user if request.user.is_authenticated else None,
            )
            PurchaseOrderItem.objects.create(
                po=po,
                item=item,
                quantity=quantity,
                unit_cost=item.cost_price or Decimal('0'),
            )
            po.refresh_from_db()  # pick up the recompute_total side effect

        # Optional: render PDF + email it
        pdf_url = ''
        email_sent = False
        email_error = ''
        if send_email_flag:
            try:
                pdf_url = store_purchase_order_pdf(po)
                po.pdf_url = pdf_url
                po.save(update_fields=['pdf_url', 'updated_at'])
            except Exception as exc:  # pragma: no cover — storage failure path
                logger.exception("PO PDF render/store failed")
                email_error = f"PDF render failed: {exc}"

            if pdf_url and supplier.email:
                co_name = getattr(settings, "COMPANY", {}).get("name", "La Foi Designs")
                subject = f"[{co_name}] Purchase Order {po.reference}"
                body = (
                    f"Hello {supplier.contact_person or supplier.name},\n\n"
                    f"Please find our purchase order {po.reference} attached as a PDF:\n"
                    f"  {pdf_url}\n\n"
                    f"  Item:     {item.sku} — {item.name}\n"
                    f"  Quantity: {quantity} {item.unit}\n"
                    f"  Total:    {currency} {po.total:.2f}\n\n"
                    f"Kindly confirm receipt and the expected dispatch date.\n\n"
                    f"Thank you,\n{co_name}"
                )
                from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "") or config(
                    "DEFAULT_FROM_EMAIL", default="noreply@lafoidesigns.com"
                )
                try:
                    sent_count = send_mail(
                        subject=subject,
                        message=body,
                        from_email=from_email,
                        recipient_list=[supplier.email],
                        fail_silently=False,
                    )
                    if sent_count > 0:
                        email_sent = True
                        po.status = 'sent'
                        po.save(update_fields=['status', 'updated_at'])
                except Exception as exc:  # pragma: no cover — SMTP failure
                    logger.exception("Supplier email failed")
                    email_error = f"Email failed: {exc}"
            elif send_email_flag and not supplier.email:
                email_error = "Supplier has no email on file."

        po.refresh_from_db()
        data = PurchaseOrderSerializer(po).data
        data['email_sent'] = email_sent
        data['email_error'] = email_error
        return Response(data, status=status.HTTP_201_CREATED)

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
    permission_classes = [HasModuleAccess.for_module("inventory")]
    filterset_fields = ('item', 'location')
    ordering_fields = ('quantity', 'updated_at')


class MovementViewSet(viewsets.ModelViewSet):
    queryset = Movement.objects.select_related('item', 'location', 'performed_by').all()
    serializer_class = MovementSerializer
    permission_classes = [HasModuleAccess.for_module("inventory")]
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

    def create(self, request, *args, **kwargs):
        """Idempotent create: if `client_uuid` matches an existing Movement,
        return that row instead of double-posting.

        This is the offline-sync contract — the IndexedDB queue can replay
        the same payload after a flaky network and we won't end up with
        duplicate stock movements.
        """
        client_uuid = request.data.get('client_uuid')
        if client_uuid:
            existing = Movement.objects.filter(client_uuid=client_uuid).first()
            if existing is not None:
                return Response(MovementSerializer(existing).data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)

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
    permission_classes = [HasModuleAccess.for_module("inventory")]
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


class NotificationRuleViewSet(viewsets.ModelViewSet):
    """Distribution-list management — who gets pinged when stock runs low."""

    queryset = NotificationRule.objects.all()
    serializer_class = NotificationRuleSerializer
    permission_classes = [HasModuleAccess.for_module("inventory")]
    filterset_fields = ('event', 'channel', 'is_active')
    search_fields = ('name', 'recipient_email', 'recipient_phone', 'notes')
    ordering_fields = ('event', 'channel', 'name', 'created_at')

    @action(detail=True, methods=['post'], url_path='test')
    def test(self, request, pk=None):
        """Fire a one-off test message to the rule's recipient.

        Returns the created Notification row so the dashboard can surface
        the success/failure status inline.
        """
        rule = self.get_object()
        notification = send_test_alert(rule)
        return Response(NotificationSerializer(notification).data)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only history of every send attempt. Filters: event, channel, status, item."""

    queryset = Notification.objects.select_related('rule', 'item').all()
    serializer_class = NotificationSerializer
    permission_classes = [HasModuleAccess.for_module("inventory")]
    filterset_fields = ('event', 'channel', 'status', 'item', 'rule')
    search_fields = ('recipient', 'subject', 'body', 'error', 'item__sku', 'item__name')
    ordering_fields = ('created_at', 'sent_at', 'status')
