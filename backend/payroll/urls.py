from rest_framework.routers import DefaultRouter

from .views import (
    ClockEntryViewSet,
    EmployeeLoanViewSet,
    EmployeeViewSet,
    LeaveBalanceViewSet,
    LeaveRequestViewSet,
    LeaveTypeViewSet,
    LoanRepaymentViewSet,
    PayrollEntryViewSet,
    PayrollPeriodViewSet,
    PublicHolidayViewSet,
    SalaryHistoryViewSet,
)

router = DefaultRouter()
router.register("employees", EmployeeViewSet, basename="employee")
router.register("payroll-periods", PayrollPeriodViewSet, basename="payroll-period")
router.register("payroll-entries", PayrollEntryViewSet, basename="payroll-entry")
router.register("salary-history", SalaryHistoryViewSet, basename="salary-history")
router.register("employee-loans", EmployeeLoanViewSet, basename="employee-loan")
router.register("loan-repayments", LoanRepaymentViewSet, basename="loan-repayment")
router.register("leave-types", LeaveTypeViewSet, basename="leave-type")
router.register("leave-balances", LeaveBalanceViewSet, basename="leave-balance")
router.register("leave-requests", LeaveRequestViewSet, basename="leave-request")
router.register("public-holidays", PublicHolidayViewSet, basename="public-holiday")
router.register("clock-entries", ClockEntryViewSet, basename="clock-entry")

urlpatterns = router.urls
