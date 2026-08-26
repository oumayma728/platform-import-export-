from pathlib import Path
from alembic import command
from alembic.config import Config
from app.config.database import DATABASE_URL


def run_database_migrations() -> None:
    """Applique automatiquement toutes les migrations Alembic au démarrage."""
    project_root = Path(__file__).resolve().parents[2]
    alembic_ini = project_root / "alembic.ini"
    migrations_dir = project_root / "migrations"

    if not alembic_ini.exists():
        raise RuntimeError(f"Fichier Alembic introuvable : {alembic_ini}")

    cfg = Config(str(alembic_ini))
    cfg.set_main_option("script_location", str(migrations_dir))
    cfg.set_main_option("sqlalchemy.url", DATABASE_URL.replace("%", "%%"))

    print("[DATABASE] Vérification des migrations Alembic...")
    command.upgrade(cfg, "head")
    print("[DATABASE] Base de données à jour.")
