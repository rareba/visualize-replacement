"""
Superset Configuration for LINDAS integration.
"""

import os
from datetime import timedelta

# -----------------------------------------------------------------------------
# SECRETS AND SECURITY
# -----------------------------------------------------------------------------
SECRET_KEY = os.environ.get("SUPERSET_SECRET_KEY", "your-secret-key-change-in-production")

# -----------------------------------------------------------------------------
# DATABASE CONFIGURATION
# -----------------------------------------------------------------------------
SQLALCHEMY_DATABASE_URI = os.environ.get(
    "DATABASE_URL",
    "postgresql://superset:superset@postgres:5432/superset"
)

# SQLAlchemy connection pool settings
SQLALCHEMY_POOL_SIZE = 5
SQLALCHEMY_POOL_TIMEOUT = 300
SQLALCHEMY_MAX_OVERFLOW = 10

# -----------------------------------------------------------------------------
# CACHE CONFIGURATION (Redis)
# -----------------------------------------------------------------------------
REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")

CACHE_CONFIG = {
    "CACHE_TYPE": "RedisCache",
    "CACHE_DEFAULT_TIMEOUT": 300,
    "CACHE_KEY_PREFIX": "superset_",
    "CACHE_REDIS_URL": REDIS_URL,
}

DATA_CACHE_CONFIG = {
    "CACHE_TYPE": "RedisCache",
    "CACHE_DEFAULT_TIMEOUT": 86400,  # 24 hours
    "CACHE_KEY_PREFIX": "superset_data_",
    "CACHE_REDIS_URL": REDIS_URL,
}

FILTER_STATE_CACHE_CONFIG = {
    "CACHE_TYPE": "RedisCache",
    "CACHE_DEFAULT_TIMEOUT": 86400,
    "CACHE_KEY_PREFIX": "superset_filter_",
    "CACHE_REDIS_URL": REDIS_URL,
}

EXPLORE_FORM_DATA_CACHE_CONFIG = {
    "CACHE_TYPE": "RedisCache",
    "CACHE_DEFAULT_TIMEOUT": 86400,
    "CACHE_KEY_PREFIX": "superset_explore_",
    "CACHE_REDIS_URL": REDIS_URL,
}

# -----------------------------------------------------------------------------
# CELERY CONFIGURATION
# -----------------------------------------------------------------------------
class CeleryConfig:
    broker_url = REDIS_URL
    result_backend = REDIS_URL
    imports = (
        "superset.sql_lab",
        "superset.tasks.scheduler",
    )
    task_annotations = {
        "sql_lab.get_sql_results": {
            "rate_limit": "100/s",
        },
    }

CELERY_CONFIG = CeleryConfig

# -----------------------------------------------------------------------------
# FEATURE FLAGS
# -----------------------------------------------------------------------------
FEATURE_FLAGS = {
    # Enable embedded dashboards and charts
    "EMBEDDED_SUPERSET": True,
    "EMBEDDABLE_CHARTS": True,

    # Dashboard features
    "DASHBOARD_NATIVE_FILTERS": True,
    "DASHBOARD_CROSS_FILTERS": True,
    "DASHBOARD_RBAC": True,

    # Other features
    "ENABLE_TEMPLATE_PROCESSING": True,
    "ALERT_REPORTS": True,
    "TAGGING_SYSTEM": True,
    "GLOBAL_ASYNC_QUERIES": True,

    # SQL Lab features
    "SQLLAB_BACKEND_PERSISTENCE": True,
    "ESTIMATE_QUERY_COST": False,
}

# -----------------------------------------------------------------------------
# EMBEDDING CONFIGURATION
# -----------------------------------------------------------------------------
# Allow embedding in iframes
HTTP_HEADERS = {
    "X-Frame-Options": "ALLOWALL",
}

# CORS configuration for embedded mode
ENABLE_CORS = True
CORS_OPTIONS = {
    "supports_credentials": True,
    "allow_headers": ["*"],
    "resources": ["*"],
    "origins": [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # Add production origins here
    ],
}

