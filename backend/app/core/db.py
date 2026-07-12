import ssl
from urllib.parse import urlsplit, urlunsplit

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import DATABASE_URL


def _pg8000_url(raw: str) -> str:
    parts = urlsplit(raw)
    return urlunsplit(("postgresql+pg8000", parts.netloc, parts.path, "", ""))


ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE
engine = create_engine(_pg8000_url(DATABASE_URL), connect_args={"ssl_context": ssl_context}, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
