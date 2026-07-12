import os
from pathlib import Path

from dotenv import load_dotenv

# backend/app/core/config.py -> repo root is parents[3]
ROOT = Path(__file__).resolve().parents[3]
load_dotenv(ROOT / ".env")

DATABASE_URL = os.environ["DATABASE_URL"]
JWT_SECRET = os.environ.get("JWT_SECRET", "assetflow-dev-secret-change-me")
JWT_ALG = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24  # 1 day
RESET_TOKEN_EXPIRE_MINUTES = 30

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

# SMTP / email
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "465"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_FROM = os.environ.get("SMTP_FROM") or SMTP_USER

CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
