"""Inventory signals — auto-fire low-stock alerts on movement.

Hook strategy: `post_save` on `Movement`. After a movement lands and
`Movement.save()` has updated the corresponding `Stock` row, we re-check
the parent `Item.is_low_stock` and dispatch via `send_low_stock_alert`.

The dispatcher itself enforces a 24h dedupe via
`Item.last_low_stock_alert_at`, so every stock-out, transfer, sale or
adjust safely calls in here without spamming. Item.save() is hooked too
in case an admin raises `reorder_threshold` and pushes an in-stock item
below the new bar.

Failures inside the signal are logged and swallowed — a notification
issue must never prevent a stock movement from being recorded.
"""
from __future__ import annotations

import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Item, Movement

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Movement, dispatch_uid="inventory.alert_on_movement")
def _alert_on_movement(sender, instance: Movement, created: bool, **kwargs):
    """Re-check the moved item's stock level after every movement."""
    item = instance.item
    if item is None or not item.is_active:
        return
    if not item.is_low_stock:
        return
    try:
        from .notifications import send_low_stock_alert
        send_low_stock_alert(item)
    except Exception:
        logger.exception("Low-stock alert dispatch failed for item %s", item.pk)


@receiver(post_save, sender=Item, dispatch_uid="inventory.alert_on_item_save")
def _alert_on_item_save(sender, instance: Item, created: bool, **kwargs):
    """If reorder_threshold was raised so the item is now low, alert."""
    if created or not instance.is_active:
        return
    if not instance.is_low_stock:
        return
    try:
        from .notifications import send_low_stock_alert
        send_low_stock_alert(instance)
    except Exception:
        logger.exception("Low-stock alert dispatch failed for item %s", instance.pk)
