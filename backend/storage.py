"""
Object storage (spec §3) : MinIO en production, repli sur le système de
fichiers local en développement quand MinIO n'est pas configuré.

Le contrat d'API est identique dans les deux modes (presign PUT, presign GET,
stat) pour que le frontend n'ait pas à connaître le backend utilisé. Les clés
d'objets ne sont jamais les noms de fichiers bruts : on utilise le format
`kyb/{entreprise_id}/{type_document}/{uuid}-{sanitized_filename}`.
"""
import os
import re
from pathlib import Path
from urllib.parse import quote

from config import (
    MINIO_ENDPOINT,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    MINIO_BUCKET,
    MINIO_SECURE,
)

LOCAL_ROOT = os.path.join(os.path.dirname(__file__), "uploads", "kyb")


def sanitize_filename(name: str) -> str:
    """Nettoie un nom de fichier : lettres/chiffres/points/tirets seulement."""
    name = Path(name or "file").name
    name = re.sub(r"[^A-Za-z0-9._-]", "_", name)
    return name[:120] or "file"


def build_key(entreprise_id: str, document_type: str, filename: str) -> str:
    import uuid

    safe_type = sanitize_filename(document_type).lower() or "autre"
    return f"kyb/{entreprise_id}/{safe_type}/{uuid.uuid4()}-{sanitize_filename(filename)}"


def backend_name() -> str:
    return "minio" if (MINIO_ENDPOINT and MINIO_ACCESS_KEY and MINIO_SECRET_KEY) else "local"


def _minio_client():
    from minio import Minio

    return Minio(
        MINIO_ENDPOINT,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=MINIO_SECURE,
    )


def ensure_bucket() -> bool:
    """Crée le bucket s'il n'existe pas. No-op en mode local."""
    if backend_name() != "minio":
        return True
    try:
        client = _minio_client()
        if not client.bucket_exists(MINIO_BUCKET):
            client.make_bucket(MINIO_BUCKET)
        return True
    except Exception:
        return False


def presign_put_url(key: str, content_type: str, expiry_seconds: int = 600) -> str | None:
    """URL présignée PUT (upload direct côté client). None en mode local."""
    if backend_name() != "minio":
        return None
    try:
        client = _minio_client()
        return client.presigned_put_object(
            MINIO_BUCKET, key, expires=timedelta(seconds=expiry_seconds)
        )
    except Exception:
        return None


def presign_get_url(key: str, expiry_seconds: int = 120) -> str | None:
    """URL présignée GET (consultation admin), courte durée. None en mode local."""
    if backend_name() != "minio":
        return None
    try:
        client = _minio_client()
        return client.presigned_get_object(MINIO_BUCKET, key, expires=timedelta(seconds=expiry_seconds))
    except Exception:
        return None


def object_stat(key: str) -> dict | None:
    """Retourne {size, content_type} de l'objet, ou None s'il n'existe pas."""
    if backend_name() == "minio":
        try:
            client = _minio_client()
            stat = client.stat_object(MINIO_BUCKET, key)
            return {"size": stat.size, "content_type": stat.content_type}
        except Exception:
            # Repli : l'upload a pu atterrir sur le disque local (mode fallback)
            path = local_abs_path(key)
            if os.path.isfile(path):
                return {"size": os.path.getsize(path), "content_type": None}
            return None
    # Mode local
    path = local_abs_path(key)
    if not os.path.isfile(path):
        return None
    return {"size": os.path.getsize(path), "content_type": None}


def stat_source(key: str) -> str | None:
    """Localise l'objet : 'minio' ou 'local', ou None s'il est absent partout."""
    if backend_name() == "minio":
        try:
            _minio_client().stat_object(MINIO_BUCKET, key)
            return "minio"
        except Exception:
            pass
    if os.path.isfile(local_abs_path(key)):
        return "local"
    return None


def local_abs_path(key: str) -> str:
    """Chemin fichier local correspondant à une clé d'objet (mode local)."""
    parts = key.split("/")
    # Construit un chemin sûr : ne remonte jamais hors de LOCAL_ROOT. Les
    # parties ne sont pas tronquées ici : la clé est déjà bornée en build_key,
    # le chemin doit correspondre exactement à la clé (URL publique incluse).
    safe_parts = [_sanitize_path_part(p) for p in parts]
    return os.path.join(LOCAL_ROOT, *safe_parts)


def _sanitize_path_part(name: str) -> str:
    """Nettoie une partie de chemin sans la tronquer."""
    return re.sub(r"[^A-Za-z0-9._-]", "_", Path(name or "file").name)


def save_local(key: str, data: bytes) -> str:
    """Écrit un objet en mode local. Retourne le chemin absolu."""
    path = local_abs_path(key)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(data)
    return path


def delete_object(key: str) -> bool:
    if backend_name() == "minio":
        try:
            _minio_client().remove_object(MINIO_BUCKET, key)
            return True
        except Exception:
            return False
    path = local_abs_path(key)
    if os.path.isfile(path):
        os.remove(path)
        return True
    return False


def public_view_url(key: str) -> str:
    """URL publique de visualisation en mode local (via /uploads/kyb/...)."""
    from config import BACKEND_PUBLIC_URL

    quoted = quote(key)
    return f"{BACKEND_PUBLIC_URL}/uploads/kyb/{quoted}"


from datetime import timedelta  # noqa: E402
