"""Branded PDF generation for La Foi Designs business documents.

Uses ReportLab Platypus. Produces:
  - Quotations
  - Invoices
  - Receipts

The visual language matches the public site:
  - Fraunces-style serif headlines (rendered with Helvetica-Bold here for
    portability; safe across all systems).
  - La Foi green (#1A8A2E) accents — header bar, totals row, hairline rules.
  - Cream (#FAFAF8) page background avoided; we use white for print.
  - Logo (when available) rendered top-left of the header.
"""
from __future__ import annotations

import io
from decimal import Decimal
from typing import Iterable

from django.conf import settings
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


# ---------------------------------------------------------------------------
# Colour palette (mirrors front-end CSS tokens)
# ---------------------------------------------------------------------------
BRAND_GREEN = colors.HexColor("#1A8A2E")
BRAND_GREEN_LIGHT = colors.HexColor("#22C55E")
BRAND_GREEN_DARK = colors.HexColor("#15572E")
BRAND_DARK = colors.HexColor("#111111")
BRAND_GRAY = colors.HexColor("#4A4A4A")
BRAND_GRAY_LIGHT = colors.HexColor("#9CA3AF")
BRAND_LINE = colors.HexColor("#E5E5E5")
BRAND_BG = colors.HexColor("#FAFAF8")


# ---------------------------------------------------------------------------
# Styles
# ---------------------------------------------------------------------------
def _styles():
    base = getSampleStyleSheet()

    base.add(ParagraphStyle(
        name="LFTitle", parent=base["Heading1"], fontName="Helvetica-Bold",
        fontSize=24, leading=28, textColor=BRAND_DARK, spaceBefore=0, spaceAfter=2,
    ))
    base.add(ParagraphStyle(
        name="LFEyebrow", parent=base["Normal"], fontName="Helvetica-Bold",
        fontSize=8, leading=10, textColor=BRAND_GREEN,
        spaceBefore=0, spaceAfter=4,
    ))
    base.add(ParagraphStyle(
        name="LFLabel", parent=base["Normal"], fontName="Helvetica",
        fontSize=8, leading=10, textColor=BRAND_GRAY_LIGHT, spaceBefore=0, spaceAfter=2,
    ))
    base.add(ParagraphStyle(
        name="LFValue", parent=base["Normal"], fontName="Helvetica-Bold",
        fontSize=10, leading=12, textColor=BRAND_DARK, spaceAfter=4,
    ))
    base.add(ParagraphStyle(
        name="LFBody", parent=base["Normal"], fontName="Helvetica",
        fontSize=9, leading=12, textColor=BRAND_GRAY,
    ))
    base.add(ParagraphStyle(
        name="LFBodySmall", parent=base["Normal"], fontName="Helvetica",
        fontSize=8, leading=11, textColor=BRAND_GRAY,
    ))
    base.add(ParagraphStyle(
        name="LFAddress", parent=base["Normal"], fontName="Helvetica",
        fontSize=9, leading=12, textColor=BRAND_DARK,
    ))
    base.add(ParagraphStyle(
        name="LFTagline", parent=base["Normal"], fontName="Helvetica",
        fontSize=8, leading=10, textColor=BRAND_GRAY_LIGHT,
    ))
    base.add(ParagraphStyle(
        name="LFTotalLabel", parent=base["Normal"], fontName="Helvetica",
        fontSize=10, leading=12, textColor=BRAND_GRAY, alignment=TA_RIGHT,
    ))
    base.add(ParagraphStyle(
        name="LFTotalValue", parent=base["Normal"], fontName="Helvetica-Bold",
        fontSize=10, leading=12, textColor=BRAND_DARK, alignment=TA_RIGHT,
    ))
    base.add(ParagraphStyle(
        name="LFGrandTotalLabel", parent=base["Normal"], fontName="Helvetica-Bold",
        fontSize=12, leading=14, textColor=colors.white, alignment=TA_RIGHT,
    ))
    base.add(ParagraphStyle(
        name="LFGrandTotalValue", parent=base["Normal"], fontName="Helvetica-Bold",
        fontSize=14, leading=16, textColor=colors.white, alignment=TA_RIGHT,
    ))
    base.add(ParagraphStyle(
        name="LFFooter", parent=base["Normal"], fontName="Helvetica",
        fontSize=8, leading=10, textColor=BRAND_GRAY_LIGHT, alignment=TA_CENTER,
    ))
    return base


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _fmt_money(amount, currency: str = "USD") -> str:
    if amount is None:
        amount = Decimal("0")
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))
    sign = "-" if amount < 0 else ""
    abs_amt = abs(amount)
    return f"{sign}{currency} {abs_amt:,.2f}"


def _company():
    return getattr(settings, "COMPANY", {})


