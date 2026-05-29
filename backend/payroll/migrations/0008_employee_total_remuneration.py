"""Add total_remuneration as a stored Decimal field on Employee and
backfill existing rows with base_salary + transport_allowance so
nothing reads 0 on existing employees."""
from decimal import Decimal

from django.db import migrations, models


def backfill_totals(apps, schema_editor):
    Employee = apps.get_model("payroll", "Employee")
    for emp in Employee.objects.all():
        emp.total_remuneration = (emp.base_salary or Decimal("0")) + (emp.transport_allowance or Decimal("0"))
        emp.save(update_fields=["total_remuneration"])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("payroll", "0007_employee_transport_allowance"),
    ]

    operations = [
        migrations.AddField(
            model_name="employee",
            name="total_remuneration",
            field=models.DecimalField(
                decimal_places=2, default=Decimal("0"), max_digits=12,
                help_text="Auto-fills to base + transport when saved as 0.",
            ),
        ),
        migrations.RunPython(backfill_totals, reverse_code=noop),
    ]
