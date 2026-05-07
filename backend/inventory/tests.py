"""Inventory tests.

Covers:
- Item.on_hand sums Stock rows across locations
- Movement.save() updates Stock atomically
- Item.is_low_stock matches reorder_threshold semantics
- CSV import upserts by SKU correctly
- /api/movements/burn-rate/ returns the expected payload shape
- /api/items/lookup/ resolves a barcode
- /api/purchase-orders/<id>/receive/ creates Movements + advances status
- Phase 2: low-stock alert dedupe + dispatch
- Phase 2: quick reorder action drafts a PO + line
- Phase 2: client_uuid makes Movement creates idempotent
- Phase 2: notification-rules/<id>/test fires a Notification record
"""
import uuid
from datetime import timedelta
from decimal import Decimal
from io import BytesIO
from unittest import mock

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from .models import (
    Category,
    Item,
    Movement,
    Notification,
    NotificationRule,
    NotificationStatus,
    PurchaseOrder,
    PurchaseOrderItem,
    Stock,
    StockLocation,
    Supplier,
)
from .notifications import send_low_stock_alert


User = get_user_model()


class StockMovementTests(TestCase):
    """Direct model-level invariants for on-hand + movements."""

    @classmethod
    def setUpTestData(cls):
        cls.cat = Category.objects.create(name='Sheets', sort_order=1)
        cls.sup = Supplier.objects.create(name='Beam Co', email='hi@beam.example')
        cls.warehouse = StockLocation.objects.create(name='Main Warehouse', is_default=True)
        cls.van = StockLocation.objects.create(name='Van 1')
        cls.item = Item.objects.create(
            name='PVC sheet 3m', category=cls.cat, supplier=cls.sup,
            unit='m2', cost_price=Decimal('12.50'), sale_price=Decimal('25.00'),
            reorder_threshold=Decimal('10'), reorder_quantity=Decimal('50'),
        )

    def test_sku_auto_assigned(self):
        self.assertTrue(self.item.sku.startswith('ITM-'))

    def test_on_hand_sums_across_locations(self):
        Movement.objects.create(item=self.item, location=self.warehouse, quantity=Decimal('30'), reason='receive')
        Movement.objects.create(item=self.item, location=self.van, quantity=Decimal('5'), reason='receive')
        # Total = 35
        self.assertEqual(self.item.on_hand, Decimal('35'))

    def test_movement_save_updates_stock(self):
        Movement.objects.create(item=self.item, location=self.warehouse, quantity=Decimal('20'), reason='receive')
        stock = Stock.objects.get(item=self.item, location=self.warehouse)
        self.assertEqual(stock.quantity, Decimal('20'))
        # Issue 7 — the stock row should drop to 13
        Movement.objects.create(item=self.item, location=self.warehouse, quantity=Decimal('-7'), reason='issue')
        stock.refresh_from_db()
        self.assertEqual(stock.quantity, Decimal('13'))

    def test_is_low_stock_threshold_logic(self):
        # No stock yet → on_hand = 0, threshold = 10 → low
        self.assertTrue(self.item.is_low_stock)
        # Receive 30 → on_hand = 30, threshold = 10 → not low
        Movement.objects.create(item=self.item, location=self.warehouse, quantity=Decimal('30'), reason='receive')
        self.assertFalse(self.item.is_low_stock)
        # Threshold 0 short-circuits — never low.
        self.item.reorder_threshold = Decimal('0')
        self.item.save()
        self.assertFalse(self.item.is_low_stock)


