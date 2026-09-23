from rest_framework import filters, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from compliance.permissions import HasModuleAccess

from .models import ContentBlock
from .serializers import ContentBlockSerializer


class ContentBlockViewSet(viewsets.ModelViewSet):
    """Authenticated CRUD over website content blocks (module: website)."""
    queryset = ContentBlock.objects.all()
    serializer_class = ContentBlockSerializer
    permission_classes = [HasModuleAccess.for_module("website")]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    # NB: no "page" filter here — it collides with the pagination `?page=` param.
    # The admin fetches all blocks and filters by page client-side; the public
    # site-content view does its own (un-paginated) page lookup.
    filterset_fields = ["section", "type", "is_active"]
    search_fields = ["key", "label", "value", "section"]
    ordering_fields = ["order", "page", "section", "key", "updated_at"]
    ordering = ["page", "section", "order"]

    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


@api_view(["GET"])
@permission_classes([AllowAny])
def site_content(request):
    """Public, unauthenticated read used by the marketing site.

    Returns a flat map of ``"section.key" -> resolved value`` for the given
    ``?page=``. Without a page, returns every page nested under its slug.
    """
    page = request.query_params.get("page")
    qs = ContentBlock.objects.filter(is_active=True)
    if page:
        qs = qs.filter(page=page)

    out = {}
    for b in qs:
        if b.type == ContentBlock.Type.IMAGE and b.image:
            val = request.build_absolute_uri(b.image.url)
        else:
            val = b.value
        out.setdefault(b.page, {})[f"{b.section}.{b.key}"] = val

    return Response(out.get(page, {}) if page else out)
