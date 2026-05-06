"""Custom pagination — supports `?page_size=` from the client up to a hard cap.

Lets the dashboard ramp page sizes from 25 → 250 for power users browsing
large datasets without blowing the database open.
"""
from rest_framework.pagination import PageNumberPagination


class ScalablePageNumberPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 250