# ---------------------------------------------------------------------------
# Static reference data printed onto every billing document
# ---------------------------------------------------------------------------

BANK_DETAILS = {
    "bank": "CBZ",
    "branch": "Borrowdale",
    "account_name": "La Foi Designs (Pvt) Ltd",
    "usd_account": "02927377770013",
    "zwg_account": "02927377770023",
}

# Quotation-only terms blocks. Each entry is (heading, list_of_lines).
# Rendered as a stack of titled blocks at the bottom of the quotation.
QUOTATION_TERMS = [
    (
        "Warranty",
        [
            "Stretch ceiling PVC: 10 years.",
            "Delayed or incomplete payments will pause work and void the warranty.",
            "Water and electricity must be available on site.",
        ],
    ),
    (
        "Payment Terms",
        [
            "90% advance / 10% on completion.",
            "All payments made are non-refundable once work has commenced or after completion.",
            "Delayed or incomplete payments will pause work and void the warranty.",
            "Water and electricity must be available on site.",
        ],
    ),
    (
        "Lead Time / Waiting Period",
        [
            "The estimated lead time for project commencement is subject to size, design and scope.",
            "Small projects under 100 m² typically require 3 to 4 weeks from deposit confirmation to installation start date.",
            "Large projects exceeding 100 m² typically require 1 to 2 months.",
            "All ceilings are custom-made per client specifications, therefore lead time may differ based on design complexity, material selection and product requirements.",
        ],
    ),
    (
        "Work Execution",
        [
            "Completion within 10 working days after order, payment and design approval.",
            "Delays caused by other contractors or client work are not our responsibility.",
            "Scaffolding and site protection to be provided by client (extra if required).",
        ],
    ),
    (
        "General Terms",
        [
            "Extra work or materials needed on site will be charged separately.",
            "Openings for lights, grilles or other fixtures are not included unless quoted.",
            "Work based on regular hours (Sunday to Friday); night/weekend cost extra.",
            "Variations must be approved before execution.",
            "No 'pay-when-paid', bond or security cheques accepted.",
        ],
    ),
    (
        "Not Included",
        [
            "Spotlights, chandeliers, grilles, gypsum/MDF/aluminium boxes and image designs (unless quoted).",
            "Authority fees, approvals or access equipment above 3 m (unless stated).",
        ],
    ),
]


def _contact_lines(co: dict) -> list[str]:
    """Address + phones + email + website, as HTML-safe lines for header use."""
    lines = []
    if co.get("address"):
        lines.append(co["address"])
    phones = " &middot; ".join(filter(None, [co.get("phone_primary"), co.get("phone_secondary")]))
    contact = " &middot; ".join(filter(None, [phones, co.get("email")]))
    if contact:
        lines.append(contact)
    if co.get("website"):
        lines.append(co["website"])
    return lines


def _bank_details_flowable(st):
    """A bordered block listing bank account info — same layout on invoice, receipt and quotation."""
    title = Paragraph("BANK DETAILS", st["LFEyebrow"])
    rows = [
        ("Bank", BANK_DETAILS["bank"]),
        ("Branch", BANK_DETAILS["branch"]),
        ("Account name", BANK_DETAILS["account_name"]),
        ("USD account", BANK_DETAILS["usd_account"]),
        ("ZWG account", BANK_DETAILS["zwg_account"]),
    ]
    body = []
    for label, value in rows:
        body.append([
            Paragraph(label.upper(), st["LFLabel"]),
            Paragraph(value, st["LFValue"]),
        ])
    inner = Table(body, colWidths=[34 * mm, None])
    inner.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
    ]))
    wrap = Table([[title], [Spacer(1, 4)], [inner]], colWidths=[None])
    wrap.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.6, BRAND_GREEN),
        ("BACKGROUND", (0, 0), (-1, -1), BRAND_BG),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    return wrap


def _quotation_terms_flowable(st):
    """Six titled terms blocks. Quotation-only."""
    parts = []
    parts.append(Paragraph("TERMS &amp; CONDITIONS", st["LFEyebrow"]))
    parts.append(Spacer(1, 6))
    for heading, bullets in QUOTATION_TERMS:
        parts.append(Paragraph(heading, ParagraphStyle(
            "TermsHead", parent=st["LFValue"],
            fontSize=10, textColor=BRAND_GREEN, spaceAfter=2,
        )))
        bullet_html = "<br/>".join(f"&bull;&nbsp;&nbsp;{line}" for line in bullets)
        parts.append(Paragraph(bullet_html, st["LFBodySmall"]))
        parts.append(Spacer(1, 8))
    parts.append(Spacer(1, 4))
    parts.append(Paragraph(
        "We appreciate your consideration and look forward to working with you to deliver a high-quality, lasting ceiling solution.",
        ParagraphStyle("TermsOutro", parent=st["LFBodySmall"], textColor=BRAND_DARK, fontSize=8, leading=11),
    ))
    return parts


