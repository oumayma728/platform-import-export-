import json
import os
from datetime import datetime, timezone
from typing import Literal
from fastapi import APIRouter, HTTPException, Depends, Query, File, UploadFile
from pydantic import BaseModel
from database import prisma
from deps import get_current_user, get_admin_user, get_superadmin
from auth import hash_password, verify_password, create_admin_token
from trust import compute_and_store_trust_score, recompute_all_trust_scores
from notifications import notify_user
from config import BACKEND_PUBLIC_URL
import storage

router = APIRouter(prefix="/api/admin", tags=["admin"])

# ─── KYB CHECKLIST (spec §3 / §5.1) ───────────────────────
# Points de vérification évalués manuellement par l'admin. Le score KYB est
# dérivé du nombre de critères validés : score = round(100 * validés / total).
KYB_CHECKLIST = {
    "siret": "Numéro SIRET / SIREN valide",
    "registre_commerce": "Extrait du registre de commerce (Kbis) conforme",
    "consulaire": "Immatriculation consulaire valide",
    "piece_identite": "Pièce d'identité du représentant légal",
    "siege_social": "Adresse du siège social vérifiée",
    "tva": "Numéro de TVA intracommunautaire valide",
    "certifications": "Certifications présentées authentiques",
    "beneficiaires": "Bénéficiaires effectifs identifiés",
}


# ─── AUTH ADMIN (spec §4) ─────────────────────────────────

class AdminLoginRequest(BaseModel):
    email: str
    password: str


@router.post("/auth/login")
async def admin_login(body: AdminLoginRequest):
    admin = await prisma.admin.find_unique(where={"email": body.email})
    if not admin or not verify_password(body.password, admin.passwordHash):
        raise HTTPException(status_code=401, detail="Email ou mot de passe administrateur incorrect")
    if not admin.isActive:
        raise HTTPException(status_code=403, detail="Ce compte administrateur a été désactivé")

    token = create_admin_token(admin.id, admin.email, admin.role)
    return {
        "token": token,
        "admin": {
            "id": admin.id,
            "email": admin.email,
            "nom": admin.nom,
            "prenom": admin.prenom,
            "role": admin.role,
        },
    }


@router.get("/auth/me")
async def admin_me(admin=Depends(get_admin_user)):
    return {
        "id": admin.id,
        "email": admin.email,
        "nom": admin.nom,
        "prenom": admin.prenom,
        "role": admin.role,
    }


@router.post("/auth/logout")
async def admin_logout(admin=Depends(get_admin_user)):
    """Déconnexion admin (spec §4). Le token est stateless ; l'endpoint existe
    pour la traçabilité côté front, qui purge ensuite le token local."""
    return {"success": True, "message": "Déconnexion réussie"}


# ─── GESTION DES ADMINS (SUPERADMIN uniquement, spec §4) ──

class AdminCreateRequest(BaseModel):
    email: str
    password: str
    nom: str
    prenom: str
    role: Literal["moderateur", "superadmin"] = "moderateur"


@router.get("/admins")
async def list_admins(admin=Depends(get_superadmin)):
    admins = await prisma.admin.find_many(order={"createdAt": "desc"})
    return [
        {
            "id": a.id,
            "email": a.email,
            "nom": a.nom,
            "prenom": a.prenom,
            "role": a.role,
            "isActive": a.isActive,
            "createdAt": a.createdAt.isoformat() if a.createdAt else None,
        }
        for a in admins
    ]


@router.post("/admins")
async def create_admin(body: AdminCreateRequest, admin=Depends(get_superadmin)):
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins 8 caractères")
    existing = await prisma.admin.find_unique(where={"email": body.email})
    if existing:
        raise HTTPException(status_code=400, detail="Un administrateur avec cet email existe déjà")

    created = await prisma.admin.create(
        data={
            "email": body.email,
            "passwordHash": hash_password(body.password),
            "nom": body.nom,
            "prenom": body.prenom,
            "role": body.role,
            "isActive": True,
        }
    )
    return {"id": created.id, "email": created.email, "role": created.role}


@router.post("/admins/{admin_id}/deactivate")
async def deactivate_admin(admin_id: str, admin=Depends(get_superadmin)):
    if admin_id == admin.id:
        raise HTTPException(status_code=400, detail="Impossible de désactiver votre propre compte")
    target = await prisma.admin.find_unique(where={"id": admin_id})
    if not target:
        raise HTTPException(status_code=404, detail="Administrateur non trouvé")
    await prisma.admin.update(where={"id": admin_id}, data={"isActive": False})
    return {"success": True, "message": "Administrateur désactivé"}


@router.post("/admins/{admin_id}/reactivate")
async def reactivate_admin(admin_id: str, admin=Depends(get_superadmin)):
    target = await prisma.admin.find_unique(where={"id": admin_id})
    if not target:
        raise HTTPException(status_code=404, detail="Administrateur non trouvé")
    await prisma.admin.update(where={"id": admin_id}, data={"isActive": True})
    return {"success": True, "message": "Administrateur réactivé"}


# ─── DASHBOARD ────────────────────────────────────────────

