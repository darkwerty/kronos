import os
from urllib.parse import urlparse

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import DATABASE_URL


def ensure_sqlite_dir(url: str) -> None:
    """Creates the parent directory for a sqlite file:// URL, if any. Must run
    before the first real connection — SQLite's own connect() call creates the
    directory's *file*, but not the directory itself."""
    if not url.startswith("sqlite:"):
        return
    path = urlparse(url).path
    if path and path != ":memory:":
        directory = os.path.dirname(path)
        if directory:
            os.makedirs(directory, exist_ok=True)


engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


@event.listens_for(engine, "connect")
def _enable_foreign_keys(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def ensure_schema_migrated(engine_obj) -> None:
    """Añade automáticamente columnas que faltan en SQLite si la tabla fue creada por versiones anteriores."""
    from sqlalchemy import inspect, text

    inspector = inspect(engine_obj)
    tables = inspector.get_table_names()
    with engine_obj.begin() as conn:
        if "categories" in tables:
            columns = [c["name"] for c in inspector.get_columns("categories")]
            if "user_id" not in columns:
                conn.execute(text("ALTER TABLE categories ADD COLUMN user_id INTEGER"))
            if "color" not in columns:
                conn.execute(text("ALTER TABLE categories ADD COLUMN color VARCHAR DEFAULT '#6366f1'"))
            if "icon" not in columns:
                conn.execute(text("ALTER TABLE categories ADD COLUMN icon VARCHAR DEFAULT 'Tag'"))
            if "is_default" not in columns:
                conn.execute(text("ALTER TABLE categories ADD COLUMN is_default BOOLEAN DEFAULT 0"))

        if "habits" in tables:
            columns = [c["name"] for c in inspector.get_columns("habits")]
            if "user_id" not in columns:
                conn.execute(text("ALTER TABLE habits ADD COLUMN user_id INTEGER"))
            if "target_days" not in columns:
                conn.execute(text("ALTER TABLE habits ADD COLUMN target_days VARCHAR DEFAULT '1,2,3,4,5,6,7'"))
            if "category_id" not in columns:
                conn.execute(text("ALTER TABLE habits ADD COLUMN category_id INTEGER"))
            if "current_xp" not in columns:
                conn.execute(text("ALTER TABLE habits ADD COLUMN current_xp INTEGER DEFAULT 0"))
            if "level" not in columns:
                conn.execute(text("ALTER TABLE habits ADD COLUMN level INTEGER DEFAULT 1"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