def _logo_flowable(width_mm: float = 45):
    """Return an Image flowable for the brand logo, or None if file missing."""
    path = getattr(settings, "BRAND_LOGO_PATH", None)
    if not path or not path.exists():
        return None
    try:
        img = Image(str(path))
        # scale to target width preserving aspect ratio
        iw, ih = img.imageWidth, img.imageHeight
        target_w = width_mm * mm
        scale = target_w / iw
        img.drawWidth = target_w
        img.drawHeight = ih * scale
        return img
    except Exception:
        return None


def _header_flowable(doc_label: str, doc_number: str, st):
    """Top header — logo + brand block on left, document title + number on right."""
    co = _company()
    logo = _logo_flowable(width_mm=42)

    address_html = "<br/>".join(_contact_lines(co))

    left = []
    if logo is not None:
        left.append(logo)
        left.append(Spacer(1, 4))
    left.append(Paragraph(co.get("name", "La Foi Designs"), st["LFTitle"]))
    if co.get("tagline"):
        left.append(Paragraph(co["tagline"], st["LFTagline"]))
    if address_html:
        left.append(Spacer(1, 3))
        left.append(Paragraph(address_html, st["LFBodySmall"]))

    right = [
        Paragraph(doc_label.upper(), ParagraphStyle(
            "DocLabel", parent=st["LFEyebrow"], textColor=BRAND_GREEN,
            fontSize=10, alignment=TA_RIGHT, spaceAfter=2,
        )),
        Paragraph(
            doc_number,
            ParagraphStyle("DocNumber", parent=st["LFTitle"],
                           fontSize=20, alignment=TA_RIGHT, textColor=BRAND_DARK),
        ),
    ]

    table = Table([[left, right]], colWidths=[None, 70 * mm])
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return table


def _hr(thickness: float = 0.6, color=BRAND_LINE):
    """Hairline rule via 1-row table."""
    t = Table([[" "]], colWidths=["*"], rowHeights=[1])
    t.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), thickness, color),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return t


def _meta_block(rows: Iterable[tuple], st):
    """Two-column meta table (label / value pairs). `rows` is an iterable of (label, value)."""
    data = []
    for label, value in rows:
        data.append([
            Paragraph(label.upper(), st["LFLabel"]),
            Paragraph(value or "—", st["LFValue"]),
        ])
    if not data:
        return Spacer(1, 0)
    t = Table(data, colWidths=[26 * mm, None])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
    ]))
    return t


def _bill_to(customer, st):
    """Build a BILL TO block.

    Accepts either a Customer instance OR a plain dict with the same
    keys (name, contact_person, email, phone, address). The dict form
    is used when the document was raised for a free-form recipient
    (no project, no customer record yet).
    """
    if customer is None:
        return [Paragraph("BILL TO", st["LFEyebrow"]), Paragraph("—", st["LFValue"])]
    get = (lambda key: customer.get(key, "")) if isinstance(customer, dict) else (lambda key: getattr(customer, key, "") or "")
    name = get("name") or "—"
    parts = [Paragraph("BILL TO", st["LFEyebrow"]), Paragraph(name, st["LFValue"])]
    contact = get("contact_person")
    if contact:
        parts.append(Paragraph(contact, st["LFBodySmall"]))
    email = get("email")
    if email:
        parts.append(Paragraph(email, st["LFBodySmall"]))
    phone = get("phone")
    if phone:
        parts.append(Paragraph(phone, st["LFBodySmall"]))
    address = get("address")
    if address:
        parts.append(Paragraph(address.replace("\n", "<br/>"), st["LFBodySmall"]))
    return parts


def _quotation_recipient(doc):
    """Resolve a Quotation or Invoice's recipient into something _bill_to can render.

    Precedence: project.customer -> standalone customer -> free-form
    recipient dict built from the doc's recipient_* fields.
    """
    if getattr(doc, "project_id", None) and doc.project and doc.project.customer_id:
        return doc.project.customer
    if getattr(doc, "customer_id", None):
        return doc.customer
    return {
        "name": getattr(doc, "recipient_name", ""),
        "contact_person": getattr(doc, "recipient_contact", ""),
        "email": getattr(doc, "recipient_email", ""),
        "phone": getattr(doc, "recipient_phone", ""),
        "address": getattr(doc, "recipient_address", ""),
    }


