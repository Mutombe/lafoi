"""Audit log — signal-driven recorder.

We hook post_save and pre_delete on a curated list of model labels so we
audit only the things that matter (financial, employment, customer-facing
actions). The actor is read from a thread-local set by the AuditMiddleware.
"""
from __future__ import annotations

import json
import threading
from contextlib import contextmanager
from typing import Optional

from django.apps import apps
from django.core import serializers as core_serializers
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver

from .models import AuditLog


_LOCAL = threading.local()


def get_audit_actor():
    """Return the currently-attached User (or None) for the running thread."""
    return getattr(_LOCAL, "actor", None)


def get_audit_request_meta() -> dict:
    return {
        "ip": getattr(_LOCAL, "ip", None),
        "ua": getattr(_LOCAL, "ua", ""),
    }


@contextmanager
def audit_context(*, actor=None, ip=None, ua=""):
    """Use inside management commands or background workers when no request
    middleware is in play.
    """
    prev = (getattr(_LOCAL, "actor", None), getattr(_LOCAL, "ip", None), getattr(_LOCAL, "ua", ""))
    _LOCAL.actor = actor
    _LOCAL.ip = ip
    _LOCAL.ua = ua
    try:
        yield
    finally:
        _LOCAL.actor, _LOCAL.ip, _LOCAL.ua = prev


# Models we actively track (label = `<app_label>.<ModelName>`).
TRACKED_LABELS = {
    "accounts.User",
    "crm.Customer",
    "crm.Project",
    "crm.ProjectUpdate",
    "crm.ProjectFile",
    "billing.Quotation",
    "billing.QuotationItem",
    "billing.Invoice",
    "billing.InvoiceItem",
    "billing.Receipt",
    "payroll.Employee",
    "payroll.PayrollPeriod",
    "payroll.PayrollEntry",
    "payroll.ClockEntry",
    "compliance.TaxBracketSet",
    "compliance.TaxBracket",
    "compliance.StatutoryRate",
    "compliance.ExchangeRate",
    "inventory.Category",
    "inventory.StockLocation",
    "inventory.Supplier",
    "inventory.Item",
    "inventory.Stock",
    "inventory.Movement",
    "inventory.PurchaseOrder",
    "inventory.PurchaseOrderItem",
    "inventory.NotificationRule",
    "inventory.Notification",
}


def _label(instance) -> str:
    return f"{instance._meta.app_label}.{instance.__class__.__name__}"


def _serialise(instance) -> Optional[dict]:
    """Return a JSON-serialisable snapshot of the instance, or None if it can't be serialised.

    We round-trip through Django's JSON serializer (which handles dates,
    decimals, etc.) and then load back into a dict so the result is safe to
    stash on a JSONField.
    """
    try:
        raw = core_serializers.serialize("json", [instance], cls=DjangoJSONEncoder)
        parsed = json.loads(raw)
        if not parsed:
            return None
        return parsed[0].get("fields", {})
    except Exception:
        return None


@receiver(pre_save)
def _capture_pre_save(sender, instance, **kwargs):
    label = _label(instance)
    if label not in TRACKED_LABELS or instance.pk is None:
        return
    try:
        existing = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        return
    setattr(instance, "_audit_before", _serialise(existing))


@receiver(post_save)
def _record_save(sender, instance, created, **kwargs):
    label = _label(instance)
    if label not in TRACKED_LABELS:
        return
    actor = get_audit_actor()
    meta = get_audit_request_meta()
    AuditLog.objects.create(
        action=AuditLog.Action.CREATE if created else AuditLog.Action.UPDATE,
        model_label=label,
        object_id=str(instance.pk),
        object_repr=str(instance)[:240],
        actor=actor if (actor and getattr(actor, "is_authenticated", False)) else None,
        actor_username=getattr(actor, "username", "") or "",
        before=getattr(instance, "_audit_before", None) if not created else None,
        after=_serialise(instance),
        ip_address=meta.get("ip"),
        user_agent=meta.get("ua") or "",
    )


@receiver(post_delete)
def _record_delete(sender, instance, **kwargs):
    label = _label(instance)
    if label not in TRACKED_LABELS:
        return
    actor = get_audit_actor()
    meta = get_audit_request_meta()
    AuditLog.objects.create(
        action=AuditLog.Action.DELETE,
        model_label=label,
        object_id=str(instance.pk),
        object_repr=str(instance)[:240],
        actor=actor if (actor and getattr(actor, "is_authenticated", False)) else None,
        actor_username=getattr(actor, "username", "") or "",
        before=_serialise(instance),
        after=None,
        ip_address=meta.get("ip"),
        user_agent=meta.get("ua") or "",
    )


class AuditMiddleware:
    """Attach the request user + ip + UA to a thread-local so signals can read them."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _LOCAL.actor = getattr(request, "user", None)
        _LOCAL.ip = self._client_ip(request)
        _LOCAL.ua = request.META.get("HTTP_USER_AGENT", "")[:240]
        try:
            response = self.get_response(request)
        finally:
            _LOCAL.actor = None
            _LOCAL.ip = None
            _LOCAL.ua = ""
        return response

    @staticmethod
    def _client_ip(request) -> Optional[str]:
        x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded:
            return x_forwarded.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")
