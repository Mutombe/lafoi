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

    address_parts = []
    if co.get("address"):
        address_parts.append(co["address"])
    contact = " &middot; ".join(filter(None, [co.get("phone_primary"), co.get("email")]))
    if contact:
        address_parts.append(contact)
    if co.get("website"):
        address_parts.append(co["website"])
    address_html = "<br/>".join(address_parts)

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
    co_name = customer.name if customer else "—"
    parts = [Paragraph("BILL TO", st["LFEyebrow"]), Paragraph(co_name, st["LFValue"])]
    contact = customer.contact_person if customer else ""
    if contact:
        parts.append(Paragraph(contact, st["LFBodySmall"]))
    if customer and customer.email:
        parts.append(Paragraph(customer.email, st["LFBodySmall"]))
    if customer and customer.phone:
        parts.append(Paragraph(customer.phone, st["LFBodySmall"]))
    if customer and customer.address:
        parts.append(Paragraph(customer.address.replace("\n", "<br/>"), st["LFBodySmall"]))
    return parts


def _items_table(items, st, currency="USD"):
    head = [
        [
            Paragraph("DESCRIPTION", ParagraphStyle("h", parent=st["LFEyebrow"], textColor=colors.white, fontSize=8)),
            Paragraph("QTY", ParagraphStyle("h", parent=st["LFEyebrow"], textColor=colors.white, fontSize=8, alignment=TA_RIGHT)),
            Paragraph("UNIT", ParagraphStyle("h", parent=st["LFEyebrow"], textColor=colors.white, fontSize=8, alignment=TA_CENTER)),
            Paragraph("UNIT PRICE", ParagraphStyle("h", parent=st["LFEyebrow"], textColor=colors.white, fontSize=8, alignment=TA_RIGHT)),
            Paragraph("LINE TOTAL", ParagraphStyle("h", parent=st["LFEyebrow"], textColor=colors.white, fontSize=8, alignment=TA_RIGHT)),
        ]
    ]
    rows = []
    for it in items:
        rows.append([
            Paragraph(it.description or "", st["LFBody"]),
            Paragraph(f"{it.quantity:.2f}", ParagraphStyle("r", parent=st["LFBody"], alignment=TA_RIGHT)),
            Paragraph(it.unit or "", ParagraphStyle("c", parent=st["LFBody"], alignment=TA_CENTER)),
            Paragraph(_fmt_money(it.unit_price, currency), ParagraphStyle("r", parent=st["LFBody"], alignment=TA_RIGHT)),
            Paragraph(_fmt_money(it.line_total, currency), ParagraphStyle("r", parent=st["LFValue"], alignment=TA_RIGHT)),
        ])
    if not rows:
        rows.append([
            Paragraph("<i>No line items.</i>", st["LFBodySmall"]),
            "", "", "", "",
        ])

    table = Table(head + rows, colWidths=[None, 18 * mm, 18 * mm, 28 * mm, 28 * mm])
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
    # Zebra striping for body rows
    for i in range(1, len(head) + len(rows)):
        if i % 2 == 0:
            style.add("BACKGROUND", (0, i), (-1, i), BRAND_BG)
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
    line = " · ".join(filter(None, [co.get("name"), co.get("phone_primary"), co.get("email"), co.get("website")]))
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

    project = quotation.project
    customer = project.customer if project else None

    flow = []
    flow.append(_header_flowable("Quotation", quotation.number, st))
    flow.append(Spacer(1, 6))
    flow.append(_hr(1.2, BRAND_GREEN))
    flow.append(Spacer(1, 12))

    # Bill-to + meta — two columns
    meta_rows = [
        ("Issue date", quotation.issue_date.strftime("%d %b %Y") if quotation.issue_date else "—"),
        ("Valid until", quotation.expiry_date.strftime("%d %b %Y") if quotation.expiry_date else "—"),
        ("Project", f"{project.code} — {project.title}" if project else "—"),
        ("Status", quotation.get_status_display()),
    ]
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
        flow.append(Paragraph("TERMS", st["LFEyebrow"]))
        flow.append(Paragraph(quotation.terms.replace("\n", "<br/>"), st["LFBody"]))

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

    project = invoice.project
    customer = project.customer if project else None

    flow = []
    flow.append(_header_flowable("Invoice", invoice.number, st))
    flow.append(Spacer(1, 6))
    flow.append(_hr(1.2, BRAND_GREEN))
    flow.append(Spacer(1, 12))

    meta_rows = [
        ("Issue date", invoice.issue_date.strftime("%d %b %Y") if invoice.issue_date else "—"),
        ("Due date", invoice.due_date.strftime("%d %b %Y") if invoice.due_date else "—"),
        ("Project", f"{project.code} — {project.title}" if project else "—"),
        ("Status", invoice.get_status_display()),
    ]
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
    project = invoice.project if invoice else None
    customer = project.customer if project else None

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
        ("Project", f"{project.code} — {project.title}" if project else "—"),
    ]
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