def _items_table(items, st, currency="USD"):
    head_row = [
        Paragraph("DESCRIPTION", ParagraphStyle("h", parent=st["LFEyebrow"], textColor=colors.white, fontSize=8)),
        Paragraph("QTY", ParagraphStyle("h", parent=st["LFEyebrow"], textColor=colors.white, fontSize=8, alignment=TA_RIGHT)),
        Paragraph("UNIT", ParagraphStyle("h", parent=st["LFEyebrow"], textColor=colors.white, fontSize=8, alignment=TA_CENTER)),
        Paragraph("UNIT PRICE", ParagraphStyle("h", parent=st["LFEyebrow"], textColor=colors.white, fontSize=8, alignment=TA_RIGHT)),
        Paragraph("LINE TOTAL", ParagraphStyle("h", parent=st["LFEyebrow"], textColor=colors.white, fontSize=8, alignment=TA_RIGHT)),
    ]

    # Group items by section while preserving sort order. Items without a
    # section land in an unnamed "Items" bucket rendered without a header.
    sections = []
    current = None
    for it in items:
        key = (getattr(it, "section", "") or "").strip()
        if not sections or sections[-1]["name"] != key:
            current = {"name": key, "items": [], "total": Decimal("0")}
            sections.append(current)
        current["items"].append(it)
        current["total"] += it.line_total or Decimal("0")

    table_rows = [head_row]
    section_indices = []   # rows where a section header sits
    subtotal_indices = []  # rows where a section subtotal sits

    show_sections = any(s["name"] for s in sections)

    for sec in sections:
        if show_sections and sec["name"]:
            section_indices.append(len(table_rows))
            table_rows.append([
                Paragraph(
                    sec["name"].upper(),
                    ParagraphStyle("sec", parent=st["LFEyebrow"], textColor=BRAND_GREEN_DARK, fontSize=9, leading=11),
                ),
                "", "", "", "",
            ])
        for it in sec["items"]:
            table_rows.append([
                Paragraph(it.description or "", st["LFBody"]),
                Paragraph(f"{it.quantity:.2f}", ParagraphStyle("r", parent=st["LFBody"], alignment=TA_RIGHT)),
                Paragraph(it.unit or "", ParagraphStyle("c", parent=st["LFBody"], alignment=TA_CENTER)),
                Paragraph(_fmt_money(it.unit_price, currency), ParagraphStyle("r", parent=st["LFBody"], alignment=TA_RIGHT)),
                Paragraph(_fmt_money(it.line_total, currency), ParagraphStyle("r", parent=st["LFValue"], alignment=TA_RIGHT)),
            ])
        # Subtotal row only when the section is named AND there's something
        # to roll up
        if show_sections and sec["name"] and sec["items"]:
            subtotal_indices.append(len(table_rows))
            table_rows.append([
                Paragraph(
                    f"Subtotal · {sec['name']}",
                    ParagraphStyle("subL", parent=st["LFBodySmall"], textColor=BRAND_GRAY, alignment=TA_RIGHT, fontSize=8),
                ),
                "", "", "",
                Paragraph(
                    _fmt_money(sec["total"], currency),
                    ParagraphStyle("subV", parent=st["LFValue"], alignment=TA_RIGHT, fontSize=9, textColor=BRAND_DARK),
                ),
            ])

    if len(table_rows) == 1:
        table_rows.append([Paragraph("<i>No line items.</i>", st["LFBodySmall"]), "", "", "", ""])

    table = Table(table_rows, colWidths=[None, 18 * mm, 18 * mm, 28 * mm, 28 * mm])
    style = TableStyle([
        # Header row — green fill, white text
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_GREEN),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("ALIGN", (2, 0), (2, -1), "CENTER"),
        ("ALIGN", (3, 0), (4, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ])
    # Zebra striping for body rows, skipping the section header + subtotal rows
    special = set(section_indices) | set(subtotal_indices)
    for i in range(1, len(table_rows)):
        if i in special:
            continue
        if i % 2 == 0:
            style.add("BACKGROUND", (0, i), (-1, i), BRAND_BG)
    # Section header — soft green band, span all columns
    for i in section_indices:
        style.add("BACKGROUND", (0, i), (-1, i), colors.HexColor("#EDF6EF"))
        style.add("SPAN", (0, i), (-1, i))
        style.add("LINEBELOW", (0, i), (-1, i), 0.4, BRAND_GREEN)
        style.add("TOPPADDING", (0, i), (-1, i), 10)
        style.add("BOTTOMPADDING", (0, i), (-1, i), 6)
    # Subtotal — hairline above + span label cells, value stays in last col
    for i in subtotal_indices:
        style.add("LINEABOVE", (0, i), (-1, i), 0.3, BRAND_LINE)
        style.add("SPAN", (0, i), (3, i))
        style.add("TOPPADDING", (0, i), (-1, i), 6)
        style.add("BOTTOMPADDING", (0, i), (-1, i), 8)
        style.add("ALIGN", (0, i), (3, i), "RIGHT")
    style.add("LINEBELOW", (0, 0), (-1, -1), 0.4, BRAND_LINE)
    table.setStyle(style)
    return table


def _totals_table(doc, st, currency="USD"):
    """Right-aligned totals block. `doc` should expose subtotal/discount_amount/tax_rate/tax_amount/total."""
    rows = []

    def line(label, value, value_style=None):
        rows.append([Paragraph(label, st["LFTotalLabel"]), Paragraph(value, value_style or st["LFTotalValue"])])

    line("Subtotal", _fmt_money(doc.subtotal, currency))
    if (doc.discount_amount or 0) > 0:
        line("Discount", "− " + _fmt_money(doc.discount_amount, currency))
    if (doc.tax_rate or 0) > 0:
        line(f"Tax ({doc.tax_rate}%)", _fmt_money(doc.tax_amount, currency))

    grand_label = "TOTAL"
    grand_value = _fmt_money(doc.total, currency)

    # Top-rows table (subtle, gray)
    sub_table = Table(rows, colWidths=[None, 38 * mm]) if rows else None
    if sub_table is not None:
        sub_table.setStyle(TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
        ]))

    # Grand total — green background, white text
    grand_table = Table(
        [[Paragraph(grand_label, st["LFGrandTotalLabel"]), Paragraph(grand_value, st["LFGrandTotalValue"])]],
        colWidths=[None, 38 * mm],
    )
    grand_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BRAND_GREEN),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
    ]))

    parts = []
    if sub_table is not None:
        parts.append(sub_table)
        parts.append(Spacer(1, 4))
    parts.append(grand_table)
    return parts


