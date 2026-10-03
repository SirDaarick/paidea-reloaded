from typing import List, Optional
from pydantic import BaseModel


class ChatHistoryItem(BaseModel):
    role: str # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    mensaje: str
    historial: Optional[List[ChatHistoryItem]] = None


class ChatResponse(BaseModel):
    respuesta: str
