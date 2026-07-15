import os

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:////data/kronos.db")
