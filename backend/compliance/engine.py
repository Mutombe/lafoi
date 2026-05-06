"""Tax / statutory calculation engine.

Pure functions on top of compliance models — no Django ORM mutations here.
Inputs are dates + decimal amounts; outputs are decimal amounts. Callers
(e.g. PayrollEntry.save) are responsible for snapshotting the rates used
back onto the entry.
"""
from __future__ import annotations

from dataclasses import dataclass, field, asdict
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from django.db.models import Q

from .models import StatutoryRate, TaxBracketSet


D0 = Decimal("0")
HUNDRED = Decimal("100")


def _round(value: Decimal) -> Decimal:
    return (value or D0).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


# ---------------------------------------------------------------------------
# Lookups
# ---------------------------------------------------------------------------

def get_active_bracket_set(currency: str, on_date) -> Optional[TaxBracketSet]:
    """Return the TaxBracketSet effective for `currency` on `on_date`, or None."""
    qs = TaxBracketSet.objects.filter(
        is_active=True,
        currency=currency,
        effective_from__lte=on_date,
    ).filter(Q(effective_to__isnull=True) | Q(effective_to__gte=on_date))
    return qs.order_by("-effective_from").first()


def get_statutory_value(code: str, on_date, currency: str = "") -> Optional[Decimal]:
    """Return the active StatutoryRate value for `code` on `on_date`.

    If `currency` is supplied, it must match. If blank, returns the rate-only
    (currency-agnostic) entry.
    """
    qs = StatutoryRate.objects.filter(
        is_active=True,
        code=code,
        effective_from__lte=on_date,
    ).filter(Q(effective_to__isnull=True) | Q(effective_to__gte=on_date))
    if currency:
        qs = qs.filter(Q(currency=currency) | Q(currency=""))
    rate = qs.order_by("-effective_from").first()
    return rate.value if rate else None


# ---------------------------------------------------------------------------
# Computation result
# ---------------------------------------------------------------------------

@dataclass
class TaxCalcResult:
    """Result of a complete statutory computation for one period."""

    gross: Decimal = D0
    paye: Decimal = D0
    aids_levy: Decimal = D0
    nssa_employee: Decimal = D0
    nssa_employer: Decimal = D0
    statutory_total: Decimal = D0      # employee-side only — what comes off their cheque
    snapshot: dict = field(default_factory=dict)  # input rates used (for audit)

    def to_dict(self) -> dict:
        return {
            "gross": str(self.gross),
            "paye": str(self.paye),
            "aids_levy": str(self.aids_levy),
            "nssa_employee": str(self.nssa_employee),
            "nssa_employer": str(self.nssa_employer),
            "statutory_total": str(self.statutory_total),
            "snapshot": self.snapshot,
        }


# ---------------------------------------------------------------------------
# PAYE
# ---------------------------------------------------------------------------

def compute_paye(gross: Decimal, currency: str, on_date) -> tuple[Decimal, dict]:
    """Apply the active bracket set to `gross`. Returns (tax, snapshot)."""
    if not gross or gross <= D0:
        return D0, {"reason": "non-positive gross"}

    bracket_set = get_active_bracket_set(currency, on_date)
    if bracket_set is None:
        return D0, {"reason": f"no PAYE brackets for {currency} on {on_date}"}

    # Find the bracket whose [lower, upper] contains `gross`.
    # Brackets are stored sorted by `sort_order` ascending. We trust user data here.
    matching = None
    for b in bracket_set.brackets.all().order_by("sort_order", "lower"):
        if gross >= b.lower and (b.upper is None or gross <= b.upper):
            matching = b
            break

    if matching is None:
        # Fall through — pick the highest bracket (top open-ended)
        matching = bracket_set.brackets.order_by("-sort_order").first()
        if matching is None:
            return D0, {"reason": "bracket set has no rows"}

    # ZIMRA-style lookup: tax = gross * rate% - fixed_deduction
    rate_decimal = (matching.rate or D0) / HUNDRED
    tax = gross * rate_decimal - (matching.fixed_deduction or D0)
    if tax < D0:
        tax = D0

    snapshot = {
        "bracket_set_id": bracket_set.id,
        "bracket_set_name": bracket_set.name,
        "currency": currency,
        "applied_bracket": {
            "id": matching.id,
            "lower": str(matching.lower),
            "upper": str(matching.upper) if matching.upper is not None else None,
            "rate": str(matching.rate),
            "fixed_deduction": str(matching.fixed_deduction),
        },
        "aids_levy_rate": str(bracket_set.aids_levy_rate),
    }
    return _round(tax), snapshot


