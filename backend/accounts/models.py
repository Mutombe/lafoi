"""User accounts — extended `User` with role + per-module access flags."""
from django.contrib.auth.models import AbstractUser
from django.db import models


# Modules that admins can grant/revoke access to. Keep this list in sync with
# the `MODULE_TO_PERM_KEY` map in `compliance.permissions` and with the dashboard
# nav (DashboardLayout NAV array).
MODULES = (
    ("customers", "Customers"),
    ("projects", "Projects"),
    ("quotations", "Quotations"),
    ("invoices", "Invoices"),
    ("receipts", "Receipts"),
    ("expenses", "Cashflow (Income & Expenses)"),
    ("catalog", "Catalog (Products & Services)"),
    ("employees", "Employees"),
    ("payroll", "Payroll"),
    ("loans", "Loans & Advances"),
    ("leave", "Leave"),
    ("holidays", "Public Holidays"),
    ("time_clock", "Time Clock"),
    ("inventory", "Inventory"),
    ("compliance", "Tax & Compliance"),
    ("audit", "Audit Log"),
    ("users", "User Management"),
    ("map", "Studio Map"),
)
DEFAULT_MODULE_ACCESS = {key: True for key, _ in MODULES if key not in ("payroll", "employees", "loans", "compliance", "audit", "users")}


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Administrator"
        MANAGER = "manager", "Manager"
        STAFF = "staff", "Staff"

    role = models.CharField(max_length=16, choices=Role.choices, default=Role.STAFF)
    phone = models.CharField(max_length=32, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    job_title = models.CharField(max_length=120, blank=True)

    # Granular per-module access — admins flip these to grant/revoke pages
    # without changing the role. {"payroll": false, ...}. Admin role bypasses
    # this map entirely (sees everything). Default is sensible-non-sensitive.
    module_access = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ("first_name", "last_name", "username")

    @property
    def display_name(self) -> str:
        full = (self.first_name + " " + self.last_name).strip()
        return full or self.username

    def has_module(self, module: str) -> bool:
        """True if this user can access `module`. Admins always can."""
        if not self.is_active:
            return False
        if self.is_superuser or self.role == self.Role.ADMIN:
            return True
        access = self.module_access or {}
        return bool(access.get(module, False))

    def save(self, *args, **kwargs):
        # Seed defaults the first time the row is saved with no map.
        if not self.module_access:
            self.module_access = dict(DEFAULT_MODULE_ACCESS)
        super().save(*args, **kwargs)

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.display_name} ({self.role})"
