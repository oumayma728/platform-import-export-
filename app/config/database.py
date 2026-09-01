from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL n'est pas défini dans le fichier .env")


def create_database_if_not_exists() -> None:
    """Crée automatiquement la base PostgreSQL ciblée si elle n'existe pas."""
    url = make_url(DATABASE_URL)
    database_name = url.database
    if not database_name:
        raise RuntimeError("Le nom de la base est absent de DATABASE_URL")

    # Connexion à la base système PostgreSQL pour pouvoir créer la base applicative.
    admin_engine = create_engine(
        url.set(database="postgres"),
        isolation_level="AUTOCOMMIT",
        pool_pre_ping=True,
    )

    try:
        with admin_engine.connect() as connection:
            exists = connection.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :database_name"),
                {"database_name": database_name},
            ).scalar()

            if exists:
                print(f"[DATABASE] Base '{database_name}' déjà existante.")
                return

            # database_name vient de la configuration, et les guillemets sont échappés.
            safe_name = database_name.replace('"', '""')
            connection.execute(text(f'CREATE DATABASE "{safe_name}"'))
            print(f"[DATABASE] Base '{database_name}' créée automatiquement.")
    finally:
        admin_engine.dispose()


create_database_if_not_exists()

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
