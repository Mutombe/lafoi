from rest_framework import serializers

from .models import ContentBlock, MediaAsset


class ContentBlockSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    resolved = serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ContentBlock
        fields = (
            "id", "page", "section", "key", "type", "label", "help_text",
            "value", "image", "image_url", "resolved", "order", "is_active",
            "updated_by_name", "updated_at",
        )
        read_only_fields = ("image_url", "resolved", "updated_by_name", "updated_at")
        extra_kwargs = {
            "image": {"write_only": True, "required": False, "allow_null": True},
            "label": {"required": False},
            "section": {"required": False},
        }

    def _abs(self, url):
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request else url

    def get_image_url(self, obj):
        return self._abs(obj.image.url) if obj.image else None

    def get_resolved(self, obj):
        if obj.type == ContentBlock.Type.IMAGE and obj.image:
            return self._abs(obj.image.url)
        return obj.value

    def get_updated_by_name(self, obj):
        u = obj.updated_by
        return (u.get_full_name() or u.username) if u else None


class MediaAssetSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = MediaAsset
        fields = (
            "id", "title", "alt", "file", "external_url", "url", "source",
            "tags", "folder", "created_at",
        )
        read_only_fields = ("url", "created_at")
        extra_kwargs = {
            "file": {"write_only": True, "required": False, "allow_null": True},
            "title": {"required": False},
        }

    def get_url(self, obj):
        u = obj.url
        if not u:
            return None
        if u.startswith("http") or u.startswith("/"):
            request = self.context.get("request")
            # Uploaded files may be relative (local storage) — absolutise those.
            if obj.file and request:
                return request.build_absolute_uri(u)
            return u
        request = self.context.get("request")
        return request.build_absolute_uri(u) if request else u
