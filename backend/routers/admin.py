import json
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from database import prisma
from deps import get_current_user, get_admin_user

router = APIRouter(prefix="/api/admin", tags=["admin"])


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
    }


# ─── USER MANAGEMENT ──────────────────────────────────────

@router.get("/users")
async def get_users(
    status: str | None = None,
    pays: str | None = None,
    search: str | None = None,
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

    total = await prisma.utilisateur.count(where=where)
    users = await prisma.utilisateur.find_many(
        where=where,
        include={"entreprise": {"include": {"location": True}}},
        skip=(page - 1) * limit,
        take=limit,
        order={"createdAt": "desc"},
    )

    if pays:
        users = [u for u in users if u.entreprise and u.entreprise.location and u.entreprise.location.pays.lower() == pays.lower()]

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
        raise HTTPException(status_code=404, detail="Utilisateur non trouv\u00e9")

    reports = await prisma.report.find_many(where={"cibleUserId": user_id})
    reviews = await prisma.review.find_many(where={"entrepriseId": user.entrepriseId}) if user.entrepriseId else []
    actions = await prisma.adminaction.find_many(
        where={"cibleUserId": user_id}, order={"createdAt": "desc"}
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
        "averageRating": avg_rating,
    }


# ─── ENTERPRISE VALIDATION ────────────────────────────────

@router.get("/validation-queue")
async def get_validation_queue(admin=Depends(get_admin_user)):
    users = await prisma.utilisateur.find_many(
        where={"validationStatus": "pending"},
        include={
            "entreprise": {"include": {"location": True, "certifications": True, "documents": True}},
        },
        order={"createdAt": "asc"},
    )
    return [
        {
            "id": u.id,
            "email": u.email,
            "nom": u.nom,
            "prenom": u.prenom,
            "createdAt": u.createdAt.isoformat() if u.createdAt else None,
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
                    {"id": d.id, "nomFichier": d.nomFichier, "cheminFichier": d.cheminFichier, "extention": d.extention, "taille": d.taille}
                    for d in u.entreprise.documents
                ],
            } if u.entreprise else None,
        }
        for u in users
    ]


class ValidateRejectRequest(BaseModel):
    motif: str | None = None


@router.post("/validate/{user_id}")
async def validate_enterprise(user_id: str, admin=Depends(get_admin_user)):
    user = await prisma.utilisateur.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouv\u00e9")
    if user.validationStatus != "pending":
        raise HTTPException(status_code=400, detail="Ce profil n'est pas en attente de validation")

    await prisma.utilisateur.update(where={"id": user_id}, data={"validationStatus": "validated"})

    if user.entrepriseId:
        await prisma.trustbadge.create(
            data={
                "entrepriseId": user.entrepriseId,
                "badgeType": "entreprise_verifiee",
                "description": "Profil v\u00e9rifi\u00e9 par l'administration",
            }
        )

    await prisma.adminaction.create(
        data={
            "adminId": admin.id,
            "cibleUserId": user_id,
            "typeAction": "VALIDATION_ENTREPRISE",
            "description": f"Profil de {user.nom} {user.prenom} ({user.email}) valid\u00e9",
            "metadata": json.dumps({"action": "validate"}),
        }
    )

    return {"success": True, "message": "Profil valid\u00e9 avec succ\u00e8s"}


@router.post("/reject/{user_id}")
async def reject_enterprise(user_id: str, body: ValidateRejectRequest, admin=Depends(get_admin_user)):
    if not body.motif:
        raise HTTPException(status_code=400, detail="Un motif de rejet est obligatoire")

    user = await prisma.utilisateur.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouv\u00e9")
    if user.validationStatus != "pending":
        raise HTTPException(status_code=400, detail="Ce profil n'est pas en attente de validation")

    await prisma.utilisateur.update(where={"id": user_id}, data={"validationStatus": "rejected"})

    await prisma.adminaction.create(
        data={
            "adminId": admin.id,
            "cibleUserId": user_id,
            "typeAction": "REJET_ENTREPRISE",
            "description": f"Profil de {user.nom} {user.prenom} ({user.email}) rejet\u00e9 : {body.motif}",
            "metadata": json.dumps({"motif": body.motif, "action": "reject"}),
        }
    )

    return {"success": True, "message": "Profil rejet\u00e9"}


# ─── ACCOUNT MODERATION ───────────────────────────────────

