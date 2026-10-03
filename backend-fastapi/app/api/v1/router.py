from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.alumnos import router as alumnos_router
from app.api.v1.profesores import router as profesores_router
from app.api.v1.agent import router as agent_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(alumnos_router)
api_router.include_router(profesores_router)
api_router.include_router(agent_router)
