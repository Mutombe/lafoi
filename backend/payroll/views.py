import csv
import io
from datetime import date
from decimal import Decimal

from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from billing.pdf import render_payslip_pdf

from .models import (
    ClockEntry,
    Employee,
    EmployeeLoan,
    LeaveBalance,
    LeaveRequest,
    LeaveType,
    LoanRepayment,
    PayrollEntry,
    PayrollPeriod,
    PublicHoliday,
    SalaryHistory,
)
from .serializers import (
    ClockEntrySerializer,
    EmployeeLoanSerializer,
    EmployeeSerializer,
    LeaveBalanceSerializer,
    LeaveRequestSerializer,
    LeaveTypeSerializer,
    LoanRepaymentSerializer,
    PayrollEntrySerializer,
    PayrollPeriodSerializer,
    PublicHolidaySerializer,
    SalaryHistorySerializer,
)


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    filterset_fields = ("status", "department", "pay_frequency")
    search_fields = ("employee_code", "first_name", "last_name", "email", "phone", "department", "job_title")
    ordering_fields = ("hire_date", "first_name", "last_name", "base_salary")

    @action(detail=True, methods=["get"], url_path="ytd")
    def ytd(self, request, pk=None):
        """Year-to-date totals for this employee — gross, PAYE, NSSA, net,
        across all entries whose period_end falls in the requested calendar year.
        """
        emp = self.get_object()
        year = int(request.query_params.get("year") or timezone.now().year)
        entries = PayrollEntry.objects.filter(
            employee=emp,
            period__period_end__year=year,
        )
        agg = {
            "year": year,
            "gross": Decimal("0"),
            "paye": Decimal("0"),
            "aids_levy": Decimal("0"),
            "nssa_employee": Decimal("0"),
            "nssa_employer": Decimal("0"),
            "statutory_total": Decimal("0"),
            "deductions": Decimal("0"),
            "net": Decimal("0"),
            "periods": entries.count(),
        }
        for e in entries:
            agg["gross"] += e.gross or Decimal("0")
            agg["paye"] += e.paye or Decimal("0")
            agg["aids_levy"] += e.aids_levy or Decimal("0")
            agg["nssa_employee"] += e.nssa_employee or Decimal("0")
            agg["nssa_employer"] += e.nssa_employer or Decimal("0")
            agg["statutory_total"] += e.statutory_total or Decimal("0")
            agg["deductions"] += e.total_deductions or Decimal("0")
            agg["net"] += e.net or Decimal("0")
        # cast Decimals to strings
        return Response({k: (str(v) if isinstance(v, Decimal) else v) for k, v in agg.items()})


