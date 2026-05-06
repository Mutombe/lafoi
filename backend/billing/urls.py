from rest_framework.routers import DefaultRouter

from .views import InvoiceViewSet, QuotationViewSet, ReceiptViewSet

router = DefaultRouter()
router.register("quotations", QuotationViewSet, basename="quotation")
router.register("invoices", InvoiceViewSet, basename="invoice")
router.register("receipts", ReceiptViewSet, basename="receipt")

urlpatterns = router.urls
