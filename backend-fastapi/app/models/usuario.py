import enum
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Boolean, Enum, ForeignKey, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.alumno import Alumno
    from app.models.profesor import Profesor
    from app.models.chat import ChatThread


class RolUsuario(str, enum.Enum):
    ALUMNO = "Alumno"
    PROFESOR = "Profesor"
    ADMINISTRADOR = "Administrador"


class Usuario(Base, TimestampMixin):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    nombre: Mapped[str] = mapped_column(String(80), nullable=False)
    primer_apellido: Mapped[str] = mapped_column(String(80), nullable=False)
    segundo_apellido: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    rol: Mapped[RolUsuario] = mapped_column(
        Enum(RolUsuario, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=RolUsuario.ALUMNO,
    )
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relaciones 1:1 con perfil extendido
    datos_personales: Mapped[Optional["DatosPersonales"]] = relationship(
        "DatosPersonales", back_populates="usuario", uselist=False, cascade="all, delete-orphan"
    )
    direccion: Mapped[Optional["Direccion"]] = relationship(
        "Direccion", back_populates="usuario", uselist=False, cascade="all, delete-orphan"
    )

    # Subtipos
    alumno: Mapped[Optional["Alumno"]] = relationship(
        "Alumno", back_populates="usuario", uselist=False, cascade="all, delete-orphan"
    )
    profesor: Mapped[Optional["Profesor"]] = relationship(
        "Profesor", back_populates="usuario", uselist=False, cascade="all, delete-orphan"
    )
    chat_threads: Mapped[List["ChatThread"]] = relationship(
        "ChatThread", back_populates="usuario", cascade="all, delete-orphan"
    )

    @property
    def nombre_completo(self) -> str:
        if self.segundo_apellido:
            return f"{self.nombre} {self.primer_apellido} {self.segundo_apellido}"
        return f"{self.nombre} {self.primer_apellido}"


class DatosPersonales(Base, TimestampMixin):
    __tablename__ = "datos_personales"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), unique=True)
    curp: Mapped[Optional[str]] = mapped_column(String(18), unique=True, index=True, nullable=True)
    rfc: Mapped[Optional[str]] = mapped_column(String(13), unique=True, index=True, nullable=True)
    nacimiento: Mapped[Optional[Date]] = mapped_column(Date, nullable=True)
    nacionalidad: Mapped[Optional[str]] = mapped_column(String(50), default="Mexicana", nullable=True)
    telefono: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    movil: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    sexo: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    estado_civil: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)

    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="datos_personales")


class Direccion(Base, TimestampMixin):
    __tablename__ = "direcciones"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), unique=True)
    estado: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    alcaldia_municipio: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    colonia: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    calle: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    numero_exterior: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    numero_interior: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    codigo_postal: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)

    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="direccion")
