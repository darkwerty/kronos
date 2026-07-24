from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import auth, config, schemas
from app.database import get_db
from app.models import Habit, User

from fastapi.responses import RedirectResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/github/callback")
@router.get("/github")
async def github_callback_redirect(code: str):
    """Redirige el callback GET de GitHub de vuelta al frontend con el código de autorización."""
    frontend_url = "http://localhost:5173"
    if config.ALLOWED_ORIGINS and config.ALLOWED_ORIGINS[0] != "*":
        frontend_url = config.ALLOWED_ORIGINS[0].rstrip("/")
    return RedirectResponse(url=f"{frontend_url}/?code={code}")



@router.get("/config")
def get_auth_config():
    """Retorna la configuración dinámica de Client IDs de Google y GitHub para el cliente React."""
    return {
        "google_client_id": config.GOOGLE_CLIENT_ID,
        "github_client_id": config.GITHUB_CLIENT_ID,
    }


@router.post("/google", response_model=schemas.TokenOut)
async def login_google(
    payload: schemas.GoogleLoginRequest,
    db: Session = Depends(get_db),
):
    """Autentica un usuario con ID Token de Google (o modo dev si ID token es 'mock_google_token')."""
    if payload.id_token.startswith("mock_google_token"):
        # Mock de desarrollo para testing sin API real de Google
        user_info = {
            "email": "dev.user@kronos.app",
            "name": "Usuario Dev Google",
            "picture": "https://lh3.googleusercontent.com/a/default-user=s96-c",
            "provider_user_id": "google_mock_12345",
        }
    else:
        user_info = await auth.verify_google_token(payload.id_token)

    email = user_info["email"]
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo obtener el correo electrónico de la cuenta de Google",
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            name=user_info.get("name"),
            picture=user_info.get("picture"),
            provider="google",
            provider_user_id=user_info["provider_user_id"],
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Actualizar foto o nombre si cambiaron
        if user_info.get("name"):
            user.name = user_info["name"]
        if user_info.get("picture"):
            user.picture = user_info["picture"]
        db.commit()

    token = auth.create_access_token(user_id=user.id, email=user.email)
    return schemas.TokenOut(access_token=token, user=user)


@router.post("/github", response_model=schemas.TokenOut)
async def login_github(
    payload: schemas.GithubLoginRequest,
    db: Session = Depends(get_db),
):
    """Autentica un usuario con código de autorización de GitHub (o modo dev si code es 'mock_github_code')."""
    if payload.code.startswith("mock_github_code"):
        user_info = {
            "email": "dev.github@kronos.app",
            "name": "Usuario Dev GitHub",
            "picture": "https://avatars.githubusercontent.com/u/9919?v=4",
            "provider_user_id": "github_mock_67890",
        }
    else:
        user_info = await auth.verify_github_code(
            code=payload.code,
            client_id=config.GITHUB_CLIENT_ID,
            client_secret=config.GITHUB_CLIENT_SECRET,
        )

    email = user_info["email"]
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            name=user_info.get("name"),
            picture=user_info.get("picture"),
            provider="github",
            provider_user_id=user_info["provider_user_id"],
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = auth.create_access_token(user_id=user.id, email=user.email)
    return schemas.TokenOut(access_token=token, user=user)


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: User = Depends(auth.get_current_user)):
    """Retorna los datos del usuario autenticado."""
    return current_user


@router.post("/sync-guest-habits")
def sync_guest_habits(
    payload: schemas.SyncGuestHabitsRequest,
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """Asocia una lista de hábitos creados sin usuario (modo invitado) al usuario autenticado actual."""
    if not payload.habit_ids:
        return {"synced_count": 0}

    unassigned_habits = (
        db.query(Habit)
        .filter(Habit.id.in_(payload.habit_ids), Habit.user_id == None)
        .all()
    )
    count = 0
    for h in unassigned_habits:
        h.user_id = current_user.id
        count += 1

    db.commit()
    return {"synced_count": count}
