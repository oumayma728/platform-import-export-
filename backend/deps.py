from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import prisma
from auth import decode_token, decode_admin_token

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
):
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token manquant")

    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")

    user = await prisma.utilisateur.find_unique(where={"id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur non trouvé")

    if user.validationStatus == "suspended":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Votre compte a été suspendu. Veuillez contacter l'administration.")

    return user


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
):
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload:
        return None
    return await prisma.utilisateur.find_unique(where={"id": payload["sub"]})


async def get_admin_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
):
    """Authentifie un administrateur via le JWT admin dédié (spec §4).

    Identité complètement séparée de `Utilisateur` : un token utilisateur,
    même avec un rôle élevé, ne peut jamais accéder aux routes /admin.
    """
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token admin manquant")

    payload = decode_admin_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token admin invalide ou expiré")

    admin = await prisma.admin.find_unique(where={"id": payload["sub"]})
    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Compte admin introuvable")

    if not admin.isActive:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ce compte admin a été désactivé")

    return admin


async def get_superadmin(admin=Depends(get_admin_user)):
    """Restreint une action aux SUPERADMIN (création/désactivation d'admins, gestion des badges)."""
    if admin.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cette action est réservée aux super-administrateurs",
        )
    return admin
