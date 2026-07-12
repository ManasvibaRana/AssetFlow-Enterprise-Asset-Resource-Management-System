import ssl
from urllib.parse import urlsplit, urlunsplit

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import DATABASE_URL


def _pg8000_url(raw: str) -> str:
    """Rewrite the URL to the pure-Python pg8000 driver and drop query params
    (sslmode is handled via connect_args instead)."""
    p = urlsplit(raw)
    return urlunsplit(("postgresql+pg8000", p.netloc, p.path, "", ""))


# sslmode=require -> encrypt but don't verify the server certificate.
_ssl_ctx = ssl.create_default_context()
_ssl_ctx.check_hostname = False
_ssl_ctx.verify_mode = ssl.CERT_NONE

engine = create_engine(
    _pg8000_url(DATABASE_URL),
    connect_args={"ssl_context": _ssl_ctx},
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
