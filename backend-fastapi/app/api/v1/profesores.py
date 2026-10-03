from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import require_roles
from app.models.usuario import Usuario, RolUsuario
from app.models.academico import Clase, Materia, Grupo, HorarioClase

router = APIRouter(prefix="/profesores", tags=["Profesores"])


@router.get("/me/clases")
async def get_mis_clases(
    current_user: Usuario = Depends(require_roles(RolUsuario.PROFESOR)),
    db: AsyncSession = Depends(get_db),
):
    profesor = current_user.profesor
    if not profesor:
        raise HTTPException(status_code=404, detail="Perfil de profesor no encontrado")

    query = (
        select(Clase)
        .options(
            selectinload(Clase.materia),
            selectinload(Clase.grupo),
            selectinload(Clase.horarios),
        )
        .where(Clase.profesor_id == profesor.id)
    )
    res = await db.execute(query)
    clases = res.scalars().all()

    return [
        {
            "id": c.id,
            "materia": c.materia.nombre,
            "clave": c.materia.clave,
            "grupo": c.grupo.nombre,
            "aula": c.aula,
            "cupo_maximo": c.cupo_maximo,
            "horarios": [
                {
                    "dia": h.dia_semana,
                    "inicio": h.hora_inicio,
                    "fin": h.hora_fin,
                }
                for h in c.horarios
            ],
        }
        for c in clases
    ]
