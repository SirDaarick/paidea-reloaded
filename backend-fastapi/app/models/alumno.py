from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Integer, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.usuario import Usuario
    from app.models.academico import Carrera
    from app.models.inscripcion import Inscripcion, InscripcionETS
    from app.models.tramite import CitaReinscripcion, SolicitudTramite


class Alumno(Base, TimestampMixin):
    __tablename__ = "alumnos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    boleta: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), unique=True)
    carrera_id: Mapped[int] = mapped_column(ForeignKey("carreras.id"), nullable=False)
    
    promedio: Mapped[float] = mapped_column(Float, default=0.0)
    creditos_cursados: Mapped[float] = mapped_column(Float, default=0.0)
    semestre_actual: Mapped[int] = mapped_column(Integer, default=1)
    situacion_academica: Mapped[str] = mapped_column(String(30), default="Regular") # Regular, Irregular, Dictamen

    # Relaciones
    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="alumno")
    carrera: Mapped["Carrera"] = relationship("Carrera", back_populates="alumnos")
    inscripciones: Mapped[List["Inscripcion"]] = relationship("Inscripcion", back_populates="alumno")
    inscripciones_ets: Mapped[List["InscripcionETS"]] = relationship("InscripcionETS", back_populates="alumno")
    citas: Mapped[List["CitaReinscripcion"]] = relationship("CitaReinscripcion", back_populates="alumno")
    solicitudes: Mapped[List["SolicitudTramite"]] = relationship("SolicitudTramite", back_populates="alumno")
