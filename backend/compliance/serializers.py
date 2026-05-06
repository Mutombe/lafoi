from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from .engine import compute_statutory
from .models import AuditLog, ExchangeRate, StatutoryRate, TaxBracket, TaxBracketSet


class TaxBracketSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxBracket
        fields = ("id", "sort_order", "lower", "upper", "rate", "fixed_deduction")
        read_only_fields = ("id",)


class TaxBracketSetSerializer(serializers.ModelSerializer):
    brackets = TaxBracketSerializer(many=True, required=False)

    class Meta:
        model = TaxBracketSet
        fields = (
            "id", "name", "currency", "effective_from", "effective_to",
            "aids_levy_rate", "notes", "is_active", "brackets",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def _save_brackets(self, bracket_set, brackets_data):
        if brackets_data is None:
            return
        bracket_set.brackets.all().delete()
        for idx, b in enumerate(brackets_data):
            TaxBracket.objects.create(bracket_set=bracket_set, sort_order=idx, **b)

    @transaction.atomic
    def create(self, validated):
        brackets = validated.pop("brackets", [])
        bracket_set = TaxBracketSet.objects.create(**validated)
        self._save_brackets(bracket_set, brackets)
        return bracket_set

    @transaction.atomic
    def update(self, instance, validated):
        brackets = validated.pop("brackets", None)
        for k, v in validated.items():
            setattr(instance, k, v)
        instance.save()
        self._save_brackets(instance, brackets)
        return instance


class StatutoryRateSerializer(serializers.ModelSerializer):
    code_label = serializers.CharField(source="get_code_display", read_only=True)

    class Meta:
        model = StatutoryRate
        fields = (
            "id", "code", "code_label", "label", "value", "currency",
            "effective_from", "effective_to", "is_active", "notes",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at", "code_label")


class ExchangeRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExchangeRate
        fields = ("id", "base", "quote", "rate", "as_of", "notes", "created_at")
        read_only_fields = ("id", "created_at")


class AuditLogSerializer(serializers.ModelSerializer):
    actor_display = serializers.SerializerMethodField()
    action_label = serializers.CharField(source="get_action_display", read_only=True)

    class Meta:
        model = AuditLog
        fields = (
            "id", "action", "action_label", "model_label", "object_id", "object_repr",
            "actor", "actor_display", "actor_username",
            "before", "after", "summary", "ip_address", "user_agent", "created_at",
        )
        read_only_fields = fields  # audit log is read-only via the API

    def get_actor_display(self, obj):
        if obj.actor:
            full = (obj.actor.first_name + " " + obj.actor.last_name).strip()
            return full or obj.actor.username
        return obj.actor_username or "system"


class PayeCalculatorSerializer(serializers.Serializer):
    """Validate input for the live PAYE preview endpoint."""

    gross = serializers.DecimalField(max_digits=14, decimal_places=2)
    currency = serializers.CharField(max_length=8, default="USD")
    on_date = serializers.DateField(required=False)

    def to_representation(self, instance):
        # `instance` is the validated data dict; engine called by the view.
        return instance
