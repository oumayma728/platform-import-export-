"""
test_uploads.py — Tests de l'upload de fichiers
"""
from fastapi.testclient import TestClient


def test_upload_file(client: TestClient, exporter_token: str):
    files = {"file": ("test.pdf", b"%PDF-1.4 fake content", "application/pdf")}
    resp = client.post(
        "/uploads/",
        headers={"Authorization": f"Bearer {exporter_token}"},
        files=files,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["filename"] == "test.pdf"
    assert data["content_type"] == "application/pdf"
    assert data["url"].startswith("/static/uploads/")
