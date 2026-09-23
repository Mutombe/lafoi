from django.contrib import admin

from .models import ContentBlock


@admin.register(ContentBlock)
class ContentBlockAdmin(admin.ModelAdmin):
    list_display = ("page", "section", "key", "type", "is_active", "updated_at")
    list_filter = ("page", "section", "type", "is_active")
    search_fields = ("page", "section", "key", "label", "value")
