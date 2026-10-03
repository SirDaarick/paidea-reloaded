from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel, Field
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.usuario import Usuario, DatosPersonales
from app.models.alumno import Alumno
from app.models.profesor import Profesor
from app.agent.tecno_burro import tecno_burro_agent
from app.schemas.agent import ChatRequest, ChatResponse

router = APIRouter(tags=["Agente Conversacional"])


# Esquema compatible con el widget frontend legacy
class LegacyPreguntaRequest(BaseModel):
    pregunta: str
    identificador: str
    historial: Optional[List[dict]] = Field(default_factory=list)


@router.post("/api/v1/agent/chat", response_model=ChatResponse)
async def chat_con_agente(
    payload: ChatRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Endpoint moderno autenticado vía JWT."""
    historial_dicts = [h.model_dump() for h in payload.historial] if payload.historial else []
    respuesta = await tecno_burro_agent.chat(
        mensaje=payload.mensaje,
        current_user=current_user,
        db=db,
        historial=historial_dicts,
    )
    return ChatResponse(respuesta=respuesta)


@router.post("/preguntar")
async def preguntar_legacy(
    payload: LegacyPreguntaRequest,
    db: AsyncSession = Depends(get_db),
):
    """Endpoint retrocompatible para el ChatWidget actual de React."""
    identificador = payload.identificador.strip()

    # Buscar usuario por Boleta, RFC o Correo
    query = (
        select(Usuario)
        .outerjoin(Usuario.alumno)
        .outerjoin(Usuario.profesor)
        .outerjoin(Usuario.datos_personales)
        .options(
            selectinload(Usuario.alumno),
            selectinload(Usuario.profesor),
            selectinload(Usuario.datos_personales),
        )
        .where(
            or_(
                Usuario.email.ilike(identificador),
                Alumno.boleta == identificador,
                Profesor.rfc.ilike(identificador),
                DatosPersonales.rfc.ilike(identificador),
            )
        )
    )
    res = await db.execute(query)
    user = res.scalar_one_or_none()

    if not user:
        # Si no se encuentra el usuario, responder cortesmente desde el agente
        return {
            "respuesta": f"No pude encontrar un usuario registrado con la boleta o RFC '{identificador}'. Por favor verifica tus datos de inicio de sesión."
        }

    # Procesar la consulta con el agente
    respuesta = await tecno_burro_agent.chat(
        mensaje=payload.pregunta,
        current_user=user,
        db=db,
        historial=payload.historial,
    )
    return {"respuesta": respuesta}
