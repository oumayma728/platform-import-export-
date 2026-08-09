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

    # ── Admin (identité séparée, spec §4) ──
    admin_user = await prisma.utilisateur.find_unique(where={"email": "admin@platform.com"})
    admin = await prisma.admin.find_unique(where={"email": "admin@platform.com"})
    if not admin:
        admin = await prisma.admin.create(
            data={
                # Même id que l'ancien utilisateur admin legacy pour que
                # les AdminAction historiques restent rattachées.
                "id": admin_user.id if admin_user else None,
                "email": "admin@platform.com",
                "passwordHash": hash_password("admin123"),
                "nom": "Admin",
                "prenom": "Super",
                "role": "superadmin",
                "isActive": True,
            }
        )
        print(f"Admin created: admin@platform.com / admin123 (id={admin.id}, role=superadmin)")
    else:
        print("Admin already exists")

    if not admin_user:
        admin_user = await prisma.utilisateur.create(
            data={
                "email": "admin@platform.com",
                "passwordHash": hash_password("admin123"),
                "nom": "Admin",
                "prenom": "Super",
                "role": "admin",
                "validationStatus": "validated",
            }
        )
        print(f"Legacy admin user created (id={admin_user.id})")
    else:
        print("Legacy admin user already exists")

    # ── Moderateurs (identité séparée, spec §4) ──
    # On (ré)applique toujours le mot de passe par défaut pour que les
    # identifiants de démo restent stables entre deux seeds.
    moderators = [
        {"email": "moderateur@platform.com", "password": "moderator123", "nom": "Mod", "prenom": "Moderateur"},
        {"email": "newmod1785913547@x.com", "password": "moderator123", "nom": "Modo", "prenom": "Test"},
    ]
    for m in moderators:
        existing_mod = await prisma.admin.find_unique(where={"email": m["email"]})
        if existing_mod:
            await prisma.admin.update(
                where={"id": existing_mod.id},
                data={"passwordHash": hash_password(m["password"]), "isActive": True},
            )
            print(f"Moderator reset: {m['email']} / {m['password']} (role={existing_mod.role})")
        else:
            created_mod = await prisma.admin.create(
                data={
                    "email": m["email"],
                    "passwordHash": hash_password(m["password"]),
                    "nom": m["nom"],
                    "prenom": m["prenom"],
                    "role": "moderateur",
                    "isActive": True,
                }
            )
            print(f"Moderator created: {m['email']} / {m['password']} (id={created_mod.id}, role=moderateur)")


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

    # ── Documents KYB de démonstration (livres du domaine public, spec §3) ──
    from seed_kyb_books import seed_kyb_documents

    await seed_kyb_documents(prisma)

    await prisma.disconnect()
    print("\nSeed complete!")


if __name__ == "__main__":
    asyncio.run(main())
