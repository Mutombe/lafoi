from rest_framework.routers import DefaultRouter

from .views import (
    CategoryViewSet,
    ItemViewSet,
    MovementViewSet,
    PurchaseOrderViewSet,
    StockLocationViewSet,
    StockViewSet,
    SupplierViewSet,
)

router = DefaultRouter()
router.register('inventory-categories', CategoryViewSet, basename='inventory-category')
router.register('stock-locations', StockLocationViewSet, basename='stock-location')
router.register('suppliers', SupplierViewSet, basename='supplier')
router.register('items', ItemViewSet, basename='item')
router.register('stocks', StockViewSet, basename='stock')
router.register('movements', MovementViewSet, basename='movement')
router.register('purchase-orders', PurchaseOrderViewSet, basename='purchase-order')

urlpatterns = router.urls
