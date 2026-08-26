from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from database import prisma
from auth import hash_password, verify_password, create_access_token, create_reset_token, decode_reset_token
from deps import get_current_user
from emailer import send_email
from config import FRONTEND_URL
from datetime import datetime
import os

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _user_role(user, entreprise=None):
    if user.role == "admin":
        return "admin"
    if entreprise:
        return _normalize_role(entreprise.role)
    return "user"


def _normalize_role(role):
    """Normalise le rôle entreprise en valeurs canoniques lowercase
    ("both", "exporter", "importer") pour un affichage/stockage uniforme.
    Tolère les anciennes valeurs uppercase (BOTH, EXPORTATEUR, IMPORTATEUR)."""
    if not role:
        return "importer"
    r = str(role).strip().lower()
    if r in ("both", "exporter", "importer"):
        return r
    return "importer"


def _user_profile_status(user):
    return user.validationStatus or "pending"


class RegisterRequest(BaseModel):
    email: str
    password: str
    nom: str | None = None
    prenom: str | None = None
    telephone: str | None = None
    role: str | list[str] | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class ProfileUpdateRequest(BaseModel):
    companyName: str | None = None
    country: str | None = None
    sector: str | None = None
    certifications: list[str] | None = None
    description: str | None = None
    siret: str | None = None
    numeroTva: str | None = None
    role: str | None = None
    phone: str | None = None


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


@router.post("/register")
async def register(body: RegisterRequest):
    existing = await prisma.utilisateur.find_unique(where={"email": body.email})
    if existing:
        raise HTTPException(status_code=409, detail="Un compte existe déjà avec cet email")

    nom = body.nom or "Utilisateur"
    prenom = body.prenom or "Nouveau"

    user = await prisma.utilisateur.create(
        data={
            "email": body.email,
            "passwordHash": hash_password(body.password),
            "nom": nom,
            "prenom": prenom,
            "telephone": body.telephone,
            "validationStatus": "pending",
        }
    )

    user_role = "user"
    entreprise_obj = None
    if body.role:
        entreprise_role = body.role
        if isinstance(entreprise_role, list):
            if len(entreprise_role) == 2:
                entreprise_role = "both"
            elif "exporter" in entreprise_role:
                entreprise_role = "exporter"
            else:
                entreprise_role = "importer"
        else:
            entreprise_role = str(entreprise_role).lower()
            if entreprise_role not in ("exporter", "importer", "both"):
                entreprise_role = "importer"

        location = await prisma.location.create(
            data={"pays": "", "ville": "", "codePostal": "", "adresse": "", "region": ""}
        )
        entreprise_obj = await prisma.entreprise.create(
            data={
                "locationId": location.id,
                "nom": "Mon Entreprise",
                "role": entreprise_role,
            }
        )
        await prisma.utilisateur.update(where={"id": user.id}, data={"entrepriseId": entreprise_obj.id})

    token = create_access_token(user.id, user.email, user_role)
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "nom": user.nom,
            "prenom": user.prenom,
            "role": _user_role(user, entreprise_obj),
            "profileStatus": _user_profile_status(user),
        },
        "token": token,
    }


@router.post("/login")
async def login(body: LoginRequest):
    user = await prisma.utilisateur.find_unique(where={"email": body.email})
    if not user:
        # Les comptes administrateurs vivent dans une table séparée (spec §4) :
        # ils ne sont pas authentifiés ici, mais sur /admin/login. Un lien vers
        # cet espace est affiché sur la page de connexion publique.
        raise HTTPException(status_code=401, detail="Aucun compte associé à cet email. Inscrivez-vous d'abord.")
    if not verify_password(body.password, user.passwordHash):
        raise HTTPException(status_code=401, detail="Mot de passe incorrect.")

    if user.validationStatus == "suspended":
        raise HTTPException(status_code=403, detail="Votre compte a été suspendu. Veuillez contacter l'administration.")

    entreprise = None
    if user.entrepriseId:
        entreprise = await prisma.entreprise.find_unique(where={"id": user.entrepriseId})
    token = create_access_token(user.id, user.email, user.role)
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "nom": user.nom,
            "prenom": user.prenom,
            "telephone": user.telephone,
            "role": _user_role(user, entreprise),
            "profileStatus": _user_profile_status(user),
            "photoProfile": user.photoProfile,
        },
        "token": token,
    }


