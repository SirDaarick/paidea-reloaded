from typing import List, Optional
import json
from fastapi import APIRouter, Depends, HTTPException, Body, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import select, or_, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.usuario import Usuario, DatosPersonales
from app.models.alumno import Alumno
from app.models.profesor import Profesor
from app.models.chat import ChatThread, ChatMessage
from app.agent.tecno_burro import tecno_burro_agent
from app.schemas.agent import (
    ChatRequest,
    ChatResponse,
    ChatThreadResponse,
    ChatThreadDetailResponse,
    ChatMessageResponse,
    NewThreadRequest,
)

router = APIRouter(tags=["Agente Conversacional"])


# Esquema compatible con el widget frontend legacy
class LegacyPreguntaRequest(BaseModel):
    pregunta: str
    identificador: str
    historial: Optional[List[dict]] = Field(default_factory=list)


# ==============================================================
# 🧵 GESTIÓN DE HILOS Y SESIONES CONVERSACIONALES PERSISTENTES
# ==============================================================

@router.get("/api/v1/agent/threads", response_model=List[ChatThreadResponse])
async def listar_hilos(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lista todos los hilos de conversación del usuario autenticado."""
    query = (
        select(ChatThread)
        .where(ChatThread.usuario_id == current_user.id, ChatThread.activo == True)
        .order_by(desc(ChatThread.updated_at))
    )
    res = await db.execute(query)
    threads = res.scalars().all()
    return threads


@router.post("/api/v1/agent/threads", response_model=ChatThreadResponse)
async def crear_hilo(
    payload: NewThreadRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Crea un nuevo hilo de conversación para el usuario."""
    nuevo_hilo = ChatThread(
        usuario_id=current_user.id,
        titulo=payload.titulo or "Nueva consulta con TecnoBurro",
        activo=True,
    )
    db.add(nuevo_hilo)
    await db.commit()
    await db.refresh(nuevo_hilo)
    return nuevo_hilo


@router.get("/api/v1/agent/threads/{thread_id}", response_model=ChatThreadDetailResponse)
async def obtener_detalle_hilo(
    thread_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Obtiene los mensajes de un hilo de conversación con validación de propiedad."""
    query = (
        select(ChatThread)
        .options(selectinload(ChatThread.mensajes))
        .where(ChatThread.id == thread_id, ChatThread.usuario_id == current_user.id)
    )
    res = await db.execute(query)
    thread = res.scalar_one_or_none()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hilo de conversación no encontrado o no pertenece al usuario.",
        )
    return thread


@router.delete("/api/v1/agent/threads/{thread_id}")
async def archivar_hilo(
    thread_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Marca un hilo de conversación como inactivo."""
    query = select(ChatThread).where(
        ChatThread.id == thread_id, ChatThread.usuario_id == current_user.id
    )
    res = await db.execute(query)
    thread = res.scalar_one_or_none()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hilo de conversación no encontrado.",
        )
    thread.activo = False
    await db.commit()
    return {"message": "Hilo archivado correctamente."}


# ==============================================================
# 💬 INTERACCIÓN CON EL AGENTE (JWT AUTENTICADO)
# ==============================================================

@router.post("/api/v1/agent/chat", response_model=ChatResponse)
async def chat_con_agente(
    payload: ChatRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Endpoint moderno autenticado vía JWT con persistencia relacional automática."""
    thread = None
    if payload.thread_id:
        query_th = select(ChatThread).where(
            ChatThread.id == payload.thread_id, ChatThread.usuario_id == current_user.id
        )
        res_th = await db.execute(query_th)
        thread = res_th.scalar_one_or_none()

    if not thread:
        # Título inferido de los primeros caracteres del mensaje
        resumen_titulo = (payload.mensaje[:35] + "...") if len(payload.mensaje) > 35 else payload.mensaje
        thread = ChatThread(
            usuario_id=current_user.id,
            titulo=resumen_titulo.capitalize(),
            activo=True,
        )
        db.add(thread)
        await db.commit()
        await db.refresh(thread)

    # Persistir mensaje del usuario
    user_msg = ChatMessage(
        thread_id=thread.id,
        rol="user",
        contenido=payload.mensaje,
    )
    db.add(user_msg)
    await db.commit()

    # Procesar con el agente
    historial_dicts = [h.model_dump() for h in payload.historial] if payload.historial else []
    respuesta = await tecno_burro_agent.chat(
        mensaje=payload.mensaje,
        current_user=current_user,
        db=db,
        historial=historial_dicts,
    )

    # Persistir respuesta del asistente
    bot_msg = ChatMessage(
        thread_id=thread.id,
        rol="assistant",
        contenido=respuesta,
    )
    db.add(bot_msg)
    await db.commit()

    return ChatResponse(respuesta=respuesta, thread_id=thread.id)


@router.post("/api/v1/agent/chat/stream")
async def chat_con_agente_stream(
    payload: ChatRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Endpoint con streaming SSE (Server-Sent Events) en tiempo real con persistencia."""
    thread = None
    if payload.thread_id:
        query_th = select(ChatThread).where(
            ChatThread.id == payload.thread_id, ChatThread.usuario_id == current_user.id
        )
        res_th = await db.execute(query_th)
        thread = res_th.scalar_one_or_none()

    if not thread:
        resumen_titulo = (payload.mensaje[:35] + "...") if len(payload.mensaje) > 35 else payload.mensaje
        thread = ChatThread(
            usuario_id=current_user.id,
            titulo=resumen_titulo.capitalize(),
            activo=True,
        )
        db.add(thread)
        await db.commit()
        await db.refresh(thread)

    user_msg = ChatMessage(
        thread_id=thread.id,
        rol="user",
        contenido=payload.mensaje,
    )
    db.add(user_msg)
    await db.commit()

    historial_dicts = [h.model_dump() for h in payload.historial] if payload.historial else []

    async def event_generator():
        yield f"data: {json.dumps({'type': 'thread', 'thread_id': thread.id})}\n\n"

        full_bot_text = ""
        async for chunk in tecno_burro_agent.chat_stream(
            mensaje=payload.mensaje,
            current_user=current_user,
            db=db,
            historial=historial_dicts,
        ):
            line = chunk.strip()
            if line.startswith("data: "):
                try:
                    ev_data = json.loads(line[6:])
                    if ev_data.get("type") == "done":
                        full_bot_text = ev_data.get("full_text", "")
                except Exception:
                    pass
            yield chunk

        if full_bot_text:
            bot_msg = ChatMessage(
                thread_id=thread.id,
                rol="assistant",
                contenido=full_bot_text,
            )
            db.add(bot_msg)
            await db.commit()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ==============================================================
# 🔄 ENDPOINT RETROCOMPATIBLE (LEGACY ADAPTER)
# ==============================================================

@router.post("/preguntar")
async def preguntar_legacy(
    payload: LegacyPreguntaRequest,
    db: AsyncSession = Depends(get_db),
):
    """Endpoint retrocompatible con carga ansiosa estricta para el ChatWidget actual de React."""
    identificador = payload.identificador.strip()

    # Buscar usuario por Boleta, RFC o Correo con carga ansiosa profunda
    query = (
        select(Usuario)
        .outerjoin(Usuario.alumno)
        .outerjoin(Usuario.profesor)
        .outerjoin(Usuario.datos_personales)
        .options(
            selectinload(Usuario.alumno).selectinload(Alumno.carrera),
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
        return {
            "respuesta": f"No pude encontrar un usuario registrado con la boleta o RFC '{identificador}'. Por favor verifica tus credenciales institucionales de PAIDEA."
        }

    respuesta = await tecno_burro_agent.chat(
        mensaje=payload.pregunta,
        current_user=user,
        db=db,
        historial=payload.historial,
    )
    return {"respuesta": respuesta}


# ==============================================================
# 🛡️ HUMAN-IN-THE-LOOP: CONFIRMACIÓN Y EJECUCIÓN DE ACCIONES
# ==============================================================

class ActionConfirmRequest(BaseModel):
    action: str
    payload: dict


@router.post("/api/v1/agent/action/confirm")
async def confirmar_accion(
    payload: ActionConfirmRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Ejecuta de forma segura mutaciones de Human-in-the-Loop tras confirmación explícita del usuario."""
    if payload.action == "inscribir_ets":
        if not current_user.alumno:
            raise HTTPException(status_code=403, detail="Solo los alumnos pueden inscribir exámenes ETS.")

        ets_id = payload.payload.get("ets_id")
        if not ets_id:
            raise HTTPException(status_code=400, detail="Identificador de ETS requerido.")

        from app.models.inscripcion import InscripcionETS
        check_stmt = select(InscripcionETS).where(
            InscripcionETS.alumno_id == current_user.alumno.id,
            InscripcionETS.ets_id == ets_id
        )
        existing = (await db.execute(check_stmt)).scalars().first()
        if existing:
            return {
                "success": True,
                "mensaje": "Ya te encontrabas previamente inscrito en este examen ETS.",
                "folio": f"ETS-{existing.id:04d}"
            }

        nueva_inscripcion = InscripcionETS(
            alumno_id=current_user.alumno.id,
            ets_id=ets_id
        )
        db.add(nueva_inscripcion)
        await db.commit()
        await db.refresh(nueva_inscripcion)

        return {
            "success": True,
            "mensaje": "Inscripción formal al examen ETS confirmada exitosamente ante la Subdirección Escolar de ESCOM.",
            "folio": f"ETS-{nueva_inscripcion.id:04d}"
        }

    raise HTTPException(status_code=400, detail=f"Acción '{payload.action}' no soportada.")

