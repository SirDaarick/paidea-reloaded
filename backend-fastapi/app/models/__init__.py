from app.models.base import Base
from app.models.usuario import Usuario, DatosPersonales, Direccion, RolUsuario
from app.models.academico import Carrera, Materia, PeriodoAcademico, Grupo, Clase, HorarioClase
from app.models.alumno import Alumno
from app.models.profesor import Profesor
from app.models.inscripcion import (
    Inscripcion,
    InscripcionClase,
    Calificacion,
    ETS,
    InscripcionETS,
    CalificacionETS,
)
from app.models.tramite import CitaReinscripcion, SolicitudTramite

__all__ = [
    "Base",
    "Usuario",
    "DatosPersonales",
    "Direccion",
    "RolUsuario",
    "Carrera",
    "Materia",
    "PeriodoAcademico",
    "Grupo",
    "Clase",
    "HorarioClase",
    "Alumno",
    "Profesor",
    "Inscripcion",
    "InscripcionClase",
    "Calificacion",
    "ETS",
    "InscripcionETS",
    "CalificacionETS",
    "CitaReinscripcion",
    "SolicitudTramite",
]
