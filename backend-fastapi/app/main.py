from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.api.v1.agent import router as legacy_agent_router
from app.agent.rag.chroma_store import chroma_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[PAIDEA] Iniciando FastAPI Backend...")
    try:
        count = chroma_store.count()
        print(f"[PAIDEA] ChromaDB conectado. Chunks en base de conocimiento: {count}")
    except Exception as e:
        print(f"[PAIDEA] ChromaDB status: {e}")
    yield
    print("[PAIDEA] Deteniendo FastAPI Backend...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="2.0.0",
    description="Backend oficial de PAIDEA Reloaded en FastAPI con persistencia SQL relacional, RAG con ChromaDB y agente conversacional TecnoBurro.",
    lifespan=lifespan,
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas de la API v1
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

from app.api.v1.legacy_compat import compat_router

# Rutas legacy para el ChatWidget actual de React y vistas no migradas
app.include_router(legacy_agent_router)
app.include_router(compat_router)


@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database": "connected",
        "knowledge_base_chunks": chroma_store.count(),
    }
