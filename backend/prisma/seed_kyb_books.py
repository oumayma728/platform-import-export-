"""
Seeding de documents KYB de démonstration : de vrais livres du domaine public
(téléchargés depuis Project Gutenberg) convertis en PDF, stockés dans MinIO
(bucket kyb-documents) ou en repli local, et référencés par des lignes
DocumentEntreprise + KybVerification.

Usage :
  python -c "import asyncio; from prisma.seed_kyb_books import main; asyncio.run(main())"
  # ou, depuis seed.py :
  from prisma.seed_kyb_books import seed_kyb_documents
"""
import io
import json
import os
import sys
import textwrap
import zlib

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from storage import build_key, backend_name, ensure_bucket, save_local
from config import MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET, MINIO_SECURE

BOOK_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "book_documents")

# Titres du domaine public. Le champ `statut` correspond au statut de la ligne
# DocumentEntreprise créée (en_attente / valide / rejete).
BOOKS = [
    {
        "id": "alice",
        "title": "Alice's Adventures in Wonderland",
        "author": "Lewis Carroll",
        "source_txt": "alice.txt",
        "filename": "alice_wonderland.pdf",
        "statut": "valide",
    },
    {
        "id": "pride",
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "source_txt": "pride.txt",
        "filename": "pride_and_prejudice.pdf",
        "statut": "valide",
    },
    {
        "id": "timemachine",
        "title": "The Time Machine",
        "author": "H. G. Wells",
        "source_txt": "timemachine.txt",
        "filename": "time_machine.pdf",
        "statut": "en_attente",
    },
    {
        "id": "frankenstein",
        "title": "Frankenstein",
        "author": "Mary Shelley",
        "source_txt": "frankenstein.txt",
        "filename": "frankenstein.pdf",
        "statut": "en_attente",
    },
]

# Associe à chaque entreprise seedée un état de vérification KYB cohérent.
VERIFICATIONS = [
    {
        "nom": "Nile Cotton Trading",
        "statut": "verified",
        "score": 85,
        "commentaire": "Documents vérifiés - certification GOTS conforme.",
    },
    {
        "nom": "Green Import Co.",
        "statut": "pending",
        "score": None,
        "commentaire": None,
    },
    {
        "nom": "SolarTech Guangzhou",
        "statut": "verified",
        "score": 92,
        "commentaire": "Documents vérifiés - certificats CE et d'essais en règle.",
    },
    {
        "nom": "Olive Trade Iberia",
        "statut": "rejected",
        "score": None,
        "commentaire": "Pièces illisibles - merci de redéposer des copies nettes.",
    },
    {
        "nom": "Epicerie Gourmande Belgique",
        "statut": "pending",
        "score": None,
        "commentaire": None,
    },
]


