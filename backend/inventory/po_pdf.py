"""Branded PDF generator for Purchase Orders.

Mirrors the visual language of `billing/pdf.py` (same palette, same Platypus
helpers) so a PO printed alongside a quotation/invoice/receipt looks like it
came out of the same studio.

Output format: A4 ReportLab Platypus. Output location: `default_storage`
(Digital Ocean Spaces in production, FileSystemStorage in dev).
"""
from __future__ import annotations

import io
from decimal import Decimal

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


# ---------------------------------------------------------------------------
# Mirrors billing/pdf.py palette so docs look uniform across the suite.
# ---------------------------------------------------------------------------
BRAND_GREEN = colors.HexColor("#1A8A2E")
BRAND_DARK = colors.HexColor("#111111")
BRAND_GRAY = colors.HexColor("#4A4A4A")
BRAND_GRAY_LIGHT = colors.HexColor("#9CA3AF")
BRAND_LINE = colors.HexColor("#E5E5E5")
BRAND_BG = colors.HexColor("#FAFAF8")


def _styles():
    base = getSampleStyleSheet()
    base.add(ParagraphStyle(
        name="LFTitle", parent=base["Heading1"], fontName="Helvetica-Bold",
        fontSize=24, leading=28, textColor=BRAND_DARK, spaceBefore=0, spaceAfter=2,
    ))
    base.add(ParagraphStyle(
        name="LFEyebrow", parent=base["Normal"], fontName="Helvetica-Bold",
        fontSize=8, leading=10, textColor=BRAND_GREEN,
    ))
    base.add(ParagraphStyle(
        name="LFLabel", parent=base["Normal"], fontName="Helvetica",
        fontSize=8, leading=10, textColor=BRAND_GRAY_LIGHT,
    ))
    base.add(ParagraphStyle(
        name="LFValue", parent=base["Normal"], fontName="Helvetica-Bold",
        fontSize=10, leading=12, textColor=BRAND_DARK,
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
    return base


def _fmt_money(amount, currency: str = "USD") -> str:
    if amount is None:
        amount = Decimal("0")
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))
    return f"{currency} {amount:,.2f}"


def _company():
    return getattr(settings, "COMPANY", {})


def _logo_flowable(width_mm: float = 42):
    path = getattr(settings, "BRAND_LOGO_PATH", None)
    if not path or not path.exists():
        return None
    try:
        img = Image(str(path))
        iw, ih = img.imageWidth, img.imageHeight
        target_w = width_mm * mm
        scale = target_w / iw
        img.drawWidth = target_w
        img.drawHeight = ih * scale
        return img
    except Exception:
        return None


def _header(po, st):
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
        Paragraph(
            "PURCHASE ORDER",
            ParagraphStyle("DocLabel", parent=st["LFEyebrow"], textColor=BRAND_GREEN,
                           fontSize=10, alignment=TA_RIGHT, spaceAfter=2),
        ),
        Paragraph(
            po.reference,
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


def _hr(thickness=0.6, color=BRAND_LINE):
    t = Table([[" "]], colWidths=["*"], rowHeights=[1])
    t.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), thickness, color),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return t


def _supplier_block(supplier, st):
    parts = [Paragraph("SUPPLIER", st["LFEyebrow"])]
    if not supplier:
        parts.append(Paragraph("—", st["LFValue"]))
        return parts
    parts.append(Paragraph(supplier.name, st["LFValue"]))
    if supplier.contact_person:
        parts.append(Paragraph(supplier.contact_person, st["LFBodySmall"]))
    if supplier.email:
        parts.append(Paragraph(supplier.email, st["LFBodySmall"]))
    if supplier.phone:
        parts.append(Paragraph(supplier.phone, st["LFBodySmall"]))
    if supplier.address:
        parts.append(Paragraph(supplier.address.replace("\n", "<br/>"), st["LFBodySmall"]))
    return parts


def _meta(po, st):
    rows = [
        ("PO ref", po.reference),
        ("Status", po.get_status_display()),
        ("Issued", po.created_at.strftime("%d %b %Y") if po.created_at else "—"),
        ("Expected", po.expected_date.strftime("%d %b %Y") if po.expected_date else "—"),
        ("Currency", po.currency),
    ]
    data = [
        [Paragraph(label.upper(), st["LFLabel"]),
         Paragraph(value or "—", st["LFValue"])]
        for label, value in rows
    ]
    t = Table(data, colWidths=[26 * mm, None])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
    ]))
    return t