class SuspendRequest(BaseModel):
    motif: str | None = None


@router.post("/suspend/{user_id}")
async def suspend_user(user_id: str, body: SuspendRequest, admin=Depends(get_admin_user)):
    user = await prisma.utilisateur.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouv\u00e9")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Impossible de suspendre un administrateur")

    await prisma.utilisateur.update(where={"id": user_id}, data={"validationStatus": "suspended"})

    motif_text = f" : {body.motif}" if body.motif else ""
    await prisma.adminaction.create(
        data={
            "adminId": admin.id,
            "cibleUserId": user_id,
            "typeAction": "SUSPENSION",
            "description": f"Compte de {user.nom} {user.prenom} ({user.email}) suspendu{motif_text}",
            "metadata": json.dumps({"motif": body.motif, "action": "suspend"}),
        }
    )

    return {"success": True, "message": "Compte suspendu"}


@router.post("/reactivate/{user_id}")
async def reactivate_user(user_id: str, admin=Depends(get_admin_user)):
    user = await prisma.utilisateur.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouv\u00e9")
    if user.validationStatus != "suspended":
        raise HTTPException(status_code=400, detail="Ce compte n'est pas suspendu")

    await prisma.utilisateur.update(where={"id": user_id}, data={"validationStatus": "validated"})

    await prisma.adminaction.create(
        data={
            "adminId": admin.id,
            "cibleUserId": user_id,
            "typeAction": "REACTIVATION",
            "description": f"Compte de {user.nom} {user.prenom} ({user.email}) r\u00e9activ\u00e9",
            "metadata": json.dumps({"action": "reactivate"}),
        }
    )

    return {"success": True, "message": "Compte r\u00e9activ\u00e9"}


# ─── ENTERPRISE LIST ──────────────────────────────────────

@router.get("/enterprises")
async def get_enterprises(
    pays: str | None = None,
    secteur: str | None = None,
    role: str | None = None,
    search: str | None = None,
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

    total = await prisma.entreprise.count(where=where)
    entreprises = await prisma.entreprise.find_many(
        where=where,
        include={
            "location": True,
            "certifications": True,
            "badges": {"where": {"estActif": True}},
        },
        skip=(page - 1) * limit,
        take=limit,
        order={"createdAt": "desc"},
    )

    if pays:
        entreprises = [e for e in entreprises if e.location and e.location.pays.lower() == pays.lower()]

    enriched = []
    for e in entreprises:
        user_ids = [u.id for u in await prisma.utilisateur.find_many(where={"entrepriseId": e.id})]
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


# ─── REPORTS / SIGNALEMENTS ───────────────────────────────

class ReportCreateRequest(BaseModel):
    annonceId: str | None = None
    cibleUserId: str | None = None
    type: str
    motif: str


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
                "reporter": {"id": r.reporter.id, "nom": r.reporter.nom, "prenom": r.reporter.prenom, "email": r.reporter.email} if r.reporter else None,
                "cibleUserId": r.cibleUserId,
                "annonce": {"id": r.annonce.id, "titre": r.annonce.titre} if r.annonce else None,
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


@router.post("/reports")
async def create_report(body: ReportCreateRequest, user=Depends(get_current_user)):
    report = await prisma.report.create(
        data={
            "reporterId": user.id,
            "annonceId": body.annonceId,
            "cibleUserId": body.cibleUserId,
            "type": body.type,
            "motif": body.motif,
            "statut": "pending",
        }
    )
    return {"id": report.id, "statut": report.statut}


@router.post("/reports/{report_id}/treat")
async def treat_report(report_id: str, body: TreatReportRequest, admin=Depends(get_admin_user)):
    report = await prisma.report.find_unique(where={"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Signalement non trouv\u00e9")

    new_statut = "rejected" if body.action == "dismiss" else "processed"
    await prisma.report.update(
        where={"id": report_id},
        data={"statut": new_statut, "traitePar": admin.id, "dateTraitement": datetime.now(timezone.utc)},
    )

    if body.action == "block" and report.cibleUserId:
        await prisma.utilisateur.update(where={"id": report.cibleUserId}, data={"validationStatus": "suspended"})

    if body.action == "remove" and report.annonceId:
        await prisma.annonce.update(where={"id": report.annonceId}, data={"statut": "suspended"})

    await prisma.adminaction.create(
        data={
            "adminId": admin.id,
            "cibleUserId": report.cibleUserId,
            "typeAction": "TRAITEMENT_SIGNALEMENT",
            "description": f"Signalement {report_id} trait\u00e9 : {body.action}",
            "metadata": json.dumps({"reportId": report_id, "action": body.action, "motif": body.motif}),
        }
    )

    return {"success": True, "message": "Signalement trait\u00e9"}


# ─── KYB VERIFICATION ─────────────────────────────────────

class KYBCreateRequest(BaseModel):
    entrepriseId: str
    documents: list[dict] | None = None


class KYBReviewRequest(BaseModel):
    statut: str  # verified, rejected, pending
    score: int | None = None
    commentaire: str | None = None


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
            "createdAt": v.createdAt.isoformat() if v.createdAt else None,
        }
        for v in verifications
    ]