def _escape_pdf(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _trim_gutenberg(text: str) -> str:
    """Retire l'en-tête et la licence du domaine public de Gutenberg."""
    start = text.find("*** START OF THE PROJECT GUTENBERG")
    end = text.find("*** END OF THE PROJECT GUTENBERG")
    if start != -1 and end != -1:
        return text[start:end]
    return text


def text_to_pdf(text: str, title: str, author: str = "") -> bytes:
    """Génère un PDF multi-page valide (stdlib only, Helvetica non embarquée)."""
    body = _trim_gutenberg(text)

    lines = [title]
    if author:
        lines.append("by %s" % author)
    lines.append("")
    for raw in body.splitlines():
        lines.extend(textwrap.wrap(raw.rstrip(), width=88) or [""])

    page_height = 792
    margin_top = 740
    line_height = 14
    per_page = (margin_top - 40) // line_height

    page_streams = []
    for i in range(0, max(len(lines), 1), per_page):
        chunk = lines[i : i + per_page]
        ops = ["BT", "/F1 11 Tf", "14 TL", "50 %d Td" % margin_top]
        for line in chunk:
            ops.append("(%s) Tj T*" % _escape_pdf(line[:180]))
        ops.append("ET")
        page_streams.append("\n".join(ops))

    objects = []  # chaque objet est un dict {num, body(bytes)}
    offsets = {}

    def add(obj_id: int, body: bytes):
        objects.append((obj_id, body))

    add(1, b"<< /Type /Catalog /Pages 2 0 R >>")
    kids = " ".join("%d 0 R" % (4 + 2 * i) for i in range(len(page_streams)))
    add(2, ("<< /Type /Pages /Kids [%s] /Count %d >>" % (kids, len(page_streams))).encode())
    add(3, b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

    page_obj_ids = []
    for idx, stream_text in enumerate(page_streams):
        compressed = zlib.compress(stream_text.encode("latin-1", "replace"))
        page_id = 4 + 2 * idx
        content_id = 5 + 2 * idx
        page_body = (
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 %d] "
            "/Contents %d 0 R /Resources << /Font << /F1 3 0 R >> >> >>"
            % (page_height, content_id)
        )
        add(page_id, page_body.encode())
        add(
            content_id,
            b"<< /Length %d /Filter /FlateDecode >>\nstream\n%s\nendstream" % (len(compressed), compressed),
        )
        page_obj_ids.append(page_id)

    max_obj = max(num for num, _ in objects)
    output = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    for num, body in objects:
        offsets[num] = len(output)
        output += ("%d 0 obj\n" % num).encode()
        output += body
        output += b"\nendobj\n"

    xref_pos = len(output)
    output += ("xref\n0 %d\n" % (max_obj + 1)).encode()
    output += b"0000000000 65535 f \n"
    for num in range(1, max_obj + 1):
        output += ("%010d 00000 n \n" % offsets[num]).encode()
    output += (
        "trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n" % (max_obj + 1, xref_pos)
    ).encode()
    return bytes(output)


def get_book_pdf(book: dict) -> bytes:
    """Retourne le PDF d'un livre, en le générant + cachant s'il n'existe pas."""
    pdf_path = os.path.join(BOOK_DIR, book["id"] + ".pdf")
    if os.path.isfile(pdf_path):
        with open(pdf_path, "rb") as f:
            return f.read()
    txt_path = os.path.join(BOOK_DIR, book["source_txt"])
    with open(txt_path, "r", encoding="utf-8") as f:
        text = f.read()
    pdf = text_to_pdf(text, book["title"], book["author"])
    with open(pdf_path, "wb") as f:
        f.write(pdf)
    return pdf


def _upload_object(key: str, content: bytes) -> None:
    if backend_name() == "minio":
        from minio import Minio

        client = Minio(
            MINIO_ENDPOINT,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=MINIO_SECURE,
        )
        client.put_object(
            MINIO_BUCKET, key, io.BytesIO(content), len(content), content_type="application/pdf"
        )
    else:
        save_local(key, content)


async def seed_kyb_documents(prisma) -> None:
    """Attache des documents-livres aux entreprises seedées (idempotent)."""
    ensure_bucket()
    companies = [v["nom"] for v in VERIFICATIONS]
    entreprises = await prisma.entreprise.find_many(where={"nom": {"in": companies}})
    if not entreprises:
        print("  Aucune entreprise seedée trouvée, documents KYB ignorés.")
        return

    for idx, spec in enumerate(VERIFICATIONS):
        ent = next((e for e in entreprises if e.nom == spec["nom"]), None)
        if not ent:
            print(f"  Entreprise '{spec['nom']}' introuvable, ignorée.")
            continue

        existing = await prisma.documententreprise.find_first(where={"entrepriseId": ent.id})
        if existing:
            print(f"  {ent.nom} : documents déjà présents, skip.")
            continue

        # Deux livres par entreprise (rotation sur la liste).
        book_a = BOOKS[(idx * 2) % len(BOOKS)]
        book_b = BOOKS[(idx * 2 + 1) % len(BOOKS)]
        attached = []
        for doc_statut, book in [
            (spec["statut"] == "rejected" and "rejete" or "valide", book_a),
            ("en_attente", book_b),
        ]:
            pdf = get_book_pdf(book)
            key = build_key(ent.id, "CERTIFICATION", book["filename"])
            _upload_object(key, pdf)
            motif = None
            if doc_statut == "rejete":
                motif = spec["commentaire"]
            doc = await prisma.documententreprise.create(
                data={
                    "entrepriseId": ent.id,
                    "typeDocument": "CERTIFICATION",
                    "nomFichier": book["filename"],
                    "cheminFichier": key,
                    "bucket": MINIO_BUCKET if backend_name() == "minio" else "local",
                    "mimeType": "application/pdf",
                    "extention": "pdf",
                    "taille": len(pdf),
                    "statut": doc_statut,
                    "motifRejet": motif,
                }
            )
            attached.append({"type": "CERTIFICATION", "nomFichier": book["filename"], "id": doc.id})

        await prisma.kybverification.create(
            data={
                "entrepriseId": ent.id,
                "statut": spec["statut"],
                "score": spec["score"],
                "commentaire": spec["commentaire"],
                "documents": json.dumps(attached),
            }
        )
        print(
            f"  {ent.nom} : {len(attached)} documents ({', '.join(b['nomFichier'] for b in attached)}) "
            f"- KYB {spec['statut']}"
        )
    print("  Documents KYB (livres) seedés.")


async def main():
    from prisma import Prisma

    prisma = Prisma()
    await prisma.connect()
    await seed_kyb_documents(prisma)
    await prisma.disconnect()


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