def _items_table(po, st):
    head = [[
        Paragraph("ITEM", ParagraphStyle("h", parent=st["LFEyebrow"], textColor=colors.white, fontSize=8)),
        Paragraph("SKU", ParagraphStyle("h", parent=st["LFEyebrow"], textColor=colors.white, fontSize=8)),
        Paragraph("QTY", ParagraphStyle("h", parent=st["LFEyebrow"], textColor=colors.white, fontSize=8, alignment=TA_RIGHT)),
        Paragraph("UNIT COST", ParagraphStyle("h", parent=st["LFEyebrow"], textColor=colors.white, fontSize=8, alignment=TA_RIGHT)),
        Paragraph("LINE TOTAL", ParagraphStyle("h", parent=st["LFEyebrow"], textColor=colors.white, fontSize=8, alignment=TA_RIGHT)),
    ]]
    rows = []
    for line in po.items.all():
        rows.append([
            Paragraph(line.item.name if line.item_id else "", st["LFBody"]),
            Paragraph(line.item.sku if line.item_id else "", st["LFBodySmall"]),
            Paragraph(f"{line.quantity:.2f} {line.item.unit if line.item_id else ''}",
                      ParagraphStyle("r", parent=st["LFBody"], alignment=TA_RIGHT)),
            Paragraph(_fmt_money(line.unit_cost, po.currency),
                      ParagraphStyle("r", parent=st["LFBody"], alignment=TA_RIGHT)),
            Paragraph(_fmt_money(line.line_total, po.currency),
                      ParagraphStyle("r", parent=st["LFValue"], alignment=TA_RIGHT)),
        ])
    if not rows:
        rows.append([Paragraph("<i>No line items.</i>", st["LFBodySmall"]), "", "", "", ""])

    table = Table(head + rows, colWidths=[None, 30 * mm, 22 * mm, 28 * mm, 28 * mm])
    style = TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_GREEN),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ])
    for i in range(1, len(head) + len(rows)):
        if i % 2 == 0:
            style.add("BACKGROUND", (0, i), (-1, i), BRAND_BG)
    style.add("LINEBELOW", (0, 0), (-1, -1), 0.4, BRAND_LINE)
    table.setStyle(style)
    return table


def _grand_total(po, st):
    grand = Table(
        [[
            Paragraph("TOTAL", st["LFGrandTotalLabel"]),
            Paragraph(_fmt_money(po.total, po.currency), st["LFGrandTotalValue"]),
        ]],
        colWidths=[None, 38 * mm],
    )
    grand.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BRAND_GREEN),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
    ]))
    wrap = Table([[Spacer(1, 0), grand]], colWidths=[None, 80 * mm])
    wrap.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return wrap


def _footer(canvas, doc):
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
# Public API
# ---------------------------------------------------------------------------
def render_purchase_order_pdf(po) -> bytes:
    """Return PDF bytes for the given PurchaseOrder instance."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=15 * mm, rightMargin=15 * mm,
        topMargin=15 * mm, bottomMargin=22 * mm,
        title=f"Purchase Order {po.reference}",
        author=_company().get("name", "La Foi Designs"),
    )
    st = _styles()

    flow = []
    flow.append(_header(po, st))
    flow.append(Spacer(1, 6))
    flow.append(_hr(1.2, BRAND_GREEN))
    flow.append(Spacer(1, 12))

    head = Table(
        [[_supplier_block(po.supplier, st), _meta(po, st)]],
        colWidths=[None, 80 * mm],
    )
    head.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    flow.append(head)
    flow.append(Spacer(1, 14))

    flow.append(_items_table(po, st))
    flow.append(Spacer(1, 10))
    flow.append(_grand_total(po, st))
    flow.append(Spacer(1, 16))

    if po.notes:
        flow.append(Paragraph("NOTES", st["LFEyebrow"]))
        flow.append(Paragraph(po.notes.replace("\n", "<br/>"), st["LFBody"]))

    doc.build(flow, onFirstPage=_footer, onLaterPages=_footer)
    return buf.getvalue()


def store_purchase_order_pdf(po) -> str:
    """Render and persist the PDF for `po`. Returns the public URL.

    Storage backend follows `STORAGES["default"]` — Digital Ocean Spaces in
    production, local FileSystemStorage in dev. Returns the URL the storage
    backend exposes (signed or public depending on bucket ACL).
    """
    pdf_bytes = render_purchase_order_pdf(po)
    path = f"po/{po.reference}.pdf"
    # `default_storage.save` returns the actual saved path (may differ from the
    # requested path if file_overwrite is off and the file exists). We then
    # convert it to a URL the browser can hit.
    saved = default_storage.save(path, ContentFile(pdf_bytes))
    try:
        return default_storage.url(saved)
    except Exception:  # pragma: no cover — some storages can't make URLs
        return saved