def _document_footer(canvas, doc):
    """Footer drawn on every page — company line + page number."""
    canvas.saveState()
    co = _company()
    canvas.setStrokeColor(BRAND_LINE)
    canvas.setLineWidth(0.4)
    canvas.line(15 * mm, 18 * mm, A4[0] - 15 * mm, 18 * mm)

    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(BRAND_GRAY_LIGHT)
    phones = " · ".join(filter(None, [co.get("phone_primary"), co.get("phone_secondary")]))
    line = " · ".join(filter(None, [co.get("name"), phones, co.get("email"), co.get("website")]))
    canvas.drawString(15 * mm, 12 * mm, line)
    canvas.drawRightString(A4[0] - 15 * mm, 12 * mm, f"Page {canvas.getPageNumber()}")
    canvas.restoreState()


# ---------------------------------------------------------------------------
# Public renderers
# ---------------------------------------------------------------------------

def render_quotation_pdf(quotation) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=15 * mm, rightMargin=15 * mm,
        topMargin=15 * mm, bottomMargin=22 * mm,
        title=f"Quotation {quotation.number}",
        author=_company().get("name", "La Foi Designs"),
    )
    st = _styles()

    project = quotation.project if quotation.project_id else None
    customer = _quotation_recipient(quotation)

    flow = []
    flow.append(_header_flowable("Quotation", quotation.number, st))
    flow.append(Spacer(1, 6))
    flow.append(_hr(1.2, BRAND_GREEN))
    flow.append(Spacer(1, 12))

    # Bill-to + meta — two columns. Project row is omitted entirely when
    # the quotation was raised for a customer / free-form recipient.
    meta_rows = [
        ("Issue date", quotation.issue_date.strftime("%d %b %Y") if quotation.issue_date else "—"),
        ("Valid until", quotation.expiry_date.strftime("%d %b %Y") if quotation.expiry_date else "—"),
    ]
    if project:
        meta_rows.append(("Project", f"{project.code} — {project.title}"))
    meta_rows.append(("Status", quotation.get_status_display()))
    bill_block = _bill_to(customer, st)
    meta_table = _meta_block(meta_rows, st)
    head_table = Table([[bill_block, meta_table]], colWidths=[None, 80 * mm])
    head_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    flow.append(head_table)
    flow.append(Spacer(1, 14))

    if quotation.subject:
        flow.append(Paragraph("RE", st["LFEyebrow"]))
        flow.append(Paragraph(quotation.subject, st["LFValue"]))
        flow.append(Spacer(1, 8))

    flow.append(_items_table(quotation.items.all(), st, currency=quotation.currency))
    flow.append(Spacer(1, 10))

    # Right-aligned totals
    totals_parts = _totals_table(quotation, st, currency=quotation.currency)
    totals_wrap = Table([[Spacer(1, 0)] + totals_parts], colWidths=[None] + [None] * len(totals_parts))
    # Simpler approach: place totals into a 2-col table where left is empty
    totals_inner = []
    for p in totals_parts:
        totals_inner.append([p])
    totals_block = Table([[Spacer(1, 0), totals_inner]], colWidths=[None, 80 * mm])
    totals_block.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    flow.append(totals_block)
    flow.append(Spacer(1, 16))

    if quotation.notes:
        flow.append(Paragraph("NOTES", st["LFEyebrow"]))
        flow.append(Paragraph(quotation.notes.replace("\n", "<br/>"), st["LFBody"]))
        flow.append(Spacer(1, 8))
    if quotation.terms:
        flow.append(Paragraph("ADDITIONAL TERMS", st["LFEyebrow"]))
        flow.append(Paragraph(quotation.terms.replace("\n", "<br/>"), st["LFBody"]))
        flow.append(Spacer(1, 10))

    # Bank details + the standard quotation terms blocks
    flow.append(_bank_details_flowable(st))
    flow.append(Spacer(1, 14))
    flow.extend(_quotation_terms_flowable(st))

    doc.build(flow, onFirstPage=_document_footer, onLaterPages=_document_footer)
    return buf.getvalue()


