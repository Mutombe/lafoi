"""Website CMS — editable content for the public marketing site.

A `ContentBlock` is one editable field on one page: a heading, a paragraph,
an image, a link. The public site fetches the active blocks for a page and
falls back to its own hard-coded defaults for any key that isn't present,
so the site never breaks if a block is missing.
"""
from django.conf import settings
from django.db import models


class ContentBlock(models.Model):
    class Type(models.TextChoices):
        TEXT = "text", "Short text"
        RICHTEXT = "richtext", "Paragraph"
        IMAGE = "image", "Image"
        URL = "url", "Link / URL"
        NUMBER = "number", "Number"
        BOOL = "bool", "Toggle"

    # Address: which page, which section of it, which field.
    page = models.CharField(max_length=64, db_index=True)
    section = models.CharField(max_length=64, default="general")
    key = models.CharField(max_length=64)

    type = models.CharField(max_length=16, choices=Type.choices, default=Type.TEXT)
    label = models.CharField(max_length=160, blank=True, help_text="Human name shown in the admin.")
    help_text = models.CharField(max_length=300, blank=True)

    # Value carriers: `value` holds text / url / number / bool-as-string, or an
    # image path/URL when an image block points at an existing asset. `image`
    # holds an uploaded file (DO Spaces / local). For an image block, an
    # uploaded file wins over `value`.
    value = models.TextField(blank=True)
    image = models.ImageField(blank=True, null=True, upload_to="website/")

    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="content_blocks",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("page", "section", "order", "key")
        unique_together = ("page", "section", "key")
        indexes = [models.Index(fields=["page", "section"])]

    def __str__(self):
        return f"{self.page}.{self.section}.{self.key}"

    @property
    def resolved(self):
        """The value the public site should render (relative URL for images)."""
        if self.type == self.Type.IMAGE and self.image:
            return self.image.url
        return self.value


class MediaAsset(models.Model):
    """A reusable image in the site media library.

    Either an uploaded `file` (DO Spaces / local) or an `external_url` that
    points at an existing bundled asset such as ``/brand/images/22.png``.
    """
    class Source(models.TextChoices):
        UPLOAD = "upload", "Uploaded"
        BRAND = "brand", "Brand library"

    title = models.CharField(max_length=200, blank=True)
    alt = models.CharField(max_length=300, blank=True, help_text="Describe the image for accessibility & SEO.")
    file = models.ImageField(blank=True, null=True, upload_to="website/media/")
    external_url = models.CharField(max_length=500, blank=True)
    source = models.CharField(max_length=16, choices=Source.choices, default=Source.UPLOAD)
    tags = models.JSONField(default=list, blank=True)
    folder = models.CharField(max_length=64, blank=True, help_text="Optional grouping, e.g. a page name.")

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="media_assets",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at", "title")
        indexes = [models.Index(fields=["source", "folder"])]

    def __str__(self):
        return self.title or self.external_url or (self.file.name if self.file else f"asset {self.pk}")

    @property
    def url(self):
        if self.file:
            return self.file.url
        return self.external_url
