import sys
import os
import random
import uuid
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from sqlalchemy import text
from app.config.database import SessionLocal, engine
from app.models.models import (
    Base, User, Company, Listing, Role, TypeCompany, 
    StatutValidation, StatutListing, TypeListing, Billing, UserQuota, StatutFacturation,
    Conversation, Message, StatutConversation
)
from app.config.security import get_password_hash

def seed_database():
    print("Dropping all existing tables to reset schema...")
    with engine.connect() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE;"))
        conn.execute(text("CREATE SCHEMA public;"))
        conn.commit()
    print("Recreating all tables with new schema...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # --- 1. Création de l'Admin ---
        admin_user = User(
            email="hatim1@gmail.com",
            password_hash=get_password_hash("admin123"),
            role=Role.ADMIN
        )
        db.add(admin_user)
        db.commit()

        # Listes pour stocker les références
        exportateurs = []
        importateurs = []
        
        pays_list = ["Tunisie", "France", "Maroc", "Algérie", "Sénégal", "Côte d'Ivoire", "Espagne", "Italie", "Allemagne"]
        domaines = ["Agroalimentaire", "Textile", "Automobile", "Électronique", "Matériaux de construction", "Plastique", "Meubles"]

        print("Création de 15 Entreprises Exportatrices et 15 Importatrices...")
        # --- 2. Création de 30 Entreprises (15 Export, 15 Import) ---
        for i in range(1, 31):
            type_comp = TypeCompany.EXPORTATEUR if i <= 15 else TypeCompany.IMPORTATEUR
            company_name = f"ExportCorp {i}" if type_comp == TypeCompany.EXPORTATEUR else f"ImportGlobal {i}"
            email = f"contact@export{i}.com" if type_comp == TypeCompany.EXPORTATEUR else f"contact@import{i}.com"
            
            # Utilisateur d'abord
            user = User(
                email=email,
                password_hash=get_password_hash("password123"),
                role=Role.CLIENT
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            comp = Company(
                user_id=user.id,
                company_name=company_name,
                type=type_comp,
                pays=random.choice(pays_list),
                adresse=f"Adresse commerciale {i}, BP {1000+i}",
                statut_validation=StatutValidation.VALIDE
            )
            db.add(comp)
            db.commit()
            db.refresh(comp)
            
            # Quota et Facturation
            db.add(Billing(company_id=comp.id, statut_facturation=StatutFacturation.GRATUIT))
            db.add(UserQuota(company_id=comp.id, chats_gratuits_restants=50))
            db.commit()
            
            if type_comp == TypeCompany.EXPORTATEUR:
                exportateurs.append({"company": comp, "user": user})
            else:
                importateurs.append({"company": comp, "user": user})

        # --- 3. Création de 40 Annonces ---
        print("Création de 40 Annonces (Offres et Demandes)...")
        listings_crees = []
        for i in range(1, 41):
            is_offre = i <= 25 # 25 offres, 15 demandes
            type_list = TypeListing.OFFRE if is_offre else TypeListing.DEMANDE
            
            # Choisir une entreprise aléatoirement (Exportateur vend, Importateur achète)
            comp_dict = random.choice(exportateurs) if is_offre else random.choice(importateurs)
            comp = comp_dict["company"]
            
            domaine = random.choice(domaines)
            
            listing = Listing(
                company_id=comp.id,
                type=type_list,
                titre=f"{'Vente de' if is_offre else 'Recherche de'} {domaine} Premium - Lot {i}",
                description=f"Nous {'proposons' if is_offre else 'recherchons'} des produits de qualité dans le domaine : {domaine}. Quantité importante, prix négociable.",
                categorie=domaine,
                prix=random.randint(1000, 50000),
                quantite=random.randint(50, 10000),
                pays=comp.pays,
                statut=StatutListing.ACTIVE
            )
            db.add(listing)
            db.commit()
            db.refresh(listing)
            listings_crees.append(listing)

        # --- 4. Simulation de 30 Conversations ---
        print("Création de 30 conversations avec des messages...")
        for i in range(30):
            listing = random.choice(listings_crees)
            # Trouver une entreprise intéressée (qui n'est pas l'auteur)
            interessee = random.choice(importateurs) if listing.type == TypeListing.OFFRE else random.choice(exportateurs)
            initiator_comp = interessee["company"]
            initiator_user = interessee["user"]
            
            # Trouver l'utilisateur propriétaire de l'annonce
            owner_comp = db.query(Company).filter(Company.id == listing.company_id).first()
            owner_user = owner_comp.user
            
            # Déduire 1 chat du quota de l'initiateur
            initiator_quota = db.query(UserQuota).filter(UserQuota.company_id == initiator_comp.id).first()
            if initiator_quota and initiator_quota.chats_gratuits_restants > 0:
                initiator_quota.chats_gratuits_restants -= 1
                initiator_quota.chats_utilises += 1

            conv = Conversation(
                listing_id=listing.id,
                initiator_company_id=initiator_comp.id,
                statut=random.choice([StatutConversation.EN_CONTACT, StatutConversation.CONCLUE])
            )
            db.add(conv)
            db.commit()
            db.refresh(conv)
            
            # Ajouter 3 messages par conversation
            dates = [
                datetime.utcnow() - timedelta(days=2),
                datetime.utcnow() - timedelta(days=1),
                datetime.utcnow() - timedelta(hours=5)
            ]
            
            msg1 = Message(conversation_id=conv.id, sender_id=initiator_user.id, contenu=f"Bonjour, je suis très intéressé par votre annonce : {listing.titre}.", date_envoi=dates[0])
            msg2 = Message(conversation_id=conv.id, sender_id=owner_user.id, contenu=f"Bonjour ! Merci pour votre intérêt. Êtes-vous disponible pour discuter des modalités ?", date_envoi=dates[1])
            msg3 = Message(conversation_id=conv.id, sender_id=initiator_user.id, contenu=f"Oui, on peut discuter du prix pour {listing.quantite} unités.", date_envoi=dates[2])
            
            db.add_all([msg1, msg2, msg3])
            db.commit()

        print("✅ INCROYABLE ! Base de données générée avec succès !")
        print("📊 STATISTIQUES :")
        print("- 1 Admin (hatim1@gmail.com / admin123)")
        print("- 30 Entreprises (15 Export / 15 Import) - Mots de passe: password123")
        print("- 30 Profils de Facturation et Quotas créés")
        print("- 40 Annonces actives (Offres & Demandes)")
        print("- 30 Conversations actives")
        print("- 90 Messages échangés")
        print("\n🚀 Le Backend est prêt à être testé avec de VRAIES DONNÉES massives !")

    except Exception as e:
        print(f"Erreur lors du remplissage de la BD : {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
