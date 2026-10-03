from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.schemas.auth import LoginRequest, Token
from app.schemas.usuario import PerfilUsuarioResponse
from app.models.usuario import Usuario, DatosPersonales
from app.models.alumno import Alumno
from app.models.profesor import Profesor
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=Token)
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    identificador = credentials.identificador.strip()

    # Buscar usuario por:
    # 1. Correo directo
    # 2. Boleta de Alumno
    # 3. RFC de Profesor o de DatosPersonales
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

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas (Boleta/RFC/Email o contraseña inválida)",
        )

    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta se encuentra inactiva",
        )

    # Identificador secundario para el frontend (boleta o RFC)
    boleta_o_rfc = None
    if user.alumno:
        boleta_o_rfc = user.alumno.boleta
    elif user.profesor:
        boleta_o_rfc = user.profesor.rfc

    access_token = create_access_token(subject=user.id, role=user.rol.value)

    return Token(
        access_token=access_token,
        token_type="bearer",
        rol=user.rol,
        nombre_completo=user.nombre_completo,
        boleta_o_rfc=boleta_o_rfc,
    )


@router.get("/me", response_model=PerfilUsuarioResponse)
async def get_current_user_profile(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    boleta = current_user.alumno.boleta if current_user.alumno else None
    carrera = current_user.alumno.carrera.nombre if current_user.alumno and current_user.alumno.carrera else None
    promedio = current_user.alumno.promedio if current_user.alumno else None
    semestre = current_user.alumno.semestre_actual if current_user.alumno else None
    rfc_profesor = current_user.profesor.rfc if current_user.profesor else None
    academia = current_user.profesor.academia if current_user.profesor else None

    return PerfilUsuarioResponse(
        id=current_user.id,
        email=current_user.email,
        nombre=current_user.nombre,
        primer_apellido=current_user.primer_apellido,
        segundo_apellido=current_user.segundo_apellido,
        nombre_completo=current_user.nombre_completo,
        rol=current_user.rol,
        activo=current_user.activo,
        datos_personales=current_user.datos_personales,
        direccion=current_user.direccion,
        boleta=boleta,
        carrera=carrera,
        promedio=promedio,
        semestre=semestre,
        rfc_profesor=rfc_profesor,
        academia=academia,
    )
