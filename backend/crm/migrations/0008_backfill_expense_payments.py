"""Backfill: existing expenses that were marked paid (have a paid_on date)
predate the part-payments feature. Create one full-amount ExpensePayment for
each so they correctly read as 'paid' rather than 'unpaid' under the new
payment-status rollup. Expenses with no paid_on are left as unpaid.
"""
from django.db import migrations


def backfill(apps, schema_editor):
    ProjectCost = apps.get_model("crm", "ProjectCost")
    ExpensePayment = apps.get_model("crm", "ExpensePayment")
    for exp in ProjectCost.objects.filter(paid_on__isnull=False).exclude(amount=None):
        if exp.payments.exists():
            continue
        if not exp.amount or exp.amount <= 0:
            continue
        ExpensePayment.objects.create(
            expense=exp,
            amount=exp.amount,
            paid_on=exp.paid_on,
            method=exp.payment_method or "bank_transfer",
            reference=exp.receipt_reference or "",
            note="Imported — recorded as paid",
        )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("crm", "0007_customerfile_expensepayment"),
    ]

    operations = [
        migrations.RunPython(backfill, reverse_code=noop),
    ]
