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


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