class PayrollPeriodViewSet(viewsets.ModelViewSet):
    queryset = PayrollPeriod.objects.prefetch_related("entries", "entries__employee").all()
    serializer_class = PayrollPeriodSerializer
    filterset_fields = ("status",)
    search_fields = ("name",)
    ordering_fields = ("period_end", "created_at", "total_net")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)

    def _ensure_unlocked(self, period: PayrollPeriod):
        if period.status == PayrollPeriod.Status.CLOSED:
            raise PermissionDenied("Period is closed and locked. Reopen it first.")

    @action(detail=True, methods=["post"], url_path="generate-entries")
    def generate_entries(self, request, pk=None):
        """Auto-create draft entries for every active employee using their template values."""
        period = self.get_object()
        self._ensure_unlocked(period)
        created = 0
        with transaction.atomic():
            existing = set(period.entries.values_list("employee_id", flat=True))
            for emp in Employee.objects.filter(status=Employee.Status.ACTIVE):
                if emp.id in existing:
                    continue
                PayrollEntry.objects.create(
                    period=period,
                    employee=emp,
                    base_salary=emp.base_salary,
                    allowances=list(emp.default_allowances or []),
                    deductions=list(emp.default_deductions or []),
                )
                created += 1
            period.recompute_totals()
            period.save(update_fields=["total_gross", "total_deductions", "total_statutory",
                                          "total_net", "employee_count", "updated_at"])
        return Response({"created": created, "period": PayrollPeriodSerializer(period).data})

    @action(detail=True, methods=["post"], url_path="recompute")
    def recompute(self, request, pk=None):
        period = self.get_object()
        self._ensure_unlocked(period)
        for entry in period.entries.all():
            entry.save()  # triggers recompute via save()
        period.recompute_totals()
        period.save(update_fields=["total_gross", "total_deductions", "total_statutory",
                                      "total_net", "employee_count", "updated_at"])
        return Response(PayrollPeriodSerializer(period).data)

    # ---- Approval workflow actions ----

    def _set_status(self, period, target, request, *, who_field, when_field, notes_field=None, notes_value=""):
        period.status = target
        setattr(period, who_field, request.user if request.user.is_authenticated else None)
        setattr(period, when_field, timezone.now())
        if notes_field is not None:
            setattr(period, notes_field, notes_value)
        period.save()

    @action(detail=True, methods=["post"], url_path="mark-reviewed")
    def mark_reviewed(self, request, pk=None):
        period = self.get_object()
        self._ensure_unlocked(period)
        if period.status not in (PayrollPeriod.Status.DRAFT, PayrollPeriod.Status.REVIEWED):
            raise ValidationError("Only DRAFT periods can be marked as reviewed.")
        self._set_status(period, PayrollPeriod.Status.REVIEWED, request,
                         who_field="reviewed_by", when_field="reviewed_at",
                         notes_field="review_notes", notes_value=request.data.get("notes", ""))
        return Response(PayrollPeriodSerializer(period).data)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        period = self.get_object()
        self._ensure_unlocked(period)
        if period.status not in (PayrollPeriod.Status.REVIEWED, PayrollPeriod.Status.DRAFT):
            raise ValidationError("Period must be REVIEWED before APPROVED. Mark reviewed first if you want to skip.")
        self._set_status(period, PayrollPeriod.Status.APPROVED, request,
                         who_field="approved_by", when_field="approved_at",
                         notes_field="approval_notes", notes_value=request.data.get("notes", ""))
        return Response(PayrollPeriodSerializer(period).data)

    @action(detail=True, methods=["post"], url_path="mark-paid")
    def mark_paid(self, request, pk=None):
        period = self.get_object()
        self._ensure_unlocked(period)
        if period.status != PayrollPeriod.Status.APPROVED:
            raise ValidationError("Period must be APPROVED before being marked PAID.")
        self._set_status(period, PayrollPeriod.Status.PAID, request,
                         who_field="paid_by", when_field="paid_at")
        return Response(PayrollPeriodSerializer(period).data)

    @action(detail=True, methods=["post"], url_path="close")
    def close(self, request, pk=None):
        period = self.get_object()
        if period.status != PayrollPeriod.Status.PAID:
            raise ValidationError("Period must be PAID before being CLOSED.")
        self._set_status(period, PayrollPeriod.Status.CLOSED, request,
                         who_field="closed_by", when_field="closed_at")
        return Response(PayrollPeriodSerializer(period).data)

    @action(detail=True, methods=["post"], url_path="reopen")
    def reopen(self, request, pk=None):
        period = self.get_object()
        if period.status != PayrollPeriod.Status.CLOSED:
            raise ValidationError("Only CLOSED periods can be reopened.")
        # Audit reason is required; we capture it on review_notes for visibility
        reason = (request.data.get("reason") or "").strip()
        if not reason:
            raise ValidationError({"reason": "Reason is required to reopen a closed period."})
        period.status = PayrollPeriod.Status.APPROVED  # reopen back to APPROVED so further edits go through workflow
        period.reopened_count = (period.reopened_count or 0) + 1
        period.review_notes = (period.review_notes or "") + f"\n[REOPENED on {timezone.now():%Y-%m-%d %H:%M}] {reason}"
        period.closed_by = None
        period.closed_at = None
        period.save()
        return Response(PayrollPeriodSerializer(period).data)

    # ---- Bank batch CSV export ----

    @action(detail=True, methods=["get"], url_path="bank-file")
    def bank_file(self, request, pk=None):
        """Generic bank-batch CSV: one row per employee with their net pay
        and bank details. Header is `EmployeeCode, Name, BankName, BankAccount, Currency, NetPay, Reference`.
        Easy to adapt to bank-specific formats by passing ?format=cbz/stanbic/nmb later.
        """
        period = self.get_object()
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(["EmployeeCode", "Name", "BankName", "BankAccount", "Currency", "NetPay", "Reference"])
        for entry in period.entries.select_related("employee").all():
            emp = entry.employee
            writer.writerow([
                emp.employee_code,
                emp.full_name,
                emp.bank_name or "",
                emp.bank_account or "",
                emp.currency or "USD",
                f"{entry.net:.2f}",
                f"{period.name} salary",
            ])
        resp = HttpResponse(buf.getvalue(), content_type="text/csv")
        resp["Content-Disposition"] = f'attachment; filename="bank_batch_{period.id}_{period.period_end}.csv"'
        return resp


