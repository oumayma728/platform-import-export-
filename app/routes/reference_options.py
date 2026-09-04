from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middleware.auth import verify_token
from app.models.reference_option import ReferenceOption
from app.schemas.reference_option import ReferenceOptionCreate, ALLOWED_KINDS

router = APIRouter(prefix="/reference-options", tags=["Référentiels"])


def _normalize(kind: str, value: str) -> str:
    if kind not in ALLOWED_KINDS:
        raise HTTPException(status_code=404, detail="Type de référentiel inconnu")

    value = (value or "").strip()
    if not value:
        raise HTTPException(status_code=422, detail="La valeur est obligatoire")

    if kind == "currency":
        value = value.upper()
        if len(value) != 3 or not value.isalpha():
            raise HTTPException(
                status_code=422,
                detail="Une devise doit être un code de 3 lettres, par exemple TND, EUR ou USD.",
            )
    elif kind == "incoterm":
        value = value.upper()
    elif kind == "quantity_unit" and len(value) > 30:
        raise HTTPException(status_code=422, detail="L'unité est trop longue")
    elif kind == "country" and len(value) < 2:
        raise HTTPException(status_code=422, detail="Nom de pays invalide")
    elif kind == "category" and len(value) < 2:
        raise HTTPException(status_code=422, detail="Catégorie invalide")

    return value


@router.get("", summary="Vérifier le service des référentiels")
def reference_options_health():
    return {
        "ok": True,
        "kinds": sorted(ALLOWED_KINDS),
    }


@router.get("/{kind}", summary="Lister les valeurs d'un référentiel")
def list_reference_options(kind: str, db: Session = Depends(get_db)):
    if kind not in ALLOWED_KINDS:
        raise HTTPException(status_code=404, detail="Type de référentiel inconnu")

    rows = (
        db.query(ReferenceOption)
        .filter(ReferenceOption.kind == kind)
        .order_by(ReferenceOption.label.asc())
        .all()
    )

    return [
        {
            "id": row.id,
            "kind": row.kind,
            "value": row.value,
            "label": row.label,
            "is_custom": bool(row.is_custom),
        }
        for row in rows
    ]


@router.post(
    "/{kind}",
    status_code=status.HTTP_201_CREATED,
    summary="Ajouter une valeur absente du référentiel",
)
def add_reference_option(
    kind: str,
    payload: ReferenceOptionCreate,
    user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    value = _normalize(kind, payload.value)
    label = (payload.label or value).strip()

    existing = (
        db.query(ReferenceOption)
        .filter(
            ReferenceOption.kind == kind,
            func.lower(ReferenceOption.value) == value.lower(),
        )
        .first()
    )

    if existing:
        return {
            "id": existing.id,
            "kind": existing.kind,
            "value": existing.value,
            "label": existing.label,
            "is_custom": bool(existing.is_custom),
            "already_exists": True,
        }

    row = ReferenceOption(
        kind=kind,
        value=value,
        label=label,
        is_custom=True,
        created_by=user.get("id") if isinstance(user, dict) else None,
    )

    try:
        db.add(row)
        db.commit()
        db.refresh(row)
    except IntegrityError:
        db.rollback()
        existing = (
            db.query(ReferenceOption)
            .filter(
                ReferenceOption.kind == kind,
                func.lower(ReferenceOption.value) == value.lower(),
            )
            .first()
        )
        if existing:
            return {
                "id": existing.id,
                "kind": existing.kind,
                "value": existing.value,
                "label": existing.label,
                "is_custom": bool(existing.is_custom),
                "already_exists": True,
            }
        raise HTTPException(status_code=409, detail="Impossible d'ajouter cette valeur")

    return {
        "id": row.id,
        "kind": row.kind,
        "value": row.value,
        "label": row.label,
        "is_custom": bool(row.is_custom),
        "already_exists": False,
    }
