from django.apps import AppConfig


class ComplianceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'compliance'

    def ready(self):
        # Import signal handlers so they get wired into Django's signal registry
        from . import signals  # noqa: F401
