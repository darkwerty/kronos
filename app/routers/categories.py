from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import auth, crud
from app.database import get_db
from app.models import User
from app.schemas import CategoryCreate, CategoryOut

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
def list_categories(
    current_user: Optional[User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db),
):
    user_id = current_user.id if current_user else None
    return crud.list_categories(db, user_id=user_id)


@router.post("", response_model=CategoryOut, status_code=201)
def create_category(
    payload: CategoryCreate,
    current_user: Optional[User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db),
):
    user_id = current_user.id if current_user else None
    try:
        return crud.create_category(
            db, payload.name, payload.color, payload.icon, user_id=user_id
        )
    except crud.DuplicateNameError:
        raise HTTPException(
            status_code=400, detail="Ya existe una categoría con ese nombre."
        )


@router.get("/analytics")
def get_category_analytics(
    current_user: Optional[User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db),
):
    user_id = current_user.id if current_user else None
    return crud.get_category_analytics(db, user_id=user_id)
