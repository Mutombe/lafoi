"""Inventory notifications — email + WhatsApp dispatch.

Email goes via Django's `send_mail`. WhatsApp goes via Twilio's HTTP API
(sender prepared but only fires when TWILIO_ACCOUNT_SID is set in env).
Both senders are idempotent and log to the Notification model.

Each call to `send_low_stock_alert` is naturally rate-limited by the
`Item.last_low_stock_alert_at` timestamp — repeated triggers within
24h skip rather than re-sending. That stops a runaway scheduler from
spamming a supplier.
"""
from __future__ import annotations

import logging
from datetime import timedelta
from typing import Tuple

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from decouple import config

from .models import (
    Item,
    Notification,
    NotificationChannel,
    NotificationRule,
    NotificationStatus,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Channel senders — each returns (success, error_msg)
# ---------------------------------------------------------------------------
def _send_email(to: str, subject: str, body: str) -> Tuple[bool, str]:
    """Django send_mail wrapper. Returns (success, error)."""
    if not to:
        return False, "No recipient email."
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "") or config(
        "DEFAULT_FROM_EMAIL", default="noreply@lafoidesigns.com"
    )
    try:
        sent = send_mail(
            subject=subject,
            message=body,
            from_email=from_email,
            recipient_list=[to],
            fail_silently=False,
        )
        if sent <= 0:
            return False, "send_mail returned 0 — backend likely not configured."
        return True, ""
    except Exception as exc:  # pragma: no cover — network/SMTP failure path
        logger.exception("Email send failed")
        return False, str(exc)


def _send_whatsapp(to: str, body: str) -> Tuple[bool, str]:
    """Twilio WhatsApp via HTTP API. Lazy-imports `requests` so the dep is
    optional in dev environments where alerts aren't being sent.
    """
    if not to:
        return False, "No recipient phone."
    sid = config("TWILIO_ACCOUNT_SID", default="")
    token = config("TWILIO_AUTH_TOKEN", default="")
    sender = config("TWILIO_WHATSAPP_FROM", default="")
    if not (sid and token and sender):
        return False, (
            "WhatsApp not configured — set TWILIO_ACCOUNT_SID + "
            "TWILIO_AUTH_TOKEN + TWILIO_WHATSAPP_FROM"
        )

    try:
        import requests  # direct dep — see requirements.txt
    except ImportError:
        return False, "`requests` is not installed in this environment."

    url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
    payload = {
        "From": f"whatsapp:{sender}",
        "To": f"whatsapp:{to}",
        "Body": body,
    }
    try:
        resp = requests.post(url, data=payload, auth=(sid, token), timeout=15)
    except Exception as exc:  # pragma: no cover — network failure
        logger.exception("WhatsApp send failed")
        return False, f"HTTP error: {exc}"
    if resp.status_code >= 400:
        return False, f"Twilio {resp.status_code}: {resp.text[:240]}"
    return True, ""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def _build_low_stock_message(item: Item) -> Tuple[str, str]:
    """Return (subject, body) for a low-stock alert."""
    co_name = getattr(settings, "COMPANY", {}).get("name", "La Foi Designs")
    on_hand = item.on_hand
    subject = f"[{co_name}] Low stock: {item.sku} — {item.name}"
    body = (
        f"Heads up — {item.name} ({item.sku}) is at or below its reorder threshold.\n\n"
        f"  On hand:           {on_hand} {item.unit}\n"
        f"  Reorder threshold: {item.reorder_threshold} {item.unit}\n"
        f"  Reorder quantity:  {item.reorder_quantity} {item.unit}\n"
        f"  Supplier:          {item.supplier.name if item.supplier_id else '—'}\n\n"
        f"Action: place a purchase order or use 'Quick reorder' from the "
        f"{co_name} dashboard."
    )
    return subject, body


