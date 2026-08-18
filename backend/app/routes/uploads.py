import os
import uuid
from fastapi import APIRouter, File, UploadFile, HTTPException

router = APIRouter()

@router.post('/', response_model=dict)
def upload_file(file: UploadFile = File(...)):
    """Upload de fichier (images, PDF, vidéos)."""
    upload_dir = os.path.join("app", "static", "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, unique_filename)

    with open(file_path, "wb") as f:
        f.write(file.file.read())

    return {
        'filename': file.filename,
        'content_type': file.content_type,
        'url': f'/static/uploads/{unique_filename}'
    }
