from datetime import datetime, timezone, date
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.alumno import Alumno
    from app.models.profesor import Profesor
    from app.models.academico import Clase, Materia, PeriodoAcademico


class Inscripcion(Base, TimestampMixin):
    __tablename__ = "inscripciones"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    alumno_id: Mapped[int] = mapped_column(ForeignKey("alumnos.id", ondelete="CASCADE"), nullable=False)
    periodo_id: Mapped[int] = mapped_column(ForeignKey("periodos_academicos.id"), nullable=False)
    fecha_inscripcion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    estado: Mapped[str] = mapped_column(String(30), default="Confirmada") # Pendiente, Confirmada, Cancelada

    alumno: Mapped["Alumno"] = relationship("Alumno", back_populates="inscripciones")
    periodo: Mapped["PeriodoAcademico"] = relationship("PeriodoAcademico")
    clases_inscritas: Mapped[List["InscripcionClase"]] = relationship(
        "InscripcionClase", back_populates="inscripcion", cascade="all, delete-orphan"
    )


class InscripcionClase(Base, TimestampMixin):
    __tablename__ = "inscripciones_clases"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    inscripcion_id: Mapped[int] = mapped_column(ForeignKey("inscripciones.id", ondelete="CASCADE"), nullable=False)
    clase_id: Mapped[int] = mapped_column(ForeignKey("clases.id", ondelete="CASCADE"), nullable=False)

    inscripcion: Mapped["Inscripcion"] = relationship("Inscripcion", back_populates="clases_inscritas")
    clase: Mapped["Clase"] = relationship("Clase", back_populates="inscripciones_clase")
    calificacion: Mapped[Optional["Calificacion"]] = relationship(
        "Calificacion", back_populates="inscripcion_clase", uselist=False, cascade="all, delete-orphan"
    )


class Calificacion(Base, TimestampMixin):
    __tablename__ = "calificaciones"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    inscripcion_clase_id: Mapped[int] = mapped_column(
        ForeignKey("inscripciones_clases.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    parcial_1: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    parcial_2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    parcial_3: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    calificacion_final: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    extraordinario: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    estado: Mapped[str] = mapped_column(String(30), default="Cursando") # Cursando, Aprobada, Reprobada

    inscripcion_clase: Mapped["InscripcionClase"] = relationship("InscripcionClase", back_populates="calificacion")


class ETS(Base, TimestampMixin):
    __tablename__ = "ets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    materia_id: Mapped[int] = mapped_column(ForeignKey("materias.id", ondelete="CASCADE"), nullable=False)
    periodo_id: Mapped[int] = mapped_column(ForeignKey("periodos_academicos.id"), nullable=False)
    profesor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("profesores.id", ondelete="SET NULL"), nullable=True)
    fecha_examen: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    aula: Mapped[str] = mapped_column(String(50), default="Salon 101")
    tipo_turno: Mapped[str] = mapped_column(String(20), default="Ordinario") # Ordinario, Especial

    materia: Mapped["Materia"] = relationship("Materia", back_populates="ets_list")
    periodo: Mapped["PeriodoAcademico"] = relationship("PeriodoAcademico")
    profesor: Mapped[Optional["Profesor"]] = relationship("Profesor", back_populates="ets_asignados")
    inscripciones_ets: Mapped[List["InscripcionETS"]] = relationship("InscripcionETS", back_populates="ets")


class InscripcionETS(Base, TimestampMixin):
    __tablename__ = "inscripciones_ets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    alumno_id: Mapped[int] = mapped_column(ForeignKey("alumnos.id", ondelete="CASCADE"), nullable=False)
    ets_id: Mapped[int] = mapped_column(ForeignKey("ets.id", ondelete="CASCADE"), nullable=False)
    fecha_inscripcion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    alumno: Mapped["Alumno"] = relationship("Alumno", back_populates="inscripciones_ets")
    ets: Mapped["ETS"] = relationship("ETS", back_populates="inscripciones_ets")
    calificacion_ets: Mapped[Optional["CalificacionETS"]] = relationship(
        "CalificacionETS", back_populates="inscripcion_ets", uselist=False, cascade="all, delete-orphan"
    )


class CalificacionETS(Base, TimestampMixin):
    __tablename__ = "calificaciones_ets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    inscripcion_ets_id: Mapped[int] = mapped_column(
        ForeignKey("inscripciones_ets.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    calificacion: Mapped[float] = mapped_column(Float, nullable=False)
    aprobado: Mapped[bool] = mapped_column(default=False)

    inscripcion_ets: Mapped["InscripcionETS"] = relationship("InscripcionETS", back_populates="calificacion_ets")
