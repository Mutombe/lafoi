"""Payroll — Employees, Periods, per-Employee Entries with allowances/deductions.

Statutory pipeline (PAYE / AIDS Levy / NSSA) lives in `compliance.engine`. On
PayrollEntry.save() we recompute the statutory amounts and snapshot the rates
used onto `tax_calc_snapshot` so historical entries don't drift when admin
edits the tables later.
"""
from datetime import date
from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone

from compliance.fields import EncryptedTextField


class Employee(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        ON_LEAVE = "on_leave", "On Leave"
        TERMINATED = "terminated", "Terminated"

    class PayFrequency(models.TextChoices):
        MONTHLY = "monthly", "Monthly"
        BIWEEKLY = "biweekly", "Biweekly"
        WEEKLY = "weekly", "Weekly"

    employee_code = models.CharField(max_length=24, unique=True, blank=True, help_text="Auto: EMP-####")
    first_name = models.CharField(max_length=120)
    last_name = models.CharField(max_length=120)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=32, blank=True)
    national_id = models.CharField(max_length=64, blank=True)
    tax_id = models.CharField(max_length=64, blank=True, help_text="Pay-As-You-Earn / tax number if applicable")

    job_title = models.CharField(max_length=120, blank=True)
    department = models.CharField(max_length=120, blank=True)
    hire_date = models.DateField(default=date.today)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)

    base_salary = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    pay_frequency = models.CharField(max_length=16, choices=PayFrequency.choices, default=PayFrequency.MONTHLY)
    currency = models.CharField(max_length=8, default="USD")

    # Default allowances/deductions templates (applied to new payroll entries; can be overridden)
    default_allowances = models.JSONField(default=list, blank=True, help_text="[{name, amount}] applied per period by default")
    default_deductions = models.JSONField(default=list, blank=True, help_text="[{name, amount}] applied per period by default")

    bank_name = models.CharField(max_length=120, blank=True)
    # Encrypted at rest via Fernet (see compliance.fields.EncryptedTextField)
    bank_account = EncryptedTextField(blank=True)

    # Multi-currency salary split — array of {currency, percent}. Percents must sum to 100.
    # Empty list (default) → 100% paid in `currency` field (single-currency employee).
    currency_split = models.JSONField(
        default=list, blank=True,
        help_text='[{"currency": "USD", "percent": 60}, {"currency": "ZWG", "percent": 40}]',
    )

    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("first_name", "last_name")
        indexes = [models.Index(fields=["employee_code"]), models.Index(fields=["status"])]

    def save(self, *args, **kwargs):
        if not self.employee_code:
            count = Employee.objects.count() + 1
            self.employee_code = f"EMP-{count:04d}"
        super().save(*args, **kwargs)

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.employee_code} — {self.full_name}"


class PayrollPeriod(models.Model):
    """A pay run.

    Approval workflow: DRAFT → REVIEWED → APPROVED → PAID → CLOSED. Each stage
    captures who signed and when (`reviewed_by` / `approved_by` / `paid_by` /
    `closed_by`). Once CLOSED, entries are locked from edits unless the period
    is explicitly reopened by an admin (audit-logged).
    """

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        REVIEWED = "reviewed", "Reviewed"
        APPROVED = "approved", "Approved"
        PAID = "paid", "Paid"
        CLOSED = "closed", "Closed"

    name = models.CharField(max_length=120, help_text="e.g. 'May 2026' or 'Week 18 — 2026'")
    period_start = models.DateField()
    period_end = models.DateField()
    pay_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    notes = models.TextField(blank=True)

    total_gross = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0"))
    total_deductions = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0"))
    total_statutory = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0"))
    total_net = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0"))
    employee_count = models.PositiveIntegerField(default=0)

    # Reference exchange rate captured at period creation. Snapshotted onto each
    # PayrollEntry too so historical splits don't drift. JSON: {"USD->ZWG": "...", "as_of": "..."}.
    exchange_rate_snapshot = models.JSONField(default=dict, blank=True)

    # ---- Approval workflow sign-off capture ----
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="payroll_periods_reviewed",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)

    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="payroll_periods_approved",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    approval_notes = models.TextField(blank=True)

    paid_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="payroll_periods_paid",
    )
    paid_at = models.DateTimeField(null=True, blank=True)

    closed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="payroll_periods_closed",
    )
    closed_at = models.DateTimeField(null=True, blank=True)
    reopened_count = models.PositiveSmallIntegerField(default=0, help_text="Number of times this period has been reopened after CLOSED.")

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payroll_periods_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-period_end", "-created_at")

    @property
    def is_locked(self) -> bool:
        """Closed periods are locked from entry edits unless reopened."""
        return self.status == self.Status.CLOSED

    def recompute_totals(self) -> None:
        agg = self.entries.aggregate(  # type: ignore[attr-defined]
            g=models.Sum("gross"),
            d=models.Sum("total_deductions"),
            s=models.Sum("statutory_total"),
            n=models.Sum("net"),
            c=models.Count("id"),
        )
        self.total_gross = agg["g"] or Decimal("0")
        self.total_deductions = agg["d"] or Decimal("0")
        self.total_statutory = agg["s"] or Decimal("0")
        self.total_net = agg["n"] or Decimal("0")
        self.employee_count = agg["c"] or 0

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.name} ({self.status})"


