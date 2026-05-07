"""Payroll tests — focused on the new Time Clock module.

Covers:
- Happy path clock-in then clock-out
- Cannot clock in twice (open shift exists)
- Cannot clock out an already-closed entry
- `ClockEntry.hours_worked` calculation correctness
- `PayrollEntry.total_clock_hours()` sums entries inside the period range
"""
from datetime import date, datetime, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from .models import ClockEntry, Employee, PayrollEntry, PayrollPeriod


User = get_user_model()


class ClockEntryAPITests(TestCase):
    """API-level tests for the clock_in / clock_out custom actions."""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="hr_admin", password="pw12345", role="admin", is_staff=True,
        )
        cls.employee = Employee.objects.create(
            first_name="Tatenda", last_name="Moyo", email="t@example.com",
            base_salary=Decimal("1500"), currency="USD",
        )

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_clock_in_then_clock_out_happy_path(self):
        # Clock in
        resp = self.client.post(
            "/api/clock-entries/clock_in/",
            {"employee": self.employee.id, "location": "Studio A", "notes": "Morning shift"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        entry_id = resp.json()["id"]
        entry = ClockEntry.objects.get(pk=entry_id)
        self.assertIsNone(entry.clock_out)
        self.assertEqual(entry.location, "Studio A")
        self.assertEqual(entry.employee_id, self.employee.id)

        # Clock out
        resp = self.client.post(
            f"/api/clock-entries/{entry_id}/clock_out/",
            {"notes": "Wrapped up"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        entry.refresh_from_db()
        self.assertIsNotNone(entry.clock_out)
        self.assertIn("Wrapped up", entry.notes)
        self.assertIn("Morning shift", entry.notes)

    def test_cannot_clock_in_twice_without_clocking_out(self):
        # First clock-in succeeds
        resp = self.client.post(
            "/api/clock-entries/clock_in/",
            {"employee": self.employee.id},
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.content)

        # Second clock-in is rejected
        resp = self.client.post(
            "/api/clock-entries/clock_in/",
            {"employee": self.employee.id},
            format="json",
        )
        self.assertEqual(resp.status_code, 400, resp.content)
        self.assertIn("already clocked in", str(resp.content))

    def test_cannot_clock_out_a_closed_entry(self):
        entry = ClockEntry.objects.create(
            employee=self.employee,
            clock_in=timezone.now() - timedelta(hours=4),
            clock_out=timezone.now(),
        )
        resp = self.client.post(
            f"/api/clock-entries/{entry.pk}/clock_out/",
            {},
            format="json",
        )
        self.assertEqual(resp.status_code, 400, resp.content)
        self.assertIn("already closed", str(resp.content))


class ClockEntryHoursTests(TestCase):
    """Direct model tests for the hours_worked property."""

    @classmethod
    def setUpTestData(cls):
        cls.employee = Employee.objects.create(
            first_name="Rudo", last_name="Chari", base_salary=Decimal("1200"),
        )

    def test_hours_worked_returns_none_when_open(self):
        entry = ClockEntry.objects.create(
            employee=self.employee,
            clock_in=timezone.now(),
        )
        self.assertIsNone(entry.hours_worked)

    def test_hours_worked_calculates_correctly(self):
        start = timezone.now()
        entry = ClockEntry.objects.create(
            employee=self.employee,
            clock_in=start,
            clock_out=start + timedelta(hours=8, minutes=30),
        )
        # 8.5 hours
        self.assertEqual(entry.hours_worked, 8.5)

    def test_hours_worked_handles_short_shift(self):
        start = timezone.now()
        entry = ClockEntry.objects.create(
            employee=self.employee,
            clock_in=start,
            clock_out=start + timedelta(minutes=15),
        )
        # 0.25 hours
        self.assertEqual(entry.hours_worked, 0.25)


class PayrollEntryClockHoursTests(TestCase):
    """Verify PayrollEntry.total_clock_hours() sums clock entries in range."""

    @classmethod
    def setUpTestData(cls):
        cls.employee = Employee.objects.create(
            first_name="Farai", last_name="Ncube",
            base_salary=Decimal("2000"), currency="USD",
        )
        cls.period = PayrollPeriod.objects.create(
            name="May 2026",
            period_start=date(2026, 5, 1),
            period_end=date(2026, 5, 31),
        )
        cls.entry = PayrollEntry.objects.create(
            period=cls.period,
            employee=cls.employee,
            base_salary=Decimal("2000"),
        )

    def _make_clock(self, day, hours):
        """Helper — make a clock entry on `day` lasting `hours`."""
        start = timezone.make_aware(datetime(day.year, day.month, day.day, 8, 0))
        return ClockEntry.objects.create(
            employee=self.employee,
            clock_in=start,
            clock_out=start + timedelta(hours=hours),
        )

    def test_sums_multiple_entries_within_period(self):
        self._make_clock(date(2026, 5, 4), 8)
        self._make_clock(date(2026, 5, 5), 7.5)
        self._make_clock(date(2026, 5, 6), 4)
        total = self.entry.total_clock_hours()
        self.assertEqual(Decimal(str(total)), Decimal("19.5"))

    def test_excludes_entries_outside_period(self):
        # Inside period
        self._make_clock(date(2026, 5, 10), 6)
        # Before period
        before = timezone.make_aware(datetime(2026, 4, 28, 8, 0))
        ClockEntry.objects.create(
            employee=self.employee, clock_in=before, clock_out=before + timedelta(hours=5),
        )
        # After period
        after = timezone.make_aware(datetime(2026, 6, 2, 8, 0))
        ClockEntry.objects.create(
            employee=self.employee, clock_in=after, clock_out=after + timedelta(hours=5),
        )
        total = self.entry.total_clock_hours()
        self.assertEqual(Decimal(str(total)), Decimal("6"))

    def test_excludes_open_shifts(self):
        # Closed shift inside period — counts
        self._make_clock(date(2026, 5, 12), 8)
        # Open shift inside period — does NOT count
        open_start = timezone.make_aware(datetime(2026, 5, 14, 8, 0))
        ClockEntry.objects.create(
            employee=self.employee, clock_in=open_start, clock_out=None,
        )
        total = self.entry.total_clock_hours()
        self.assertEqual(Decimal(str(total)), Decimal("8"))

    def test_returns_zero_when_no_entries(self):
        total = self.entry.total_clock_hours()
        self.assertEqual(Decimal(str(total)), Decimal("0"))
