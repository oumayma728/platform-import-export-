import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "file:./dev.db")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_DAYS = int(os.getenv("JWT_EXPIRE_DAYS", "7"))

# Sécurité admin : identité séparée de celle des Utilisateurs (spec §4)
ADMIN_JWT_SECRET = os.getenv("ADMIN_JWT_SECRET", "dev-admin-secret-change-in-production")
ADMIN_JWT_EXPIRE_DAYS = int(os.getenv("ADMIN_JWT_EXPIRE_DAYS", "1"))

# Clé d'accès interne service-à-service (spec §5.5 / GET /internal/...)
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")

# Object storage (spec §3) — MinIO, avec repli local si non configuré
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "kyb-documents")
MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"
BACKEND_PUBLIC_URL = os.getenv("BACKEND_PUBLIC_URL", "http://localhost:8000")
PORT = int(os.getenv("PORT", "5000"))
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "Indeed²")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