class PayrollEntry(models.Model):
    """One employee's payslip line for a period."""

    period = models.ForeignKey(PayrollPeriod, on_delete=models.CASCADE, related_name="entries")
    employee = models.ForeignKey(Employee, on_delete=models.PROTECT, related_name="payroll_entries")

    base_salary = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    overtime_hours = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0"))
    overtime_rate = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0"))
    overtime_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))

    # JSON arrays of {name, amount}
    allowances = models.JSONField(default=list, blank=True)
    deductions = models.JSONField(default=list, blank=True)

    # Statutory deductions — auto-computed from compliance.engine on save().
    paye = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    aids_levy = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    nssa_employee = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    nssa_employer = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    statutory_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    # Snapshot of the rates / brackets used for this entry — for audit defence.
    tax_calc_snapshot = models.JSONField(default=dict, blank=True)

    # Currency split snapshot — copied from Employee.currency_split at creation
    # so future changes to the employee don't retroactively re-allocate this entry.
    currency_split = models.JSONField(default=list, blank=True)

    # Whether to auto-compute statutory deductions on save. Set False for
    # custom/edge-case adjustments (e.g. retroactive period regeneration).
    auto_compute_statutory = models.BooleanField(default=True)

    # Computed
    total_allowances = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    gross = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    net = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))

    notes = models.TextField(blank=True)
    paid_on = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("employee__first_name", "employee__last_name")
        unique_together = (("period", "employee"),)
        indexes = [models.Index(fields=["period", "employee"])]

    def recompute(self) -> None:
        # ---- gross side ----
        self.overtime_amount = (self.overtime_hours or Decimal("0")) * (self.overtime_rate or Decimal("0"))
        self.total_allowances = sum(
            (Decimal(str(a.get("amount", 0))) for a in (self.allowances or [])), Decimal("0")
        )

        # ---- inject auto-loan-instalments into deductions if not already there ----
        # We look for an existing deduction line keyed by 'loan_ref' so saving
        # twice in a row doesn't double-deduct.
        if self.employee_id and self.period_id:
            try:
                from .models import EmployeeLoan  # noqa: F401  — re-import for clarity
                existing_keys = {d.get("loan_ref") for d in (self.deductions or []) if isinstance(d, dict)}
                active_loans = EmployeeLoan.objects.filter(
                    employee_id=self.employee_id,
                    status=EmployeeLoan.Status.ACTIVE,
                    balance__gt=Decimal("0"),
                )
                deductions = list(self.deductions or [])
                for loan in active_loans:
                    # Skip if loan starts after this period
                    if loan.first_repayment_period and self.period.period_end and loan.first_repayment_period > self.period.period_end:
                        continue
                    if loan.reference in existing_keys:
                        continue
                    instalment = min(loan.instalment, loan.balance)
                    if instalment <= Decimal("0"):
                        continue
                    deductions.append({
                        "name": f"{loan.get_kind_display()} repayment ({loan.reference})",
                        "amount": str(instalment),
                        "loan_ref": loan.reference,
                        "auto_added": True,
                    })
                self.deductions = deductions
            except Exception:
                pass

        custom_deductions = sum(
            (Decimal(str(d.get("amount", 0))) for d in (self.deductions or [])), Decimal("0")
        )
        self.gross = (self.base_salary or Decimal("0")) + self.overtime_amount + self.total_allowances

        # ---- statutory side (auto, unless caller has opted out) ----
        if self.auto_compute_statutory:
            try:
                from compliance.engine import compute_statutory  # local import to avoid cycle at app load

                period_end = self.period.period_end if self.period_id else timezone.now().date()
                currency = self.employee.currency if self.employee_id else "USD"
                result = compute_statutory(self.gross, currency, period_end)
                self.paye = result.paye
                self.aids_levy = result.aids_levy
                self.nssa_employee = result.nssa_employee
                self.nssa_employer = result.nssa_employer
                self.statutory_total = result.statutory_total
                self.tax_calc_snapshot = result.snapshot
            except Exception as exc:  # pragma: no cover — never fail save() on stat issues
                self.tax_calc_snapshot = {"error": str(exc)}

        # ---- final totals ----
        self.total_deductions = custom_deductions + (self.statutory_total or Decimal("0"))
        self.net = self.gross - self.total_deductions
        if self.net < Decimal("0"):
            # cap at 0 net; the shortfall could be carried forward by a future feature
            self.net = Decimal("0")

    def save(self, *args, **kwargs):
        # Default the currency_split from Employee at first save if not explicitly set
        if not self.currency_split and self.employee_id:
            self.currency_split = list(self.employee.currency_split or [])
        self.recompute()
        super().save(*args, **kwargs)
        # After save, record any auto-added loan repayments and decrement loan balances.
        self._sync_loan_repayments()

    def _sync_loan_repayments(self) -> None:
        """Idempotently materialise loan-repayment records for this entry.
        Called after save(). If a LoanRepayment for (loan, this entry) already exists,
        we skip it — avoids double-charging on re-save.
        """
        try:
            from decimal import Decimal as D

            from .models import EmployeeLoan, LoanRepayment

            for ded in (self.deductions or []):
                if not isinstance(ded, dict):
                    continue
                ref = ded.get("loan_ref")
                if not ref:
                    continue
                loan = EmployeeLoan.objects.filter(reference=ref, employee_id=self.employee_id).first()
                if loan is None:
                    continue
                amount = D(str(ded.get("amount", 0) or 0))
                if amount <= D("0"):
                    continue
                # Idempotency: replace any existing repayment for this entry on this loan.
                existing = LoanRepayment.objects.filter(loan=loan, payroll_entry=self).first()
                if existing and existing.amount == amount:
                    continue
                if existing:
                    existing.amount = amount
                    existing.save()
                else:
                    LoanRepayment.objects.create(
                        loan=loan, period=self.period, payroll_entry=self,
                        amount=amount, applied_on=self.period.period_end if self.period_id else None,
                    )
                # Recompute loan balance from the sum of its repayments
                from django.db.models import Sum
                total = loan.repayments.aggregate(s=Sum("amount"))["s"] or D("0")
                loan.total_repaid = total
                loan.balance = max(D("0"), (loan.principal or D("0")) - total)
                if loan.balance == D("0") and loan.status == EmployeeLoan.Status.ACTIVE:
                    loan.status = EmployeeLoan.Status.SETTLED
                    loan.end_on = self.period.period_end if self.period_id else None
                loan.save(update_fields=["total_repaid", "balance", "status", "end_on", "updated_at"])
        except Exception:
            # Never let loan accounting fail a payroll save
            pass

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.period.name}: {self.employee.full_name}"