@router.get("/dashboard")
async def get_dashboard_stats(admin=Depends(get_admin_user)):
    total_users = await prisma.utilisateur.count()
    pending = await prisma.utilisateur.count(where={"validationStatus": "pending"})
    validated = await prisma.utilisateur.count(where={"validationStatus": "validated"})
    rejected = await prisma.utilisateur.count(where={"validationStatus": "rejected"})
    suspended = await prisma.utilisateur.count(where={"validationStatus": "suspended"})
    total_entreprises = await prisma.entreprise.count()
    total_annonces = await prisma.annonce.count(where={"statut": "active"})
    total_reports = await prisma.report.count()
    pending_reports = await prisma.report.count(where={"statut": "pending"})

    # ── Analytics (spec §5.3) : tendances, répartition géo/secteur/rôle,
    # distribution des scores de confiance et conversion de la validation.
    today = datetime.now(timezone.utc)

    users_all = await prisma.utilisateur.find_many()
    entreprises_all = await prisma.entreprise.find_many()
    locations_all = await prisma.location.find_many()

    pays_by_id = {loc.id: (loc.pays or "").strip() for loc in locations_all}
    entreprise_user_ids = await prisma.utilisateur.find_many(
        where={"entrepriseId": {"not": None}},
    )
    user_to_ent = {u.id: u.entrepriseId for u in entreprise_user_ids}

    # Inscriptions sur les 14 derniers jours
    from datetime import timedelta

    registrations = []
    for i in range(13, -1, -1):
        day_start = (today - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = sum(1 for u in users_all if day_start <= _to_utc(u.createdAt) < day_end)
        registrations.append({"date": day_start.strftime("%Y-%m-%d"), "count": count})

    # Répartition par pays (via entreprise -> location)
    pays_counts = {}
    for uid, eid in user_to_ent.items():
        ent = next((e for e in entreprises_all if e.id == eid), None)
        if ent and ent.locationId:
            pays = pays_by_id.get(ent.locationId)
            if pays:
                pays_counts[pays] = pays_counts.get(pays, 0) + 1
    top_countries = sorted(pays_counts.items(), key=lambda kv: kv[1], reverse=True)[:6]

    # Répartition par secteur
    secteur_counts = {}
    for ent in entreprises_all:
        s = (ent.secteurActivite or "").strip()
        if not s:
            s = "Non renseigné"
        secteur_counts[s] = secteur_counts.get(s, 0) + 1
    top_sectors = sorted(secteur_counts.items(), key=lambda kv: kv[1], reverse=True)[:6]

    # Répartition par rôle (normalisé lowercase)
    role_counts = {"importer": 0, "exporter": 0, "both": 0}
    for ent in entreprises_all:
        r = (ent.role or "").strip().lower()
        if r in role_counts:
            role_counts[r] += 1
        elif r in ("importateur", "exportateur"):
            role_counts["importer" if r == "importateur" else "exporter"] += 1
        else:
            role_counts["importer"] += 1

    # Distribution des scores de confiance (tranches de 20)
    score_bins = {"0-20": 0, "20-40": 0, "40-60": 0, "60-80": 0, "80-100": 0}
    scored = [e.trustScore for e in entreprises_all if e.trustScore is not None]
    for s in scored:
        s = max(0, min(100, s))
        if s < 20:
            score_bins["0-20"] += 1
        elif s < 40:
            score_bins["20-40"] += 1
        elif s < 60:
            score_bins["40-60"] += 1
        elif s < 80:
            score_bins["60-80"] += 1
        else:
            score_bins["80-100"] += 1
    avg_score = round(sum(scored) / len(scored), 1) if scored else 0
    validation_rate = round((validated / total_users) * 100, 1) if total_users else 0

    return {
        "totalUsers": total_users,
        "pendingValidation": pending,
        "validated": validated,
        "rejected": rejected,
        "suspended": suspended,
        "totalEntreprises": total_entreprises,
        "totalAnnonces": total_annonces,
        "totalReports": total_reports,
        "pendingReports": pending_reports,
        "registrations": registrations,
        "topCountries": [{"label": k, "count": v} for k, v in top_countries],
        "topSectors": [{"label": k, "count": v} for k, v in top_sectors],
        "roleSplit": role_counts,
        "trustScores": {"bins": score_bins, "avg": avg_score, "count": len(scored)},
        "validationRate": validation_rate,
    }


@router.get("/countries")
async def get_countries(admin=Depends(get_admin_user)):
    """Liste stable de tous les pays distincts (pour les dropdowns de filtre)."""
    locations = await prisma.location.find_many()
    countries = sorted({(loc.pays or "").strip() for loc in locations if (loc.pays or "").strip()})
    return {"countries": countries}


def _to_utc(dt):
    """Convertit un datetime naive (SQLite) en datetime aware UTC."""
    if dt is None:
        return dt
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


# ─── USER MANAGEMENT ──────────────────────────────────────

@router.get("/users")
async def get_users(
    status: str | None = None,
    pays: str | None = None,
    secteur: str | None = None,
    search: str | None = None,
    dateDebut: str | None = None,
    dateFin: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin=Depends(get_admin_user),
):
    where = {}
    if status:
        where["validationStatus"] = status
    if search:
        where["OR"] = [
            {"nom": {"contains": search}},
            {"prenom": {"contains": search}},
            {"email": {"contains": search}},
        ]
    # Filtres côté serveur (spec §5.3) : combinés avec AND, avant pagination.
    if pays:
        where["entreprise"] = {"is": {"location": {"is": {"pays": {"equals": pays}}}}}
    if secteur:
        where["entreprise"] = {
            "is": {"secteurActivite": {"contains": secteur}}
        } if not pays else {
            **where["entreprise"]["is"],
            "secteurActivite": {"contains": secteur},
        }

    # Période d'inscription (spec §5.3) : createdAt compris dans [dateDebut, dateFin].
    date_where = {}
    if dateDebut:
        date_where["gte"] = datetime.fromisoformat(dateDebut.replace("Z", "+00:00"))
    if dateFin:
        date_where["lte"] = datetime.fromisoformat(dateFin.replace("Z", "+00:00"))
    if date_where:
        where["createdAt"] = date_where

    total = await prisma.utilisateur.count(where=where)
    users = await prisma.utilisateur.find_many(
        where=where,
        include={"entreprise": {"include": {"location": True}}},
        skip=(page - 1) * limit,
        take=limit,
        order={"createdAt": "desc"},
    )

    return {
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "nom": u.nom,
                "prenom": u.prenom,
                "role": u.role,
                "validationStatus": u.validationStatus,
                "companyName": u.entreprise.nom if u.entreprise else None,
                "country": u.entreprise.location.pays if u.entreprise and u.entreprise.location else None,
                "sector": u.entreprise.secteurActivite if u.entreprise else None,
                "createdAt": u.createdAt.isoformat() if u.createdAt else None,
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "totalPages": (total + limit - 1) // limit,
    }


@router.get("/users/{user_id}")
async def get_user_detail(user_id: str, admin=Depends(get_admin_user)):
    user = await prisma.utilisateur.find_unique(
        where={"id": user_id},
        include={
            "entreprise": {
                "include": {"location": True, "certifications": True, "badges": True, "documents": True},
            }
        },
    )
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    reports = await prisma.report.find_many(where={"cibleUserId": user_id})
    reviews = await prisma.review.find_many(where={"entrepriseId": user.entrepriseId}) if user.entrepriseId else []
    actions = await prisma.adminaction.find_many(
        where={"cibleUserId": user_id}, order={"createdAt": "desc"}
    )
    moderation = await prisma.usermoderationhistory.find_many(
        where={"userId": user_id}, order={"createdAt": "desc"}
    )

    avg_rating = round(sum(r.note for r in reviews) / len(reviews), 1) if reviews else None

    return {
        "id": user.id,
        "email": user.email,
        "nom": user.nom,
        "prenom": user.prenom,
        "role": user.role,
        "validationStatus": user.validationStatus,
        "createdAt": user.createdAt.isoformat() if user.createdAt else None,
        "entreprise": {
            "id": user.entreprise.id,
            "nom": user.entreprise.nom,
            "siret": user.entreprise.siret,
            "numeroTva": user.entreprise.numeroTva,
            "role": user.entreprise.role,
            "secteurActivite": user.entreprise.secteurActivite,
            "pays": user.entreprise.location.pays if user.entreprise.location else None,
            "certifications": [{"id": c.id, "nom": c.nom, "estVerifie": c.estVerifie} for c in user.entreprise.certifications],
            "badges": [{"id": b.id, "type": b.badgeType, "description": b.description} for b in user.entreprise.badges],
        } if user.entreprise else None,
        "reports": [{"id": r.id, "type": r.type, "motif": r.motif, "statut": r.statut, "createdAt": r.createdAt.isoformat()} for r in reports],
        "reviews": [{"id": r.id, "note": r.note, "commentaire": r.commentaire, "createdAt": r.createdAt.isoformat()} for r in reviews],
        "adminActions": [{"id": a.id, "typeAction": a.typeAction, "description": a.description, "createdAt": a.createdAt.isoformat()} for a in actions],
        "moderationHistory": [
            {
                "id": m.id,
                "action": m.action,
                "motif": m.motif,
                "suspensionDurationDays": m.suspensionDurationDays,
                "suspensionEndDate": m.suspensionEndDate.isoformat() if m.suspensionEndDate else None,
                "createdAt": m.createdAt.isoformat() if m.createdAt else None,
            }
            for m in moderation
        ],
        "averageRating": avg_rating,
    }


# ─── ENTERPRISE VALIDATION (spec §5.1) ────────────────────

@router.get("/validation-queue")
async def get_validation_queue(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin=Depends(get_admin_user),
):
    where = {"validationStatus": "pending"}
    total = await prisma.utilisateur.count(where=where)
    users = await prisma.utilisateur.find_many(
        where=where,
        include={
            "entreprise": {"include": {"location": True, "certifications": True, "documents": True}},
        },
        order={"createdAt": "desc"},
        skip=(page - 1) * limit,
        take=limit,
    )
    queue = [
        {
            "id": u.id,
            "email": u.email,
            "nom": u.nom,
            "prenom": u.prenom,
            "createdAt": u.createdAt.isoformat() if u.createdAt else None,
            "dateInscription": u.createdAt.isoformat() if u.createdAt else None,
            "entreprise": {
                "id": u.entreprise.id,
                "nom": u.entreprise.nom,
                "siret": u.entreprise.siret,
                "numeroTva": u.entreprise.numeroTva,
                "role": u.entreprise.role,
                "secteurActivite": u.entreprise.secteurActivite,
                "pays": u.entreprise.location.pays if u.entreprise.location else None,
                "certifications": [
                    {"id": c.id, "nom": c.nom, "estVerifie": c.estVerifie}
                    for c in u.entreprise.certifications
                ],
                "documents": [
                    {
                        "id": d.id,
                        "nomFichier": d.nomFichier,
                        "nom_document": d.nomFichier,
                        "cheminFichier": d.cheminFichier,
                        "extention": d.extention,
                        "taille": d.taille,
                        "typeDocument": d.typeDocument,
                        "statut": d.statut,
                        "motifRejet": d.motifRejet,
                        "date_upload": d.createdAt.isoformat() if d.createdAt else None,
                    }
                    for d in u.entreprise.documents
                ],
            } if u.entreprise else None,
        }
        for u in users
    ]
    return {
        "queue": queue,
        "total": total,
        "page": page,
        "totalPages": (total + limit - 1) // limit,
    }


class ValidateRejectRequest(BaseModel):
    motif: str | None = None


async def _log_admin_action(admin, action: str, cible_type: str, cible_id: str, description: str, motif: str | None = None, cible_user_id: str | None = None, metadata: dict | None = None):
    """Écrit la ligne d'audit ModerationAction/AdminAction (spec §3.3)."""
    await prisma.adminaction.create(
        data={
            "adminId": admin.id,
            "cibleUserId": cible_user_id,
            "cibleType": cible_type,
            "cibleId": cible_id,
            "action": action,
            "typeAction": action,
            "motif": motif,
            "description": description,
            "metadata": json.dumps(metadata or {}),
        }
    )


@router.post("/validate/{user_id}")
async def validate_enterprise(user_id: str, admin=Depends(get_admin_user)):
    user = await prisma.utilisateur.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    if user.validationStatus != "pending":
        raise HTTPException(status_code=400, detail="Ce profil n'est pas en attente de validation")

    await prisma.utilisateur.update(where={"id": user_id}, data={"validationStatus": "validated"})

    if user.entrepriseId:
        await prisma.trustbadge.create(
            data={
                "entrepriseId": user.entrepriseId,
                "badgeType": "entreprise_verifiee",
                "description": "Profil vérifié par l'administration",
            }
        )
        await compute_and_store_trust_score(user.entrepriseId)

    await _log_admin_action(
        admin,
        action="VALIDATION",
        cible_type="UTILISATEUR",
        cible_id=user_id,
        cible_user_id=user_id,
        description=f"Profil de {user.nom} {user.prenom} ({user.email}) validé",
        metadata={"action": "validate"},
    )

    await notify_user(
        user_id,
        "Profil validé",
        f"Votre profil {user.email} a été validé par l'administration. Vous pouvez maintenant utiliser pleinement la plateforme.",
    )

    return {"success": True, "message": "Profil validé avec succès"}


@router.post("/reject/{user_id}")
async def reject_enterprise(user_id: str, body: ValidateRejectRequest, admin=Depends(get_admin_user)):
    if not body.motif:
        raise HTTPException(status_code=400, detail="Un motif de rejet est obligatoire")

    user = await prisma.utilisateur.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    if user.validationStatus != "pending":
        raise HTTPException(status_code=400, detail="Ce profil n'est pas en attente de validation")

    await prisma.utilisateur.update(where={"id": user_id}, data={"validationStatus": "rejected"})

    await _log_admin_action(
        admin,
        action="REJET",
        cible_type="UTILISATEUR",
        cible_id=user_id,
        cible_user_id=user_id,
        motif=body.motif,
        description=f"Profil de {user.nom} {user.prenom} ({user.email}) rejeté : {body.motif}",
        metadata={"motif": body.motif, "action": "reject"},
    )

    await notify_user(
        user_id,
        "Profil rejeté",
        f"Votre profil {user.email} a été rejeté : {body.motif}. Vous pouvez corriger les informations et soumettre à nouveau votre dossier.",
    )

    return {"success": True, "message": "Profil rejeté"}


class EntrepriseValidationRequest(BaseModel):
    action: Literal["validate", "reject"]
    motif: str | None = None


@router.patch("/enterprises/{entreprise_id}/validation")
async def review_entreprise(entreprise_id: str, body: EntrepriseValidationRequest, admin=Depends(get_admin_user)):
    """Approbation / rejet de l'entreprise entière (spec §6, PATCH /admin/entreprises/{id}/validation).

    Applique la décision à tous les utilisateurs rattachés, journalise l'action
    d'audit, notifie les propriétaires et recalcule le score de confiance.
    """
    if body.action == "reject" and not body.motif:
        raise HTTPException(status_code=400, detail="Un motif de rejet est obligatoire")

    entreprise = await prisma.entreprise.find_unique(
        where={"id": entreprise_id},
        include={"utilisateurs": True},
    )
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise non trouvée")

    users = entreprise.utilisateurs or []
    if not users:
        raise HTTPException(status_code=400, detail="Aucun utilisateur rattaché à cette entreprise")

    new_status = "validated" if body.action == "validate" else "rejected"
    affected = 0
    for u in users:
        if u.validationStatus in ("pending", "rejected"):
            await prisma.utilisateur.update(
                where={"id": u.id}, data={"validationStatus": new_status}
            )
            affected += 1

    if body.action == "validate":
        existing = await prisma.trustbadge.find_first(
            where={"entrepriseId": entreprise_id, "badgeType": "entreprise_verifiee", "estActif": True}
        )
        if not existing:
            await prisma.trustbadge.create(
                data={
                    "entrepriseId": entreprise_id,
                    "badgeType": "entreprise_verifiee",
                    "description": "Entreprise validée par l'administration",
                }
            )

    await compute_and_store_trust_score(entreprise_id)

    label = "validée" if body.action == "validate" else f"rejetée : {body.motif}"
    await _log_admin_action(
        admin,
        action="VALIDATION" if body.action == "validate" else "REJET",
        cible_type="ENTREPRISE",
        cible_id=entreprise_id,
        motif=body.motif,
        description=f"Entreprise {entreprise.nom} ({entreprise_id}) {label}",
        metadata={"entrepriseId": entreprise_id, "action": body.action, "motif": body.motif, "affected": affected},
    )

    for u in users:
        if body.action == "validate":
            await notify_user(
                u.id,
                "Entreprise validée",
                f"Votre entreprise {entreprise.nom} a été validée par l'administration. Vous pouvez maintenant utiliser pleinement la plateforme.",
            )
        else:
            await notify_user(
                u.id,
                "Entreprise rejetée",
                f"Votre entreprise {entreprise.nom} a été rejetée : {body.motif}. Vous pouvez corriger les informations et soumettre à nouveau votre dossier.",
            )

    return {
        "success": True,
        "message": f"Entreprise {label}",
        "affected": affected,
    }


class SuspendRequest(BaseModel):
    motif: str | None = None
    suspendAnnonces: bool = False
    suspension_duration_days: int | None = None


@router.post("/suspend/{user_id}")
async def suspend_user(user_id: str, body: SuspendRequest, admin=Depends(get_admin_user)):
    user = await prisma.utilisateur.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    await prisma.utilisateur.update(where={"id": user_id}, data={"validationStatus": "suspended"})

    if body.suspendAnnonces:
        await prisma.annonce.update_many(
            where={"utilisateurId": user_id, "statut": "active"},
            data={"statut": "suspended"},
        )

    if user.entrepriseId:
        await compute_and_store_trust_score(user.entrepriseId)

    # Historique de modération dédié (spec #3771) : timestamp + admin_id + durée.
    end_date = None
    if body.suspension_duration_days and body.suspension_duration_days > 0:
        from datetime import timedelta
        end_date = datetime.now(timezone.utc) + timedelta(days=body.suspension_duration_days)
    await prisma.usermoderationhistory.create(
        data={
            "userId": user_id,
            "adminId": admin.id,
            "action": "SUSPENSION",
            "motif": body.motif,
            "suspensionDurationDays": body.suspension_duration_days,
            "suspensionEndDate": end_date,
        }
    )

    motif_text = f" : {body.motif}" if body.motif else ""
    await _log_admin_action(
        admin,
        action="SUSPENSION",
        cible_type="UTILISATEUR",
        cible_id=user_id,
        cible_user_id=user_id,
        motif=body.motif,
        description=f"Compte de {user.nom} {user.prenom} ({user.email}) suspendu{motif_text}",
        metadata={
            "motif": body.motif,
            "action": "suspend",
            "suspendAnnonces": body.suspendAnnonces,
            "suspension_duration_days": body.suspension_duration_days,
        },
    )

    await notify_user(
        user_id,
        "Compte suspendu",
        f"Votre compte {user.email} a été suspendu{body.motif and f' pour la raison suivante : {body.motif}' or ''}. Contactez l'administration si vous pensez qu'il s'agit d'une erreur.",
    )

    return {"success": True, "message": "Compte suspendu"}


@router.post("/reactivate/{user_id}")
async def reactivate_user(user_id: str, admin=Depends(get_superadmin)):
    user = await prisma.utilisateur.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    if user.validationStatus != "suspended":
        raise HTTPException(status_code=400, detail="Ce compte n'est pas suspendu")

    await prisma.utilisateur.update(where={"id": user_id}, data={"validationStatus": "validated"})

    await prisma.usermoderationhistory.create(
        data={
            "userId": user_id,
            "adminId": admin.id,
            "action": "REACTIVATION",
            "motif": "Compte réactivé par l'administration",
            "suspensionDurationDays": None,
            "suspensionEndDate": None,
        }
    )

    if user.entrepriseId:
        await compute_and_store_trust_score(user.entrepriseId)

    await _log_admin_action(
        admin,
        action="REACTIVATION",
        cible_type="UTILISATEUR",
        cible_id=user_id,
        cible_user_id=user_id,
        description=f"Compte de {user.nom} {user.prenom} ({user.email}) réactivé",
        metadata={"action": "reactivate"},
    )

    await notify_user(
        user_id,
        "Compte réactivé",
        f"Votre compte {user.email} a été réactivé. Bienvenue à nouveau !",
    )

    return {"success": True, "message": "Compte réactivé"}


# ─── ENTERPRISE LIST (spec §5.3) ──────────────────────────

@router.get("/enterprises")
async def get_enterprises(
    statut: str | None = None,
    pays: str | None = None,
    secteur: str | None = None,
    role: str | None = None,
    search: str | None = None,
    dateDebut: str | None = None,
    dateFin: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin=Depends(get_admin_user),
):
    where = {}
    if search:
        where["OR"] = [{"nom": {"contains": search}}, {"siret": {"contains": search}}]
    if role:
        where["role"] = role
    if secteur:
        where["secteurActivite"] = {"contains": secteur}
    if statut:
        # Filtre sur le statut de validation de l'utilisateur rattaché
        where["utilisateurs"] = {"some": {"validationStatus": statut}}
    if pays:
        where["location"] = {"is": {"pays": {"equals": pays}}}

    # Période d'inscription (spec §5.3) : createdAt compris dans [dateDebut, dateFin].
    date_where = {}
    if dateDebut:
        date_where["gte"] = datetime.fromisoformat(dateDebut.replace("Z", "+00:00"))
    if dateFin:
        date_where["lte"] = datetime.fromisoformat(dateFin.replace("Z", "+00:00"))
    if date_where:
        where["createdAt"] = date_where

    total = await prisma.entreprise.count(where=where)
    entreprises = await prisma.entreprise.find_many(
        where=where,
        include={
            "location": True,
            "certifications": True,
            "badges": {"where": {"estActif": True}},
            "utilisateurs": True,
        },
        skip=(page - 1) * limit,
        take=limit,
        order={"createdAt": "desc"},
    )

    enriched = []
    for e in entreprises:
        user_ids = [u.id for u in e.utilisateurs]
        nb_annonces = 0
        if user_ids:
            nb_annonces = await prisma.annonce.count(where={"utilisateurId": {"in": user_ids}, "statut": "active"})
        enriched.append({
            "id": e.id,
            "nom": e.nom,
            "pays": e.location.pays if e.location else "",
            "secteur": e.secteurActivite or "",
            "role": e.role,
            "siret": e.siret,
            "nombreAnnoncesActives": nb_annonces,
            "trustScore": e.trustScore,
            "badges": [b.badgeType for b in e.badges],
            "certifications": [c.nom for c in e.certifications],
            "createdAt": e.createdAt.isoformat() if e.createdAt else None,
        })

    return {
        "entreprises": enriched,
        "total": total,
        "page": page,
        "totalPages": (total + limit - 1) // limit,
    }


@router.get("/enterprises/{entreprise_id}")
async def get_enterprise_detail(entreprise_id: str, admin=Depends(get_admin_user)):
    entreprise = await prisma.entreprise.find_unique(
        where={"id": entreprise_id},
        include={
            "location": True,
            "documents": True,
            "badges": {"where": {"estActif": True}},
            "certifications": True,
            "kybVerifications": {"orderBy": {"createdAt": "desc"}},
            "entrepriseBadges": {"include": {"badge": True}},
            "utilisateurs": True,
            "reviewsRecus": {"include": {"auteur": True}, "orderBy": {"createdAt": "desc"}},
        },
    )
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise non trouvée")

    user_ids = [u.id for u in entreprise.utilisateurs]
    nb_annonces = 0
    if user_ids:
        nb_annonces = await prisma.annonce.count(where={"utilisateurId": {"in": user_ids}, "statut": "active"})

    reports = await prisma.report.find_many(
        where={
            "OR": [
                {"cibleUserId": {"in": user_ids}} if user_ids else {"cibleUserId": "___none___"},
                {"cibleType": "ENTREPRISE", "cibleId": entreprise_id},
            ]
        },
        order={"createdAt": "desc"},
    ) if user_ids else await prisma.report.find_many(where={"cibleType": "ENTREPRISE", "cibleId": entreprise_id})

    actions = await prisma.adminaction.find_many(
        where={
            "OR": [
                {"cibleType": "ENTREPRISE", "cibleId": entreprise_id},
                {"cibleUserId": {"in": user_ids}} if user_ids else {"cibleUserId": "___none___"},
            ]
        },
        order={"createdAt": "desc"},
    ) if user_ids else await prisma.adminaction.find_many(where={"cibleType": "ENTREPRISE", "cibleId": entreprise_id})

    return {
        "id": entreprise.id,
        "nom": entreprise.nom,
        "siret": entreprise.siret,
        "numeroTva": entreprise.numeroTva,
        "description": entreprise.description,
        "siteWeb": entreprise.siteWeb,
        "role": entreprise.role,
        "secteurActivite": entreprise.secteurActivite,
        "pays": entreprise.location.pays if entreprise.location else None,
        "ville": entreprise.location.ville if entreprise.location else None,
        "createdAt": entreprise.createdAt.isoformat() if entreprise.createdAt else None,
        "trustScore": entreprise.trustScore,
        "trustScoreDetails": json.loads(entreprise.trustScoreDetails) if entreprise.trustScoreDetails else None,
        "nombreAnnoncesActives": nb_annonces,
        "utilisateurs": [
            {"id": u.id, "nom": u.nom, "prenom": u.prenom, "email": u.email, "validationStatus": u.validationStatus}
            for u in entreprise.utilisateurs
        ],
        "badges": [
            {"id": b.id, "type": b.badgeType, "description": b.description}
            for b in entreprise.badges
        ],
        "badgesDefinitions": [
            {"id": eb.badge.id, "code": eb.badge.code, "nom": eb.badge.nom, "obtenuLe": eb.obtenuLe.isoformat()}
            for eb in entreprise.entrepriseBadges if eb.badge
        ],
        "certifications": [
            {"id": c.id, "nom": c.nom, "estVerifie": c.estVerifie, "dateExpiration": c.dateExpiration.isoformat() if c.dateExpiration else None}
            for c in entreprise.certifications
        ],
        "documents": [
            {
                "id": d.id,
                "typeDocument": d.typeDocument,
                "nomFichier": d.nomFichier,
                "nom_document": d.nomFichier,
                "cheminFichier": d.cheminFichier,
                "mimeType": d.mimeType,
                "extention": d.extention,
                "taille": str(d.taille),
                "statut": d.statut,
                "motifRejet": d.motifRejet,
                "createdAt": d.createdAt.isoformat() if d.createdAt else None,
                "date_upload": d.createdAt.isoformat() if d.createdAt else None,
            }
            for d in entreprise.documents
        ],
        "kyb": [
            {
                "id": k.id,
                "statut": k.statut,
                "score": k.score,
                "commentaire": k.commentaire,
                "dateVerification": k.dateVerification.isoformat() if k.dateVerification else None,
            }
            for k in entreprise.kybVerifications
        ],
        "reviews": [
            {
                "id": r.id,
                "note": r.note,
                "commentaire": r.commentaire,
                "auteur": {"nom": r.auteur.nom, "prenom": r.auteur.prenom} if r.auteur else None,
                "createdAt": r.createdAt.isoformat() if r.createdAt else None,
            }
            for r in entreprise.reviewsRecus
        ],
        "reports": [
            {"id": r.id, "type": r.type, "motif": r.motif, "statut": r.statut, "createdAt": r.createdAt.isoformat()}
            for r in reports
        ],
        "adminActions": [
            {
                "id": a.id,
                "action": a.action,
                "typeAction": a.typeAction,
                "motif": a.motif,
                "description": a.description,
                "createdAt": a.createdAt.isoformat(),
            }
            for a in actions
        ],
    }


# ─── DOCUMENTS ENTREPRISE (spec §5.1 / #3767) ─────────────

@router.get("/enterprises/{entreprise_id}/documents")
async def get_enterprise_documents(entreprise_id: str, admin=Depends(get_admin_user)):
    """Liste dédiée des justificatifs d'une entreprise avec URLs de prévisualisation."""
    entreprise = await prisma.entreprise.find_unique(
        where={"id": entreprise_id},
        include={"documents": True},
    )
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise non trouvée")

    return [
        {
            "id": d.id,
            "typeDocument": d.typeDocument,
            "nom_document": d.nomFichier,
            "nomFichier": d.nomFichier,
            "cheminFichier": d.cheminFichier,
            "mimeType": d.mimeType,
            "extention": d.extention,
            "taille": str(d.taille),
            "statut": d.statut,
            "motifRejet": d.motifRejet,
            "date_upload": d.createdAt.isoformat() if d.createdAt else None,
            "createdAt": d.createdAt.isoformat() if d.createdAt else None,
        }
        for d in entreprise.documents
    ]


# ─── REPORTS / SIGNALEMENTS (spec §5.2) ───────────────────

class TreatReportRequest(BaseModel):
    action: str  # "block", "remove", "dismiss"
    motif: str | None = None


@router.get("/reports")
async def get_reports(
    statut: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin=Depends(get_admin_user),
):
    where = {}
    if statut:
        where["statut"] = statut

    total = await prisma.report.count(where=where)
    reports = await prisma.report.find_many(
        where=where,
        include={
            "reporter": True,
            "annonce": True,
            "conversation": True,
        },
        order={"createdAt": "desc"},
        skip=(page - 1) * limit,
        take=limit,
    )

    return {
        "reports": [
            {
                "id": r.id,
                "type": r.type,
                "motif": r.motif,
                "statut": r.statut,
                "cibleType": r.cibleType,
                "cibleId": r.cibleId,
                "reporter": {"id": r.reporter.id, "nom": r.reporter.nom, "prenom": r.reporter.prenom, "email": r.reporter.email} if r.reporter else None,
                "cibleUserId": r.cibleUserId,
                "annonce": {"id": r.annonce.id, "titre": r.annonce.titre} if r.annonce else None,
                "conversation": {"id": r.conversation.id, "statut": r.conversation.statut} if r.conversation else None,
                "traitePar": r.traitePar,
                "dateTraitement": r.dateTraitement.isoformat() if r.dateTraitement else None,
                "createdAt": r.createdAt.isoformat() if r.createdAt else None,
            }
            for r in reports
        ],
        "total": total,
        "page": page,
        "totalPages": (total + limit - 1) // limit,
    }


@router.post("/reports/{report_id}/treat")
async def treat_report(report_id: str, body: TreatReportRequest, admin=Depends(get_admin_user)):
    report = await prisma.report.find_unique(where={"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Signalement non trouvé")

    new_statut = "rejected" if body.action == "dismiss" else "processed"
    await prisma.report.update(
        where={"id": report_id},
        data={
            "statut": new_statut,
            "traitePar": admin.id,
            "traiteParAdminId": admin.id,
            "dateTraitement": datetime.now(timezone.utc),
        },
    )

    target_user_id = report.cibleUserId
    if body.action == "block" and report.cibleUserId:
        await prisma.utilisateur.update(where={"id": report.cibleUserId}, data={"validationStatus": "suspended"})

    if body.action == "remove" and report.annonceId:
        await prisma.annonce.update(where={"id": report.annonceId}, data={"statut": "suspended"})

    await _log_admin_action(
        admin,
        action="ANNONCE_SUPPRIMEE" if body.action == "remove" else "SUSPENSION" if body.action == "block" else "SIGNALEMENT_REJETE",
        cible_type=report.cibleType or "UTILISATEUR",
        cible_id=report.cibleId or report.cibleUserId or report.annonceId or report_id,
        cible_user_id=report.cibleUserId,
        motif=body.motif,
        description=f"Signalement {report_id} traité : {body.action}",
        metadata={"reportId": report_id, "action": body.action, "motif": body.motif},
    )

    if target_user_id:
        await notify_user(
            target_user_id,
            "Compte suspendu suite à un signalement",
            f"Suite à un signalement, votre compte a été suspendu{body.motif and f' : {body.motif}' or ''}. Vous pouvez contester cette décision auprès de l'administration.",
        )

    return {"success": True, "message": "Signalement traité"}



# ─── INVESTIGATION (spec §5.2 : l'admin consulte la cible signalée) ────

@router.get("/conversations/{conversation_id}")
async def get_conversation_investigation(conversation_id: str, admin=Depends(get_admin_user)):
    """Lecture seule d'une conversation pour l'investigation d'un signalement :
    participants, annonce liée et fil de messages. Jamais de modification."""
    conversation = await prisma.conversation.find_unique(
        where={"id": conversation_id},
        include={
            "annonce": {"include": {"utilisateur": {"include": {"entreprise": True}}}},
            "vendeur": True,
            "acheteur": True,
            "messages": {"include": {"expediteur": True}},
        },
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation introuvable")

    return {
        "id": conversation.id,
        "statut": conversation.statut,
        "annonce": {
            "id": conversation.annonce.id,
            "titre": conversation.annonce.titre,
            "statut": conversation.annonce.statut,
            "entreprise": conversation.annonce.utilisateur.entreprise.nom if conversation.annonce.utilisateur and conversation.annonce.utilisateur.entreprise else None,
        } if conversation.annonce else None,
        "participants": [
            {
                "id": conversation.vendeur.id,
                "nom": conversation.vendeur.nom,
                "prenom": conversation.vendeur.prenom,
                "email": conversation.vendeur.email,
                "validationStatus": conversation.vendeur.validationStatus,
                "role": "vendeur",
            },
            {
                "id": conversation.acheteur.id,
                "nom": conversation.acheteur.nom,
                "prenom": conversation.acheteur.prenom,
                "email": conversation.acheteur.email,
                "validationStatus": conversation.acheteur.validationStatus,
                "role": "acheteur",
            },
        ],
        "messages": [
            {
                "id": m.id,
                "expediteurId": m.expediteurId,
                "expediteur": f"{m.expediteur.prenom} {m.expediteur.nom}" if m.expediteur else "Inconnu",
                "contenu": m.contenu,
                "estLu": m.estLu,
                "dateEnvoi": m.dateEnvoi.isoformat() if m.dateEnvoi else None,
            }
            for m in sorted(conversation.messages, key=lambda x: x.dateEnvoi or x.createdAt)
        ],
        "nombreMessages": len(conversation.messages),
        "createdAt": conversation.createdAt.isoformat() if conversation.createdAt else None,
    }


# ─── KYB VERIFICATION (spec §3 / §5.1) ────────────────────

class KYBCreateRequest(BaseModel):
    entrepriseId: str
    documents: list[dict] | None = None


class KYBReviewRequest(BaseModel):
    statut: str  # verified, rejected, pending
    score: int | None = None
    commentaire: str | None = None
    checklist: list[str] | None = None


@router.get("/kyb/checklist")
async def get_kyb_checklist(admin=Depends(get_admin_user)):
    """Retourne les points de vérification KYB (spec §3)."""
    return [
        {"code": code, "label": label} for code, label in KYB_CHECKLIST.items()
    ]


@router.get("/kyb")
async def get_kyb_verifications(
    statut: str | None = None,
    admin=Depends(get_admin_user),
):
    where = {}
    if statut:
        where["statut"] = statut

    verifications = await prisma.kybverification.find_many(
        where=where,
        include={"entreprise": {"include": {"location": True, "certifications": True}}},
        order={"createdAt": "desc"},
    )

    entreprise_ids = [v.entrepriseId for v in verifications if v.entrepriseId]
    uploaded_by_entreprise: dict[str, list] = {}
    if entreprise_ids:
        uploaded = await prisma.documententreprise.find_many(
            where={"entrepriseId": {"in": entreprise_ids}},
            order={"createdAt": "desc"},
        )
        for d in uploaded:
            uploaded_by_entreprise.setdefault(d.entrepriseId, []).append(d)

    return [
        {
            "id": v.id,
            "entrepriseId": v.entrepriseId,
            "entrepriseNom": v.entreprise.nom if v.entreprise else "",
            "statut": v.statut,
            "score": v.score,
            "commentaire": v.commentaire,
            "verifiedBy": v.verifiedBy,
            "dateVerification": v.dateVerification.isoformat() if v.dateVerification else None,
            "documents": json.loads(v.documents) if v.documents else [],
            "checklist": json.loads(v.checklist) if v.checklist else [],
            "uploadedDocuments": [
                {
                    "id": d.id,
                    "typeDocument": d.typeDocument,
                    "nomFichier": d.nomFichier,
                    "statut": d.statut,
                    "motifRejet": d.motifRejet,
                    "mimeType": d.mimeType,
                    "taille": str(d.taille),
                    "createdAt": d.createdAt.isoformat() if d.createdAt else None,
                }
                for d in uploaded_by_entreprise.get(v.entrepriseId, [])
            ],
            "createdAt": v.createdAt.isoformat() if v.createdAt else None,
        }
        for v in verifications
    ]


@router.post("/kyb")
async def create_kyb_verification(body: KYBCreateRequest, admin=Depends(get_admin_user)):
    entreprise = await prisma.entreprise.find_unique(where={"id": body.entrepriseId})
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise non trouvée")

    verification = await prisma.kybverification.create(
        data={
            "entrepriseId": body.entrepriseId,
            "statut": "pending",
            "documents": json.dumps(body.documents or []),
        }
    )
    return {"id": verification.id, "statut": verification.statut}


@router.post("/kyb/{verification_id}/review")
async def review_kyb(verification_id: str, body: KYBReviewRequest, admin=Depends(get_admin_user)):
    verification = await prisma.kybverification.find_unique(where={"id": verification_id})
    if not verification:
        raise HTTPException(status_code=404, detail="Vérification non trouvée")

    # Score dérivé des critères validés (spec §5.1) : si aucune checklist n'est
    # fournie on conserve le score transmis (comportement legacy).
    validated_codes = body.checklist if body.checklist is not None else (
        json.loads(verification.checklist) if verification.checklist else []
    )
    unknown = set(validated_codes) - set(KYB_CHECKLIST.keys())
    if unknown:
        raise HTTPException(status_code=400, detail=f"Critères inconnus : {sorted(unknown)}")

    if body.checklist is not None:
        computed_score = round(100 * len(validated_codes) / len(KYB_CHECKLIST))
    else:
        computed_score = body.score

    await prisma.kybverification.update(
        where={"id": verification_id},
        data={
            "statut": body.statut,
            "score": computed_score,
            "checklist": json.dumps(validated_codes),
            "commentaire": body.commentaire,
            "verifiedBy": admin.id,
            "dateVerification": datetime.now(timezone.utc),
        },
    )

    if body.statut == "verified" and verification.entrepriseId:
        existing = await prisma.trustbadge.find_first(
            where={"entrepriseId": verification.entrepriseId, "badgeType": "entreprise_certifiee"}
        )
        if not existing:
            await prisma.trustbadge.create(
                data={
                    "entrepriseId": verification.entrepriseId,
                    "badgeType": "entreprise_certifiee",
                    "description": f"KYB vérifié - Score: {body.score or 'N/A'}",
                }
            )
        await compute_and_store_trust_score(verification.entrepriseId)

    await _log_admin_action(
        admin,
        action="KYB_" + body.statut.upper(),
        cible_type="ENTREPRISE",
        cible_id=verification.entrepriseId,
        description=f"Vérification KYB {verification_id} : {body.statut}",
        metadata={"verificationId": verification_id, "statut": body.statut, "score": body.score},
    )

    # L'utilisateur est notifié de la décision KYB (spec §5.1) : c'est son
    # dossier qui a été évalué, indépendamment du statut global du profil.
    if verification.entrepriseId and body.statut in ("verified", "rejected"):
        owners = await prisma.utilisateur.find_many(
            where={"entrepriseId": verification.entrepriseId}
        )
        for owner in owners:
            if body.statut == "verified":
                await notify_user(
                    owner.id,
                    "KYB approuvé",
                    "Votre dossier de vérification KYB a été approuvé. Votre entreprise est désormais certifiée.",
                )
            else:
                motif = body.commentaire or "motif non précisé"
                await notify_user(
                    owner.id,
                    "KYB rejeté",
                    f"Votre dossier de vérification KYB a été rejeté : {motif}. Vous pouvez corriger les informations et soumettre à nouveau votre dossier.",
                )

    return {"success": True, "message": "Vérification KYB mise à jour"}


# ─── DOCUMENTS KYB — upload présigné MinIO (spec §3) ───────

ALLOWED_MIME_TYPES = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
}


class PresignUploadRequest(BaseModel):
    entrepriseId: str | None = None
    typeDocument: str = "AUTRE"
    mimeType: str
    filename: str


@router.get("/kyb-documents")
async def get_my_kyb_documents(user=Depends(get_current_user)):
    """Liste des documents KYB de l'entreprise du connecté (spec §3/§5.1, côté utilisateur)."""
    if not user.entrepriseId:
        return {"documents": []}
    docs = await prisma.documententreprise.find_many(
        where={"entrepriseId": user.entrepriseId},
        order={"createdAt": "desc"},
    )
    return {
        "documents": [
            {
                "id": d.id,
                "typeDocument": d.typeDocument,
                "nomFichier": d.nomFichier,
                "mimeType": d.mimeType,
                "taille": str(d.taille),
                "statut": d.statut,
                "motifRejet": d.motifRejet,
                "createdAt": d.createdAt.isoformat() if d.createdAt else None,
            }
            for d in docs
        ]
    }


@router.post("/kyb-documents/presign-upload")
async def presign_upload(body: PresignUploadRequest, user=Depends(get_current_user)):
    if body.mimeType not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Type de fichier non autorisé (PDF, JPG, PNG uniquement)")

    entreprise_id = body.entrepriseId or user.entrepriseId
    if not entreprise_id:
        raise HTTPException(status_code=400, detail="Aucune entreprise rattachée à votre compte")

    # Sécurité : un utilisateur ne peut déposer que pour SA propre entreprise
    if user.entrepriseId and entreprise_id != user.entrepriseId:
        raise HTTPException(status_code=403, detail="Impossible d'ajouter un document à une autre entreprise")

    entreprise = await prisma.entreprise.find_unique(where={"id": entreprise_id})
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise non trouvée")

    # Seuls les documents rejetés du même type sont remplacés lors d'une
    # resoumission : un dépôt multiple (plusieurs certifications, etc.) reste
    # possible sans écraser les documents précédents encore en attente.
    await prisma.documententreprise.delete_many(
        where={"entrepriseId": entreprise_id, "typeDocument": body.typeDocument, "statut": "rejete"}
    )

    key = storage.build_key(entreprise_id, body.typeDocument, body.filename)
    # La ligne est créée AVANT l'upload réel (spec §3, étape 3)
    document = await prisma.documententreprise.create(
        data={
            "entrepriseId": entreprise_id,
            "typeDocument": body.typeDocument,
            "nomFichier": body.filename,
            "cheminFichier": key,
            "bucket": storage.MINIO_BUCKET if storage.backend_name() == "minio" else "local",
            "mimeType": body.mimeType,
            "extention": ALLOWED_MIME_TYPES[body.mimeType],
            "taille": 0,
            "statut": "en_attente",
        }
    )

    upload_url = storage.presign_put_url(key, body.mimeType)

    return {
        "documentId": document.id,
        "objectKey": key,
        "uploadUrl": upload_url,
        "localUploadUrl": f"{BACKEND_PUBLIC_URL}/api/admin/kyb-documents/{document.id}/local-upload",
        "expiresIn": 600,
    }


@router.post("/kyb-documents/{doc_id}/local-upload")
async def local_upload(doc_id: str, file: UploadFile = File(...), user=Depends(get_current_user)):
    """Repli local quand MinIO n'est pas configuré : le fichier transite par le serveur."""
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (10 Mo max)")

    document = await prisma.documententreprise.find_unique(where={"id": doc_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document non trouvé")

    path = storage.save_local(document.cheminFichier, data)
    await prisma.documententreprise.update(
        where={"id": doc_id},
        data={"taille": len(data), "nomFichier": file.filename or document.nomFichier},
    )
    return {"success": True, "path": path, "size": len(data)}


@router.post("/kyb-documents/{doc_id}/confirm")
async def confirm_upload(doc_id: str, user=Depends(get_current_user)):
    document = await prisma.documententreprise.find_unique(where={"id": doc_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document non trouvé")

    stat = storage.object_stat(document.cheminFichier)
    if not stat:
        raise HTTPException(status_code=400, detail="L'upload n'a pas abouti (objet introuvable)")

    await prisma.documententreprise.update(
        where={"id": doc_id},
        data={"taille": stat["size"], "statut": "en_attente"},
    )

    # Une vérification KYB "pending" est créée automatiquement dès qu'un
    # document est déposé : le dossier apparaît ainsi dans la file admin KYB
    # (spec §3) sans action manuelle de l'administrateur.
    if document.entrepriseId:
        existing = await prisma.kybverification.find_first(
            where={"entrepriseId": document.entrepriseId, "statut": "pending"}
        )
        if not existing:
            await prisma.kybverification.create(
                data={
                    "entrepriseId": document.entrepriseId,
                    "statut": "pending",
                    "documents": "[]",
                }
            )

    return {"success": True, "stat": stat}


class DocumentReviewRequest(BaseModel):
    statut: Literal["valide", "rejete"]
    motifRejet: str | None = None


@router.patch("/kyb-documents/{doc_id}")
async def review_document(doc_id: str, body: DocumentReviewRequest, admin=Depends(get_admin_user)):
    document = await prisma.documententreprise.find_unique(where={"id": doc_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document non trouvé")

    if body.statut == "rejete" and not body.motifRejet:
        raise HTTPException(status_code=400, detail="Un motif de rejet est obligatoire")

    await prisma.documententreprise.update(
        where={"id": doc_id},
        data={"statut": body.statut, "motifRejet": body.motifRejet},
    )

    await _log_admin_action(
        admin,
        action="DOCUMENT_" + body.statut.upper(),
        cible_type="ENTREPRISE",
        cible_id=document.entrepriseId,
        motif=body.motifRejet,
        description=f"Document KYB {doc_id} {body.statut}",
        metadata={"documentId": doc_id, "statut": body.statut, "motifRejet": body.motifRejet},
    )

    return {"success": True, "statut": body.statut}


@router.get("/kyb-documents/{doc_id}/view-url")
async def view_document_url(doc_id: str, admin=Depends(get_admin_user)):
    document = await prisma.documententreprise.find_unique(where={"id": doc_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document non trouvé")

    # L'objet peut résider dans MinIO ou, en repli, sur le disque local : on
    # sert l'URL correspondant à l'endroit où le fichier existe réellement.
    source = storage.stat_source(document.cheminFichier)
    if source is None:
        raise HTTPException(status_code=404, detail="Fichier introuvable dans le stockage")
    if source == "minio":
        presigned = storage.presign_get_url(document.cheminFichier)
        if presigned:
            return {"url": presigned, "expiresIn": 120}
    return {"url": storage.public_view_url(document.cheminFichier), "expiresIn": None}


# ─── BADGES — définitions + attribution (spec §4 / §5.5) ──

class BadgeCreateRequest(BaseModel):
    code: str
    nom: str
    description: str | None = None
    criteres: dict = {}


@router.get("/badges/definitions")
async def list_badge_definitions(admin=Depends(get_admin_user)):
    badges = await prisma.badge.find_many(order={"createdAt": "asc"})
    return [
        {
            "id": b.id,
            "code": b.code,
            "nom": b.nom,
            "description": b.description,
            "criteres": json.loads(b.criteres) if b.criteres else {},
        }
        for b in badges
    ]


@router.post("/badges/definitions")
async def create_badge_definition(body: BadgeCreateRequest, admin=Depends(get_superadmin)):
    existing = await prisma.badge.find_unique(where={"code": body.code})
    if existing:
        raise HTTPException(status_code=400, detail="Un badge avec ce code existe déjà")
    badge = await prisma.badge.create(
        data={
            "code": body.code,
            "nom": body.nom,
            "description": body.description,
            "criteres": json.dumps(body.criteres),
        }
    )
    return {"id": badge.id, "code": badge.code}


@router.delete("/badges/definitions/{badge_id}")
async def delete_badge_definition(badge_id: str, admin=Depends(get_superadmin)):
    badge = await prisma.badge.find_unique(where={"id": badge_id})
    if not badge:
        raise HTTPException(status_code=404, detail="Badge non trouvé")
    await prisma.badge.delete(where={"id": badge_id})
    return {"success": True, "message": "Définition de badge supprimée"}


class BadgeAwardRequest(BaseModel):
    entrepriseId: str
    badgeId: str
    description: str | None = None


class LegacyBadgeAwardRequest(BaseModel):
    entrepriseId: str
    badgeType: str
    description: str | None = None


@router.get("/badges")
async def get_trust_badges(
    entrepriseId: str | None = None,
    admin=Depends(get_admin_user),
):
    where = {"estActif": True}
    if entrepriseId:
        where["entrepriseId"] = entrepriseId

    badges = await prisma.trustbadge.find_many(
        where=where,
        include={"entreprise": True},
        order={"dateObtention": "desc"},
    )

    return [
        {
            "id": b.id,
            "entrepriseId": b.entrepriseId,
            "entrepriseNom": b.entreprise.nom if b.entreprise else "",
            "badgeType": b.badgeType,
            "description": b.description,
            "dateObtention": b.dateObtention.isoformat() if b.dateObtention else None,
        }
        for b in badges
    ]


@router.post("/badges/award")
async def award_badge_definition(body: BadgeAwardRequest, admin=Depends(get_admin_user)):
    badge = await prisma.badge.find_unique(where={"id": body.badgeId})
    if not badge:
        raise HTTPException(status_code=404, detail="Définition de badge non trouvée")

    existing = await prisma.entreprisebadge.find_first(
        where={"entrepriseId": body.entrepriseId, "badgeId": badge.id}
    )
    if not existing:
        await prisma.entreprisebadge.create(
            data={"entrepriseId": body.entrepriseId, "badgeId": badge.id}
        )

    # Ligne legacy pour la cohérence avec l'UI historique
    legacy = await prisma.trustbadge.find_first(
        where={"entrepriseId": body.entrepriseId, "badgeType": badge.code, "estActif": True}
    )
    if not legacy:
        await prisma.trustbadge.create(
            data={
                "entrepriseId": body.entrepriseId,
                "badgeType": badge.code,
                "description": body.description or badge.nom,
            }
        )

    await compute_and_store_trust_score(body.entrepriseId)
    await _log_admin_action(
        admin,
        action="AWARD_BADGE",
        cible_type="ENTREPRISE",
        cible_id=body.entrepriseId,
        description=f"Badge {badge.code} attribué à l'entreprise {body.entrepriseId}",
        metadata={"badgeId": badge.id, "badgeCode": badge.code},
    )

    return {"id": badge.id, "badgeType": badge.code}


@router.post("/badges")
async def award_badge(body: LegacyBadgeAwardRequest, admin=Depends(get_admin_user)):
    badge = await prisma.trustbadge.create(
        data={
            "entrepriseId": body.entrepriseId,
            "badgeType": body.badgeType,
            "description": body.description,
        }
    )

    await _log_admin_action(
        admin,
        action="AWARD_BADGE",
        cible_type="ENTREPRISE",
        cible_id=body.entrepriseId,
        description=f"Badge {body.badgeType} attribué à l'entreprise {body.entrepriseId}",
        metadata={"entrepriseId": body.entrepriseId, "badgeType": body.badgeType},
    )

    return {"id": badge.id, "badgeType": badge.badgeType}


@router.delete("/badges/{badge_id}")
async def revoke_badge(badge_id: str, admin=Depends(get_admin_user)):
    badge = await prisma.trustbadge.find_unique(where={"id": badge_id})
    if not badge:
        raise HTTPException(status_code=404, detail="Badge non trouvé")

    await prisma.trustbadge.update(where={"id": badge_id}, data={"estActif": False})

    await _log_admin_action(
        admin,
        action="REVOKE_BADGE",
        cible_type="ENTREPRISE",
        cible_id=badge.entrepriseId,
        description=f"Badge {badge.badgeType} révoqué pour l'entreprise {badge.entrepriseId}",
        metadata={"badgeId": badge_id, "badgeType": badge.badgeType},
    )

    return {"success": True, "message": "Badge révoqué"}


# ─── REVIEWS / AVIS (spec §5.4) ───────────────────────────

@router.get("/reviews")
async def get_reviews(
    entrepriseId: str | None = None,
    admin=Depends(get_admin_user),
):
    where = {}
    if entrepriseId:
        where["entrepriseId"] = entrepriseId

    reviews = await prisma.review.find_many(
        where=where,
        include={
            "auteur": True,
            "entreprise": True,
            "conversation": True,
        },
        order={"createdAt": "desc"},
    )

    return [
        {
            "id": r.id,
            "note": r.note,
            "commentaire": r.commentaire,
            "auteur": {"id": r.auteur.id, "nom": r.auteur.nom, "prenom": r.auteur.prenom} if r.auteur else None,
            "entreprise": {"id": r.entreprise.id, "nom": r.entreprise.nom} if r.entreprise else None,
            "conversationId": r.conversationId,
            "dateVisite": r.dateVisite.isoformat() if r.dateVisite else None,
            "createdAt": r.createdAt.isoformat() if r.createdAt else None,
        }
        for r in reviews
    ]


# ─── MODERATION HISTORY (spec §3.3) ───────────────────────

@router.get("/moderation-history")
async def get_moderation_history(
    cible_id: str | None = None,
    action: str | None = None,
    entity_type: str | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    admin=Depends(get_admin_user),
):
    where = {}
    if cible_id:
        where["cibleId"] = cible_id
    if action:
        where["OR"] = [
            {"action": {"contains": action}},
            {"typeAction": {"contains": action}},
        ]
    if entity_type:
        where["cibleType"] = entity_type.upper()
    if search:
        where["description"] = {"contains": search}

    total = await prisma.adminaction.count(where=where)
    actions = await prisma.adminaction.find_many(
        where=where,
        order={"createdAt": "desc"},
        skip=(page - 1) * limit,
        take=limit,
    )

    # Résolution des noms d'admin (Admin moderne + Utilisateur legacy)
    admin_ids = {a.adminId for a in actions}
    admin_map = {}
    if admin_ids:
        admins = await prisma.admin.find_many(where={"id": {"in": list(admin_ids)}})
        admin_map.update({a.id: f"{a.prenom} {a.nom}" for a in admins})
    missing = [i for i in admin_ids if i not in admin_map]
    if missing:
        legacy = await prisma.utilisateur.find_many(where={"id": {"in": missing}})
        admin_map.update({u.id: f"{u.prenom} {u.nom}" for u in legacy})

    return {
        "actions": [
            {
                "id": a.id,
                "admin": {"id": a.adminId, "nom": admin_map.get(a.adminId, a.adminId)},
                "cibleUserId": a.cibleUserId,
                "cibleType": a.cibleType,
                "cibleId": a.cibleId,
                "action": a.action,
                "typeAction": a.typeAction,
                "motif": a.motif,
                "description": a.description,
                "metadata": json.loads(a.metadata) if a.metadata else {},
                "createdAt": a.createdAt.isoformat() if a.createdAt else None,
            }
            for a in actions
        ],
        "total": total,
        "page": page,
        "totalPages": (total + limit - 1) // limit,
    }


# ─── TRUST SCORE (spec §5.5) ──────────────────────────────

@router.get("/reliability-score/{entreprise_id}")
async def get_reliability_score(entreprise_id: str, admin=Depends(get_admin_user)):
    entreprise = await prisma.entreprise.find_unique(where={"id": entreprise_id})
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise non trouvée")

    try:
        details = await compute_and_store_trust_score(entreprise_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return details


@router.get("/reputation-score/{entreprise_id}")
async def get_reputation_score(entreprise_id: str, admin=Depends(get_admin_user)):
    """Score de réputation au format stable (spec #3775) :
    {kyb_score, average_rating, review_count, badges[], malus_count, final_reputation_score}."""
    entreprise = await prisma.entreprise.find_unique(where={"id": entreprise_id})
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise non trouvée")

    try:
        details = await compute_and_store_trust_score(entreprise_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    components = details.get("components", {})

    # kyB 0-100 (30 max → scale à 100)
    kyb_raw = components.get("kyb_verified", 0)
    kyb_score = round((kyb_raw / 30) * 100) if kyb_raw else 0

    avg_raw = components.get("avg_review_score", 0)
    average_rating = round((avg_raw / 30) * 5, 2) if avg_raw else None

    review_count = components.get("review_count", 0)
    flags_penalty = components.get("flags_penalty", 0)
    malus_count = abs(flags_penalty) // 5 if flags_penalty else 0

    return {
        "kyb_score": kyb_score,
        "average_rating": average_rating,
        "review_count": review_count,
        "badges": details.get("badges", []),
        "malus_count": malus_count,
        "final_reputation_score": details.get("score", 0),
    }


@router.post("/trust/recompute-all")
async def recompute_trust_scores(admin=Depends(get_superadmin)):
    updated = await recompute_all_trust_scores()
    return {"success": True, "updated": updated}
