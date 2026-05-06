from django.contrib import admin

from .models import Employee, PayrollEntry, PayrollPeriod


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("employee_code", "first_name", "last_name", "department", "job_title", "status", "base_salary")
    list_filter = ("status", "department", "pay_frequency")
    search_fields = ("employee_code", "first_name", "last_name", "email", "phone")
    readonly_fields = ("employee_code", "created_at", "updated_at")


class PayrollEntryInline(admin.TabularInline):
    model = PayrollEntry
    extra = 0
    fields = ("employee", "base_salary", "total_allowances", "total_deductions", "gross", "net")
    readonly_fields = ("total_allowances", "total_deductions", "gross", "net")


@admin.register(PayrollPeriod)
class PayrollPeriodAdmin(admin.ModelAdmin):
    list_display = ("name", "period_start", "period_end", "pay_date", "status", "employee_count", "total_net")
    list_filter = ("status",)
    search_fields = ("name",)
    readonly_fields = ("total_gross", "total_deductions", "total_net", "employee_count", "created_at", "updated_at")
    inlines = (PayrollEntryInline,)


@admin.register(PayrollEntry)
class PayrollEntryAdmin(admin.ModelAdmin):
    list_display = ("period", "employee", "gross", "total_deductions", "net", "paid_on")
    list_filter = ("period",)
    search_fields = ("employee__first_name", "employee__last_name", "employee__employee_code")
    readonly_fields = ("overtime_amount", "total_allowances", "total_deductions", "gross", "net", "created_at", "updated_at")
