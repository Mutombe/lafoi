"""Compliance — configurable tax tables, statutory rates, audit log.

Everything ZIMRA / NSSA / AIDS-Levy-related lives here. The values are stored as
data (not constants) so finance can update them via the dashboard when ZIMRA
publishes new schedules — without a deploy.

Critical design rule: payroll entries on a CLOSED period snapshot the rates
they were calculated against (see `payroll.PayrollEntry.tax_calc_snapshot`).
That way historical payslips never silently change when an admin edits a
bracket set later.
"""
from datetime import date
from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone


CURRENCY_CHOICES = [
    ("USD", "US Dollar"),
    ("ZWG", "Zimbabwe Gold"),
    ("ZWL", "Zimbabwe Dollar (legacy)"),
    ("ZAR", "South African Rand"),
]


class TaxBracketSet(models.Model):
    """A complete progressive PAYE bracket schedule for a currency + period.

    Multiple sets can exist; the active one for a given (currency, date) is the
    one whose effective_from <= date AND (effective_to IS NULL OR effective_to >= date).
    """

    name = models.CharField(max_length=120, help_text="e.g. 'ZIMRA 2026 — USD'")
    currency = models.CharField(max_length=8, choices=CURRENCY_CHOICES, default="USD")
    effective_from = models.DateField(default=date.today)
    effective_to = models.DateField(null=True, blank=True, help_text="Leave blank to mean 'still active'")

    aids_levy_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("3.00"),
        help_text="AIDS Levy applied on top of PAYE. ZIMRA: 3.0% historically.",
    )

    notes = models.TextField(blank=True)
    is_active = models.BooleanField(
        default=True,
        help_text="Soft-deactivate. Set false instead of deleting so historical payslip snapshots remain resolvable.",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="tax_brackets_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-effective_from", "currency")
        indexes = [
            models.Index(fields=["currency", "effective_from"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.name} ({self.currency})"

    def is_effective_on(self, when) -> bool:
        if self.effective_from and self.effective_from > when:
            return False
        if self.effective_to and self.effective_to < when:
            return False
        return self.is_active


class TaxBracket(models.Model):
    """A single row in the progressive PAYE ladder.

    Tax for income X in this bracket = (X - lower) × rate% + carry-over from
    lower brackets. We store an explicit `fixed_deduction` for ZIMRA's lookup-
    table style "tax = X × rate − fixed_deduction" so the engine can compute in
    one pass without integrating across brackets.
    """

    bracket_set = models.ForeignKey(TaxBracketSet, on_delete=models.CASCADE, related_name="brackets")
    sort_order = models.PositiveSmallIntegerField(default=0)

    lower = models.DecimalField(max_digits=14, decimal_places=2)
    upper = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True,
        help_text="Inclusive upper bound; leave blank for ∞ (top bracket).",
    )
    rate = models.DecimalField(
        max_digits=5, decimal_places=2,
        help_text="Marginal tax rate as a percentage. e.g. 25.00",
    )
    fixed_deduction = models.DecimalField(
        max_digits=14, decimal_places=2, default=Decimal("0"),
        help_text="ZIMRA-style 'subtract from rate × income' constant.",
    )

    class Meta:
        ordering = ("bracket_set", "sort_order", "lower")
        indexes = [models.Index(fields=["bracket_set", "lower"])]

    def __str__(self) -> str:  # pragma: no cover
        upper = f"{self.upper}" if self.upper else "∞"
        return f"{self.lower} → {upper} @ {self.rate}%"


class StatutoryRate(models.Model):
    """Single-value statutory parameters: NSSA percentages, ceilings, etc.

    Looked up by `code` + applicable date. Same effective-date semantics as
    TaxBracketSet — historical snapshots remain resolvable.
    """

    class Code(models.TextChoices):
        NSSA_EMPLOYEE_PCT = "nssa_employee_pct", "NSSA Employee Contribution %"
        NSSA_EMPLOYER_PCT = "nssa_employer_pct", "NSSA Employer Contribution %"
        NSSA_CEILING = "nssa_ceiling", "NSSA Insurable Earnings Ceiling"
        AIDS_LEVY_PCT = "aids_levy_pct", "AIDS Levy %"
        STANDARD_OT_RATE = "standard_ot_rate", "Standard Overtime Multiplier (weekday)"
        WEEKEND_OT_RATE = "weekend_ot_rate", "Overtime Multiplier (weekend / holiday)"

    code = models.CharField(max_length=64, choices=Code.choices)
    label = models.CharField(max_length=160, blank=True)
    value = models.DecimalField(max_digits=14, decimal_places=4)
    currency = models.CharField(
        max_length=8, choices=CURRENCY_CHOICES, blank=True,
        help_text="Currency-specific (e.g. NSSA ceiling); leave blank if rate-only (percent).",
    )

    effective_from = models.DateField(default=date.today)
    effective_to = models.DateField(null=True, blank=True)

    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="statutory_rates_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-effective_from", "code", "currency")
        indexes = [
            models.Index(fields=["code", "currency", "effective_from"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self) -> str:  # pragma: no cover
        suffix = f" ({self.currency})" if self.currency else ""
        return f"{self.get_code_display()}{suffix} = {self.value}"


class ExchangeRate(models.Model):
    """USD ⇄ ZWG (or other) reference rate, snapshot-able per period.

    Pay periods snapshot the rate at creation so historical payslips never
    re-convert when the daily rate moves.
    """

    base = models.CharField(max_length=8, choices=CURRENCY_CHOICES, default="USD")
    quote = models.CharField(max_length=8, choices=CURRENCY_CHOICES, default="ZWG")
    rate = models.DecimalField(max_digits=14, decimal_places=6, help_text="1 base = N quote")
    as_of = models.DateField(default=date.today, help_text="Date this rate applies from")
    notes = models.CharField(max_length=240, blank=True, help_text="e.g. 'RBZ interbank average'")

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="exchange_rates_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-as_of", "base", "quote")
        indexes = [models.Index(fields=["base", "quote", "as_of"])]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.base}/{self.quote} = {self.rate} ({self.as_of})"


class AuditLog(models.Model):
    """Generic audit trail — who changed what, when, before/after.

    Recorded via signals on tracked models (see compliance.signals). The
    `before` and `after` blobs are JSON snapshots of the model's serialised
    state, so any field change can be diffed at review time.
    """

    class Action(models.TextChoices):
        CREATE = "create", "Created"
        UPDATE = "update", "Updated"
        DELETE = "delete", "Deleted"
        APPROVE = "approve", "Approved"
        VOID = "void", "Voided"

    action = models.CharField(max_length=16, choices=Action.choices)
    model_label = models.CharField(max_length=120, help_text="<app_label>.<ModelName>")
    object_id = models.CharField(max_length=64, db_index=True)
    object_repr = models.CharField(max_length=240, blank=True)

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="audit_actions",
    )
    actor_username = models.CharField(max_length=150, blank=True, help_text="Captured at write time so user-rename doesn't lose attribution")

    before = models.JSONField(null=True, blank=True)
    after = models.JSONField(null=True, blank=True)

    summary = models.CharField(max_length=240, blank=True, help_text="Optional short reason / context")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=240, blank=True)

    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["model_label", "object_id"]),
            models.Index(fields=["actor"]),
            models.Index(fields=["action"]),
        ]

    def __str__(self) -> str:  # pragma: no cover
        who = self.actor_username or "system"
        return f"{self.created_at:%Y-%m-%d %H:%M} · {who} {self.action} {self.model_label}#{self.object_id}"