def render_invoice_pdf(invoice) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=15 * mm, rightMargin=15 * mm,
        topMargin=15 * mm, bottomMargin=22 * mm,
        title=f"Invoice {invoice.number}",
        author=_company().get("name", "La Foi Designs"),
    )
    st = _styles()

    project = invoice.project if invoice.project_id else None
    customer = _quotation_recipient(invoice)

    flow = []
    flow.append(_header_flowable("Invoice", invoice.number, st))
    flow.append(Spacer(1, 6))
    flow.append(_hr(1.2, BRAND_GREEN))
    flow.append(Spacer(1, 12))

    meta_rows = [
        ("Issue date", invoice.issue_date.strftime("%d %b %Y") if invoice.issue_date else "—"),
        ("Due date", invoice.due_date.strftime("%d %b %Y") if invoice.due_date else "—"),
    ]
    if project:
        meta_rows.append(("Project", f"{project.code} — {project.title}"))
    meta_rows.append(("Status", invoice.get_status_display()))
    bill_block = _bill_to(customer, st)
    meta_table = _meta_block(meta_rows, st)
    head_table = Table([[bill_block, meta_table]], colWidths=[None, 80 * mm])
    head_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    flow.append(head_table)
    flow.append(Spacer(1, 14))

    if invoice.subject:
        flow.append(Paragraph("RE", st["LFEyebrow"]))
        flow.append(Paragraph(invoice.subject, st["LFValue"]))
        flow.append(Spacer(1, 8))

    flow.append(_items_table(invoice.items.all(), st, currency=invoice.currency))
    flow.append(Spacer(1, 10))

    totals_parts = _totals_table(invoice, st, currency=invoice.currency)
    # Add Amount Paid + Balance Due rows after totals
    extra_rows = []
    if invoice.amount_paid and float(invoice.amount_paid) > 0:
        extra_rows.append([
            Paragraph("Amount paid", st["LFTotalLabel"]),
            Paragraph("− " + _fmt_money(invoice.amount_paid, invoice.currency), st["LFTotalValue"]),
        ])
        extra_rows.append([
            Paragraph("Balance due", ParagraphStyle("bd", parent=st["LFTotalLabel"], textColor=BRAND_DARK, fontSize=11)),
            Paragraph(
                _fmt_money(invoice.balance_due, invoice.currency),
                ParagraphStyle("bdv", parent=st["LFTotalValue"], textColor=BRAND_GREEN, fontSize=12),
            ),
        ])
    extra_block = None
    if extra_rows:
        extra_block = Table(extra_rows, colWidths=[None, 38 * mm])
        extra_block.setStyle(TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("LINEABOVE", (0, 0), (-1, 0), 0.4, BRAND_LINE),
        ]))

    totals_inner = [[p] for p in totals_parts]
    if extra_block:
        totals_inner.append([extra_block])
    totals_block = Table([[Spacer(1, 0), totals_inner]], colWidths=[None, 80 * mm])
    totals_block.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    flow.append(totals_block)
    flow.append(Spacer(1, 16))

    if invoice.notes:
        flow.append(Paragraph("NOTES", st["LFEyebrow"]))
        flow.append(Paragraph(invoice.notes.replace("\n", "<br/>"), st["LFBody"]))
        flow.append(Spacer(1, 8))
    if invoice.terms:
        flow.append(Paragraph("PAYMENT TERMS", st["LFEyebrow"]))
        flow.append(Paragraph(invoice.terms.replace("\n", "<br/>"), st["LFBody"]))
        flow.append(Spacer(1, 10))

    flow.append(_bank_details_flowable(st))

    doc.build(flow, onFirstPage=_document_footer, onLaterPages=_document_footer)
    return buf.getvalue()


