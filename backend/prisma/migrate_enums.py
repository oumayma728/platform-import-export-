"""
Migrate existing DB data from uppercase French enum values to lowercase English.
Run: cd backend && python prisma/migrate_enums.py
"""
import sys
import os
import asyncio

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from prisma import Prisma

prisma = Prisma()


async def main():
    await prisma.connect()

    # ── Utilisateur.validationStatus ──
    status_map = {
        "EN_ATTENTE_VALIDATION": "pending",
        "VALIDE": "validated",
        "REJETE": "rejected",
        "SUSPENDU": "suspended",
    }
    for old, new in status_map.items():
        result = await prisma.utilisateur.update_many(
            where={"validationStatus": old},
            data={"validationStatus": new},
        )
        if result:
            print(f"  Utilisateur.validationStatus: {old} -> {new} ({result} rows)")

    # ── Entreprise.role ──
    role_map = {
        "EXPORTATEUR": "exporter",
        "IMPORTATEUR": "importer",
        "BOTH": "both",
    }
    for old, new in role_map.items():
        result = await prisma.entreprise.update_many(
            where={"role": old},
            data={"role": new},
        )
        if result:
            print(f"  Entreprise.role: {old} -> {new} ({result} rows)")

    # ── Annonce.type ──
    type_map = {"OFFRE": "offer", "DEMANDE": "demand"}
    for old, new in type_map.items():
        result = await prisma.annonce.update_many(
            where={"type": old},
            data={"type": new},
        )
        if result:
            print(f"  Annonce.type: {old} -> {new} ({result} rows)")

    # ── Annonce.statut ──
    statut_map = {
        "ACTIVE": "active",
        "SUSPENDUE": "suspended",
        "CLOTUREE": "closed",
        "EXPIREE": "expired",
        "BROUILLON": "draft",
    }
    for old, new in statut_map.items():
        result = await prisma.annonce.update_many(
            where={"statut": old},
            data={"statut": new},
        )
        if result:
            print(f"  Annonce.statut: {old} -> {new} ({result} rows)")

    # ── Facturation.statut ──
    fact_map = {
        "GRATUIT": "free",
        "PREMIUM": "premium",
        "PAY_PER_USE": "pay-per-use",
    }
    for old, new in fact_map.items():
        result = await prisma.facturation.update_many(
            where={"statut": old},
            data={"statut": new},
        )
        if result:
            print(f"  Facturation.statut: {old} -> {new} ({result} rows)")

    # ── Report.statut ──
    report_map = {"EN_ATTENTE": "pending", "TRAITE": "processed", "REJETE": "rejected"}
    for old, new in report_map.items():
        result = await prisma.report.update_many(
            where={"statut": old},
            data={"statut": new},
        )
        if result:
            print(f"  Report.statut: {old} -> {new} ({result} rows)")

    # ── KYBVerification.statut ──
    kyb_map = {"EN_ATTENTE": "pending", "VERIFIE": "verified", "REJETE": "rejected"}
    for old, new in kyb_map.items():
        result = await prisma.kybverification.update_many(
            where={"statut": old},
            data={"statut": new},
        )
        if result:
            print(f"  KYBVerification.statut: {old} -> {new} ({result} rows)")

    # ── TrustBadge.badgeType ──
    badge_map = {
        "ENTREPRISE_VERIFIEE": "entreprise_verifiee",
        "ENTREPRISE_CERTIFIEE": "entreprise_certifiee",
        "TOP_EXPORTATEUR": "top_exporter",
        "TOP_IMPORTATEUR": "top_importer",
    }
    for old, new in badge_map.items():
        result = await prisma.trustbadge.update_many(
            where={"badgeType": old},
            data={"badgeType": new},
        )
        if result:
            print(f"  TrustBadge.badgeType: {old} -> {new} ({result} rows)")

    await prisma.disconnect()
    print("\nMigration complete!")


if __name__ == "__main__":
    asyncio.run(main())
