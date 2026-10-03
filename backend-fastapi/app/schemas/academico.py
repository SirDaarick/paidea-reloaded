from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class HorarioDetalle(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    dia_semana: str
    hora_inicio: str
    hora_fin: str


class ClaseHorarioResponse(BaseModel):
    materia_clave: str
    materia_nombre: str
    grupo: str
    profesor_nombre: str
    aula: str
    horarios: List[HorarioDetalle]


class KardexItem(BaseModel):
    semestre: int
    clave: str
    materia: str
    creditos: float
    parcial_1: Optional[float] = None
    parcial_2: Optional[float] = None
    parcial_3: Optional[float] = None
    calificacion_final: Optional[float] = None
    estado: str # Aprobada, Reprobada, Cursando


class KardexResponse(BaseModel):
    alumno_nombre: str
    boleta: str
    carrera: str
    promedio: float
    creditos_cursados: float
    materias: List[KardexItem]
