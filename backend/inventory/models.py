"""Inventory — catalogue, stock, suppliers, purchase orders, movements.

Core invariant: the on-hand quantity for an Item at a Location is the sum of
all signed Movement quantities posted against that pair. We keep a denormalised
`Stock` row updated on every Movement.save() so list pages stay snappy without
joining and aggregating a movements table on every request.

Reorder loop:
- Every Item has a `reorder_threshold` and a `reorder_quantity`.
- The Inventory list flags items where `on_hand <= reorder_threshold` as low.
- A manager can convert a low-stock list into a PurchaseOrder, then post a
  `receive` movement when the goods arrive — which decrements the open PO line
  and increments the on-hand stock atomically.
"""
from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    parent = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.SET_NULL, related_name='children',
    )
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('sort_order', 'name')
        verbose_name_plural = 'Categories'

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name)[:120] or 'category'
            slug = base
            i = 2
            while Category.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{i}"
                i += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self) -> str:  # pragma: no cover
        return self.name


class StockLocation(models.Model):
    """A physical place where inventory lives — main warehouse, van, site."""

    name = models.CharField(max_length=120)
    address = models.CharField(max_length=240, blank=True)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-is_default', 'name')

    def save(self, *args, **kwargs):
        # Only one location may be flagged as default. Flip others off when this
        # one is being saved as default.
        if self.is_default:
            StockLocation.objects.exclude(pk=self.pk).filter(is_default=True).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self) -> str:  # pragma: no cover
        return self.name


class Supplier(models.Model):
    name = models.CharField(max_length=120)
    contact_person = models.CharField(max_length=120, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=32, blank=True)
    address = models.TextField(blank=True)
    lead_time_days = models.PositiveSmallIntegerField(default=7)
    payment_terms = models.CharField(
        max_length=120, blank=True,
        help_text="e.g. 'Net 30', '50% deposit'",
    )
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('name',)

    def __str__(self) -> str:  # pragma: no cover
        return self.name


class Item(models.Model):
    UNIT_CHOICES = [
        ('piece', 'Piece'),
        ('m', 'Metre'),
        ('m2', 'Square metre'),
        ('m3', 'Cubic metre'),
        ('kg', 'Kilogram'),
        ('l', 'Litre'),
        ('roll', 'Roll'),
        ('box', 'Box'),
        ('set', 'Set'),
    ]

    sku = models.CharField(
        max_length=64, unique=True, db_index=True,
        help_text="Stock-keeping unit. Auto: ITM-#####",
    )
    barcode = models.CharField(
        max_length=64, blank=True, db_index=True,
        help_text="EAN/UPC/QR. Optional.",
    )
    name = models.CharField(max_length=200)
    category = models.ForeignKey(
        Category, null=True, blank=True, on_delete=models.SET_NULL, related_name='items',
    )
    supplier = models.ForeignKey(
        Supplier, null=True, blank=True, on_delete=models.SET_NULL, related_name='items',
    )
    unit = models.CharField(max_length=8, choices=UNIT_CHOICES, default='piece')

    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))
    sale_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))
    currency = models.CharField(max_length=8, default='USD')

    reorder_threshold = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal('0'),
        help_text="Trigger low-stock alert at or below this on-hand level.",
    )
    reorder_quantity = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal('0'),
        help_text="Quantity to reorder when threshold hit.",
    )

    description = models.TextField(blank=True)
    image_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('name',)
        indexes = [models.Index(fields=['sku']), models.Index(fields=['barcode'])]

    def save(self, *args, **kwargs):
        if not self.sku:
            count = Item.objects.count() + 1
            # Loop until we find a free SKU — defensive against races / manual
            # inserts that have already taken ITM-NNNNN.
            sku = f"ITM-{count:05d}"
            while Item.objects.filter(sku=sku).exists():
                count += 1
                sku = f"ITM-{count:05d}"
            self.sku = sku
        super().save(*args, **kwargs)

    @property
    def on_hand(self) -> Decimal:
        return self.stocks.aggregate(s=models.Sum('quantity'))['s'] or Decimal('0')

    @property
    def is_low_stock(self) -> bool:
        return self.reorder_threshold > 0 and self.on_hand <= self.reorder_threshold

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.sku} — {self.name}"


