"""Server-side watermarking for secure design shares.

Every asset a client views is re-encoded and stamped with their name +
"La Foi Designs · Confidential" tiled diagonally across the image, so a
screenshot or photo of the screen carries the mark and identifies the client.
Images are downscaled and re-saved as lossy JPEG so the delivered pixels are
never the original file. PDFs are rasterised page-by-page (never a downloadable
vector PDF) and watermarked the same way.
"""
import io
import math
from datetime import date

from PIL import Image, ImageDraw, ImageFont

_FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/arial.ttf",
]


def _font(size):
    for path in _FONT_CANDIDATES:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    try:
        return ImageFont.load_default(size=size)  # Pillow >= 10.1 scalable default
    except Exception:
        return ImageFont.load_default()


def _tiled_watermark(base: Image.Image, label: str) -> Image.Image:
    """Composite a repeated, rotated, semi-transparent label over `base`."""
    W, H = base.size
    fsize = max(15, int(W / 42))
    font = _font(fsize)

    # Build an oversized transparent layer, tile the text across it, rotate,
    # then centre-crop back to the image size so the diagonal fully covers it.
    diag = int(math.hypot(W, H)) + fsize * 2
    layer = Image.new("RGBA", (diag, diag), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    try:
        tw = int(draw.textlength(label, font=font))
    except Exception:
        tw = len(label) * fsize // 2
    step_x = tw + int(fsize * 3)
    step_y = int(fsize * 4.5)

    y = 0
    row = 0
    while y < diag:
        x = -(row % 2) * (step_x // 2)
        while x < diag:
            draw.text((x, y), label, font=font, fill=(255, 255, 255, 60))
            draw.text((x + 1, y + 1), label, font=font, fill=(0, 0, 0, 40))
            x += step_x
        y += step_y
        row += 1

    layer = layer.rotate(30, expand=False)
    left = (diag - W) // 2
    top = (diag - H) // 2
    layer = layer.crop((left, top, left + W, top + H))

    out = Image.alpha_composite(base.convert("RGBA"), layer)
    return out.convert("RGB")


def watermark_image_bytes(src: bytes, label: str, max_dim: int = 1600, quality: int = 68) -> bytes:
    """Return watermarked JPEG bytes for an image, downscaled + re-encoded."""
    img = Image.open(io.BytesIO(src))
    if img.mode in ("RGBA", "P", "LA"):
        img = img.convert("RGB")
    if max(img.size) > max_dim:
        img.thumbnail((max_dim, max_dim), Image.LANCZOS)
    stamped = _tiled_watermark(img, label)
    buf = io.BytesIO()
    stamped.save(buf, "JPEG", quality=quality, optimize=True)
    return buf.getvalue()


def pdf_page_count(src: bytes) -> int:
    import fitz
    with fitz.open(stream=src, filetype="pdf") as doc:
        return doc.page_count


def watermark_pdf_page_bytes(src: bytes, page_index: int, label: str, dpi: int = 110) -> bytes:
    """Rasterise one PDF page and return it as a watermarked JPEG."""
    import fitz
    with fitz.open(stream=src, filetype="pdf") as doc:
        page_index = max(0, min(page_index, doc.page_count - 1))
        pix = doc[page_index].get_pixmap(dpi=dpi)
        png = pix.tobytes("png")
    return watermark_image_bytes(png, label, max_dim=1700, quality=72)


def label_for(client_name: str) -> str:
    return f"{client_name}  ·  La Foi Designs  ·  CONFIDENTIAL  ·  {date.today():%d %b %Y}"