def compute_aids_levy(paye: Decimal, currency: str, on_date) -> tuple[Decimal, dict]:
    """3% (configurable) of PAYE. Reads bracket-set's aids_levy_rate first; falls
    back to global StatutoryRate(AIDS_LEVY_PCT)."""
    if not paye or paye <= D0:
        return D0, {"reason": "no PAYE → no AIDS levy"}

    bracket_set = get_active_bracket_set(currency, on_date)
    rate = bracket_set.aids_levy_rate if bracket_set else None
    if rate is None:
        rate = get_statutory_value(StatutoryRate.Code.AIDS_LEVY_PCT, on_date)
    if rate is None:
        return D0, {"reason": "no AIDS levy rate configured"}

    levy = paye * (rate / HUNDRED)
    return _round(levy), {"rate_used": str(rate)}


# ---------------------------------------------------------------------------
# NSSA
# ---------------------------------------------------------------------------

def compute_nssa(gross: Decimal, currency: str, on_date) -> tuple[Decimal, Decimal, dict]:
    """Returns (employee_contribution, employer_contribution, snapshot)."""
    if not gross or gross <= D0:
        return D0, D0, {"reason": "non-positive gross"}

    emp_pct = get_statutory_value(StatutoryRate.Code.NSSA_EMPLOYEE_PCT, on_date)
    er_pct = get_statutory_value(StatutoryRate.Code.NSSA_EMPLOYER_PCT, on_date)
    ceiling = get_statutory_value(StatutoryRate.Code.NSSA_CEILING, on_date, currency=currency)

    if emp_pct is None and er_pct is None:
        return D0, D0, {"reason": "no NSSA rates configured"}

    insurable = gross
    if ceiling is not None and gross > ceiling:
        insurable = ceiling

    employee = (insurable * (emp_pct or D0) / HUNDRED) if emp_pct is not None else D0
    employer = (insurable * (er_pct or D0) / HUNDRED) if er_pct is not None else D0

    return _round(employee), _round(employer), {
        "insurable_earnings": str(insurable),
        "ceiling": str(ceiling) if ceiling is not None else None,
        "employee_pct": str(emp_pct) if emp_pct is not None else None,
        "employer_pct": str(er_pct) if er_pct is not None else None,
    }


# ---------------------------------------------------------------------------
# Top-level orchestrator
# ---------------------------------------------------------------------------

def compute_statutory(gross: Decimal, currency: str, on_date) -> TaxCalcResult:
    """Run the full statutory pipeline for one payslip. Returns a single result
    object with line items + a single audit snapshot.
    """
    paye, paye_snap = compute_paye(gross, currency, on_date)
    aids, aids_snap = compute_aids_levy(paye, currency, on_date)
    emp_nssa, er_nssa, nssa_snap = compute_nssa(gross, currency, on_date)

    statutory_total = paye + aids + emp_nssa

    return TaxCalcResult(
        gross=_round(gross),
        paye=paye,
        aids_levy=aids,
        nssa_employee=emp_nssa,
        nssa_employer=er_nssa,
        statutory_total=_round(statutory_total),
        snapshot={
            "computed_for_date": str(on_date),
            "currency": currency,
            "paye": paye_snap,
            "aids_levy": aids_snap,
            "nssa": nssa_snap,
        },
    )