class Stock(models.Model):
    """Per-item, per-location on-hand quantity. Updated by Movement.save()."""

    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='stocks')
    location = models.ForeignKey(StockLocation, on_delete=models.CASCADE, related_name='stocks')
    quantity = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0'))
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (('item', 'location'),)
        ordering = ('item__name', 'location__name')

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.item.sku} @ {self.location.name}: {self.quantity}"


class Movement(models.Model):
    """A single signed stock movement.

    Positive quantity = stock in (receive, return, positive adjustment).
    Negative quantity = stock out (issue, sale, negative adjustment).
    Posting a movement updates the corresponding Stock row.
    """

    REASON_CHOICES = [
        ('receive', 'Receive'),
        ('issue', 'Issue'),
        ('transfer', 'Transfer'),
        ('adjust', 'Adjust'),
        ('sale', 'Sale'),
        ('return', 'Return'),
    ]

    item = models.ForeignKey(Item, on_delete=models.PROTECT, related_name='movements')
    location = models.ForeignKey(StockLocation, on_delete=models.PROTECT, related_name='movements')
    quantity = models.DecimalField(
        max_digits=14, decimal_places=2,
        help_text="Signed: positive for stock in, negative for stock out.",
    )
    reason = models.CharField(max_length=12, choices=REASON_CHOICES)
    reference = models.CharField(
        max_length=120, blank=True,
        help_text="PO ref, project ref, free text.",
    )
    notes = models.TextField(blank=True)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='inventory_movements',
    )
    occurred_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-occurred_at', '-created_at')
        indexes = [
            models.Index(fields=['item', 'occurred_at']),
            models.Index(fields=['reason']),
        ]

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            stock, _ = Stock.objects.get_or_create(
                item=self.item, location=self.location,
                defaults={'quantity': Decimal('0')},
            )
            stock.quantity = (stock.quantity or Decimal('0')) + (self.quantity or Decimal('0'))
            stock.save()

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.item.sku} {self.quantity:+} ({self.reason}) @ {self.location.name}"


class PurchaseOrder(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('partial', 'Partially received'),
        ('received', 'Received'),
        ('cancelled', 'Cancelled'),
    ]

    reference = models.CharField(
        max_length=24, unique=True, blank=True,
        help_text="Auto: PO-#####",
    )
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name='purchase_orders')
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default='draft')
    expected_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    total = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0'))
    currency = models.CharField(max_length=8, default='USD')

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='purchase_orders_created',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-created_at',)

    def save(self, *args, **kwargs):
        if not self.reference:
            count = PurchaseOrder.objects.count() + 1
            ref = f"PO-{count:05d}"
            while PurchaseOrder.objects.filter(reference=ref).exists():
                count += 1
                ref = f"PO-{count:05d}"
            self.reference = ref
        super().save(*args, **kwargs)

    def recompute_total(self):
        agg = self.items.aggregate(s=models.Sum('line_total'))
        self.total = agg['s'] or Decimal('0')
        self.save(update_fields=['total', 'updated_at'])

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.reference} — {self.supplier.name}"


class PurchaseOrderItem(models.Model):
    po = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    item = models.ForeignKey(Item, on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=14, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)
    line_total = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0'))
    received_quantity = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0'))
    notes = models.CharField(max_length=240, blank=True)

    class Meta:
        ordering = ('id',)

    def save(self, *args, **kwargs):
        self.line_total = (self.quantity or Decimal('0')) * (self.unit_cost or Decimal('0'))
        super().save(*args, **kwargs)
        # Roll the line total up to the parent PO.
        if self.po_id:
            self.po.recompute_total()

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.po.reference} :: {self.item.sku} × {self.quantity}"
