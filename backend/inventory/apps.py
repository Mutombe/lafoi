from django.apps import AppConfig


class InventoryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'inventory'

    def ready(self):
        # Wire post_save signals that fire low-stock alerts automatically.
        from . import signals  # noqa: F401
