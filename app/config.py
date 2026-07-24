import os

default_db_path = "/data/kronos.db" if os.path.exists("/data") and os.access("/data", os.W_OK) else "./kronos.db"
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{default_db_path}")

raw_origins = os.environ.get("ALLOWED_ORIGINS", "*")
if raw_origins == "*":
    ALLOWED_ORIGINS = ["*"]
else:
    ALLOWED_ORIGINS = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "kronos_dev_secret_key_change_in_production_12345")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 24 * 7))  # 7 days

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GITHUB_CLIENT_ID = os.environ.get("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.environ.get("GITHUB_CLIENT_SECRET", "")


