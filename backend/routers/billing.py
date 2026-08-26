import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import prisma
from deps import get_current_user

router = APIRouter(prefix="/api", tags=["billing"])


async def _get_invoices(user):
    facturations = await prisma.facturation.find_many(
        where={"utilisateurId": user.id}, order={"createdAt": "desc"}
    )
    return [
        {
            "id": f.numeroFacture,
            "date": f.datePaiement.strftime("%Y-%m-%d") if f.datePaiement else f.createdAt.strftime("%Y-%m-%d"),
            "amount": f"{f.montantTtc} \u20ac",
            "status": "paid" if f.statut == "free" else f.statut,
            "method": f.methodePaiement or "\u2014",
            "description": f"Facture {f.numeroFacture}",
        }
        for f in facturations
    ]


@router.get("/invoices")
async def get_invoices_root(user=Depends(get_current_user)):
    return await _get_invoices(user)


FREE_TIER_MAX = 50
PREMIUM_MAX = 9999


def _get_plan_info(facturations):
    if not facturations:
        return "free", FREE_TIER_MAX
    plan = facturations[0]
    if plan.statut in ("premium",):
        return "premium", PREMIUM_MAX
    if plan.statut in ("pay-per-use",):
        return "pay-per-use", PREMIUM_MAX
    return "free", FREE_TIER_MAX


async def _count_user_messages_this_month(user_id: str) -> int:
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    count = await prisma.message.count(
        where={
            "expediteurId": user_id,
            "dateEnvoi": {"gte": month_start},
        }
    )
    return count


PLAN_MAP = {
    "free": {"title": "Gratuit", "price": "0 \u20ac", "statut": "free", "maxChats": FREE_TIER_MAX},
    "pay-per-use": {"title": "Paiement \u00e0 l'usage", "price": "0,50 \u20ac", "statut": "pay-per-use", "maxChats": PREMIUM_MAX},
    "premium": {"title": "Premium", "price": "29 \u20ac/mois", "statut": "premium", "maxChats": PREMIUM_MAX},
}


async def _get_latest_subscription(user_id: str):
    return await prisma.facturation.find_first(
        where={"utilisateurId": user_id, "dateFinAbonnement": {"not": None}},
        order={"dateFinAbonnement": "desc"},
    )


@router.get("/billing/usage")
async def get_usage(user=Depends(get_current_user)):
    facturations = await prisma.facturation.find_many(
        where={"utilisateurId": user.id}, order={"createdAt": "desc"}
    )
    _, max_chats = _get_plan_info(facturations)
    used = await _count_user_messages_this_month(user.id)
    return {"usedChats": min(used, max_chats), "maxChats": max_chats}


@router.get("/billing/subscription")
async def get_subscription(user=Depends(get_current_user)):
    facturations = await prisma.facturation.find_many(
        where={"utilisateurId": user.id}, order={"createdAt": "desc"}
    )
    plan_id, _ = _get_plan_info(facturations)
    info = PLAN_MAP[plan_id]

    sub = await _get_latest_subscription(user.id)
    now = datetime.now(timezone.utc)

    started_at = None
    renewal_date = None
    cancel_at_period_end = False
    status = "active"

    if sub and sub.dateDebutAbonnement:
        started_at = sub.dateDebutAbonnement.isoformat()
    if sub and sub.dateFinAbonnement:
        renewal_date = sub.dateFinAbonnement.isoformat()
        if sub.dateFinAbonnement < now:
            cancel_at_period_end = False
            plan_id = "free"
            info = PLAN_MAP["free"]
            started_at = None
            renewal_date = None

    return {
        "planId": plan_id,
        "planTitle": info["title"],
        "price": info["price"],
        "status": status,
        "cancelAtPeriodEnd": cancel_at_period_end,
        "startedAt": started_at,
        "renewalDate": renewal_date,
        "billingCycle": "Mensuel",
    }


class ChangePlanRequest(BaseModel):
    planId: str


