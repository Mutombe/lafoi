from django.contrib.auth import get_user_model
from django.contrib.auth.models import update_last_login
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(read_only=True)
    avatar = serializers.ImageField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id", "username", "email", "first_name", "last_name", "phone",
            "role", "job_title", "is_active", "is_staff", "display_name", "avatar",
            "module_access",
            "date_joined", "last_login",
        )
        read_only_fields = ("id", "is_staff", "date_joined", "last_login", "display_name", "avatar")


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "phone", "role",
                   "job_title", "module_access", "password")

    def create(self, validated):
        password = validated.pop("password")
        user = User(**validated)
        user.set_password(password)
        user.save()
        return user


class UserPasswordResetSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, min_length=8)


class UserSelfUpdateSerializer(serializers.ModelSerializer):
    """Fields a signed-in user may edit on their OWN account.

    Excludes role / is_active / is_staff / module_access — those stay
    admin-only via the regular UserViewSet update path."""

    class Meta:
        model = User
        fields = ("first_name", "last_name", "email", "phone", "job_title")


class LafoiTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adds user object to the response so the frontend doesn't need a follow-up call."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["display_name"] = user.display_name
        return token

    def validate(self, attrs):
        # Accept EITHER a username or an email address (case-insensitive) in the
        # login field. Users naturally type their email, but SimpleJWT only
        # authenticates by USERNAME_FIELD (username), so an email login would
        # otherwise fail with "No active account found". Translate a matching
        # email to the real username before the parent runs its auth.
        from django.db.models import Q

        login = (attrs.get(self.username_field) or "").strip()
        if login:
            match = (
                User.objects.filter(Q(username__iexact=login) | Q(email__iexact=login))
                .order_by("-is_superuser", "id")
                .first()
            )
            if match:
                attrs[self.username_field] = match.username

        data = super().validate(attrs)
        # SimpleJWT doesn't touch `last_login` on token issuance — it has to
        # be done explicitly here for the Profile page (and any audit work)
        # to show meaningful sign-in timestamps. Only fires on full token
        # *obtain*, not on refresh, which is exactly what we want.
        update_last_login(None, self.user)
        data["user"] = UserSerializer(self.user, context=self.context).data
        return data
