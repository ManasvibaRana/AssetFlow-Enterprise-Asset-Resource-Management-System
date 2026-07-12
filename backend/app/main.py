from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import CORS_ORIGINS
from .modules.assets.router import router as assets_router
from .modules.insight.router import router as insight_router
from .routers import auth, categories, departments, employees
from .seed import seed

app = FastAPI(title="AssetFlow API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.on_event("startup")
def on_startup() -> None:
    seed()


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(departments.router)
app.include_router(categories.router)
app.include_router(employees.router)
app.include_router(assets_router)
app.include_router(insight_router)
