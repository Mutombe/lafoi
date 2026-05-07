"""Scan for low-stock items and dispatch alerts.

Usage:
    python manage.py check_low_stock [--force]

Scans every active item where on_hand <= reorder_threshold (and threshold > 0)
and dispatches alerts via every active NotificationRule with event=low_stock.
Skips items whose `last_low_stock_alert_at` is within the last 24h, unless
--force is passed.

Render-friendly: this is safe to wire to a Render Cron Job hitting it every
hour. The 24h dedupe on the Item itself keeps the noise down even if the
cron fires more often than necessary.
"""
from __future__ import annotations

from collections import Counter
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db.models import F, Q, Sum

from inventory.models import (
    Item,
    NotificationChannel,
    NotificationStatus,
)
from inventory.notifications import send_low_stock_alert


class Command(BaseCommand):
    help = "Send low-stock alerts via every active NotificationRule (event=low_stock)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Send even if last alert was within the last 24h.",
        )

    def handle(self, *args, **options):
        force = bool(options.get("force"))

        # SQL-level filter for low-stock items — avoids loading every item
        # and computing on_hand in Python.
        qs = (
            Item.objects.filter(is_active=True, reorder_threshold__gt=0)
            .annotate(_on_hand=Sum("stocks__quantity"))
            .filter(Q(_on_hand__lte=F("reorder_threshold")) | Q(_on_hand__isnull=True))
            .order_by("name")
        )

        total_items = 0
        total_sent = 0
        total_skipped = 0
        per_channel = Counter()

        for item in qs:
            total_items += 1
            notifications = send_low_stock_alert(item, force=force)
            if not notifications:
                # Skipped by 24h dedupe — nothing dispatched.
                self.stdout.write(
                    f"{item.sku} {item.name} — skipped (deduped or no rules)"
                )
                continue
            sent = sum(1 for n in notifications if n.status == NotificationStatus.SENT)
            failed = sum(1 for n in notifications if n.status == NotificationStatus.FAILED)
            skipped = sum(1 for n in notifications if n.status == NotificationStatus.SKIPPED)
            for n in notifications:
                if n.status == NotificationStatus.SENT:
                    if n.channel == NotificationChannel.EMAIL:
                        per_channel["email"] += 1
                    elif n.channel == NotificationChannel.WHATSAPP:
                        per_channel["wa"] += 1
                    elif n.channel == NotificationChannel.INAPP:
                        per_channel["inapp"] += 1
            total_sent += sent
            total_skipped += skipped
            channel_summary = ", ".join(
                f"{count} {kind}" for kind, count in per_channel.items() if count
            ) or "0"
            self.stdout.write(
                f"{item.sku} {item.name} — {sent} sent ({channel_summary})"
                f"{', ' + str(failed) + ' failed' if failed else ''}"
                f"{', ' + str(skipped) + ' skipped' if skipped else ''}"
            )

        self.stdout.write(self.style.SUCCESS(
            f"Scanned {total_items} low-stock items · {total_sent} alerts sent · "
            f"{total_skipped} skipped"
        ))
