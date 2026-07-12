from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.db import Base, engine
from app.modules.assets.router import router as assets_router

app = FastAPI(title="AssetFlow P2 API")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_methods=["*"], allow_headers=["*"])
app.include_router(assets_router)


@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(engine)


@app.get("/health")
def health():
    return {"ok": True}
