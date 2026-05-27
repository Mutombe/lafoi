from django.db import transaction
from rest_framework import serializers

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


class EmployeeSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Employee
        fields = (
            "id", "employee_code", "first_name", "last_name", "full_name",
            "email", "phone", "national_id", "tax_id", "job_title", "department",
            "hire_date", "end_date", "status",
            "base_salary", "pay_frequency", "currency",
            "currency_split",
            "default_allowances", "default_deductions",
            "home_address",
            "next_of_kin_name", "next_of_kin_relationship",
            "next_of_kin_phone", "next_of_kin_email",
            "bank_name", "bank_account",
            "notes", "created_at", "updated_at",
        )
        read_only_fields = ("id", "employee_code", "full_name", "created_at", "updated_at")


class PayrollEntrySerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    employee_code = serializers.CharField(source="employee.employee_code", read_only=True)
    employee_currency = serializers.CharField(source="employee.currency", read_only=True)
    # Sum of `ClockEntry.hours_worked` for this entry's employee within the
    # parent period's date range. Informational only — never auto-deducted.
    total_clock_hours = serializers.SerializerMethodField()

    class Meta:
        model = PayrollEntry
        fields = (
            "id", "period", "employee", "employee_name", "employee_code", "employee_currency",
            "base_salary", "overtime_hours", "overtime_rate", "overtime_amount",
            "allowances", "deductions",
            # Statutory (auto-computed via compliance.engine)
            "paye", "aids_levy", "nssa_employee", "nssa_employer", "statutory_total",
            "tax_calc_snapshot", "currency_split", "auto_compute_statutory",
            # Totals
            "total_allowances", "total_deductions", "gross", "net",
            "total_clock_hours",
            "notes", "paid_on",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "overtime_amount", "total_allowances", "total_deductions",
                             "gross", "net",
                             "paye", "aids_levy", "nssa_employee", "nssa_employer",
                             "statutory_total", "tax_calc_snapshot",
                             "total_clock_hours",
                             "created_at", "updated_at",
                             "employee_name", "employee_code", "employee_currency")

    def get_total_clock_hours(self, obj):
        try:
            return float(obj.total_clock_hours())
        except Exception:
            return 0.0


class PayrollPeriodSerializer(serializers.ModelSerializer):
    entries = PayrollEntrySerializer(many=True, read_only=True)
    is_locked = serializers.BooleanField(read_only=True)
    reviewed_by_name = serializers.CharField(source="reviewed_by.display_name", read_only=True)
    approved_by_name = serializers.CharField(source="approved_by.display_name", read_only=True)
    paid_by_name = serializers.CharField(source="paid_by.display_name", read_only=True)
    closed_by_name = serializers.CharField(source="closed_by.display_name", read_only=True)

    class Meta:
        model = PayrollPeriod
        fields = (
            "id", "name", "period_start", "period_end", "pay_date", "status", "is_locked", "notes",
            "total_gross", "total_deductions", "total_statutory", "total_net",
            "employee_count", "exchange_rate_snapshot",
            "reviewed_by", "reviewed_by_name", "reviewed_at", "review_notes",
            "approved_by", "approved_by_name", "approved_at", "approval_notes",
            "paid_by", "paid_by_name", "paid_at",
            "closed_by", "closed_by_name", "closed_at", "reopened_count",
            "entries", "created_at", "updated_at",
        )
        read_only_fields = ("id", "total_gross", "total_deductions", "total_statutory",
                             "total_net", "employee_count", "entries", "is_locked",
                             "reviewed_by", "reviewed_by_name", "reviewed_at",
                             "approved_by", "approved_by_name", "approved_at",
                             "paid_by", "paid_by_name", "paid_at",
                             "closed_by", "closed_by_name", "closed_at", "reopened_count",
                             "created_at", "updated_at")


# ============================================================================
# Tier 2 — Salary history, loans, leave, holidays
# ============================================================================

class SalaryHistorySerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)

    class Meta:
        model = SalaryHistory
        fields = (
            "id", "employee", "employee_name", "base_salary", "currency",
            "effective_from", "effective_to", "reason", "created_at",
        )
        read_only_fields = ("id", "employee_name", "created_at")


class LoanRepaymentSerializer(serializers.ModelSerializer):
    period_name = serializers.CharField(source="period.name", read_only=True)

    class Meta:
        model = LoanRepayment
        fields = ("id", "loan", "period", "period_name", "payroll_entry", "amount", "applied_on", "notes", "created_at")
        read_only_fields = ("id", "period_name", "created_at")


class EmployeeLoanSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    repayments = LoanRepaymentSerializer(many=True, read_only=True)

    class Meta:
        model = EmployeeLoan
        fields = (
            "id", "reference", "employee", "employee_name", "kind",
            "principal", "interest_rate", "instalment", "currency",
            "issued_on", "first_repayment_period", "end_on",
            "total_repaid", "balance", "status", "notes",
            "repayments", "created_at", "updated_at",
        )
        read_only_fields = ("id", "reference", "employee_name", "total_repaid", "balance",
                             "repayments", "created_at", "updated_at")


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = ("id", "code", "label", "paid", "accrual_per_month", "annual_cap",
                   "sort_order", "is_active")
        read_only_fields = ("id",)


class LeaveBalanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    leave_type_label = serializers.CharField(source="leave_type.label", read_only=True)
    leave_type_code = serializers.CharField(source="leave_type.code", read_only=True)

    class Meta:
        model = LeaveBalance
        fields = ("id", "employee", "employee_name", "leave_type", "leave_type_code", "leave_type_label",
                   "balance", "last_accrued_on", "notes", "updated_at")
        read_only_fields = ("id", "employee_name", "leave_type_code", "leave_type_label", "updated_at")


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    leave_type_code = serializers.CharField(source="leave_type.code", read_only=True)
    leave_type_label = serializers.CharField(source="leave_type.label", read_only=True)
    decision_by_name = serializers.CharField(source="decision_by.display_name", read_only=True)

    class Meta:
        model = LeaveRequest
        fields = (
            "id", "employee", "employee_name", "leave_type", "leave_type_code", "leave_type_label",
            "start_date", "end_date", "days", "reason", "status",
            "decision_by", "decision_by_name", "decision_at", "decision_notes",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "employee_name", "leave_type_code", "leave_type_label",
                             "decision_by", "decision_by_name", "decision_at",
                             "created_at", "updated_at")


class PublicHolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = PublicHoliday
        fields = ("id", "name", "date", "is_paid", "notes", "created_at")
        read_only_fields = ("id", "created_at")


class ClockEntrySerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employee_code = serializers.CharField(source="employee.employee_code", read_only=True)
    hours_worked = serializers.FloatField(read_only=True)

    class Meta:
        model = ClockEntry
        fields = (
            "id", "employee", "employee_name", "employee_code",
            "clock_in", "clock_out", "hours_worked",
            "notes", "location",
            "created_at", "updated_at",
        )
        read_only_fields = (
            "id", "employee_name", "employee_code", "hours_worked",
            "created_at", "updated_at",
        )

    def get_employee_name(self, obj):
        emp = obj.employee
        if not emp:
            return ""
        return f"{emp.first_name} {emp.last_name}".strip()