@router.post("/kyb")
async def create_kyb_verification(body: KYBCreateRequest, admin=Depends(get_admin_user)):
    entreprise = await prisma.entreprise.find_unique(where={"id": body.entrepriseId})
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise non trouv\u00e9e")

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
        raise HTTPException(status_code=404, detail="V\u00e9rification non trouv\u00e9e")

    await prisma.kybverification.update(
        where={"id": verification_id},
        data={
            "statut": body.statut,
            "score": body.score,
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
                    "description": f"KYB v\u00e9rifi\u00e9 - Score: {body.score or 'N/A'}",
                }
            )

    await prisma.adminaction.create(
        data={
            "adminId": admin.id,
            "typeAction": "REVIEW_KYB",
            "description": f"V\u00e9rification KYB {verification_id} : {body.statut}",
            "metadata": json.dumps({"verificationId": verification_id, "statut": body.statut, "score": body.score}),
        }
    )

    return {"success": True, "message": "V\u00e9rification KYB mise \u00e0 jour"}


# ─── TRUST BADGES ─────────────────────────────────────────

class BadgeAwardRequest(BaseModel):
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


@router.post("/badges")
async def award_badge(body: BadgeAwardRequest, admin=Depends(get_admin_user)):
    badge = await prisma.trustbadge.create(
        data={
            "entrepriseId": body.entrepriseId,
            "badgeType": body.badgeType,
            "description": body.description,
        }
    )

    await prisma.adminaction.create(
        data={
            "adminId": admin.id,
            "typeAction": "AWARD_BADGE",
            "description": f"Badge {body.badgeType} attribu\u00e9 \u00e0 l'entreprise {body.entrepriseId}",
            "metadata": json.dumps({"entrepriseId": body.entrepriseId, "badgeType": body.badgeType}),
        }
    )

    return {"id": badge.id, "badgeType": badge.badgeType}


@router.delete("/badges/{badge_id}")
async def revoke_badge(badge_id: str, admin=Depends(get_admin_user)):
    badge = await prisma.trustbadge.find_unique(where={"id": badge_id})
    if not badge:
        raise HTTPException(status_code=404, detail="Badge non trouv\u00e9")

    await prisma.trustbadge.update(where={"id": badge_id}, data={"estActif": False})

    await prisma.adminaction.create(
        data={
            "adminId": admin.id,
            "typeAction": "REVOKE_BADGE",
            "description": f"Badge {badge.badgeType} r\u00e9voqu\u00e9 pour l'entreprise {badge.entrepriseId}",
            "metadata": json.dumps({"badgeId": badge_id, "badgeType": badge.badgeType}),
        }
    )

    return {"success": True, "message": "Badge r\u00e9voqu\u00e9"}


# ─── REVIEWS / AVIS ───────────────────────────────────────

class ReviewCreateRequest(BaseModel):
    entrepriseId: str
    annonceId: str | None = None
    note: int
    commentaire: str | None = None
    dateVisite: str | None = None


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
            "dateVisite": r.dateVisite.isoformat() if r.dateVisite else None,
            "createdAt": r.createdAt.isoformat() if r.createdAt else None,
        }
        for r in reviews
    ]