class PayrollEntryViewSet(viewsets.ModelViewSet):
    queryset = PayrollEntry.objects.select_related("period", "employee").all()
    serializer_class = PayrollEntrySerializer
    filterset_fields = ("period", "employee")
    ordering_fields = ("created_at",)

    def _ensure_unlocked(self, instance: PayrollEntry):
        if instance.period and instance.period.status == PayrollPeriod.Status.CLOSED:
            raise PermissionDenied("This entry's period is closed and locked.")

    def perform_create(self, serializer):
        instance = serializer.save()
        period = instance.period
        period.recompute_totals()
        period.save(update_fields=["total_gross", "total_deductions", "total_statutory",
                                      "total_net", "employee_count", "updated_at"])

    def perform_update(self, serializer):
        if serializer.instance:
            self._ensure_unlocked(serializer.instance)
        instance = serializer.save()
        period = instance.period
        period.recompute_totals()
        period.save(update_fields=["total_gross", "total_deductions", "total_statutory",
                                      "total_net", "employee_count", "updated_at"])

    def perform_destroy(self, instance):
        self._ensure_unlocked(instance)
        period = instance.period
        super().perform_destroy(instance)
        period.recompute_totals()
        period.save(update_fields=["total_gross", "total_deductions", "total_statutory",
                                      "total_net", "employee_count", "updated_at"])

    @action(detail=True, methods=["get"], url_path="payslip")
    def payslip(self, request, pk=None):
        entry = self.get_object()
        pdf_bytes = render_payslip_pdf(entry)
        resp = HttpResponse(pdf_bytes, content_type="application/pdf")
        resp["Content-Disposition"] = f'inline; filename="payslip-{entry.employee.employee_code}-{entry.period_id}.pdf"'
        return resp


# ============================================================================
# Tier 2 — Salary history, loans, leave, holidays
# ============================================================================

