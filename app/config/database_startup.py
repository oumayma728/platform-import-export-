from pathlib import Path
from alembic import command
from alembic.config import Config
from app.config.database import DATABASE_URL
from sqlalchemy.exc import ProgrammingError


def _is_duplicate_table_error(exc: Exception) -> bool:
    return "already exists" in str(exc).lower() or "duplicatetable" in type(exc).__name__.lower()


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
    try:
        command.upgrade(cfg, "head")
    except ProgrammingError as exc:
        if not _is_duplicate_table_error(exc):
            raise
        print("[DATABASE] Schéma déjà présent, marquage des migrations comme appliquées.")
        command.stamp(cfg, "head")
    print("[DATABASE] Base de données à jour.")
