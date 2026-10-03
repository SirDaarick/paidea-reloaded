from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Integer, Text, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.usuario import Usuario


class ChatThread(Base, TimestampMixin):
    __tablename__ = "chat_threads"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    titulo: Mapped[str] = mapped_column(String(150), default="Nueva consulta", nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relaciones
    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="chat_threads")
    mensajes: Mapped[List["ChatMessage"]] = relationship(
        "ChatMessage", back_populates="thread", cascade="all, delete-orphan", order_by="ChatMessage.id"
    )


class ChatMessage(Base, TimestampMixin):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    thread_id: Mapped[int] = mapped_column(ForeignKey("chat_threads.id", ondelete="CASCADE"), nullable=False, index=True)
    rol: Mapped[str] = mapped_column(String(20), nullable=False)  # "user", "assistant", "system"
    contenido: Mapped[str] = mapped_column(Text, nullable=False)
    metadatos_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON para widgets y herramientas

    # Relaciones
    thread: Mapped["ChatThread"] = relationship("ChatThread", back_populates="mensajes")