@router.get("/me")
async def get_me(user=Depends(get_current_user)):
    entreprise = None
    if user.entrepriseId:
        entreprise = await prisma.entreprise.find_unique(
            where={"id": user.entrepriseId},
            include={"location": True, "certifications": True, "badges": {"where": {"estActif": True}}},
        )

    profile = None
    if entreprise:
        certs = await prisma.entreprisecertification.find_many(where={"entrepriseId": entreprise.id})
        profile = {
            "companyName": entreprise.nom,
            "country": entreprise.location.pays if entreprise.location else "",
            "sector": entreprise.secteurActivite or "",
            "certifications": [c.nom for c in certs],
            "logoUrl": entreprise.logo,
            "description": entreprise.description,
        }

    return {
        "id": user.id,
        "email": user.email,
        "nom": user.nom,
        "prenom": user.prenom,
        "telephone": user.telephone,
        "role": _user_role(user, entreprise),
        "profileStatus": _user_profile_status(user),
        "photoProfile": user.photoProfile,
        "profile": profile,
    }


@router.put("/profile")
async def update_profile(body: ProfileUpdateRequest, user=Depends(get_current_user)):
    entreprise = None
    if user.entrepriseId:
        entreprise = await prisma.entreprise.find_unique(
            where={"id": user.entrepriseId}, include={"location": True}
        )

    if entreprise:
        if entreprise.locationId and body.country:
            await prisma.location.update(where={"id": entreprise.locationId}, data={"pays": body.country})

        await prisma.entreprise.update(
            where={"id": entreprise.id},
            data={
                **({"nom": body.companyName} if body.companyName else {}),
                **({"secteurActivite": body.sector} if body.sector else {}),
                **({"description": body.description} if body.description else {}),
                **({"siret": body.siret} if body.siret else {}),
                **({"numeroTva": body.numeroTva} if body.numeroTva else {}),
                **({"role": _normalize_role(body.role)} if body.role else {}),
            },
        )

        if body.certifications is not None:
            await prisma.entreprisecertification.delete_many(where={"entrepriseId": entreprise.id})
            for cert in body.certifications:
                await prisma.entreprisecertification.create(data={"entrepriseId": entreprise.id, "nom": cert})
    else:
        location = await prisma.location.create(
            data={"pays": body.country or "", "ville": "", "codePostal": "", "adresse": "", "region": ""}
        )
        entreprise = await prisma.entreprise.create(
            data={
                "locationId": location.id,
                "nom": body.companyName or "Mon Entreprise",
                "role": _normalize_role(body.role) if body.role else "importer",
                "secteurActivite": body.sector,
                "description": body.description,
                "siret": body.siret,
                "numeroTva": body.numeroTva,
            }
        )
        await prisma.utilisateur.update(where={"id": user.id}, data={"entrepriseId": entreprise.id})

        if body.certifications:
            for cert in body.certifications:
                await prisma.entreprisecertification.create(data={"entrepriseId": entreprise.id, "nom": cert})

    if body.phone is not None:
        await prisma.utilisateur.update(where={"id": user.id}, data={"telephone": body.phone})

    updated_user = await prisma.utilisateur.find_unique(where={"id": user.id})
    updated_entreprise = None
    if updated_user.entrepriseId:
        updated_entreprise = await prisma.entreprise.find_unique(where={"id": updated_user.entrepriseId})
    return {
        "id": updated_user.id,
        "email": updated_user.email,
        "nom": updated_user.nom,
        "prenom": updated_user.prenom,
        "telephone": updated_user.telephone,
        "profileStatus": _user_profile_status(updated_user),
        "role": _user_role(updated_user, updated_entreprise),
    }


