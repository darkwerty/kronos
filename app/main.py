from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import crud
from app.config import ALLOWED_ORIGINS, DATABASE_URL
from app.database import Base, SessionLocal, engine, ensure_schema_migrated, ensure_sqlite_dir
from app.routers import auth, categories, habits, logs


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_sqlite_dir(DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    ensure_schema_migrated(engine)
    db = SessionLocal()
    try:
        crud.seed_default_categories(db)
    finally:
        db.close()
    yield



app = FastAPI(title="Kronos", version="0.4.0", lifespan=lifespan)

# CORS Middleware flexible para desarrollo y producción sin bloqueos de navegador
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(habits.router)
app.include_router(logs.router)
app.include_router(categories.router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
