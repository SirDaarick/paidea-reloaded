from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user, require_roles
from app.models.usuario import Usuario, RolUsuario
from app.models.alumno import Alumno
from app.models.profesor import Profesor
from app.models.inscripcion import Inscripcion, InscripcionClase, Calificacion
from app.models.academico import Clase, Materia, HorarioClase, Grupo
from app.models.tramite import CitaReinscripcion
from app.schemas.academico import ClaseHorarioResponse, HorarioDetalle, KardexResponse, KardexItem

router = APIRouter(prefix="/alumnos", tags=["Alumnos"])


@router.get("/me/horario", response_model=list[ClaseHorarioResponse])
async def get_mi_horario(
    current_user: Usuario = Depends(require_roles(RolUsuario.ALUMNO)),
    db: AsyncSession = Depends(get_db),
):
    alumno = current_user.alumno
    if not alumno:
        raise HTTPException(status_code=404, detail="Perfil de alumno no encontrado")

    # Obtener la inscripción activa más reciente
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
            .selectinload(Clase.profesor)
            .selectinload(Profesor.usuario),
            selectinload(Inscripcion.clases_inscritas)
            .selectinload(InscripcionClase.clase)
            .selectinload(Clase.horarios),
        )
        .where(Inscripcion.alumno_id == alumno.id)
        .order_by(Inscripcion.id.desc())
    )
    res = await db.execute(query)
    inscripcion = res.scalars().first()

    if not inscripcion:
        return []

    resultado = []
    for ic in inscripcion.clases_inscritas:
        clase = ic.clase
        prof_nombre = "Por asignar"
        if clase.profesor and clase.profesor.usuario:
            prof_nombre = clase.profesor.usuario.nombre_completo

        horarios_dto = [
            HorarioDetalle(
                dia_semana=h.dia_semana,
                hora_inicio=h.hora_inicio,
                hora_fin=h.hora_fin,
            )
            for h in clase.horarios
        ]

        resultado.append(
            ClaseHorarioResponse(
                materia_clave=clase.materia.clave,
                materia_nombre=clase.materia.nombre,
                grupo=clase.grupo.nombre,
                profesor_nombre=prof_nombre,
                aula=clase.aula or "Sin aula asignada",
                horarios=horarios_dto,
            )
        )
    return resultado


@router.get("/me/kardex", response_model=KardexResponse)
async def get_mi_kardex(
    current_user: Usuario = Depends(require_roles(RolUsuario.ALUMNO)),
    db: AsyncSession = Depends(get_db),
):
    alumno = current_user.alumno
    if not alumno:
        raise HTTPException(status_code=404, detail="Perfil de alumno no encontrado")

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
    inscripciones_clase = res.scalars().all()

    carrera_nombre = alumno.carrera.nombre if alumno.carrera else "Carrera no asignada"

    materias_dto = []
    for ic in inscripciones_clase:
        calif = ic.calificacion
        materia = ic.clase.materia
        materias_dto.append(
            KardexItem(
                semestre=materia.semestre,
                clave=materia.clave,
                materia=materia.nombre,
                creditos=materia.creditos,
                parcial_1=calif.parcial_1 if calif else None,
                parcial_2=calif.parcial_2 if calif else None,
                parcial_3=calif.parcial_3 if calif else None,
                calificacion_final=calif.calificacion_final if calif else None,
                estado=calif.estado if calif else "Cursando",
            )
        )

    return KardexResponse(
        alumno_nombre=current_user.nombre_completo,
        boleta=alumno.boleta,
        carrera=carrera_nombre,
        promedio=alumno.promedio,
        creditos_cursados=alumno.creditos_cursados,
        materias=materias_dto,
    )


@router.get("/me/cita")
async def get_mi_cita_reinscripcion(
    current_user: Usuario = Depends(require_roles(RolUsuario.ALUMNO)),
    db: AsyncSession = Depends(get_db),
):
    alumno = current_user.alumno
    if not alumno:
        raise HTTPException(status_code=404, detail="Perfil de alumno no encontrado")

    query = (
        select(CitaReinscripcion)
        .options(selectinload(CitaReinscripcion.periodo))
        .where(CitaReinscripcion.alumno_id == alumno.id)
        .order_by(CitaReinscripcion.id.desc())
    )
    res = await db.execute(query)
    cita = res.scalar_one_or_none()

    if not cita:
        return {"tiene_cita": False, "mensaje": "No tienes cita de reinscripción asignada para este periodo."}

    return {
        "tiene_cita": True,
        "fecha_cita": cita.fecha_cita.isoformat(),
        "periodo": cita.periodo.nombre if cita.periodo else "",
        "lugar": cita.lugar,
    }