def _dispatch(rule: NotificationRule, item: Item, subject: str, body: str) -> Notification:
    """Dispatch a single rule and persist a Notification record.

    The Notification row is created first as PENDING so we always have a
    durable trail even if the channel call hangs or kills the worker.
    """
    if rule.channel == NotificationChannel.EMAIL:
        recipient = rule.recipient_email
    elif rule.channel == NotificationChannel.WHATSAPP:
        recipient = rule.recipient_phone
    else:
        recipient = ""

    notification = Notification.objects.create(
        rule=rule,
        item=item,
        event="low_stock",
        channel=rule.channel,
        recipient=recipient or "",
        subject=subject,
        body=body,
        status=NotificationStatus.PENDING,
    )

    if not recipient:
        notification.status = NotificationStatus.SKIPPED
        notification.error = "Rule has no recipient configured for this channel."
        notification.save(update_fields=["status", "error"])
        return notification

    if rule.channel == NotificationChannel.EMAIL:
        ok, err = _send_email(recipient, subject, body)
    elif rule.channel == NotificationChannel.WHATSAPP:
        ok, err = _send_whatsapp(recipient, body)
    elif rule.channel == NotificationChannel.INAPP:
        # In-app channel just records the row — the dashboard surfaces it
        # via the alert-history table.
        ok, err = True, ""
    else:
        ok, err = False, f"Unknown channel: {rule.channel}"

    notification.status = NotificationStatus.SENT if ok else NotificationStatus.FAILED
    notification.error = err or ""
    if ok:
        notification.sent_at = timezone.now()
    notification.save(update_fields=["status", "error", "sent_at"])
    return notification


def send_low_stock_alert(item: Item, *, force: bool = False) -> list[Notification]:
    """Send a low-stock alert to every active rule with event=low_stock.

    Returns the list of Notification rows produced. Updates
    `item.last_low_stock_alert_at` on the first successful send. Skips
    entirely (returns []) when the last alert was within 24h, unless
    `force=True`.
    """
    if not force and item.last_low_stock_alert_at:
        if timezone.now() - item.last_low_stock_alert_at < timedelta(hours=24):
            return []

    rules = NotificationRule.objects.filter(event="low_stock", is_active=True)
    if not rules.exists():
        return []

    subject, body = _build_low_stock_message(item)
    sent_any = False
    notifications: list[Notification] = []
    for rule in rules:
        n = _dispatch(rule, item, subject, body)
        notifications.append(n)
        if n.status == NotificationStatus.SENT:
            sent_any = True

    if sent_any:
        Item.objects.filter(pk=item.pk).update(last_low_stock_alert_at=timezone.now())

    return notifications


def send_test_alert(rule: NotificationRule) -> Notification:
    """Fire a one-off test message for a rule. Used by the dashboard's
    "Test" button so admins can verify their config without tripping a
    real low-stock event.
    """
    co_name = getattr(settings, "COMPANY", {}).get("name", "La Foi Designs")
    subject = f"[{co_name}] Test alert — {rule.name}"
    body = (
        f"This is a test message from {co_name} for rule '{rule.name}'.\n"
        f"If you received this, your {rule.get_channel_display()} configuration "
        f"is working correctly."
    )
    # Fake item=None for the test — the Notification row keeps the trail.
    if rule.channel == NotificationChannel.EMAIL:
        recipient = rule.recipient_email
    elif rule.channel == NotificationChannel.WHATSAPP:
        recipient = rule.recipient_phone
    else:
        recipient = ""

    notification = Notification.objects.create(
        rule=rule,
        item=None,
        event="test",
        channel=rule.channel,
        recipient=recipient or "",
        subject=subject,
        body=body,
        status=NotificationStatus.PENDING,
    )
    if not recipient:
        notification.status = NotificationStatus.SKIPPED
        notification.error = "Rule has no recipient configured for this channel."
        notification.save(update_fields=["status", "error"])
        return notification

    if rule.channel == NotificationChannel.EMAIL:
        ok, err = _send_email(recipient, subject, body)
    elif rule.channel == NotificationChannel.WHATSAPP:
        ok, err = _send_whatsapp(recipient, body)
    elif rule.channel == NotificationChannel.INAPP:
        ok, err = True, ""
    else:
        ok, err = False, f"Unknown channel: {rule.channel}"

    notification.status = NotificationStatus.SENT if ok else NotificationStatus.FAILED
    notification.error = err or ""
    if ok:
        notification.sent_at = timezone.now()
    notification.save(update_fields=["status", "error", "sent_at"])
    return notification
