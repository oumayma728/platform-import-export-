"""
main.py — Application FastAPI principale
Initialise la DB PostgreSQL, les routes et les seeders.
"""
import hashlib
import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from apscheduler.schedulers.background import BackgroundScheduler

load_dotenv()

from .database import Base, engine, SessionLocal
from .models import Company, Salon, User, Role
from .services.currency import CurrencyService
from .services.notification import NotificationService
from .services.reminders import run_rdv_reminders

# Import des routers
from .routes.auth import router as auth_router
from .routes.companies import router as companies_router
from .routes.salons import router as salons_router
from .routes.stands import router as stands_router
from .routes.rendezvous import router as rendezvous_router
from .routes.uploads import router as uploads_router
from .routes.messaging import router as messaging_router
from .routes.payments import router as payments_router
from .routes.external import router as external_router
from .routes.ads import router as ads_router
from .routes.stats import router as stats_router
from .routes.billing import router as billing_router
from .routes.subscriptions import router as subscriptions_router

logger = logging.getLogger(__name__)

FREE_CHAT_LIMIT = 50


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def seed_database(db: Session) -> None:
    """Initialise les données de démonstration si la DB est vide."""

    # Seed rôles
    if not db.query(Role).first():
        roles = [
            Role(id="admin", name="Administrateur", description="Accès total"),
            Role(id="exporter", name="Exportateur", description="Vendeur de produits"),
            Role(id="importer", name="Importateur", description="Acheteur de produits"),
        ]
        for role in roles:
            db.merge(role)
        logger.info("✅ Rôles créés")

    # Seed utilisateurs
    if not db.query(User).filter(User.email == "youssef.elamrani@maroc-export.ma").first():
        moroccan_users = [
            User(
                id="user-admin-maroc",
                email="youssef.elamrani@maroc-export.ma",
                full_name="Youssef El Amrani (Direction Maroc Export)",
                role_id="admin",
                hashed_password=hash_password("MarocAdmin2026!"),
                status="VALIDE",
                is_email_verified=True,
                is_active=True,
            ),
            User(
                id="user-exporter-maroc",
                email="a.benjelloun@atlas-export.ma",
                full_name="Amina Benjelloun (Atlas Terroir & Argan)",
                role_id="exporter",
                hashed_password=hash_password("ExportMaroc2026!"),
                status="VALIDE",
                is_email_verified=True,
                is_active=True,
            ),
            User(
                id="user-importer-maroc",
                email="o.berrada@maghreb-import.ma",
                full_name="Omar Berrada (Maghreb Industrial Sourcing)",
                role_id="importer",
                hashed_password=hash_password("ImportMaroc2026!"),
                status="VALIDE",
                is_email_verified=True,
                is_active=True,
            ),
        ]
        for user in moroccan_users:
            db.merge(user)
        logger.info("Utilisateurs marocains créés")

    # Seed entreprises
    if not db.query(Company).filter(Company.id == "company-atlas-export").first():
        moroccan_companies = [
            Company(
                id="company-atlas-export",
                name="Atlas Terroir & Argan Exporters SARL",
                is_exporter=True,
                is_importer=False,
                country="MA",
                description="Producteur et exportateur marocain certifié d'huile d'argan bio et produits du terroir à Agadir.",
                owner_id="user-exporter-maroc",
                website="https://atlas-export.ma",
                registration_number="ICE: 002849102000085 | RC Agadir: 45892",
                certification_docs=[{"name": "ISO 9001", "url": "https://example.com/iso.pdf"}],
                profile_status="VALIDE",
            ),
            Company(
                id="company-maghreb-import",
                name="Maghreb Industrial Sourcing & Importation SARL AU",
                is_exporter=False,
                is_importer=True,
                country="MA",
                description="Société marocaine d'importation et de distribution de machines industrielles basée à Casablanca.",
                owner_id="user-importer-maroc",
                website="https://maghreb-import.ma",
                registration_number="ICE: 001958203000042 | RC Casablanca: 120495",
                certification_docs=[],
                profile_status="VALIDE",
            ),
        ]
        for company in moroccan_companies:
            db.merge(company)
        logger.info("Entreprises marocaines créées")

    # Seed salon
    if not db.query(Salon).filter(Salon.id == "salon-siam-virtuel").first():
        demo_salon = Salon(
            id="salon-siam-virtuel",
            title="SIAM Virtuel 2026 - Salon International de l'Agriculture au Maroc",
            category="Agroalimentaire & Agriculture",
            description="Plateforme virtuelle d'exposition pour les coopératives et entreprises agroalimentaires marocaines et internationales.",
            start_date="2026-09-10",
            end_date="2026-09-14",
            stand_price=5000.0,
            status="VALIDE",
        )
        db.merge(demo_salon)
        logger.info("Salon virtuel marocain créé")

    db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialisation au démarrage : création tables + seed."""
    logger.info("🚀 Démarrage de l'application Salons Virtuels...")

    # Créer toutes les tables
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Tables PostgreSQL créées/vérifiées")

    # Seed des données de démonstration
    db = SessionLocal()
    try:
        seed_database(db)
    except Exception as e:
        logger.error(f"❌ Erreur lors du seed : {e}")
    finally:
        db.close()

    # Rejouer les notifications échouées (retry)
    try:
        db = SessionLocal()
        replayed = NotificationService.retry_failed_notifications(db, max_retries=3)
        logger.info(f"🔁 Notifications rejouées au démarrage : {replayed}")
        db.close()
    except Exception as e:
        logger.error(f"❌ Erreur lors du retry des notifications : {e}")
        try:
            db.close()
        except Exception:
            pass

    # Warm-up du cache des taux de change (mise à jour périodique : TTL 1h)
    try:
        await CurrencyService.get_all_rates("EUR")
        logger.info("📈 Taux de change préchargés (cache 1h)")
    except Exception as e:
        logger.warning(f"⚠️ Préchargement des taux de change impossible : {e}")

    # Scheduler : rappels 24h avant chaque RDV confirmé (toutes les heures)
    scheduler = BackgroundScheduler(timezone="UTC")
    if os.getenv("TESTING") != "1":
        scheduler.add_job(
            run_rdv_reminders,
            trigger="interval",
            hours=1,
            id="rdv_reminders",
            replace_existing=True,
        )
        scheduler.start()
        logger.info("⏰ Planificateur de rappels RDV démarré (toutes les heures)")

    yield

    if scheduler.running:
        scheduler.shutdown(wait=False)
    logger.info("👋 Arrêt de l'application")


# ─────────────────────────────────────────────────────────────────────────────
# Application FastAPI
# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Salons Virtuels API",
    description="""