@router.post("/billing/change-plan")
async def change_plan(body: ChangePlanRequest, user=Depends(get_current_user)):
    if body.planId not in PLAN_MAP:
        raise HTTPException(status_code=400, detail="Plan inconnu")

    info = PLAN_MAP[body.planId]
    now = datetime.now(timezone.utc)
    renewal = now + timedelta(days=30)

    facturation = await prisma.facturation.create(
        data={
            "utilisateurId": user.id,
            "numeroFacture": f"INV-{uuid.uuid4().hex[:8].upper()}",
            "montantHt": 0,
            "tva": 0,
            "montantTva": 0,
            "montantTtc": 0,
            "statut": info["statut"],
            "methodePaiement": "stripe",
            "datePaiement": now,
            "nombreChatsFactures": 0,
            "dateDebutAbonnement": now,
            "dateFinAbonnement": renewal,
        }
    )

    return {
        "planId": body.planId,
        "planTitle": info["title"],
        "price": info["price"],
        "status": "active",
        "cancelAtPeriodEnd": False,
        "startedAt": now.isoformat(),
        "renewalDate": renewal.isoformat(),
        "billingCycle": "Mensuel",
    }


@router.post("/billing/cancel-subscription")
async def cancel_subscription(user=Depends(get_current_user)):
    sub = await _get_latest_subscription(user.id)
    if not sub or sub.statut in ("free",):
        raise HTTPException(status_code=400, detail="Aucun abonnement payant actif")

    return {
        "planId": _get_plan_info([sub])[0],
        "planTitle": PLAN_MAP[_get_plan_info([sub])[0]]["title"],
        "price": PLAN_MAP[_get_plan_info([sub])[0]]["price"],
        "status": "active",
        "cancelAtPeriodEnd": True,
        "startedAt": sub.dateDebutAbonnement.isoformat() if sub.dateDebutAbonnement else None,
        "renewalDate": sub.dateFinAbonnement.isoformat() if sub.dateFinAbonnement else None,
        "billingCycle": "Mensuel",
    }


@router.post("/billing/reactivate-subscription")
async def reactivate_subscription(user=Depends(get_current_user)):
    sub = await _get_latest_subscription(user.id)
    if not sub or sub.statut in ("free",):
        raise HTTPException(status_code=400, detail="Aucun abonnement payant actif")

    plan_id = _get_plan_info([sub])[0]
    info = PLAN_MAP[plan_id]

    return {
        "planId": plan_id,
        "planTitle": info["title"],
        "price": info["price"],
        "status": "active",
        "cancelAtPeriodEnd": False,
        "startedAt": sub.dateDebutAbonnement.isoformat() if sub.dateDebutAbonnement else None,
        "renewalDate": sub.dateFinAbonnement.isoformat() if sub.dateFinAbonnement else None,
        "billingCycle": "Mensuel",
    }


@router.get("/billing/invoices")
async def get_invoices(user=Depends(get_current_user)):
    return await _get_invoices(user)


@router.get("/billing/invoices/{invoice_id}")
async def get_invoice_by_id(invoice_id: str, user=Depends(get_current_user)):
    facturation = await prisma.facturation.find_first(
        where={"numeroFacture": invoice_id, "utilisateurId": user.id}
    )
    if not facturation:
        raise HTTPException(status_code=404, detail="Facture introuvable")
    return {
        "id": facturation.numeroFacture,
        "date": facturation.datePaiement.strftime("%Y-%m-%d") if facturation.datePaiement else "",
        "amount": f"{facturation.montantTtc} \u20ac",
        "status": facturation.statut,
        "method": facturation.methodePaiement or "\u2014",
    }


@router.post("/billing/check-paywall")
async def check_paywall(user=Depends(get_current_user)):
    facturations = await prisma.facturation.find_many(where={"utilisateurId": user.id})
    plan_id, max_chats = _get_plan_info(facturations)
    used = await _count_user_messages_this_month(user.id)
    return {
        "isBlocked": used >= max_chats,
        "usage": {"usedChats": used, "maxChats": max_chats},
        "isUnlimited": plan_id in ("premium", "pay-per-use"),
        "remaining": max(0, max_chats - used),
    }


@router.post("/billing/increment-usage")
async def increment_usage(user=Depends(get_current_user)):
    used = await _count_user_messages_this_month(user.id)
    facturations = await prisma.facturation.find_many(where={"utilisateurId": user.id})
    _, max_chats = _get_plan_info(facturations)
    return {"usedChats": min(used, max_chats), "maxChats": max_chats}