# ============================================================================
# TIER 2 — Salary history, loans, leave, public holidays
# ============================================================================

class SalaryHistory(models.Model):
    """A timeline of base-salary changes per employee.

    Used by the engine to pro-rate periods that span a salary adjustment, and
    to render a salary-trajectory mini-chart on the employee detail view.
    """

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="salary_history")
    base_salary = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=8, default="USD")
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True, help_text="Leave blank for the current rate.")
    reason = models.CharField(max_length=240, blank=True, help_text="e.g. 'Annual review 2026', 'Promotion to Senior Installer'")

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="salary_history_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-effective_from", "-created_at")
        indexes = [models.Index(fields=["employee", "effective_from"])]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.employee.full_name}: {self.currency} {self.base_salary} from {self.effective_from}"


class EmployeeLoan(models.Model):
    """A loan or salary advance granted to an employee.

    Repaid via auto-deductions on each PayrollPeriod until the principal +
    interest is cleared. The engine reads ACTIVE loans during PayrollEntry
    save() and adds an instalment line to deductions.
    """

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        SETTLED = "settled", "Settled"
        WRITTEN_OFF = "written_off", "Written off"
        CANCELLED = "cancelled", "Cancelled"

    class Kind(models.TextChoices):
        LOAN = "loan", "Loan"
        ADVANCE = "advance", "Salary Advance"

    employee = models.ForeignKey(Employee, on_delete=models.PROTECT, related_name="loans")
    reference = models.CharField(max_length=24, unique=True, blank=True, help_text="Auto: LN-####")

    kind = models.CharField(max_length=16, choices=Kind.choices, default=Kind.LOAN)
    principal = models.DecimalField(max_digits=12, decimal_places=2)
    interest_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("0"),
        help_text="Annual interest rate %; 0 for interest-free.",
    )
    instalment = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="Per-period deduction amount.",
    )
    currency = models.CharField(max_length=8, default="USD")

    issued_on = models.DateField(default=date.today)
    first_repayment_period = models.DateField(
        null=True, blank=True,
        help_text="Earliest period_end the instalment applies to. Blank = next period.",
    )
    end_on = models.DateField(null=True, blank=True, help_text="Manual override; otherwise auto-calculated when settled.")

    total_repaid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    notes = models.TextField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="loans_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-issued_on", "-created_at")
        indexes = [models.Index(fields=["employee", "status"])]

    def save(self, *args, **kwargs):
        if not self.reference:
            count = EmployeeLoan.objects.count() + 1
            self.reference = f"LN-{count:04d}"
        if self.balance == Decimal("0") and not self.pk:
            # initial balance = principal at issuance
            self.balance = self.principal
        super().save(*args, **kwargs)

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.reference} — {self.employee.full_name}"


