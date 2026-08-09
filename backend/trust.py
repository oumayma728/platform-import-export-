"""
Score de confiance (spec §5.5).

Le contrat JSON stocké dans `Entreprise.trustScoreDetails` est stable et
documenté — c'est l'artefact consommé par le matcher IA (Stagiaire 3) :

{
  "score": 82.5,
  "computed_at": "2026-08-04T10:00:00Z",
  "components": {
    "kyb_verified": 30,
    "avg_review_score": 28.5,
    "review_count": 12,
    "response_rate": 15,
    "account_age_months": 9,
    "flags_penalty": 0
  },
  "badges": ["VERIFIED", "TOP_EXPORTER"]
}
"""
import json
from datetime import datetime, timedelta, timezone

from database import prisma

MAX_SCORE = 100.0


def _badge_codes(entreprise) -> list[str]:
    """Codes de badges (TrustBadge legacy + EntrepriseBadge via définitions Badge)."""
    codes = set()
    for b in entreprise.badges or []:
        codes.add(b.badgeType.upper().replace(" ", "_"))
    for eb in entreprise.entrepriseBadges or []:
        if eb.badge:
            codes.add(eb.badge.code.upper())
    return sorted(codes)


async def _evaluate_badge_criteres(entreprise_id: str, score: float, components: dict) -> list[str]:
    """Évalue automatiquement les règles JSON des définitions Badge (spec §5.5).

    Seules les définitions avec des critères non vides sont évaluées ; un badge
    déjà attribué manuellement n'est jamais retiré. Règles supportées :
    min_trust_score, min_reviews, min_avg_review_score, kyb_verified, max_flags_penalty.
    """
    definitions = await prisma.badge.find_many()
    earned: list[str] = []
    for badge in definitions:
        try:
            crit = json.loads(badge.criteres) if badge.criteres else {}
        except Exception:
            crit = {}
        if not isinstance(crit, dict) or not crit:
            continue

        matched = True
        if "min_trust_score" in crit and score < float(crit["min_trust_score"]):
            matched = False
        if "min_reviews" in crit and components.get("review_count", 0) < int(crit["min_reviews"]):
            matched = False
        if "min_avg_review_score" in crit and components.get("review_count", 0):
            avg = round((components.get("avg_review_score", 0) / 30) * 5, 2)
            if avg < float(crit["min_avg_review_score"]):
                matched = False
        if "kyb_verified" in crit:
            kyb_ok = components.get("kyb_verified", 0) > 0
            if bool(crit["kyb_verified"]) != kyb_ok:
                matched = False
        if "max_flags_penalty" in crit and abs(components.get("flags_penalty", 0)) > float(crit["max_flags_penalty"]):
            matched = False

        if matched:
            earned.append(badge.code)
            existing = await prisma.entreprisebadge.find_first(
                where={"entrepriseId": entreprise_id, "badgeId": badge.id}
            )
            if not existing:
                await prisma.entreprisebadge.create(
                    data={"entrepriseId": entreprise_id, "badgeId": badge.id}
                )
    return earned


async def compute_trust_score(entreprise_id: str) -> dict:
    """Calcule le score de confiance d'une entreprise et le retourne (sans le stocker)."""
    entreprise = await prisma.entreprise.find_unique(
        where={"id": entreprise_id},
        include={
            "location": True,
            "badges": {"where": {"estActif": True}},
            "entrepriseBadges": {"include": {"badge": True}},
        },
    )
    if not entreprise:
        raise ValueError(f"Entreprise {entreprise_id} introuvable")

    user_ids = [
        u.id for u in await prisma.utilisateur.find_many(where={"entrepriseId": entreprise_id})
    ]

    reviews = await prisma.review.find_many(where={"entrepriseId": entreprise_id})
    kyb = await prisma.kybverification.find_first(
        where={"entrepriseId": entreprise_id}, order={"createdAt": "desc"}
    )

    # Signalements visant l'entreprise (compte ou entreprise directement)
    where_reports = {}
    if user_ids:
        where_reports["OR"] = [
            {"cibleUserId": {"in": user_ids}},
            {"cibleType": "ENTREPRISE", "cibleId": entreprise_id},
        ]
    else:
        where_reports["OR"] = [{"cibleType": "ENTREPRISE", "cibleId": entreprise_id}]
    reports = await prisma.report.find_many(where=where_reports)
    open_flags = [
        r for r in reports if r.statut in ("pending", "processed", "en_attente", "en_cours", "traite")
    ]

    # ── Composants ────────────────────────────────────────────────
    components: dict = {
        "kyb_verified": 0,
        "avg_review_score": 0,
        "review_count": 0,
        "response_rate": 0,
        "account_age_months": 0,
        "flags_penalty": 0,
    }

    # KYB vérifié → 30 points
    if kyb and kyb.statut == "verified":
        components["kyb_verified"] = 30

    # Note moyenne → jusqu'à 30 points (note/5 * 30)
    if reviews:
        avg = sum(r.note for r in reviews) / len(reviews)
        components["avg_review_score"] = round((avg / 5) * 30, 2)
        components["review_count"] = len(reviews)

    # Taux de réponse → jusqu'à 15 points
    if user_ids:
        convos = await prisma.conversation.find_many(
            where={
                "OR": [{"vendeurId": {"in": user_ids}}, {"acheteurId": {"in": user_ids}}]
            },
            include={"messages": True},
        )
        if convos:
            answered = 0
            for conv in convos:
                msgs = conv.messages or []
                if not msgs:
                    continue
                company_sent = any(m.expediteurId in user_ids for m in msgs)
                other_sent = any(m.expediteurId not in user_ids for m in msgs)
                if company_sent and other_sent:
                    answered += 1
            components["response_rate"] = round((answered / len(convos)) * 15, 2)

    # Ancienneté du compte → jusqu'à 15 points (1 pt / mois)
    if entreprise.createdAt:
        months = (datetime.now(timezone.utc) - entreprise.createdAt) / timedelta(days=30.44)
        components["account_age_months"] = min(int(months), 15)

    # Pénalité signalements → -5 par signalement ouvert, plafonnée à -20
    components["flags_penalty"] = -min(len(open_flags) * 5, 20)

    score = round(
        sum(v for k, v in components.items() if k not in ("review_count",)),
        2,
    )
    score = max(0.0, min(MAX_SCORE, score))

    earned = await _evaluate_badge_criteres(entreprise_id, score, components)

    return {
        "score": score,
        "computed_at": datetime.now(timezone.utc).isoformat(),
        "components": components,
        "badges": sorted(set(_badge_codes(entreprise)) | set(earned)),
    }


async def compute_and_store_trust_score(entreprise_id: str) -> dict:
    """Calcule le score et le stocke dans Entreprise.trustScore / trustScoreDetails."""
    details = await compute_trust_score(entreprise_id)
    await prisma.entreprise.update(
        where={"id": entreprise_id},
        data={
            "trustScore": details["score"],
            "trustScoreDetails": json.dumps(details),
        },
    )
    return details


async def recompute_all_trust_scores() -> int:
    """Recompute par lots (job nocturne de sécurité, spec §5.5)."""
    entreprises = await prisma.entreprise.find_many()
    updated = 0
    for e in entreprises:
        try:
            await compute_and_store_trust_score(e.id)
            updated += 1
        except Exception:
            continue
    return updated