## API Plateforme Salons Virtuels

### Fonctionnalités
- 🔐 **Authentification** : JWT avec rôles (admin, exportateur, importateur)
- 🏢 **Entreprises** : Gestion des profils exportateurs/importateurs
- 🎪 **Salons** : Création et gestion des salons virtuels
- 🏪 **Stands** : Réservation et validation des stands
- 📅 **Rendez-vous** : Planification et suivi des rendez-vous
- 💬 **Messagerie** : Chat WebSocket temps réel
- 💳 **Paiements** : Intégration Stripe (stands + abonnements)
- 💱 **Devises** : Conversion de devises en temps réel
- 🚚 **Logistique** : Estimation distances et coûts transport
- 📢 **Annonces (Marketplace)** : Offres et demandes de marchandises

### Comptes de démonstration
| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@salonsvirtuels.com | admin123 |
| Exportateur | exportateur@salonsvirtuels.com | export123 |
| Importateur | importateur@salonsvirtuels.com | import123 |
    """,
    version="2.0.0",
    openapi_tags=[
        {"name": "auth", "description": "Opérations d'authentification et gestion de profil utilisateur"},
        {"name": "companies", "description": "Gestion des profils d'entreprises (exportateurs/importateurs)"},
        {"name": "salons", "description": "Création et gestion des événements virtuels"},
        {"name": "stands", "description": "Réservation et configuration des stands virtuels"},
        {"name": "rendez-vous", "description": "Planification de réunions B2B"},
        {"name": "messaging", "description": "Chat en temps réel et messagerie"},
        {"name": "payments", "description": "Intégration Stripe pour stands et abonnements"},
        {"name": "ads", "description": "Marketplace pour les annonces d'offres et demandes"},
        {"name": "external", "description": "Outils externes : devises et estimations logistiques"},
    ],
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/", tags=["health"])
def root():
    return {
        "message": "Salons Virtuels API v2.0 — PostgreSQL",
        "docs": "/docs",
        "health": "ok",
    }


@app.get("/health", tags=["health"])
def health():
    """Endpoint de santé pour les tests et monitoring."""
    try:
        db = SessionLocal()
        db.execute(db.bind.connect().execute("SELECT 1"))
        db.close()
        db_status = "ok"
    except Exception:
        db_status = "error"
    return {"status": "ok", "database": db_status, "version": "2.0.0"}


# Enregistrement des routers
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(companies_router, prefix="/companies", tags=["companies"])
app.include_router(salons_router, prefix="/salons", tags=["salons"])
app.include_router(stands_router, prefix="/stands", tags=["stands"])
app.include_router(rendezvous_router, prefix="/rendez-vous", tags=["rendez-vous"])
app.include_router(uploads_router, prefix="/uploads", tags=["uploads"])
app.include_router(messaging_router, prefix="/conversations", tags=["messaging"])
app.include_router(payments_router, prefix="/payments", tags=["payments"])
app.include_router(billing_router, prefix="/billing", tags=["billing"])
app.include_router(ads_router, prefix="/ads", tags=["ads"])
app.include_router(stats_router, prefix="/stats", tags=["stats"])
app.include_router(subscriptions_router, prefix="/subscriptions", tags=["subscriptions"])
app.include_router(external_router, prefix="", tags=["external"])