# Guest token configuration
GUEST_ROLE_NAME = "Gamma"
GUEST_TOKEN_JWT_SECRET = SECRET_KEY
GUEST_TOKEN_JWT_ALGO = "HS256"
GUEST_TOKEN_HEADER_NAME = "X-GuestToken"
GUEST_TOKEN_JWT_EXP_SECONDS = 3600  # 1 hour

# Public role for anonymous access (optional)
PUBLIC_ROLE_LIKE = "Gamma"

# -----------------------------------------------------------------------------
# SECURITY CONFIGURATION
# -----------------------------------------------------------------------------
# Enable row level security
ENABLE_ROW_LEVEL_SECURITY = True

# WTF CSRF configuration
WTF_CSRF_ENABLED = True
WTF_CSRF_EXEMPT_LIST = [
    "superset.views.api",
]

# Session configuration
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
SESSION_COOKIE_HTTPONLY = True

# Permanent session lifetime
PERMANENT_SESSION_LIFETIME = timedelta(hours=24)

# -----------------------------------------------------------------------------
# WEBSERVER CONFIGURATION
# -----------------------------------------------------------------------------
SUPERSET_WEBSERVER_PORT = 8088
SUPERSET_WEBSERVER_TIMEOUT = 300
SUPERSET_WEBSERVER_ADDRESS = "0.0.0.0"

# Enable async queries
SQLLAB_ASYNC_TIME_LIMIT_SEC = 300

# Query result row limit
ROW_LIMIT = 50000
SQL_MAX_ROW = 100000

# -----------------------------------------------------------------------------
# DATA SOURCES
# -----------------------------------------------------------------------------
# Default database for SQL Lab
SQLLAB_DEFAULT_DBID = None

# Allow file uploads
ALLOW_FILE_UPLOAD = False

# Custom database configuration for SPARQL proxy
PREFERRED_DATABASES = [
    "PostgreSQL",
    "MySQL",
    "SQLite",
]

# Extra database engine specs (if needed)
EXTRA_DATABASE_ENGINE_SPECS = {}

# -----------------------------------------------------------------------------
# LOGGING CONFIGURATION
# -----------------------------------------------------------------------------
LOG_FORMAT = "%(asctime)s:%(levelname)s:%(name)s:%(message)s"
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")

ENABLE_TIME_ROTATE = True
TIME_ROTATE_LOG_LEVEL = "DEBUG"
FILENAME = os.path.join("/app/superset_home", "superset.log")
ROLLOVER = "midnight"
INTERVAL = 1
BACKUP_COUNT = 30

# -----------------------------------------------------------------------------
# THUMBNAILS (for dashboard previews)
# -----------------------------------------------------------------------------
THUMBNAILS_SQLA_LISTENERS = True
THUMBNAIL_CACHE_CONFIG = {
    "CACHE_TYPE": "RedisCache",
    "CACHE_DEFAULT_TIMEOUT": 86400,
    "CACHE_KEY_PREFIX": "thumbnail_",
    "CACHE_REDIS_URL": REDIS_URL,
}

# -----------------------------------------------------------------------------
# ALERTS AND REPORTS
# -----------------------------------------------------------------------------
ALERT_REPORTS_NOTIFICATION_DRY_RUN = True
WEBDRIVER_TYPE = "chrome"
WEBDRIVER_OPTION_ARGS = [
    "--headless",
    "--no-sandbox",
    "--disable-dev-shm-usage",
]

# Email configuration (configure as needed)
SMTP_HOST = os.environ.get("SMTP_HOST", "localhost")
SMTP_STARTTLS = True
SMTP_SSL = False
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 25))
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_MAIL_FROM = os.environ.get("SMTP_MAIL_FROM", "noreply@superset.local")

# -----------------------------------------------------------------------------
# INTERNATIONALIZATION
# -----------------------------------------------------------------------------
BABEL_DEFAULT_LOCALE = "en"
LANGUAGES = {
    "en": {"flag": "us", "name": "English"},
    "de": {"flag": "de", "name": "German"},
    "fr": {"flag": "fr", "name": "French"},
    "it": {"flag": "it", "name": "Italian"},
}

# -----------------------------------------------------------------------------
# THEME CONFIGURATION
# -----------------------------------------------------------------------------
THEME_OVERRIDES = {
    "colors": {
        "primary": {
            "base": "#1890ff",
        },
    },
}
