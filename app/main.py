from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import DATABASE_URL
from app.database import ensure_sqlite_dir
from app.routers import habits, logs


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_sqlite_dir(DATABASE_URL)
    yield


app = FastAPI(title="Kronos", version="0.2.0", lifespan=lifespan)

app.include_router(habits.router)
app.include_router(logs.router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
