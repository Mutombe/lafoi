"""La Foi Designs — Dashboard backend settings."""
from datetime import timedelta
from pathlib import Path
import urllib.parse as _u

from decouple import Csv, config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config("SECRET_KEY", default="dev-insecure")
DEBUG = config("DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv())

# Render injects the public host of this service via RENDER_EXTERNAL_HOSTNAME.
# Append it automatically so a fresh deploy is reachable without manual config.
_render_host = config("RENDER_EXTERNAL_HOSTNAME", default="")
if _render_host and _render_host not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(_render_host)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "storages",
    # Local
    "accounts",
    "crm",
    "billing",
    "payroll",
    "compliance",
    "inventory",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    # WhiteNoise serves collected static files in production. Must come right
    # after SecurityMiddleware per the WhiteNoise docs.
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # Capture request user for audit-log signals (must run AFTER auth)
    "compliance.signals.AuditMiddleware",
]

ROOT_URLCONF = "lafoi_dashboard.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "lafoi_dashboard.wsgi.application"

# --- Database (Neon Postgres) ---
_db_url = config("DATABASE_URL")
_p = _u.urlparse(_db_url)
_q = dict(_u.parse_qsl(_p.query))
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": _p.path.lstrip("/"),
        "USER": _u.unquote(_p.username or ""),
        "PASSWORD": _u.unquote(_p.password or ""),
        "HOST": _p.hostname,
        "PORT": _p.port or 5432,
        "OPTIONS": {"sslmode": _q.get("sslmode", "require")},
        "CONN_MAX_AGE": 60,
    }
}

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Harare"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

# --- Media storage --------------------------------------------------------
# When AWS_STORAGE_BUCKET_NAME is set, route uploads to a Digital Ocean
# Spaces (S3-compatible) bucket. Without it, fall back to the local disk —
# fine for dev, but on Render the local disk is wiped on every redeploy.
AWS_STORAGE_BUCKET_NAME = config("AWS_STORAGE_BUCKET_NAME", default="")
AWS_S3_ENDPOINT_URL = config("AWS_S3_ENDPOINT_URL", default="")
AWS_S3_REGION_NAME = config("AWS_S3_REGION_NAME", default="sgp1")
AWS_ACCESS_KEY_ID = config("AWS_ACCESS_KEY_ID", default="")
AWS_SECRET_ACCESS_KEY = config("AWS_SECRET_ACCESS_KEY", default="")
AWS_S3_ADDRESSING_STYLE = "virtual"
AWS_S3_SIGNATURE_VERSION = "s3v4"
AWS_DEFAULT_ACL = "public-read"
AWS_QUERYSTRING_AUTH = False  # public URLs without signed-URL noise
AWS_S3_FILE_OVERWRITE = False  # never silently overwrite an upload
AWS_S3_OBJECT_PARAMETERS = {"CacheControl": "public, max-age=86400"}

if AWS_STORAGE_BUCKET_NAME and AWS_S3_ENDPOINT_URL:
    _media_storage = {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {
            "bucket_name": AWS_STORAGE_BUCKET_NAME,
            "endpoint_url": AWS_S3_ENDPOINT_URL,
            "region_name": AWS_S3_REGION_NAME,
            "access_key": AWS_ACCESS_KEY_ID,
            "secret_key": AWS_SECRET_ACCESS_KEY,
            "default_acl": AWS_DEFAULT_ACL,
            "querystring_auth": AWS_QUERYSTRING_AUTH,
            "file_overwrite": AWS_S3_FILE_OVERWRITE,
            "addressing_style": AWS_S3_ADDRESSING_STYLE,
            "signature_version": AWS_S3_SIGNATURE_VERSION,
            "object_parameters": AWS_S3_OBJECT_PARAMETERS,
            "location": "media",  # all uploads namespaced under <bucket>/media/
        },
    }
else:
    _media_storage = {"BACKEND": "django.core.files.storage.FileSystemStorage"}

# WhiteNoise compressed manifest storage — fingerprinted assets, gzip + brotli.
STORAGES = {
    "default": _media_storage,
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- DRF + JWT ---
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    # Configurable page size via ?page_size= up to a hard cap, to support 1M+ row datasets.
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 25,
}

# Override the default pagination class to honour `?page_size=` from the
# client (capped at 250). Configured below the REST_FRAMEWORK dict to avoid
# bloating that block.
REST_FRAMEWORK["DEFAULT_PAGINATION_CLASS"] = "lafoi_dashboard.pagination.ScalablePageNumberPagination"

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# --- CORS ---
CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:5173,http://127.0.0.1:5173",
    cast=Csv(),
)
CORS_ALLOW_CREDENTIALS = True

# Origins permitted to make state-changing (non-GET) requests. Mirrors CORS in
# practice but is the explicit Django CSRF gate. Set this to your frontend
# production URL via env var.
CSRF_TRUSTED_ORIGINS = config(
    "CSRF_TRUSTED_ORIGINS",
    default="http://localhost:5173,http://127.0.0.1:5173",
    cast=Csv(),
)

# --- Production security ---
# Render terminates TLS at the edge and forwards X-Forwarded-Proto, so we
# trust that header to know whether the original request was HTTPS.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=True, cast=bool)
    SECURE_HSTS_SECONDS = config("SECURE_HSTS_SECONDS", default=31536000, cast=int)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

# --- Company branding (used by PDF generators) ---
COMPANY = {
    "name": config("COMPANY_NAME", default="La Foi Designs"),
    "tagline": config("COMPANY_TAGLINE", default="Stretch Ceilings and Lighting"),
    "address": config("COMPANY_ADDRESS", default=""),
    "phone_primary": config("COMPANY_PHONE_PRIMARY", default=""),
    "phone_secondary": config("COMPANY_PHONE_SECONDARY", default=""),
    "email": config("COMPANY_EMAIL", default=""),
    "website": config("COMPANY_WEBSITE", default=""),
    "color_green": "#1A8A2E",
    "color_green_light": "#22C55E",
    "color_green_dark": "#15572E",
    "color_dark": "#111111",
    "color_cream": "#FAFAF8",
    "color_gray": "#4A4A4A",
}

# Path to the brand logo for use in PDF generation. Falls back gracefully if missing.
# Bundled inside backend/static/brand/ so prod deploys don't depend on the
# website/ folder existing alongside backend/. Override with the
# BRAND_LOGO_PATH env var if you keep the logo elsewhere.
BRAND_LOGO_PATH = Path(
    config("BRAND_LOGO_PATH", default=str(BASE_DIR / "static" / "brand" / "logo.png"))
)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "INFO"},
}
