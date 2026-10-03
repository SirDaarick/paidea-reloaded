from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.usuario import RolUsuario


class DatosPersonalesBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    curp: Optional[str] = None
    rfc: Optional[str] = None
    telefono: Optional[str] = None
    movil: Optional[str] = None
    sexo: Optional[str] = None
    estado_civil: Optional[str] = None


class DireccionBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    estado: Optional[str] = None
    alcaldia_municipio: Optional[str] = None
    colonia: Optional[str] = None
    calle: Optional[str] = None
    numero_exterior: Optional[str] = None
    numero_interior: Optional[str] = None
    codigo_postal: Optional[str] = None


class UsuarioBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    nombre: str
    primer_apellido: str
    segundo_apellido: Optional[str] = None
    rol: RolUsuario
    activo: bool


class PerfilUsuarioResponse(UsuarioBase):
    nombre_completo: str
    datos_personales: Optional[DatosPersonalesBase] = None
    direccion: Optional[DireccionBase] = None
    boleta: Optional[str] = None
    carrera: Optional[str] = None
    promedio: Optional[float] = None
    semestre: Optional[int] = None
    rfc_profesor: Optional[str] = None
    academia: Optional[str] = None
