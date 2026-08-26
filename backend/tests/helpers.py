"""Helpers de régression Trust & Safety (Stagiaire 4) — sans pytest.

Chaque script `test_spec*.py` peut être lancé directement :
    python tests/test_spec4_trust.py [BASE_URL]

Il renvoie 0 si tous les tests passent, 1 sinon. Les tests parlent à un
serveur live (le backend uvicorn) via httpx et nettoient les données qu'ils
créent à la fin (surcharge/avis/signalement de régression).
"""
import os
import sys

import httpx

# Le dossier backend (racine du projet Python) doit être importable pour le
# nettoyage direct en base (module `database`), quel que soit le CWD de lancement.
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"

ADMIN_EMAIL = "admin@platform.com"
ADMIN_PASSWORD = "admin123"

USER_EMAIL = "importer@test.com"
USER_PASSWORD = "test123"

# Marqueur identifiant les lignes créées par la régression (nettoyage).
MARKER = "REGRESSION_SPEC4"

_registry: list[dict] = []


def test(name):
    """Décorateur : enregistre une fonction de test."""

    def decorator(fn):
        _registry.append({"name": name, "fn": fn})
        return fn

    return decorator


def check(cond, message):
    if not cond:
        raise AssertionError(message)


def client():
    return httpx.Client(base_url=BASE_URL, timeout=30)


def login_user(email=USER_EMAIL, password=USER_PASSWORD):
    with client() as c:
        r = c.post("/api/auth/login", json={"email": email, "password": password})
        r.raise_for_status()
        token = r.json().get("token") or r.json().get("access_token")
        assert token, f"token absent pour {email}"
        return token


def login_admin(email=ADMIN_EMAIL, password=ADMIN_PASSWORD):
    with client() as c:
        r = c.post("/api/admin/auth/login", json={"email": email, "password": password})
        r.raise_for_status()
        token = r.json().get("token")
        assert token, "token admin absent"
        return token


def run():
    """Exécute les tests enregistrés et renvoie le code de sortie."""
    failures = 0
    for case in _registry:
        try:
            case["fn"]()
            print(f"  PASS  {case['name']}")
        except AssertionError as exc:
            failures += 1
            print(f"  FAIL  {case['name']} : {exc}")
        except Exception as exc:  # noqa: BLE001
            failures += 1
            print(f"  FAIL  {case['name']} : {type(exc).__name__}: {exc}")

    total = len(_registry)
    print(f"\n{total - failures}/{total} tests passés")
    return 1 if failures else 0