class ItemAPITests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username='ops_admin', password='pw12345', role='admin', is_staff=True,
        )
        cls.cat = Category.objects.create(name='Trims')
        cls.sup = Supplier.objects.create(name='Profile Werks')
        cls.warehouse = StockLocation.objects.create(name='Main', is_default=True)
        cls.item = Item.objects.create(
            name='Aluminium trim 3m', category=cls.cat, supplier=cls.sup,
            barcode='1234567890123',
            unit='piece', cost_price=Decimal('5'), sale_price=Decimal('10'),
            reorder_threshold=Decimal('20'),
        )

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_lookup_by_barcode(self):
        resp = self.client.get('/api/items/lookup/?barcode=1234567890123')
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(resp.json()['id'], self.item.id)

    def test_lookup_404(self):
        resp = self.client.get('/api/items/lookup/?barcode=NOPE')
        self.assertEqual(resp.status_code, 404)

    def test_low_stock_filter(self):
        # No stock yet → item should appear in low-stock filter
        resp = self.client.get('/api/items/?low_stock=true')
        self.assertEqual(resp.status_code, 200)
        ids = [r['id'] for r in resp.json()['results']]
        self.assertIn(self.item.id, ids)

    def test_csv_import_upserts_by_sku(self):
        csv_text = (
            'sku,name,unit,cost_price,sale_price,reorder_threshold,reorder_quantity\n'
            f'{self.item.sku},Aluminium trim 3m UPDATED,piece,7.50,15.00,30,100\n'
            'NEW-001,Brand new widget,piece,1,2,5,20\n'
        )
        upload = BytesIO(csv_text.encode('utf-8'))
        upload.name = 'inv.csv'
        resp = self.client.post('/api/items/import_csv/', {'file': upload}, format='multipart')
        self.assertEqual(resp.status_code, 200, resp.content)
        body = resp.json()
        self.assertEqual(body['created'], 1)
        self.assertEqual(body['updated'], 1)
        self.assertEqual(body['errors'], [])

        self.item.refresh_from_db()
        self.assertEqual(self.item.name, 'Aluminium trim 3m UPDATED')
        self.assertEqual(self.item.cost_price, Decimal('7.50'))
        self.assertTrue(Item.objects.filter(sku='NEW-001').exists())

    def test_export_csv_streams_catalogue(self):
        resp = self.client.get('/api/items/export_csv/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp['Content-Type'], 'text/csv')
        body = resp.content.decode('utf-8')
        self.assertIn(self.item.sku, body)
        self.assertIn('on_hand', body)


class BurnRateTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username='ops', password='pw', role='admin', is_staff=True,
        )
        cls.loc = StockLocation.objects.create(name='Main', is_default=True)
        cls.hot = Item.objects.create(name='Hot mover', unit='piece')
        cls.cold = Item.objects.create(name='Cold mover', unit='piece')
        cls.dead = Item.objects.create(name='Dead stock', unit='piece')

        now = timezone.now()
        # Hot: 3 issues this week, total -45
        for delta_days, qty in ((1, -20), (3, -15), (5, -10)):
            Movement.objects.create(
                item=cls.hot, location=cls.loc,
                quantity=Decimal(qty), reason='issue',
                occurred_at=now - timedelta(days=delta_days),
            )
        # Cold: one tiny issue this week
        Movement.objects.create(
            item=cls.cold, location=cls.loc,
            quantity=Decimal('-1'), reason='issue',
            occurred_at=now - timedelta(days=2),
        )
        # Dead: a movement long ago (outside the dead-stock window)
        Movement.objects.create(
            item=cls.dead, location=cls.loc,
            quantity=Decimal('-3'), reason='issue',
            occurred_at=now - timedelta(days=200),
        )

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_burn_rate_shape_and_top_movers(self):
        resp = self.client.get('/api/movements/burn-rate/?days=30&dead_days=90')
        self.assertEqual(resp.status_code, 200, resp.content)
        body = resp.json()
        # Required keys present
        for key in ('top_movers', 'slowest', 'dead_stock', 'window_days', 'dead_window_days'):
            self.assertIn(key, body)
        # Hot mover should be at the top
        names = [r['name'] for r in body['top_movers']]
        self.assertIn('Hot mover', names)
        self.assertEqual(body['top_movers'][0]['name'], 'Hot mover')
        # Dead stock list includes the long-quiet item
        dead_names = [r['name'] for r in body['dead_stock']]
        self.assertIn('Dead stock', dead_names)


class PurchaseOrderReceiveTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username='ops_po', password='pw', role='admin', is_staff=True,
        )
        cls.sup = Supplier.objects.create(name='Profile Werks')
        cls.loc = StockLocation.objects.create(name='Main', is_default=True)
        cls.item_a = Item.objects.create(name='Trim 3m', unit='piece', cost_price=Decimal('5'))
        cls.item_b = Item.objects.create(name='Connector', unit='piece', cost_price=Decimal('1'))
        cls.po = PurchaseOrder.objects.create(supplier=cls.sup, status='sent')
        cls.line_a = PurchaseOrderItem.objects.create(po=cls.po, item=cls.item_a, quantity=Decimal('10'), unit_cost=Decimal('5'))
        cls.line_b = PurchaseOrderItem.objects.create(po=cls.po, item=cls.item_b, quantity=Decimal('20'), unit_cost=Decimal('1'))

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_partial_receive_advances_status_to_partial(self):
        resp = self.client.post(
            f'/api/purchase-orders/{self.po.pk}/receive/',
            {
                'location': self.loc.id,
                'items': [
                    {'po_item_id': self.line_a.id, 'received_quantity': '4'},
                ],
            },
            format='json',
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.po.refresh_from_db()
        self.assertEqual(self.po.status, 'partial')
        # Stock & movement land
        stock = Stock.objects.get(item=self.item_a, location=self.loc)
        self.assertEqual(stock.quantity, Decimal('4'))
        self.assertEqual(Movement.objects.filter(item=self.item_a, reason='receive').count(), 1)

    def test_full_receive_marks_received(self):
        resp = self.client.post(
            f'/api/purchase-orders/{self.po.pk}/receive/',
            {
                'location': self.loc.id,
                'items': [
                    {'po_item_id': self.line_a.id, 'received_quantity': '10'},
                    {'po_item_id': self.line_b.id, 'received_quantity': '20'},
                ],
            },
            format='json',
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.po.refresh_from_db()
        self.assertEqual(self.po.status, 'received')


class PurchaseOrderTotalsTests(TestCase):
    """Adding/removing line items keeps PurchaseOrder.total in sync."""

    def test_total_recomputes_on_line_change(self):
        sup = Supplier.objects.create(name='X')
        po = PurchaseOrder.objects.create(supplier=sup)
        PurchaseOrderItem.objects.create(po=po, item=Item.objects.create(name='A', unit='piece'),
                                          quantity=Decimal('2'), unit_cost=Decimal('10'))
        PurchaseOrderItem.objects.create(po=po, item=Item.objects.create(name='B', unit='piece'),
                                          quantity=Decimal('3'), unit_cost=Decimal('5'))
        po.refresh_from_db()
        self.assertEqual(po.total, Decimal('35'))


# ---------------------------------------------------------------------------
# Phase 2 tests
# ---------------------------------------------------------------------------


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class LowStockAlertTests(TestCase):
    """Dedupe + dispatch logic for low-stock alerts."""

    @classmethod
    def setUpTestData(cls):
        cls.loc = StockLocation.objects.create(name='Main', is_default=True)
        cls.item = Item.objects.create(
            name='Trim 3m', unit='piece',
            reorder_threshold=Decimal('10'), reorder_quantity=Decimal('20'),
        )
        cls.email_rule = NotificationRule.objects.create(
            name='Ops mailbox', event='low_stock', channel='email',
            recipient_email='ops@example.com', is_active=True,
        )

    def test_alert_creates_notification_and_stamps_timestamp(self):
        notifs = send_low_stock_alert(self.item)
        self.assertEqual(len(notifs), 1)
        self.assertEqual(notifs[0].status, NotificationStatus.SENT)
        self.item.refresh_from_db()
        self.assertIsNotNone(self.item.last_low_stock_alert_at)

    def test_dedupe_within_24h(self):
        # First call sends one
        send_low_stock_alert(self.item)
        # Second call within window — returns []
        out = send_low_stock_alert(self.item)
        self.assertEqual(out, [])

    def test_force_overrides_dedupe(self):
        send_low_stock_alert(self.item)
        out = send_low_stock_alert(self.item, force=True)
        self.assertEqual(len(out), 1)

    def test_inactive_rule_skipped(self):
        self.email_rule.is_active = False
        self.email_rule.save()
        out = send_low_stock_alert(self.item)
        self.assertEqual(out, [])


class QuickReorderTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create_user(
            username='ops_qr', password='pw', role='admin', is_staff=True,
        )
        cls.loc = StockLocation.objects.create(name='Main', is_default=True)
        cls.sup = Supplier.objects.create(name='Profile Werks', email='supplier@example.com')
        cls.item = Item.objects.create(
            name='Trim 3m', supplier=cls.sup, unit='piece',
            cost_price=Decimal('5'), reorder_threshold=Decimal('10'),
            reorder_quantity=Decimal('25'),
        )

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_quick_reorder_uses_defaults(self):
        resp = self.client.post(
            f'/api/items/{self.item.id}/quick_reorder/', {}, format='json',
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        body = resp.json()
        self.assertEqual(body['supplier'], self.sup.id)
        self.assertEqual(len(body['items']), 1)
        self.assertEqual(Decimal(body['items'][0]['quantity']), Decimal('25'))

    def test_quick_reorder_explicit_quantity(self):
        resp = self.client.post(
            f'/api/items/{self.item.id}/quick_reorder/',
            {'quantity': '7'}, format='json',
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        body = resp.json()
        self.assertEqual(Decimal(body['items'][0]['quantity']), Decimal('7'))

    def test_quick_reorder_without_supplier_400(self):
        no_sup = Item.objects.create(name='Loose item', unit='piece')
        resp = self.client.post(
            f'/api/items/{no_sup.id}/quick_reorder/', {}, format='json',
        )
        self.assertEqual(resp.status_code, 400)


class MovementIdempotencyTests(TestCase):
    """The same client_uuid POST'd twice yields one Movement."""

    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create_user(
            username='ops_idemp', password='pw', role='admin', is_staff=True,
        )
        cls.loc = StockLocation.objects.create(name='Main', is_default=True)
        cls.item = Item.objects.create(name='Trim 3m', unit='piece')

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_duplicate_uuid_returns_existing(self):
        cuid = str(uuid.uuid4())
        body = {
            'item': self.item.id, 'location': self.loc.id,
            'quantity': '5', 'reason': 'receive',
            'client_uuid': cuid,
        }
        first = self.client.post('/api/movements/', body, format='json')
        self.assertEqual(first.status_code, 201, first.content)
        second = self.client.post('/api/movements/', body, format='json')
        # Second call returns 200 with the original row
        self.assertIn(second.status_code, (200, 201))
        self.assertEqual(first.json()['id'], second.json()['id'])
        self.assertEqual(Movement.objects.filter(client_uuid=cuid).count(), 1)


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class NotificationRuleAPITests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create_user(
            username='ops_notif', password='pw', role='admin', is_staff=True,
        )

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_create_rule_then_test_endpoint_records_notification(self):
        # Create a rule via API
        resp = self.client.post('/api/notification-rules/', {
            'name': 'Ops', 'event': 'low_stock', 'channel': 'email',
            'recipient_email': 'ops@example.com', 'is_active': True,
        }, format='json')
        self.assertEqual(resp.status_code, 201, resp.content)
        rule_id = resp.json()['id']
        # Hit the test action
        test = self.client.post(f'/api/notification-rules/{rule_id}/test/')
        self.assertEqual(test.status_code, 200, test.content)
        body = test.json()
        self.assertEqual(body['status'], 'sent')
        self.assertEqual(Notification.objects.count(), 1)