@router.post("/reviews")
async def create_review(body: ReviewCreateRequest, user=Depends(get_current_user)):
    if body.note < 1 or body.note > 5:
        raise HTTPException(status_code=400, detail="La note doit \u00eatre entre 1 et 5")

    review = await prisma.review.create(
        data={
            "auteurId": user.id,
            "entrepriseId": body.entrepriseId,
            "annonceId": body.annonceId,
            "note": body.note,
            "commentaire": body.commentaire,
            "dateVisite": body.dateVisite,
        }
    )

    all_reviews = await prisma.review.find_many(where={"entrepriseId": body.entrepriseId})
    avg = sum(r.note for r in all_reviews) / len(all_reviews)

    if avg >= 4.5 and len(all_reviews) >= 5:
        entreprise = await prisma.entreprise.find_unique(where={"id": body.entrepriseId})
        if entreprise:
            badge_type = "top_exporter" if entreprise.role == "exporter" else "top_importer"
            existing = await prisma.trustbadge.find_first(
                where={"entrepriseId": body.entrepriseId, "badgeType": badge_type, "estActif": True}
            )
            if not existing:
                await prisma.trustbadge.create(
                    data={
                        "entrepriseId": body.entrepriseId,
                        "badgeType": badge_type,
                        "description": f"Note moyenne de {round(avg, 1)}/5 sur {len(all_reviews)} avis",
                    }
                )

    return {"id": review.id, "note": review.note}


# ─── MODERATION HISTORY ───────────────────────────────────

@router.get("/moderation-history")
async def get_moderation_history(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    admin=Depends(get_admin_user),
):
    total = await prisma.adminaction.count()
    actions = await prisma.adminaction.find_many(
        include={"admin": True},
        order={"createdAt": "desc"},
        skip=(page - 1) * limit,
        take=limit,
    )

    return {
        "actions": [
            {
                "id": a.id,
                "admin": {"id": a.admin.id, "nom": a.admin.nom, "prenom": a.admin.prenom, "email": a.admin.email} if a.admin else None,
                "cibleUserId": a.cibleUserId,
                "typeAction": a.typeAction,
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


# ─── RELIABILITY SCORE (consumed by AI Matching - Stagiaire 3)

@router.get("/reliability-score/{entreprise_id}")
async def get_reliability_score(entreprise_id: str, admin=Depends(get_admin_user)):
    entreprise = await prisma.entreprise.find_unique(
        where={"id": entreprise_id},
        include={"badges": {"where": {"estActif": True}}, "certifications": True, "location": True},
    )
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise non trouv\u00e9e")

    reviews = await prisma.review.find_many(where={"entrepriseId": entreprise_id})
    kyb = await prisma.kybverification.find_first(
        where={"entrepriseId": entreprise_id}, order={"createdAt": "desc"}
    )

    score = 0
    factors = []

    # KYB Verification (+30 points)
    if kyb and kyb.statut == "verified":
        score += 30
        factors.append({"name": "KYB_VERIFIE", "points": 30, "detail": f"Score KYB: {kyb.score or 'N/A'}"})

    # Certifications (+15 each, max 30)
    cert_points = min(len(entreprise.certifications) * 15, 30)
    score += cert_points
    if cert_points > 0:
        factors.append({"name": "CERTIFICATIONS", "points": cert_points, "detail": f"{len(entreprise.certifications)} certification(s)"})

    # Trust Badges (+10 each, max 20)
    badge_points = min(len(entreprise.badges) * 10, 20)
    score += badge_points
    if badge_points > 0:
        factors.append({"name": "BADGES", "points": badge_points, "detail": f"{len(entreprise.badges)} badge(s)"})

    # Reviews average (+20 max)
    if reviews:
        avg = sum(r.note for r in reviews) / len(reviews)
        review_points = round((avg / 5) * 20)
        score += review_points
        factors.append({"name": "AVIS", "points": review_points, "detail": f"Note moyenne: {round(avg, 1)}/5 ({len(reviews)} avis)"})

    # Account age (+10 if > 1 year)
    if entreprise.createdAt:
        age_ms = datetime.now(timezone.utc).timestamp() - entreprise.createdAt.timestamp()
        age_years = age_ms / (365 * 24 * 3600)
        if age_years >= 1:
            score += 10
            factors.append({"name": "ANCIENNETE", "points": 10, "detail": f"Membre depuis {int(age_years)} an(s)"})

    score = min(score, 100)

    return {
        "entrepriseId": entreprise_id,
        "score": score,
        "factors": factors,
        "version": "1.0",
        "calculatedAt": datetime.now(timezone.utc).isoformat(),
    }
