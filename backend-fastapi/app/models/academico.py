from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Integer, Float, Boolean, Date, Time, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.alumno import Alumno
    from app.models.profesor import Profesor
    from app.models.inscripcion import InscripcionClase, ETS


class Carrera(Base, TimestampMixin):
    __tablename__ = "carreras"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    clave: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False) # Ej. 'ISC', 'IIA', 'LCD'
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    creditos_totales: Mapped[float] = mapped_column(Float, default=350.0, nullable=False)

    materias: Mapped[List["Materia"]] = relationship("Materia", back_populates="carrera")
    alumnos: Mapped[List["Alumno"]] = relationship("Alumno", back_populates="carrera")


class Materia(Base, TimestampMixin):
    __tablename__ = "materias"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    clave: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    creditos: Mapped[float] = mapped_column(Float, nullable=False)
    horas_teoria: Mapped[float] = mapped_column(Float, default=3.0)
    horas_practica: Mapped[float] = mapped_column(Float, default=1.5)
    semestre: Mapped[int] = mapped_column(Integer, nullable=False)
    tipo_asignatura: Mapped[str] = mapped_column(String(50), default="Obligatoria") # Obligatoria, Optativa
    carrera_id: Mapped[int] = mapped_column(ForeignKey("carreras.id", ondelete="CASCADE"), nullable=False)

    carrera: Mapped["Carrera"] = relationship("Carrera", back_populates="materias")
    clases: Mapped[List["Clase"]] = relationship("Clase", back_populates="materia")
    ets_list: Mapped[List["ETS"]] = relationship("ETS", back_populates="materia")


class PeriodoAcademico(Base, TimestampMixin):
    __tablename__ = "periodos_academicos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    clave: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False) # Ej: '2025-1', '2025-2'
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    fecha_inicio: Mapped[Date] = mapped_column(Date, nullable=False)
    fecha_fin: Mapped[Date] = mapped_column(Date, nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    grupos: Mapped[List["Grupo"]] = relationship("Grupo", back_populates="periodo")


class Grupo(Base, TimestampMixin):
    __tablename__ = "grupos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(30), nullable=False) # Ej. '3CV1', '1CM2'
    turno: Mapped[str] = mapped_column(String(20), default="Matutino") # Matutino, Vespertino
    periodo_id: Mapped[int] = mapped_column(ForeignKey("periodos_academicos.id"), nullable=False)

    periodo: Mapped["PeriodoAcademico"] = relationship("PeriodoAcademico", back_populates="grupos")
    clases: Mapped[List["Clase"]] = relationship("Clase", back_populates="grupo")


class Clase(Base, TimestampMixin):
    __tablename__ = "clases"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    grupo_id: Mapped[int] = mapped_column(ForeignKey("grupos.id", ondelete="CASCADE"), nullable=False)
    materia_id: Mapped[int] = mapped_column(ForeignKey("materias.id", ondelete="CASCADE"), nullable=False)
    profesor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("profesores.id", ondelete="SET NULL"), nullable=True)
    aula: Mapped[Optional[str]] = mapped_column(String(50), default="Salon 101")
    cupo_maximo: Mapped[int] = mapped_column(Integer, default=35)

    grupo: Mapped["Grupo"] = relationship("Grupo", back_populates="clases")
    materia: Mapped["Materia"] = relationship("Materia", back_populates="clases")
    profesor: Mapped[Optional["Profesor"]] = relationship("Profesor", back_populates="clases")
    horarios: Mapped[List["HorarioClase"]] = relationship("HorarioClase", back_populates="clase", cascade="all, delete-orphan")
    inscripciones_clase: Mapped[List["InscripcionClase"]] = relationship("InscripcionClase", back_populates="clase")


class HorarioClase(Base, TimestampMixin):
    __tablename__ = "horarios_clases"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    clase_id: Mapped[int] = mapped_column(ForeignKey("clases.id", ondelete="CASCADE"), nullable=False)
    dia_semana: Mapped[str] = mapped_column(String(20), nullable=False) # Lunes, Martes, Miercoles, Jueves, Viernes
    hora_inicio: Mapped[str] = mapped_column(String(10), nullable=False) # '07:00'
    hora_fin: Mapped[str] = mapped_column(String(10), nullable=False)    # '08:30'

    clase: Mapped["Clase"] = relationship("Clase", back_populates="horarios")