@router.post("/resubmit")
async def resubmit(user=Depends(get_current_user)):
    """Soumission à nouveau d'un dossier rejeté (spec §5.1).

    Réouvre la MÊME ligne Utilisateur/Entreprise (pas de nouveau compte) et
    la repasse en attente de validation pour que l'admin la re-évalue.
    """
    if user.validationStatus != "rejected":
        raise HTTPException(status_code=400, detail="Seul un profil rejeté peut être soumis à nouveau")

    await prisma.utilisateur.update(where={"id": user.id}, data={"validationStatus": "pending"})

    # Les documents KYB repartent en attente de re-validation
    if user.entrepriseId:
        await prisma.documententreprise.update_many(
            where={"entrepriseId": user.entrepriseId, "statut": "rejete"},
            data={"statut": "en_attente", "motifRejet": None},
        )

    return {
        "success": True,
        "message": "Votre dossier a été soumis à nouveau et est en attente de validation.",
        "profileStatus": "pending",
    }


@router.post("/profile/logo")
async def upload_logo(file: UploadFile = File(...), user=Depends(get_current_user)):
    import os
    from config import UPLOAD_DIR

    logo_dir = os.path.join(UPLOAD_DIR, "logos")
    os.makedirs(logo_dir, exist_ok=True)

    ext = os.path.splitext(file.filename)[1] if file.filename else ".png"
    filename = f"logo-{int(__import__('time').time() * 1000)}{ext}"
    filepath = os.path.join(logo_dir, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    logo_url = f"/uploads/logos/{filename}"
    if user.entrepriseId:
        await prisma.entreprise.update(where={"id": user.entrepriseId}, data={"logo": logo_url})

    return {"logoUrl": logo_url}


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    user = await prisma.utilisateur.find_unique(where={"email": body.email})
    if not user:
        raise HTTPException(status_code=404, detail="Aucun compte associé à cet email. Vérifiez l'adresse ou inscrivez-vous.")

    token = create_reset_token(user.id)
    link = f"{FRONTEND_URL}/reset-password?token={token}"
    html = f"""
        <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #14161C;">Réinitialisation de votre mot de passe</h2>
          <p style="color: #6B6D76; line-height: 1.7;">Vous avez demandé un nouveau mot de passe sur la plateforme Indeed². Cliquez sur le bouton ci-dessous pour le modifier :</p>
          <a href="{link}" style="display: inline-block; margin: 16px 0; padding: 14px 24px; background: linear-gradient(135deg,#B8720A,#9C5E08); color: #fff; text-decoration: none; border-radius: 12px; font-weight: 700;">
            Réinitialiser mon mot de passe
          </a>
          <p style="color: #6B6D76; font-size: 13px; line-height: 1.6;">
            Ce lien expire dans 30 minutes. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
          </p>
        </div>
        """
    ok = send_email(body.email, "Réinitialisation de votre mot de passe", html)
    if not ok:
        # SMTP non configuré (développement) : on écrit le lien dans un
        # fichier + dans la console pour pouvoir tester sans email réel.
        link_line = f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {body.email} -> {link}\n"
        links_path = os.path.join(os.path.dirname(__file__), "..", "reset_links.log")
        with open(links_path, "a", encoding="utf-8") as f:
            f.write(link_line)
        print(f"[reset-password] SMTP non configuré — lien de réinitialisation : {link}", flush=True)
    return {"success": True, "message": "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé."}


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    user_id = decode_reset_token(body.token)
    if not user_id:
        raise HTTPException(status_code=400, detail="Lien de réinitialisation invalide ou expiré.")
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins 8 caractères.")

    await prisma.utilisateur.update(where={"id": user_id}, data={"passwordHash": hash_password(body.password)})
    return {"success": True, "message": "Mot de passe réinitialisé avec succès."}
