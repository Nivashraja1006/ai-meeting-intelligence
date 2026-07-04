from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import LoginRequest, RefreshRequest, SignupRequest, TokenResponse
from app.services.auth_service import authenticate_user, refresh_access_token, register_user

router = APIRouter()


@router.post("/signup", response_model=TokenResponse, status_code=201)
def signup(
    request: SignupRequest,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    _, tokens = register_user(db, request.email, request.password)
    return tokens


@router.post("/login", response_model=TokenResponse)
def login(
    request: LoginRequest,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    return authenticate_user(db, request.email, request.password)


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    request: RefreshRequest,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    return refresh_access_token(db, request.refresh_token)
