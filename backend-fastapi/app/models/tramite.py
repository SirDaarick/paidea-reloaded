from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.alumno import Alumno
    from app.models.academico import PeriodoAcademico


class CitaReinscripcion(Base, TimestampMixin):
    __tablename__ = "citas_reinscripcion"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    alumno_id: Mapped[int] = mapped_column(ForeignKey("alumnos.id", ondelete="CASCADE"), nullable=False)
    periodo_id: Mapped[int] = mapped_column(ForeignKey("periodos_academicos.id"), nullable=False)
    fecha_cita: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    lugar: Mapped[str] = mapped_column(String(50), default="En línea (Sistema PAIDEA)")

    alumno: Mapped["Alumno"] = relationship("Alumno", back_populates="citas")
    periodo: Mapped["PeriodoAcademico"] = relationship("PeriodoAcademico")


class SolicitudTramite(Base, TimestampMixin):
    __tablename__ = "solicitudes_tramites"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    alumno_id: Mapped[int] = mapped_column(ForeignKey("alumnos.id", ondelete="CASCADE"), nullable=False)
    tipo_tramite: Mapped[str] = mapped_column(String(80), nullable=False) # 'Constancia', 'Dictamen', 'Baja Temporal', 'Boleta Certificada'
    estado: Mapped[str] = mapped_column(String(30), default="Pendiente")  # 'Pendiente', 'En Revisión', 'Aprobada', 'Rechazada'
    descripcion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    comentarios_admin: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    archivo_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    alumno: Mapped["Alumno"] = relationship("Alumno", back_populates="solicitudes")
