import json
from typing import Dict, Any, List
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.agent.rag.chroma_store import chroma_store
from app.models.usuario import Usuario, RolUsuario
from app.models.alumno import Alumno
from app.models.profesor import Profesor
from app.models.inscripcion import Inscripcion, InscripcionClase, Calificacion
from app.models.academico import Clase, Materia, HorarioClase
from app.models.tramite import CitaReinscripcion

# Definición de Tools en formato OpenAI / Groq Function Calling
TOOLS_DEFINITION = [
    {
        "type": "function",
        "function": {
            "name": "consultar_reglamento_academico",
            "description": "Busca normativas, artículos, becas, dictámenes, temarios o reglamentos generales del IPN/ESCOM en la base de conocimiento vectorial.",
            "parameters": {
                "type": "object",
                "properties": {
                    "consulta": {
                        "type": "string",
                        "description": "Pregunta o palabras clave sobre el reglamento (ej. 'requisitos para dictamen', 'baja temporal', 'porcentaje de créditos para titulación')."
                    }
                },
                "required": ["consulta"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "consultar_mi_kardex",
            "description": "Obtiene las calificaciones oficiales, materias cursadas y promedio del alumno autenticado.",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "consultar_mi_horario",
            "description": "Obtiene las materias, salones, días, horas y profesores asignados del alumno autenticado.",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "consultar_mi_cita_reinscripcion",
            "description": "Obtiene la fecha y hora de la cita de reinscripción asignada para el alumno autenticado.",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    }
]


async def execute_tool(
    name: str,
    args: Dict[str, Any],
    current_user: Usuario,
    db: AsyncSession,
) -> str:
    """Ejecuta de manera segura la herramienta solicitada por el modelo con scoping del usuario."""

    if name == "consultar_reglamento_academico":
        consulta = args.get("consulta", "")
        # ChromaDB text query
        chunks = chroma_store.query_by_text(consulta, top_k=4)
        if not chunks:
            return "No se encontraron artículos o fragmentos específicos en la base de conocimiento de reglamentos."
        
        texto_resultado = []
        for i, c in enumerate(chunks, 1):
            source = c.get("metadata", {}).get("source", "Reglamento")
            texto_resultado.append(f"[{i}] (Fuente: {source}):\n{c['text']}")
        return "\n\n---\n\n".join(texto_resultado)

    elif name == "consultar_mi_kardex":
        if not current_user.alumno:
            return "El usuario autenticado no tiene perfil de alumno para consultar kárdex."
        
        alumno = current_user.alumno
        query = (
            select(InscripcionClase)
            .join(Inscripcion)
            .options(
                selectinload(InscripcionClase.calificacion),
                selectinload(InscripcionClase.clase).selectinload(Clase.materia),
            )
            .where(Inscripcion.alumno_id == alumno.id)
        )
        res = await db.execute(query)
        inscripciones = res.scalars().all()

        if not inscripciones:
            return f"Alumno: {current_user.nombre_completo} (Boleta: {alumno.boleta}). Promedio actual: {alumno.promedio}. No tiene materias registradas aún."

        detalles = []
        for ic in inscripciones:
            materia = ic.clase.materia.nombre
            calif = ic.calificacion.calificacion_final if ic.calificacion else "Cursando"
            estado = ic.calificacion.estado if ic.calificacion else "En curso"
            detalles.append(f"- {materia}: Calificación Final: {calif} ({estado})")

        return f"Alumno: {current_user.nombre_completo} (Boleta: {alumno.boleta})\nPromedio General: {alumno.promedio}\nCréditos Cursados: {alumno.creditos_cursados}\n\nMaterias:\n" + "\n".join(detalles)

    elif name == "consultar_mi_horario":
        if not current_user.alumno:
            return "El usuario autenticado no tiene perfil de alumno para consultar horario."

        alumno = current_user.alumno
        query = (
            select(Inscripcion)
            .options(
                selectinload(Inscripcion.clases_inscritas)
                .selectinload(InscripcionClase.clase)
                .selectinload(Clase.materia),
                selectinload(Inscripcion.clases_inscritas)
                .selectinload(InscripcionClase.clase)
                .selectinload(Clase.grupo),
                selectinload(Inscripcion.clases_inscritas)
                .selectinload(InscripcionClase.clase)
                .selectinload(Clase.horarios),
            )
            .where(Inscripcion.alumno_id == alumno.id)
            .order_by(Inscripcion.id.desc())
        )
        res = await db.execute(query)
        inscripcion = res.scalars().first()

        if not inscripcion or not inscripcion.clases_inscritas:
            return f"Alumno: {current_user.nombre_completo}. No tienes horario registrado para este periodo."

        lineas = []
        for ic in inscripcion.clases_inscritas:
            c = ic.clase
            horarios_str = ", ".join([f"{h.dia_semana} {h.hora_inicio}-{h.hora_fin}" for h in c.horarios])
            lineas.append(f"- {c.materia.nombre} (Grupo {c.grupo.nombre}, Aula {c.aula}): {horarios_str}")

        return f"Horario de {current_user.nombre_completo}:\n" + "\n".join(lineas)

    elif name == "consultar_mi_cita_reinscripcion":
        if not current_user.alumno:
            return "Solo los alumnos tienen cita de reinscripción."

        query = (
            select(CitaReinscripcion)
            .where(CitaReinscripcion.alumno_id == current_user.alumno.id)
            .order_by(CitaReinscripcion.id.desc())
        )
        res = await db.execute(query)
        cita = res.scalar_one_or_none()

        if not cita:
            return f"El alumno {current_user.nombre_completo} aún no tiene cita de reinscripción asignada."

        return f"Cita de reinscripción para {current_user.nombre_completo}:\nFecha y hora: {cita.fecha_cita.strftime('%d/%m/%Y a las %H:%M hrs')}\nLugar: {cita.lugar}"

    return f"Herramienta '{name}' no reconocida."
