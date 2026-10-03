from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.usuario import Usuario
    from app.models.academico import Clase
    from app.models.inscripcion import ETS


class Profesor(Base, TimestampMixin):
    __tablename__ = "profesores"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    rfc: Mapped[str] = mapped_column(String(13), unique=True, index=True, nullable=False)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), unique=True)
    academia: Mapped[str] = mapped_column(String(100), default="Ciencias de la Computación")
    cubiculo: Mapped[Optional[str]] = mapped_column(String(50), default="Edificio 1, Cubículo 10")

    # Relaciones
    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="profesor")
    clases: Mapped[List["Clase"]] = relationship("Clase", back_populates="profesor")
    ets_asignados: Mapped[List["ETS"]] = relationship("ETS", back_populates="profesor")
