"""
Seed the database with an admin user and sample data.
Run: cd backend && python prisma/seed.py
"""
import sys
import os
import asyncio

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from prisma import Prisma
from auth import hash_password

prisma = Prisma()


async def main():
    await prisma.connect()

    # ── Admin user ──
    admin = await prisma.utilisateur.find_unique(where={"email": "admin@platform.com"})
    if not admin:
        admin = await prisma.utilisateur.create(
            data={
                "email": "admin@platform.com",
                "passwordHash": hash_password("admin123"),
                "nom": "Admin",
                "prenom": "Super",
                "role": "admin",
                "validationStatus": "validated",
            }
        )
        print(f"Admin created: admin@platform.com / admin123 (id={admin.id})")
    else:
        print("Admin already exists")

    # ── Sample users ──
    users_data = [
        {"email": "exporter@test.com", "entreprise": {
            "nom": "Nile Cotton Trading", "role": "exporter", "secteurActivite": "Textile",
            "siret": "123456789", "description": "Exportateur egyptien de coton certifie GOTS"
        }, "location": {"pays": "Egypte", "ville": "Alexandrie", "codePostal": "21500", "adresse": "Port Said St.", "region": "Alexandrie"}},
        {"email": "importer@test.com", "entreprise": {
            "nom": "Green Import Co.", "role": "importer", "secteurActivite": "Agroalimentaire",
            "description": "Importateur francais specialise produits mediterraneens"
        }, "location": {"pays": "France", "ville": "Marseille", "codePostal": "13000", "adresse": "Rue de la Joliette", "region": "Provence"}},
        {"email": "solartech@test.com", "entreprise": {
            "nom": "SolarTech Guangzhou", "role": "exporter", "secteurActivite": "Energie / Photovoltaique",
            "siret": "987654321", "description": "Fabricant chinois de panneaux solaires certifies CE"
        }, "location": {"pays": "Chine", "ville": "Guangzhou", "codePostal": "510000", "adresse": "Tech Park", "region": "Guangdong"}},
        {"email": "olive@test.com", "entreprise": {
            "nom": "Olive Trade Iberia", "role": "exporter", "secteurActivite": "Agroalimentaire",
            "description": "Negociant espagnol d'huile d'olive extra vierge"
        }, "location": {"pays": "Espagne", "ville": "Seville", "codePostal": "41001", "adresse": "Calle Olive", "region": "Andalousie"}},
        {"email": "epicerie@test.com", "entreprise": {
            "nom": "Epicerie Gourmande Belgique", "role": "importer", "secteurActivite": "Agroalimentaire",
            "description": "Grossiste belge en epicerie fine certifiee Bio"
        }, "location": {"pays": "Belgique", "ville": "Bruxelles", "codePostal": "1000", "adresse": "Grand Place", "region": "Bruxelles-Capitale"}},
    ]

    for u in users_data:
        existing = await prisma.utilisateur.find_unique(where={"email": u["email"]})
        if existing:
            print(f"  User {u['email']} already exists, skipping")
            continue

        user = await prisma.utilisateur.create(
            data={
                "email": u["email"],
                "passwordHash": hash_password("test123"),
                "nom": u["entreprise"]["nom"],
                "prenom": "Test",
                "validationStatus": "validated",
            }
        )

        loc = await prisma.location.create(data=u["location"])
        ent = await prisma.entreprise.create(
            data={
                **u["entreprise"],
                "locationId": loc.id,
            }
        )
        await prisma.utilisateur.update(where={"id": user.id}, data={"entrepriseId": ent.id})
        print(f"  User {u['email']} / test123 created (id={user.id})")

    # ── Sample categories ──
    cats = ["Agroalimentaire", "Textile", "Industrie", "Energie", "Technologie", "Pharmacie"]
    for cat in cats:
        existing = await prisma.categorie.find_first(where={"nom": cat})
        if not existing:
            await prisma.categorie.create(data={"nom": cat, "description": f"Categorie {cat}"})
    print("  Categories seeded")

    # ── Sample incoterms ──
    incoterms = [
        {"code": "FOB", "nom": "Free On Board"},
        {"code": "CIF", "nom": "Cost, Insurance & Freight"},
        {"code": "EXW", "nom": "Ex Works"},
        {"code": "DAP", "nom": "Delivered At Place"},
        {"code": "DDP", "nom": "Delivered Duty Paid"},
        {"code": "CFR", "nom": "Cost & Freight"},
    ]
    for inc in incoterms:
        existing = await prisma.incoterme.find_first(where={"code": inc["code"]})
        if not existing:
            await prisma.incoterme.create(data=inc)
    print("  Incoterms seeded")

    await prisma.disconnect()
    print("\nSeed complete!")


if __name__ == "__main__":
    asyncio.run(main())