def render_receipt_pdf(receipt) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=15 * mm, rightMargin=15 * mm,
        topMargin=15 * mm, bottomMargin=22 * mm,
        title=f"Receipt {receipt.number}",
        author=_company().get("name", "La Foi Designs"),
    )
    st = _styles()

    invoice = receipt.invoice
    project = (invoice.project if invoice and invoice.project_id else None)
    customer = _quotation_recipient(invoice) if invoice else None

    flow = []
    flow.append(_header_flowable("Receipt", receipt.number, st))
    flow.append(Spacer(1, 6))
    flow.append(_hr(1.2, BRAND_GREEN))
    flow.append(Spacer(1, 12))

    meta_rows = [
        ("Received on", receipt.received_at.strftime("%d %b %Y") if receipt.received_at else "—"),
        ("Method", receipt.get_method_display()),
        ("Reference", receipt.reference or "—"),
        ("Invoice", invoice.number if invoice else "—"),
    ]
    if project:
        meta_rows.append(("Project", f"{project.code} — {project.title}"))
    bill_block = _bill_to(customer, st)
    meta_table = _meta_block(meta_rows, st)
    head_table = Table([[bill_block, meta_table]], colWidths=[None, 80 * mm])
    head_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    flow.append(head_table)
    flow.append(Spacer(1, 18))

    # Big "amount received" hero block — green background with white text
    received_table = Table(
        [
            [
                Paragraph("AMOUNT RECEIVED", ParagraphStyle("eb", parent=st["LFEyebrow"], textColor=colors.white, fontSize=9)),
                "",
            ],
            [
                Paragraph(
                    _fmt_money(receipt.amount, invoice.currency if invoice else "USD"),
                    ParagraphStyle("amt", parent=st["LFGrandTotalValue"], fontSize=26, leading=30, alignment=TA_LEFT),
                ),
                Paragraph(
                    "RECEIVED WITH THANKS",
                    ParagraphStyle("rwt", parent=st["LFEyebrow"], textColor=colors.white, fontSize=9, alignment=TA_RIGHT),
                ),
            ],
        ],
        colWidths=[None, 70 * mm],
    )
    received_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BRAND_GREEN),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ("SPAN", (1, 0), (1, 1)),
    ]))
    flow.append(received_table)
    flow.append(Spacer(1, 14))

    if invoice:
        balance_table = Table([
            [Paragraph("Invoice total", st["LFTotalLabel"]), Paragraph(_fmt_money(invoice.total, invoice.currency), st["LFTotalValue"])],
            [Paragraph("Total paid to date", st["LFTotalLabel"]), Paragraph(_fmt_money(invoice.amount_paid, invoice.currency), st["LFTotalValue"])],
            [Paragraph("Balance remaining", ParagraphStyle("bd", parent=st["LFTotalLabel"], textColor=BRAND_DARK, fontSize=11)),
             Paragraph(_fmt_money(invoice.balance_due, invoice.currency), ParagraphStyle("bdv", parent=st["LFTotalValue"], textColor=BRAND_GREEN, fontSize=11))],
        ], colWidths=[None, 38 * mm])
        balance_table.setStyle(TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("LINEABOVE", (0, 2), (-1, 2), 0.4, BRAND_LINE),
        ]))
        balance_block = Table([[Spacer(1, 0), balance_table]], colWidths=[None, 80 * mm])
        balance_block.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ]))
        flow.append(balance_block)

    if receipt.notes:
        flow.append(Spacer(1, 12))
        flow.append(Paragraph("NOTES", st["LFEyebrow"]))
        flow.append(Paragraph(receipt.notes.replace("\n", "<br/>"), st["LFBody"]))

    flow.append(Spacer(1, 14))
    flow.append(_bank_details_flowable(st))

    doc.build(flow, onFirstPage=_document_footer, onLaterPages=_document_footer)
    return buf.getvalue()


