from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from config import (
    JWT_SECRET,
    JWT_ALGORITHM,
    JWT_EXPIRE_DAYS,
    ADMIN_JWT_SECRET,
    ADMIN_JWT_EXPIRE_DAYS,
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str, email: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS)
    payload = {"sub": user_id, "email": email, "role": role, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_admin_token(admin_id: str, email: str, role: str) -> str:
    """JWT admin séparé (spec §4) : signature propre, claim `role` (MODERATEUR/SUPERADMIN)."""
    expire = datetime.now(timezone.utc) + timedelta(days=ADMIN_JWT_EXPIRE_DAYS)
    payload = {"sub": admin_id, "email": email, "role": role, "exp": expire}
    return jwt.encode(payload, ADMIN_JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_admin_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, ADMIN_JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        return None


def create_reset_token(user_id: str) -> str:
    """Token de réinitialisation de mot de passe, valable 30 minutes."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=30)
    payload = {"sub": user_id, "type": "password_reset", "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_reset_token(token: str) -> str | None:
    """Retourne l'id utilisateur si le token est un token de reset valide, sinon None."""
    payload = decode_token(token)
    if payload and payload.get("type") == "password_reset":
        return payload.get("sub")
    return None


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        return None
