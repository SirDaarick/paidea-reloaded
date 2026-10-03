from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.usuario import RolUsuario


class LoginRequest(BaseModel):
    # Acepta email, boleta o RFC en el mismo campo identificador
    identificador: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    rol: RolUsuario
    nombre_completo: str
    boleta_o_rfc: Optional[str] = None


class TokenPayload(BaseModel):
    sub: str
    role: str
    exp: Optional[int] = None
