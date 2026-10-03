from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict


class ChatHistoryItem(BaseModel):
    role: str  # "user" | "assistant" | "system"
    content: str


class ChatRequest(BaseModel):
    mensaje: str
    thread_id: Optional[int] = None
    historial: Optional[List[ChatHistoryItem]] = None


class ChatResponse(BaseModel):
    respuesta: str
    thread_id: Optional[int] = None


class ChatMessageResponse(BaseModel):
    id: int
    thread_id: int
    rol: str
    contenido: str
    metadatos_json: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatThreadResponse(BaseModel):
    id: int
    titulo: str
    activo: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatThreadDetailResponse(BaseModel):
    id: int
    titulo: str
    activo: bool
    created_at: datetime
    updated_at: datetime
    mensajes: List[ChatMessageResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class NewThreadRequest(BaseModel):
    titulo: Optional[str] = "Nueva consulta"

