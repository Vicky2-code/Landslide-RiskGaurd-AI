from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.schemas.schemas import UserCreate, UserLogin, UserResponse, Token
from app.services.auth_service import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


class ProfileUpdate(BaseModel):
    name: str
    email: str


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str


@router.post("/register", response_model=Token)
def register(data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.patch("/profile", response_model=UserResponse)
def update_profile(data: ProfileUpdate, db: Session = Depends(get_db)):
    current = db.query(User).first()
    if not current:
        raise HTTPException(status_code=404, detail="User not found")
    existing = db.query(User).filter(User.email == data.email, User.id != current.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already in use")
    current.name = data.name
    current.email = data.email
    db.commit()
    db.refresh(current)
    return UserResponse.model_validate(current)


@router.patch("/password")
def update_password(data: PasswordUpdate, db: Session = Depends(get_db)):
    current = db.query(User).first()
    if not current:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(data.current_password, current.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current.password_hash = hash_password(data.new_password)
    db.commit()
    return {"ok": True, "message": "Password updated"}