class LoanRepayment(models.Model):
    """A single repayment record applied to a loan in a specific period."""

    loan = models.ForeignKey(EmployeeLoan, on_delete=models.CASCADE, related_name="repayments")
    period = models.ForeignKey(PayrollPeriod, on_delete=models.SET_NULL, null=True, blank=True, related_name="loan_repayments")
    payroll_entry = models.ForeignKey(PayrollEntry, on_delete=models.SET_NULL, null=True, blank=True, related_name="loan_repayments")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    applied_on = models.DateField(default=date.today)
    notes = models.CharField(max_length=240, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-applied_on", "-created_at")
        indexes = [models.Index(fields=["loan", "period"])]


class LeaveType(models.Model):
    """Annual / sick / maternity / paternity / compassionate / unpaid etc."""

    code = models.SlugField(max_length=32, unique=True)  # 'annual', 'sick', 'maternity', etc.
    label = models.CharField(max_length=120)
    paid = models.BooleanField(default=True, help_text="Unpaid leave reduces gross during the period it falls in.")
    accrual_per_month = models.DecimalField(
        max_digits=6, decimal_places=2, default=Decimal("0"),
        help_text="Days credited per month worked. 0 = lump-sum or no auto-accrual.",
    )
    annual_cap = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True,
        help_text="Maximum balance days; balance won't accrue above this. Blank = uncapped.",
    )
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("sort_order", "label")

    def __str__(self) -> str:  # pragma: no cover
        return self.label


class LeaveBalance(models.Model):
    """Per-employee, per-LeaveType running balance + accrual ledger."""

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="leave_balances")
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE)
    balance = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0"))
    last_accrued_on = models.DateField(null=True, blank=True)
    notes = models.CharField(max_length=240, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (("employee", "leave_type"),)
        ordering = ("employee__first_name", "leave_type__sort_order")

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.employee.full_name} — {self.leave_type.label}: {self.balance} days"


class LeaveRequest(models.Model):
    """A leave application: pending → approved → consumed."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        CONSUMED = "consumed", "Consumed"
        CANCELLED = "cancelled", "Cancelled"

    employee = models.ForeignKey(Employee, on_delete=models.PROTECT, related_name="leave_requests")
    leave_type = models.ForeignKey(LeaveType, on_delete=models.PROTECT, related_name="requests")
    start_date = models.DateField()
    end_date = models.DateField()
    days = models.DecimalField(max_digits=6, decimal_places=2, help_text="Working days; supports half-days as 0.5.")
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)

    decision_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="leave_decisions",
    )
    decision_at = models.DateTimeField(null=True, blank=True)
    decision_notes = models.TextField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="leave_requests_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-start_date", "-created_at")
        indexes = [models.Index(fields=["employee", "status"]), models.Index(fields=["start_date"])]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.employee.full_name} — {self.leave_type.code} {self.start_date}→{self.end_date}"


class PublicHoliday(models.Model):
    """Zimbabwe public holiday calendar entry."""

    name = models.CharField(max_length=120)
    date = models.DateField(unique=True)
    is_paid = models.BooleanField(default=True)
    notes = models.CharField(max_length=240, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("date",)

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.date} — {self.name}"