def render_payslip_pdf(entry) -> bytes:
    """Payroll payslip — used by the payroll app via this shared module."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=15 * mm, rightMargin=15 * mm,
        topMargin=15 * mm, bottomMargin=22 * mm,
        title=f"Payslip {entry.employee.employee_code} {entry.period.name}",
        author=_company().get("name", "La Foi Designs"),
    )
    st = _styles()

    flow = []
    flow.append(_header_flowable("Payslip", f"{entry.employee.employee_code}", st))
    flow.append(Spacer(1, 6))
    flow.append(_hr(1.2, BRAND_GREEN))
    flow.append(Spacer(1, 12))

    emp = entry.employee
    period = entry.period

    # Two-column employee + period block
    emp_block = [
        Paragraph("EMPLOYEE", st["LFEyebrow"]),
        Paragraph(emp.full_name, st["LFValue"]),
        Paragraph(emp.job_title or "—", st["LFBodySmall"]),
        Paragraph(emp.department or "—", st["LFBodySmall"]),
        Paragraph(emp.email or emp.phone or "", st["LFBodySmall"]),
    ]
    period_rows = [
        ("Period", period.name),
        ("Pay date", period.pay_date.strftime("%d %b %Y") if period.pay_date else "—"),
        ("Frequency", emp.get_pay_frequency_display()),
        ("Currency", emp.currency),
    ]
    period_table = _meta_block(period_rows, st)
    head_table = Table([[emp_block, period_table]], colWidths=[None, 80 * mm])
    head_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    flow.append(head_table)
    flow.append(Spacer(1, 16))

    # Earnings table
    earnings_rows = [
        [Paragraph("EARNINGS", ParagraphStyle("h", parent=st["LFEyebrow"], textColor=colors.white, fontSize=9)),
         Paragraph("AMOUNT", ParagraphStyle("h", parent=st["LFEyebrow"], textColor=colors.white, fontSize=9, alignment=TA_RIGHT))],
        [Paragraph("Base salary", st["LFBody"]), Paragraph(_fmt_money(entry.base_salary, emp.currency), ParagraphStyle("r", parent=st["LFValue"], alignment=TA_RIGHT))],
    ]
    if entry.overtime_amount and float(entry.overtime_amount) > 0:
        earnings_rows.append([
            Paragraph(f"Overtime ({entry.overtime_hours}h × {entry.overtime_rate})", st["LFBody"]),
            Paragraph(_fmt_money(entry.overtime_amount, emp.currency), ParagraphStyle("r", parent=st["LFValue"], alignment=TA_RIGHT)),
        ])
    for a in (entry.allowances or []):
        earnings_rows.append([
            Paragraph(a.get("name", "Allowance"), st["LFBody"]),
            Paragraph(_fmt_money(Decimal(str(a.get("amount", 0))), emp.currency),
                      ParagraphStyle("r", parent=st["LFValue"], alignment=TA_RIGHT)),
        ])
    earnings_rows.append([
        Paragraph("<b>Gross</b>", st["LFBody"]),
        Paragraph("<b>" + _fmt_money(entry.gross, emp.currency) + "</b>",
                  ParagraphStyle("r", parent=st["LFValue"], alignment=TA_RIGHT)),
    ])
    earnings_table = Table(earnings_rows, colWidths=[None, 38 * mm])
    earnings_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_GREEN),
        ("LINEBELOW", (0, 0), (-1, -1), 0.3, BRAND_LINE),
        ("LINEABOVE", (0, -1), (-1, -1), 0.6, BRAND_DARK),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    flow.append(earnings_table)
    flow.append(Spacer(1, 12))

    # Deductions table
    ded_rows = [[
        Paragraph("DEDUCTIONS", ParagraphStyle("h", parent=st["LFEyebrow"], textColor=colors.white, fontSize=9)),
        Paragraph("AMOUNT", ParagraphStyle("h", parent=st["LFEyebrow"], textColor=colors.white, fontSize=9, alignment=TA_RIGHT)),
    ]]
    for d in (entry.deductions or []):
        ded_rows.append([
            Paragraph(d.get("name", "Deduction"), st["LFBody"]),
            Paragraph(_fmt_money(Decimal(str(d.get("amount", 0))), emp.currency),
                      ParagraphStyle("r", parent=st["LFValue"], alignment=TA_RIGHT)),
        ])
    if not entry.deductions:
        ded_rows.append([Paragraph("<i>No deductions.</i>", st["LFBodySmall"]), ""])
    ded_rows.append([
        Paragraph("<b>Total deductions</b>", st["LFBody"]),
        Paragraph("<b>" + _fmt_money(entry.total_deductions, emp.currency) + "</b>",
                  ParagraphStyle("r", parent=st["LFValue"], alignment=TA_RIGHT)),
    ])
    ded_table = Table(ded_rows, colWidths=[None, 38 * mm])
    ded_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_DARK),
        ("LINEBELOW", (0, 0), (-1, -1), 0.3, BRAND_LINE),
        ("LINEABOVE", (0, -1), (-1, -1), 0.6, BRAND_DARK),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    flow.append(ded_table)
    flow.append(Spacer(1, 18))

    # Net pay hero block
    net_table = Table([[
        Paragraph("NET PAY", ParagraphStyle("eb", parent=st["LFEyebrow"], textColor=colors.white, fontSize=10)),
        Paragraph(
            _fmt_money(entry.net, emp.currency),
            ParagraphStyle("amt", parent=st["LFGrandTotalValue"], fontSize=22, leading=26, alignment=TA_RIGHT),
        ),
    ]], colWidths=[None, 60 * mm])
    net_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BRAND_GREEN),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
    ]))
    flow.append(net_table)

    if entry.notes:
        flow.append(Spacer(1, 12))
        flow.append(Paragraph("NOTES", st["LFEyebrow"]))
        flow.append(Paragraph(entry.notes.replace("\n", "<br/>"), st["LFBody"]))

    doc.build(flow, onFirstPage=_document_footer, onLaterPages=_document_footer)
    return buf.getvalue()
