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

CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
