import time

import jwt
from fastapi import HTTPException
from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .models import User


password_hash = PasswordHash.recommended()
_dummy_password_hash = password_hash.hash("beatnik-invalid-login-placeholder")


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str | None) -> bool:
    return password_hash.verify(password, hashed_password or _dummy_password_hash) and hashed_password is not None


def create_or_link_google_user(session: Session, google_claims: dict) -> User:
    google_sub = google_claims.get("sub")
    email = (google_claims.get("email") or "").strip().lower()
    if not google_sub or not email or not google_claims.get("email_verified"):
        raise HTTPException(status_code=401, detail="Google did not provide a verified email address.")

    user = session.scalar(select(User).where(User.google_sub == google_sub))
    if user is None:
        user = session.scalar(select(User).where(User.email == email))
        if user is not None and user.google_sub not in (None, google_sub):
            raise HTTPException(status_code=409, detail="This email is linked to another Google account.")
        if user is None:
            user = User(google_sub=google_sub, email=email)
            session.add(user)

    user.google_sub = google_sub
    user.email = email
    user.display_name = google_claims.get("name") or user.display_name
    user.picture_url = google_claims.get("picture") or user.picture_url
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(status_code=409, detail="This Google account is already linked.") from None
    session.refresh(user)
    return user


def create_email_user(session: Session, email: str, password: str, display_name: str | None) -> User:
    normalized_email = email.strip().lower()
    if session.scalar(select(User.id).where(User.email == normalized_email)) is not None:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    user = User(
        email=normalized_email,
        password_hash=hash_password(password),
        display_name=(display_name or "").strip() or None,
    )
    session.add(user)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists.") from None
    session.refresh(user)
    return user


def authenticate_email_user(session: Session, email: str, password: str) -> User:
    normalized_email = email.strip().lower()
    user = session.scalar(select(User).where(User.email == normalized_email))
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    return user


def create_access_token(user: User, jwt_secret: str) -> str:
    now = int(time.time())
    return jwt.encode(
        {
            "sub": str(user.id),
            "uid": user.id,
            "email": user.email,
            "name": user.display_name,
            "picture": user.picture_url,
            "google_sub": user.google_sub,
            "iat": now,
            "exp": now + 3600,
            "iss": "beatnik",
        },
        jwt_secret,
        algorithm="HS256",
    )
