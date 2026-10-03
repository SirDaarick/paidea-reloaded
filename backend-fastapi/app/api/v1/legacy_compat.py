from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.usuario import Usuario, RolUsuario
from app.models.profesor import Profesor
from app.models.alumno import Alumno
from app.models.academico import Grupo, Clase, Materia, PeriodoAcademico

compat_router = APIRouter(tags=["Compatibilidad Legacy"])


@compat_router.get("/usuario/profesores")
async def get_legacy_profesores(db: AsyncSession = Depends(get_db)):
    query = (
        select(Profesor)
        .options(
            selectinload(Profesor.usuario).selectinload(Usuario.datos_personales),
            selectinload(Profesor.usuario).selectinload(Usuario.direccion),
        )
    )
    res = await db.execute(query)
    profesores = res.scalars().all()

    return [
        {
            "_id": str(p.id),
            "nombre": p.usuario.nombre,
            "primerApellido": p.usuario.primer_apellido,
            "segundoApellido": p.usuario.segundo_apellido,
            "correo": p.usuario.email,
            "rol": "Profesor",
            "datosPersonales": {
                "rfc": p.rfc,
                "curp": p.usuario.datos_personales.curp if p.usuario.datos_personales else "",
                "telefono": p.usuario.datos_personales.telefono if p.usuario.datos_personales else "",
            },
            "profesorData": {
                "academia": p.academia,
                "cubiculo": p.cubiculo,
            },
        }
        for p in profesores
    ]


@compat_router.get("/usuario/boleta/{boleta}")
async def get_usuario_por_boleta(boleta: str, db: AsyncSession = Depends(get_db)):
    query = (
        select(Alumno)
        .options(
            selectinload(Alumno.usuario),
            selectinload(Alumno.carrera),
        )
        .where(Alumno.boleta == boleta)
    )
    res = await db.execute(query)
    alumno = res.scalar_one_or_none()

    if not alumno:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    u = alumno.usuario
    return {
        "_id": str(u.id),
        "nombre": u.nombre,
        "primerApellido": u.primer_apellido,
        "segundoApellido": u.segundo_apellido,
        "correo": u.email,
        "rol": "Alumno",
        "boleta": alumno.boleta,
        "promedio": alumno.promedio,
        "carrera": alumno.carrera.nombre if alumno.carrera else "",
    }


@compat_router.get("/usuario/rfc/{rfc}")
async def get_usuario_por_rfc(rfc: str, db: AsyncSession = Depends(get_db)):
    query = (
        select(Profesor)
        .options(
            selectinload(Profesor.usuario),
        )
        .where(Profesor.rfc == rfc)
    )
    res = await db.execute(query)
    profesor = res.scalar_one_or_none()

    if not profesor:
        raise HTTPException(status_code=404, detail="Profesor no encontrado")

    u = profesor.usuario
    return {
        "_id": str(u.id),
        "nombre": u.nombre,
        "primerApellido": u.primer_apellido,
        "segundoApellido": u.segundo_apellido,
        "correo": u.email,
        "rol": "Profesor",
        "rfc": profesor.rfc,
    }


@compat_router.get("/grupo/profesor/{profesor_id}")
async def get_grupos_profesor(profesor_id: str, db: AsyncSession = Depends(get_db)):
    try:
        pid = int(profesor_id)
    except ValueError:
        pid = 1

    query = (
        select(Clase)
        .options(
            selectinload(Clase.grupo),
            selectinload(Clase.materia),
            selectinload(Clase.horarios),
        )
        .where(Clase.profesor_id == pid)
    )
    res = await db.execute(query)
    clases = res.scalars().all()

    return [
        {
            "_id": str(c.grupo.id),
            "nombre": c.grupo.nombre,
            "turno": c.grupo.turno,
            "materia": {
                "_id": str(c.materia.id),
                "nombre": c.materia.nombre,
                "clave": c.materia.clave,
            },
            "aula": c.aula,
        }
        for c in clases
    ]