@router.get("/billing/plans")
async def get_plans():
    return [
        {"id": "free", "title": "Gratuit", "price": "0 \u20ac", "subtitle": "50 premiers messages offerts", "features": ["50 messages gratuits", "Cr\u00e9ation d'annonces", "Matching IA", "Consultation du catalogue"], "buttonLabel": "Plan actuel", "highlighted": False},
        {"id": "pay-per-use", "title": "Paiement \u00e0 l'usage", "price": "0,50 \u20ac", "subtitle": "Par conversation", "features": ["Aucun abonnement", "Paiement uniquement \u00e0 l'utilisation", "Flexible"], "buttonLabel": "Choisir cette formule", "highlighted": False},
        {"id": "premium", "title": "Premium", "price": "29 \u20ac/mois", "subtitle": "Pour les utilisateurs intensifs", "features": ["Messages illimit\u00e9s", "Matching prioritaire", "Support prioritaire", "Historique avanc\u00e9"], "buttonLabel": "Passer Premium", "highlighted": True},
    ]


@router.post("/payments/create-intent")
async def create_payment_intent(user=Depends(get_current_user)):
    return {"clientSecret": "mock_secret_for_demo"}


# ─── PAYMENT METHODS ─────────────────────────────────────

@router.get("/billing/payment-methods")
async def get_payment_methods(user=Depends(get_current_user)):
    methods = await prisma.modepaiement.find_many(
        where={"utilisateurId": user.id}, order={"createdAt": "desc"}
    )
    return [
        {
            "id": m.id,
            "type": m.type,
            "brand": m.brand,
            "last4": m.last4,
            "expiry": m.expiry,
            "holder": m.holder,
            "email": m.email,
            "isDefault": m.isDefault,
        }
        for m in methods
    ]


class AddPaymentMethodRequest(BaseModel):
    type: str
    brand: str | None = None
    last4: str | None = None
    expiry: str | None = None
    holder: str | None = None
    email: str | None = None


@router.post("/billing/payment-methods")
async def add_payment_method(body: AddPaymentMethodRequest, user=Depends(get_current_user)):
    existing = await prisma.modepaiement.find_many(where={"utilisateurId": user.id})
    is_first = len(existing) == 0

    method = await prisma.modepaiement.create(
        data={
            "utilisateurId": user.id,
            "type": body.type,
            "brand": body.brand,
            "last4": body.last4,
            "expiry": body.expiry,
            "holder": body.holder,
            "email": body.email,
            "isDefault": is_first,
        }
    )
    return {
        "id": method.id,
        "type": method.type,
        "brand": method.brand,
        "last4": method.last4,
        "expiry": method.expiry,
        "holder": method.holder,
        "email": method.email,
        "isDefault": method.isDefault,
    }


@router.delete("/billing/payment-methods/{method_id}")
async def remove_payment_method(method_id: str, user=Depends(get_current_user)):
    method = await prisma.modepaiement.find_first(
        where={"id": method_id, "utilisateurId": user.id}
    )
    if not method:
        raise HTTPException(status_code=404, detail="Moyen de paiement introuvable")
    was_default = method.isDefault
    await prisma.modepaiement.delete(where={"id": method_id})
    if was_default:
        remaining = await prisma.modepaiement.find_first(
            where={"utilisateurId": user.id}
        )
        if remaining:
            await prisma.modepaiement.update(
                where={"id": remaining.id}, data={"isDefault": True}
            )
    return {"success": True}


@router.put("/billing/payment-methods/{method_id}/default")
async def set_default_payment_method(method_id: str, user=Depends(get_current_user)):
    method = await prisma.modepaiement.find_first(
        where={"id": method_id, "utilisateurId": user.id}
    )
    if not method:
        raise HTTPException(status_code=404, detail="Moyen de paiement introuvable")

    await prisma.modepaiement.update_many(
        where={"utilisateurId": user.id}, data={"isDefault": False}
    )
    await prisma.modepaiement.update(
        where={"id": method_id}, data={"isDefault": True}
    )

    methods = await prisma.modepaiement.find_many(
        where={"utilisateurId": user.id}, order={"createdAt": "desc"}
    )
    return [
        {
            "id": m.id,
            "type": m.type,
            "brand": m.brand,
            "last4": m.last4,
            "expiry": m.expiry,
            "holder": m.holder,
            "email": m.email,
            "isDefault": m.isDefault,
        }
        for m in methods
    ]
