"""Mirror billing.Receipt rows into crm.Income so the cashflow dashboard has
a single source of truth for incoming money. The Income row carries the same
amount/date/method as the Receipt, with source=invoice_receipt and a
OneToOne FK back so we never double-count.

Triggers:
  - post_save(Receipt): create the mirror if missing; otherwise refresh
    amount/currency/date/method/reference to match.
  - The CASCADE on Income.receipt handles deletion automatically — when the
    Receipt is deleted, its mirrored Income row goes with it.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Receipt


@receiver(post_save, sender=Receipt)
def mirror_receipt_to_income(sender, instance: Receipt, created, **kwargs):
    # Local import — Income lives in crm and crm imports billing for FKs in
    # other places, so we keep the import inside the handler to side-step
    # circulars at app load.
    from crm.models import Income

    invoice = instance.invoice
    payer_bits = []
    if invoice:
        customer = getattr(invoice, "project", None) and getattr(invoice.project, "customer", None)
        if customer:
            payer_bits.append(customer.name)
        elif getattr(invoice, "customer_id", None):
            payer_bits.append(invoice.customer.name)
        elif getattr(invoice, "recipient_name", ""):
            payer_bits.append(invoice.recipient_name)
        payer_bits.append(f"Invoice {invoice.number}")
    payer = " · ".join(payer_bits) or f"Receipt {instance.number}"

    description = (
        f"Payment received against {invoice.number}"
        if invoice
        else f"Receipt {instance.number}"
    )

    project = getattr(invoice, "project", None) if invoice else None

    # Receipt has no direct currency field — inherit it from the linked
    # invoice. The Receipt.Method enum uses 'ecocash' where Income uses
    # 'mobile_money'; map it through so the dashboards stay consistent.
    currency = (getattr(invoice, "currency", None) or "USD") if invoice else "USD"
    method_map = {"ecocash": Income.Method.MOBILE_MONEY}
    method = method_map.get(instance.method, instance.method) or Income.Method.BANK_TRANSFER

    defaults = {
        "source": Income.Source.INVOICE_RECEIPT,
        "amount": instance.amount,
        "currency": currency,
        "received_on": instance.received_at,
        "method": method,
        "payer": payer[:200],
        "reference": (instance.reference or instance.number or "")[:120],
        "description": description[:240],
        "project": project,
        "notes": (instance.notes or "")[:5000],
    }
    Income.objects.update_or_create(receipt=instance, defaults=defaults)
