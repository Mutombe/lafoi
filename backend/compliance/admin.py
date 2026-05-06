from django.contrib import admin

from .models import AuditLog, ExchangeRate, StatutoryRate, TaxBracket, TaxBracketSet


class TaxBracketInline(admin.TabularInline):
    model = TaxBracket
    extra = 0


@admin.register(TaxBracketSet)
class TaxBracketSetAdmin(admin.ModelAdmin):
    list_display = ("name", "currency", "effective_from", "effective_to", "aids_levy_rate", "is_active")
    list_filter = ("currency", "is_active")
    search_fields = ("name", "notes")
    inlines = (TaxBracketInline,)


@admin.register(StatutoryRate)
class StatutoryRateAdmin(admin.ModelAdmin):
    list_display = ("code", "currency", "value", "effective_from", "effective_to", "is_active")
    list_filter = ("code", "currency", "is_active")
    search_fields = ("code", "label", "notes")


@admin.register(ExchangeRate)
class ExchangeRateAdmin(admin.ModelAdmin):
    list_display = ("base", "quote", "rate", "as_of")
    list_filter = ("base", "quote")


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "action", "model_label", "object_id", "actor_username", "object_repr")
    list_filter = ("action", "model_label")
    search_fields = ("object_id", "object_repr", "actor_username", "summary")
    readonly_fields = (
        "action", "model_label", "object_id", "object_repr",
        "actor", "actor_username", "before", "after",
        "summary", "ip_address", "user_agent", "created_at",
    )

    def has_add_permission(self, request):
        return False
