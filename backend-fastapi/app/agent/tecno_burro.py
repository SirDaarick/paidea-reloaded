import json
from typing import List, Dict, Any, Optional, AsyncGenerator
from groq import AsyncGroq
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.models.usuario import Usuario
from app.agent.tools import TOOLS_DEFINITION, get_tools_for_user, execute_tool


class TecnoBurroAgent:
    def __init__(self):
        self.provider = (getattr(settings, "LLM_PROVIDER", "gemini") or "gemini").lower()
        gemini_key = getattr(settings, "GEMINI_API_KEY", "").strip()
        groq_key = getattr(settings, "GROQ_API_KEY", "").strip()

        if (self.provider == "gemini" and gemini_key) or (gemini_key and not groq_key):
            self.provider = "gemini"
            self.model = getattr(settings, "GEMINI_MODEL", "gemini-3.5-flash-lite") or "gemini-3.5-flash-lite"
        elif groq_key:
            self.provider = "groq"
            self.model = getattr(settings, "GROQ_MODEL", "llama-3.1-8b-instant") or "llama-3.1-8b-instant"
        else:
            self.provider = "local"
            self.model = "local-fallback"

    @property
    def client(self):
        gemini_key = getattr(settings, "GEMINI_API_KEY", "").strip()
        groq_key = getattr(settings, "GROQ_API_KEY", "").strip()

        if (self.provider == "gemini" and gemini_key) or (gemini_key and not groq_key):
            from openai import AsyncOpenAI
            return AsyncOpenAI(
                api_key=gemini_key,
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            )
        elif groq_key:
            from groq import AsyncGroq
            return AsyncGroq(api_key=groq_key)
        return None

    def _build_system_prompt(self, current_user: Usuario) -> str:
        boleta_o_rfc = (
            current_user.alumno.boleta
            if current_user.alumno
            else (current_user.profesor.rfc if current_user.profesor else "N/A")
        )
        carrera = (
            current_user.alumno.carrera.nombre
            if (current_user.alumno and current_user.alumno.carrera)
            else "ESCOM - IPN"
        )

        return (
            f"Eres TecnoBurro, el asistente virtual y mentor académico inteligente de PAIDEA en la Escuela Superior de Cómputo (ESCOM - IPN).\n"
            f"Usuario actual: {current_user.nombre_completo}\n"
            f"Rol: {current_user.rol.value} | Identificador Oficial: {boleta_o_rfc} | Carrera/Adscripción: {carrera}\n\n"
            f"PRINCIPIOS Y DIRECTRICES DE ACTUACIÓN:\n"
            f"1. **Tono**: Cálido, institucional, empático y riguroso. Hablas en español de México formal y educativo.\n"
            f"2. **Herramientas**: Si el usuario consulta calificaciones, materias, horarios, citas, trámites o simulaciones, invoca SIEMPRE las herramientas pertinentes de inmediato.\n"
            f"3. **Normativa IPN**: Para preguntas sobre bajas, dictámenes, permanencia, cupos o becas, invoca 'consultar_reglamento_academico' y cita con precisión los artículos recuperados (ej. 'con base en el Artículo 41 del RGE...').\n"
            f"4. **Fidelidad Absoluta**: NUNCA inventes calificaciones, materias ni artículos normativos. Si una herramienta devuelve información, incorpórala de forma comprensible sin alterar los datos.\n"
            f"5. **Widgets Interactivos**: Las herramientas devuelven etiquetas en formato [WIDGET:TIPO:{{...}}]. Debes CONSERVAR y EMITIR intactas dichas etiquetas al final de tu respuesta para que la interfaz gráfica interactiva las renderice.\n"
            f"6. **Sugerencias de Continuación**: Al final de tu mensaje, incluye siempre 2 o 3 preguntas o acciones sugeridas para el alumno en el formato [SUGGESTIONS:[\"pregunta 1\", \"pregunta 2\"]] para guiar su navegación.\n"
        )

    async def _local_fallback(
        self, mensaje: str, current_user: Usuario, db: AsyncSession
    ) -> str:
        import unicodedata
        msg_norm = "".join(
            c for c in unicodedata.normalize("NFD", mensaje.lower())
            if unicodedata.category(c) != "Mn"
        )
        msg_lower = msg_norm
        # 1. Ubicación de docentes o salones (específico)
        if any(k in msg_lower for k in ["donde esta", "ubicacion", "cubiculo", "donde encuentro", "donde queda", "donde se encuentra", "en que salon", "que salon"]):
            return "[Modo Local Dev] " + await execute_tool("ubicar_profesor_o_salon", {"termino": mensaje}, current_user, db)
        # 2. Optativas y plan curricular
        elif any(k in msg_lower for k in ["optativa", "plan de estudio", "plan de estudios", "mapa", "materia avanzada"]):
            return "[Modo Local Dev] " + await execute_tool("consultar_optativas_y_plan", {}, current_user, db)
        # 3. Inscripción a ETS (Human-in-the-loop)
        elif any(k in msg_lower for k in ["inscribir ets", "inscribirme a ets", "meter ets", "registrar ets"]):
            return "[Modo Local Dev] " + await execute_tool("inscribir_examen_ets", {"materia": "Compiladores"}, current_user, db)
        # 4. ETS (Consulta)
        elif any(k in msg_lower for k in ["ets", "extraordinario", "titulo de suficiencia"]):
            return "[Modo Local Dev] " + await execute_tool("consultar_mis_ets", {}, current_user, db)
        # 5. Auditoría de Asistencias y Faltas (Art. 45 RGE)
        elif any(k in msg_lower for k in ["asistencia", "falta", "inasistencia", "derecho a examen", "asistencias", "faltas"]):
            return "[Modo Local Dev] " + await execute_tool("auditar_asistencias_y_faltas", {}, current_user, db)
        # 6. Cupos y Ocupabilidad de Materias
        elif any(k in msg_lower for k in ["cupo", "cupos", "lugares disponibles", "ocupabilidad"]):
            return "[Modo Local Dev] " + await execute_tool("consultar_cupos_materias", {"materia": ""}, current_user, db)
        # 7. Estatus de Trámites Escolares
        elif any(k in msg_lower for k in ["estatus de mi tramite", "estado de mi tramite", "mis solicitudes", "seguimiento tramite", "estatus tramite"]):
            return "[Modo Local Dev] " + await execute_tool("consultar_estatus_mis_tramites", {}, current_user, db)
        # 8. Alumnos en Riesgo (Docente)
        elif any(k in msg_lower for k in ["alumnos en riesgo", "alumnos reprobados", "reprobando", "intervencion temprana", "reprobados"]):
            return "[Modo Local Dev] " + await execute_tool("identificar_alumnos_en_riesgo", {}, current_user, db)
        # 9. Lista de Grupo (Docente)
        elif any(k in msg_lower for k in ["lista de alumnos", "lista de grupo", "alumnos inscritos", "mi lista"]):
            return "[Modo Local Dev] " + await execute_tool("consultar_lista_grupo", {}, current_user, db)
        # 10. Ficha de datos personales
        elif any(k in msg_lower for k in ["mis datos", "curp", "rfc", "mi correo", "mi direccion", "perfil escolar"]):
            return "[Modo Local Dev] " + await execute_tool("consultar_mis_datos_escolares", {}, current_user, db)
        # 11. Métricas para docentes
        elif any(k in msg_lower for k in ["metrica", "rendimiento docente", "aprobacion docente", "metricas"]):
            return "[Modo Local Dev] " + await execute_tool("consultar_metricas_profesor", {}, current_user, db)
        # 12. Clase actual / próxima
        elif any(k in msg_lower for k in ["proxima clase", "clase actual", "que clase tengo"]):
            return "[Modo Local Dev] " + await execute_tool("consultar_clase_actual_o_proxima", {}, current_user, db)
        # 13. Simulador de calificaciones
        elif any(k in msg_lower for k in ["simular", "cuanto necesito", "parcial"]):
            return "[Modo Local Dev] " + await execute_tool("simular_calificacion_requerida", {"materia": "Compiladores"}, current_user, db)
        # 14. Kárdex y calificaciones generales
        elif any(k in msg_lower for k in ["kardex", "calificacion", "promedio", "materias aprobadas"]):
            return "[Modo Local Dev] " + await execute_tool("consultar_mi_kardex", {}, current_user, db)
        # 15. Horario escolar
        elif any(k in msg_lower for k in ["horario", "mis clases", "clases"]):
            return "[Modo Local Dev] " + await execute_tool("consultar_mi_horario", {}, current_user, db)
        # 16. Citas de reinscripción
        elif any(k in msg_lower for k in ["cita", "reinscripcion"]):
            return "[Modo Local Dev] " + await execute_tool("consultar_mi_cita_reinscripcion", {}, current_user, db)
        # 17. Auditoría reglamentaria
        elif any(k in msg_lower for k in ["auditar", "regular", "situacion escolar", "riesgo"]):
            return "[Modo Local Dev] " + await execute_tool("auditar_situacion_escolar", {}, current_user, db)
        # 18. Solicitud de constancias y trámites
        elif any(k in msg_lower for k in ["constancia", "boleta certificada", "tramite"]):
            return "[Modo Local Dev] " + await execute_tool("solicitar_constancia_estudios", {"tipo": "Constancia de Estudios con Calificaciones"}, current_user, db)
        # 19. Calendario académico
        elif any(k in msg_lower for k in ["calendario", "fechas departamentales", "suspension"]):
            return "[Modo Local Dev] " + await execute_tool("consultar_calendario_academico", {}, current_user, db)
        # 20. Normativa y reglamentos
        elif any(k in msg_lower for k in ["reglamento", "dictamen", "baja", "articulo", "normativa", "cossie"]):
            return "[Modo Local Dev] " + await execute_tool("consultar_reglamento_academico", {"consulta": mensaje}, current_user, db)

        return (
            "¡Hola! Soy TecnoBurro, tu asistente académico de ESCOM en PAIDEA. "
            "Para activar mis capacidades completas de razonamiento multi-paso con LLM, recuerda configurar tu GEMINI_API_KEY (Google AI Studio) o GROQ_API_KEY en el archivo .env del backend."
        )

    async def chat(
        self,
        mensaje: str,
        current_user: Usuario,
        db: AsyncSession,
        historial: Optional[List[Dict[str, str]]] = None,
    ) -> str:
        """Procesa una consulta con bucle ReAct multi-paso de hasta 3 iteraciones."""
        if not self.client:
            return await self._local_fallback(mensaje, current_user, db)

        system_prompt = self._build_system_prompt(current_user)
        messages: List[Dict[str, Any]] = [{"role": "system", "content": system_prompt}]

        if historial:
            for h in historial[-6:]:
                if h.get("role") in ["user", "assistant"] and h.get("content"):
                    messages.append({"role": h["role"], "content": h["content"]})

        messages.append({"role": "user", "content": mensaje})

        try:
            max_turns = 3
            current_turn = 0

            while current_turn < max_turns:
                current_turn += 1

                user_tools = get_tools_for_user(current_user)
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    tools=user_tools,
                    tool_choice="auto",
                    temperature=0.2,
                )

                response_message = response.choices[0].message

                # Si no hay llamadas a herramientas, hemos llegado a la respuesta final
                if not response_message.tool_calls:
                    return response_message.content or "Consulta completada con éxito."

                # Agregar la decisión del modelo al historial de la conversación
                messages.append(response_message)

                # Ejecutar cada herramienta solicitada
                for tool_call in response_message.tool_calls:
                    fn_name = tool_call.function.name
                    fn_args = {}
                    try:
                        if tool_call.function.arguments:
                            fn_args = json.loads(tool_call.function.arguments)
                    except Exception:
                        fn_args = {}

                    tool_result = await execute_tool(fn_name, fn_args, current_user, db)

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": tool_result,
                    })

            # Síntesis final tras agotar turnos si aún no se generó texto de cierre
            final_response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.3,
            )
            return final_response.choices[0].message.content or "Consulta completada."

        except Exception as e:
            # Fallback resiliente si se agota la cuota (429) o hay corte de red
            try:
                return await self._local_fallback(mensaje, current_user, db)
            except Exception:
                return f"Ocurrió una interrupción temporal al procesar tu solicitud con TecnoBurro: {str(e)}"

    async def chat_stream(
        self,
        mensaje: str,
        current_user: Usuario,
        db: AsyncSession,
        historial: Optional[List[Dict[str, str]]] = None,
    ) -> AsyncGenerator[str, None]:
        """Transmite respuestas en tiempo real token a token vía Server-Sent Events (SSE)."""
        if not self.client:
            fallback = await self._local_fallback(mensaje, current_user, db)
            yield f"data: {json.dumps({'type': 'token', 'content': fallback})}\n\n"
            yield f"data: {json.dumps({'type': 'done', 'full_text': fallback})}\n\n"
            return

        system_prompt = self._build_system_prompt(current_user)
        messages: List[Dict[str, Any]] = [{"role": "system", "content": system_prompt}]

        if historial:
            for h in historial[-6:]:
                if h.get("role") in ["user", "assistant"] and h.get("content"):
                    messages.append({"role": h["role"], "content": h["content"]})

        messages.append({"role": "user", "content": mensaje})

        try:
            # 1. Primera llamada con herramientas para razonar si se necesita invocar datos
            user_tools = get_tools_for_user(current_user)
            first_call = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                tools=user_tools,
                tool_choice="auto",
                temperature=0.2,
            )
            first_msg = first_call.choices[0].message

            # Caso A: Respuesta directa sin herramientas (conversacional o saludo)
            if not first_msg.tool_calls:
                content = first_msg.content or "Consulta completada con éxito."
                import asyncio
                # Transmitir en cadencia suave palabra por palabra
                words = content.split(" ")
                for idx, w in enumerate(words):
                    token = w if idx == len(words) - 1 else w + " "
                    yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
                    await asyncio.sleep(0.018)
                yield f"data: {json.dumps({'type': 'done', 'full_text': content})}\n\n"
                return

            # Caso B: Invocación de herramientas y síntesis streaming
            messages.append(first_msg)
            for tool_call in first_msg.tool_calls:
                fn_name = tool_call.function.name
                yield f"data: {json.dumps({'type': 'tool_start', 'tool': fn_name})}\n\n"

                fn_args = {}
                try:
                    if tool_call.function.arguments:
                        fn_args = json.loads(tool_call.function.arguments)
                except Exception:
                    fn_args = {}

                tool_result = await execute_tool(fn_name, fn_args, current_user, db)
                yield f"data: {json.dumps({'type': 'tool_done', 'tool': fn_name})}\n\n"

                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": tool_result,
                })

            # 2. Generación en Streaming de la respuesta final
            stream_response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                stream=True,
                temperature=0.3,
            )

            full_text_acc = []
            async for chunk in stream_response:
                if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    full_text_acc.append(token)
                    yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

            final_text = "".join(full_text_acc)
            yield f"data: {json.dumps({'type': 'done', 'full_text': final_text})}\n\n"

        except Exception as e:
            try:
                fallback = await self._local_fallback(mensaje, current_user, db)
                words = fallback.split(" ")
                for idx, w in enumerate(words):
                    token = w if idx == len(words) - 1 else w + " "
                    yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
                yield f"data: {json.dumps({'type': 'done', 'full_text': fallback})}\n\n"
            except Exception:
                err_msg = f"Error al generar respuesta en streaming: {str(e)}"
                yield f"data: {json.dumps({'type': 'error', 'content': err_msg})}\n\n"


tecno_burro_agent = TecnoBurroAgent()

