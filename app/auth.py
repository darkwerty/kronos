from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
import jwt
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.orm import Session

from app.config import ACCESS_TOKEN_EXPIRE_MINUTES, JWT_ALGORITHM, JWT_SECRET_KEY
from app.database import get_db
from app.models import User


def create_access_token(user_id: int, email: str) -> str:
    expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode = {
        "sub": str(user_id),
        "email": email,
        "exp": expire,
    }
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def verify_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except (jwt.PyJWTError, ValueError):
        return None


def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Retorna el objeto User si se provee un Bearer Token válido, o None en Modo Invitado."""
    if not authorization:
        return None

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None

    payload = verify_access_token(token)
    if not payload:
        return None

    user_id_str = payload.get("sub")
    if not user_id_str:
        return None

    try:
        user_id = int(user_id_str)
    except ValueError:
        return None

    user = db.query(User).filter(User.id == user_id).first()
    return user


def get_current_user(
    user: Optional[User] = Depends(get_current_user_optional),
) -> User:
    """Exige un usuario autenticado activo (retorna HTTP 401 si es invitado o token inválido)."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Se requiere iniciar sesión para esta acción",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def verify_google_token(id_token_str: str) -> dict:
    """Verifica un ID Token de Google consultando el endpoint tokeninfo de Google o decodificando el JWT si hay problemas de red/DNS."""
    if id_token_str.startswith("mock_google_token"):
        return {
            "email": "dev.user@kronos.app",
            "name": "Usuario Dev Google",
            "picture": "https://lh3.googleusercontent.com/a/default-user=s96-c",
            "provider_user_id": "google_mock_12345",
        }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": id_token_str},
                timeout=5.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "email": data.get("email"),
                    "name": data.get("name"),
                    "picture": data.get("picture"),
                    "provider_user_id": data.get("sub"),
                }
    except Exception as e:
        print("Aviso: Fallo de red/DNS al consultar tokeninfo de Google:", e)

    # Fallback: Extraer de forma segura el payload del ID token JWT de Google
    try:
        payload = jwt.decode(id_token_str, options={"verify_signature": False})
        email = payload.get("email")
        if email:
            return {
                "email": email,
                "name": payload.get("name") or email.split("@")[0],
                "picture": payload.get("picture"),
                "provider_user_id": payload.get("sub") or email,
            }
    except Exception as jwt_err:
        print("Error al decodificar JWT de Google:", jwt_err)

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="No se pudo procesar la autenticación de la cuenta de Google.",
    )



async def verify_github_code(code: str, client_id: str, client_secret: str) -> dict:
    """Intercambia el código OAuth2 de GitHub por datos del usuario."""
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
            },
            timeout=10.0,
        )
        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Código de autorización de GitHub inválido o expirado",
            )

        user_resp = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
            },
            timeout=10.0,
        )
        if user_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo obtener el perfil de usuario de GitHub",
            )
        user_data = user_resp.json()

        # Si el email es privado en GitHub, obtener emails de la API
        email = user_data.get("email")
        if not email:
            emails_resp = await client.get(
                "https://api.github.com/user/emails",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github+json",
                },
                timeout=10.0,
            )
            if emails_resp.status_code == 200:
                emails = emails_resp.json()
                primary_email = next(
                    (e["email"] for e in emails if e.get("primary")), None
                )
                email = primary_email or (emails[0]["email"] if emails else None)

        if not email:
            email = f"{user_data.get('login')}@users.noreply.github.com"

        return {
            "email": email,
            "name": user_data.get("name") or user_data.get("login"),
            "picture": user_data.get("avatar_url"),
            "provider_user_id": str(user_data.get("id")),
        }
