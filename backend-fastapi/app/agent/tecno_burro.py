import json
from typing import List, Dict, Any, Optional
from groq import AsyncGroq
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.models.usuario import Usuario
from app.agent.tools import TOOLS_DEFINITION, execute_tool


class TecnoBurroAgent:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        self.client = AsyncGroq(api_key=self.api_key) if self.api_key else None

    async def chat(
        self,
        mensaje: str,
        current_user: Usuario,
        db: AsyncSession,
        historial: Optional[List[Dict[str, str]]] = None,
    ) -> str:
        """Procesa una consulta conversacional con razonamiento y ejecución de herramientas."""

        # 1. Fallback si no hay API key configurada
        if not self.client:
            # Si el usuario pregunta por promedio/horario sin API key, respondemos con la tool directa para no bloquear desarrollo
            msg_lower = mensaje.lower()
            if any(k in msg_lower for k in ["kardex", "calificacion", "promedio"]):
                return f"[Modo Local Dev] " + await execute_tool("consultar_mi_kardex", {}, current_user, db)
            elif any(k in msg_lower for k in ["horario", "clases", "materias"]):
                return f"[Modo Local Dev] " + await execute_tool("consultar_mi_horario", {}, current_user, db)
            elif any(k in msg_lower for k in ["cita", "reinscripcion"]):
                return f"[Modo Local Dev] " + await execute_tool("consultar_mi_cita_reinscripcion", {}, current_user, db)
            elif any(k in msg_lower for k in ["reglamento", "dictamen", "baja", "articulo"]):
                return f"[Modo Local Dev] " + await execute_tool("consultar_reglamento_academico", {"consulta": mensaje}, current_user, db)
            
            return (
                "¡Hola! Soy TecnoBurro, tu asistente académico de ESCOM. "
                "Para activar mis capacidades de razonamiento completo con LLM, agrega tu GROQ_API_KEY en el archivo .env del backend."
            )

        # 2. Construcción de Mensajes del Sistema
        boleta_o_rfc = current_user.alumno.boleta if current_user.alumno else (
            current_user.profesor.rfc if current_user.profesor else "N/A"
        )
        system_prompt = (
            f"Eres TecnoBurro, el asistente virtual oficial de PAIDEA en la Escuela Superior de Cómputo (ESCOM - IPN).\n"
            f"Estás interactuando con {current_user.nombre_completo} (Rol: {current_user.rol.value}, Identificador: {boleta_o_rfc}).\n\n"
            f"REGLAS CRÍTICAS:\n"
            f"1. Sé amable, institucional, claro y preciso. Responde siempre en español.\n"
            f"2. Cuando el usuario pregunte por sus calificaciones, materias, horarios o citas, invoca la herramienta correspondiente.\n"
            f"3. Cuando el usuario pregunte sobre reglamentos, artículos, bajas, dictámenes o normativas IPN, invoca 'consultar_reglamento_academico'.\n"
            f"4. NUNCA inventes artículos de reglamentos ni calificaciones. Si no tienes la información, indícalo con cortesía.\n"
        )

        messages = [{"role": "system", "content": system_prompt}]

        # Historial de contexto (últimos 4 mensajes)
        if historial:
            for h in historial[-4:]:
                if h.get("role") in ["user", "assistant"] and h.get("content"):
                    messages.append({"role": h["role"], "content": h["content"]})

        messages.append({"role": "user", "content": mensaje})

        try:
            # 3. Primera llamada al modelo con Function Calling
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                tools=TOOLS_DEFINITION,
                tool_choice="auto",
                temperature=0.2,
            )

            response_message = response.choices[0].message

            # Si el modelo no solicitó herramientas, devolvemos la respuesta de texto
            if not response_message.tool_calls:
                return response_message.content or "No tengo una respuesta para esa consulta en este momento."

            # 4. El modelo solicitó una o más herramientas
            messages.append(response_message)

            for tool_call in response_message.tool_calls:
                fn_name = tool_call.function.name
                fn_args = {}
                try:
                    if tool_call.function.arguments:
                        fn_args = json.loads(tool_call.function.arguments)
                except Exception:
                    fn_args = {}

                # Ejecutar la herramienta en backend SQL / ChromaDB
                tool_result = await execute_tool(fn_name, fn_args, current_user, db)

                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": tool_result,
                })

            # 5. Segunda llamada al modelo para sintetizar la respuesta con el resultado de las herramientas
            final_response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.3,
            )
            return final_response.choices[0].message.content or "Consulta completada."

        except Exception as e:
            return f"Lo siento, ocurrió un error al procesar tu solicitud con TecnoBurro: {str(e)}"


tecno_burro_agent = TecnoBurroAgent()