class SalaryHistoryViewSet(viewsets.ModelViewSet):
    queryset = SalaryHistory.objects.select_related("employee").all()
    serializer_class = SalaryHistorySerializer
    filterset_fields = ("employee",)
    ordering_fields = ("effective_from", "created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)


class EmployeeLoanViewSet(viewsets.ModelViewSet):
    queryset = EmployeeLoan.objects.select_related("employee").prefetch_related("repayments").all()
    serializer_class = EmployeeLoanSerializer
    filterset_fields = ("employee", "status", "kind")
    search_fields = ("reference", "employee__first_name", "employee__last_name", "notes")
    ordering_fields = ("issued_on", "balance", "created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)


class LoanRepaymentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LoanRepayment.objects.select_related("loan", "period", "payroll_entry").all()
    serializer_class = LoanRepaymentSerializer
    filterset_fields = ("loan", "period")
    ordering_fields = ("applied_on", "created_at")


class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    filterset_fields = ("is_active", "paid")
    ordering_fields = ("sort_order", "label")


class LeaveBalanceViewSet(viewsets.ModelViewSet):
    queryset = LeaveBalance.objects.select_related("employee", "leave_type").all()
    serializer_class = LeaveBalanceSerializer
    filterset_fields = ("employee", "leave_type")


class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.select_related("employee", "leave_type", "decision_by").all()
    serializer_class = LeaveRequestSerializer
    filterset_fields = ("employee", "leave_type", "status")
    search_fields = ("employee__first_name", "employee__last_name", "reason")
    ordering_fields = ("start_date", "created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        req = self.get_object()
        if req.status not in (LeaveRequest.Status.PENDING,):
            raise ValidationError("Only PENDING requests can be approved.")
        req.status = LeaveRequest.Status.APPROVED
        req.decision_by = request.user if request.user.is_authenticated else None
        req.decision_at = timezone.now()
        req.decision_notes = request.data.get("notes", "")
        req.save()
        # Decrement balance immediately on approval
        bal, _ = LeaveBalance.objects.get_or_create(
            employee=req.employee, leave_type=req.leave_type,
            defaults={"balance": Decimal("0")},
        )
        bal.balance = (bal.balance or Decimal("0")) - (req.days or Decimal("0"))
        bal.save()
        return Response(LeaveRequestSerializer(req).data)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        req = self.get_object()
        if req.status not in (LeaveRequest.Status.PENDING,):
            raise ValidationError("Only PENDING requests can be rejected.")
        req.status = LeaveRequest.Status.REJECTED
        req.decision_by = request.user if request.user.is_authenticated else None
        req.decision_at = timezone.now()
        req.decision_notes = request.data.get("notes", "")
        req.save()
        return Response(LeaveRequestSerializer(req).data)


class PublicHolidayViewSet(viewsets.ModelViewSet):
    queryset = PublicHoliday.objects.all()
    serializer_class = PublicHolidaySerializer
    filterset_fields = ("is_paid",)
    search_fields = ("name", "notes")
    ordering_fields = ("date",)


# ============================================================================
# Time clock — clock in / clock out shifts
# ============================================================================

class ClockEntryViewSet(viewsets.ModelViewSet):
    """Per-employee clock-in/out records.

    Standard CRUD plus two custom actions:
      POST /clock-entries/clock_in/        — start a shift now (rejects double-open)
      POST /clock-entries/<id>/clock_out/  — close a shift now
    """

    queryset = ClockEntry.objects.select_related("employee").all()
    serializer_class = ClockEntrySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = {
        "employee": ["exact"],
        "clock_in": ["gte", "lte"],
    }
    search_fields = (
        "employee__first_name", "employee__last_name", "notes", "location",
    )
    ordering_fields = ("clock_in", "clock_out", "created_at")

    @action(detail=False, methods=["post"], url_path="clock_in")
    def clock_in_action(self, request):
        employee_id = request.data.get("employee")
        if not employee_id:
            raise ValidationError({"employee": "This field is required."})
        try:
            emp = Employee.objects.get(pk=employee_id)
        except Employee.DoesNotExist:
            raise ValidationError({"employee": "Employee not found."})
        # Reject if there is already an open shift for this employee.
        if ClockEntry.objects.filter(employee=emp, clock_out__isnull=True).exists():
            raise ValidationError({
                "detail": f"{emp.full_name} is already clocked in. Clock out first.",
            })
        entry = ClockEntry.objects.create(
            employee=emp,
            clock_in=timezone.now(),
            clock_out=None,
            location=request.data.get("location", "") or "",
            notes=request.data.get("notes", "") or "",
        )
        return Response(ClockEntrySerializer(entry).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="clock_out")
    def clock_out_action(self, request, pk=None):
        entry = self.get_object()
        if entry.clock_out is not None:
            raise ValidationError({"detail": "This entry is already closed."})
        entry.clock_out = timezone.now()
        extra = (request.data.get("notes") or "").strip()
        if extra:
            sep = "\n" if entry.notes else ""
            entry.notes = f"{entry.notes}{sep}{extra}"
        entry.save()
        return Response(ClockEntrySerializer(entry).data)
