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
