# ============================================================
# API DEL AGENTE ACADÉMICO – TECNOBURRO (FINAL INTEGRADO)
# ============================================================

import os
from typing import List, Optional, Dict
from groq import AsyncGroq 
import pymongo
import certifi 
from sentence_transformers import SentenceTransformer
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import json

# --- IMPORTACIONES DE TUS MÓDULOS ---
from alumno_tools import tools as tools_alumnos
from profesor_tools import tools as tools_profesores # Descomenta cuando tengas el archivo
from query_db import buscar_usuario_sistema # <--- TU NUEVO BUSCADOR

# ============================================================
# 1. CONFIGURACIÓN
# ============================================================
def require_env(var_name: str) -> str:
    value = os.environ.get(var_name)
    if not value:
        raise RuntimeError(f"Falta variable de entorno requerida: {var_name}")
    return value

GROQ_API_KEY = require_env("GROQ_API_KEY")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

# Configuración solo para la Base de Conocimiento (RAG)
MONGO_RAG_URI = require_env("MONGO_RAG_URI")
DB_RAG_NAME = "Base_Conocimiento"
COLL_RAG_NAME = "reglamentos_embeddings_v3"
INDEX_NAME = "vector_index" 

MODELO_EMBEDDING = "paraphrase-multilingual-mpnet-base-v2"
MODELO_LLM = "llama-3.1-8b-instant"

# ============================================================
# 2. CLIENTES Y MODELOS
# ============================================================

client = AsyncGroq(api_key=GROQ_API_KEY)

# Conexión EXCLUSIVA para RAG (La de usuarios ya la maneja query_db)
client_rag = pymongo.MongoClient(MONGO_RAG_URI, tlsCAFile=certifi.where())
collection_rag = client_rag[DB_RAG_NAME][COLL_RAG_NAME]

print("Cargando modelo de embeddings...")
embedding_model = SentenceTransformer(MODELO_EMBEDDING)
print("Modelo cargado ✅")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELO DE ENTRADA ACTUALIZADO ---
# Usamos 'identificador' para aceptar Boleta o RFC indistintamente
class Pregunta(BaseModel):
    pregunta: str
    identificador: str 
    # ✅ SOLUCIÓN: default_factory crea una lista NUEVA cada vez
    historial: Optional[list] = Field(default_factory=list)

# ============================================================
# 3. FUNCIONES AUXILIARES
# ============================================================

def optimizar_historial(historial_raw, max_pares=2):
    if not historial_raw: return []
    limite = max_pares * 2
    return historial_raw[-limite:]

def buscar_chunks_hibridos(query, top_k=5):
    try:
        vector = embedding_model.encode(query).tolist()
        
        pipeline = [
            {
                # ✅ CAMBIO CLAVE: Usamos $vectorSearch en lugar de $search
                "$vectorSearch": {
                    "index": INDEX_NAME, 
                    "path": "embedding_vector",
                    "queryVector": vector,
                    "numCandidates": top_k * 10, # Factor de precisión (estándar es 10x o 20x)
                    "limit": top_k
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "text": 1,
                    "score": { "$meta": "vectorSearchScore" } # ✅ Score de similitud
                }
            }
        ]
        
        resultados = list(collection_rag.aggregate(pipeline))
        return [doc["text"] for doc in resultados]

    except Exception as e:
        print(f"⚠️ Error en Búsqueda Vectorial: {e}")
        return []

def construir_prompt(pregunta, contexto, lista_tools, usuario_id_mongo, rol, texto_historial):
    return f"""
Eres TecnoBurro, asistente académico. Usuario: {rol.upper()} (ID Sistema: {usuario_id_mongo}).

HISTORIAL:
{texto_historial}

CONTEXTO (REGLAMENTOS):
{contexto}

HERRAMIENTAS DISPONIBLES:
{lista_tools}

INSTRUCCIONES DE RAZONAMIENTO:
1. Si la pregunta es sobre reglamentos o general:
   - Responde usando el CONTEXTO. NO uses formato TOOL.

2. Si necesitas datos privados (Kárdex, Listas, Busquedas):
   - DEBES usar una herramienta.
   - Formato de respuesta OBLIGATORIO:
     TOOL: <nombre_exacto_tool>
     ARGS: <argumento_o_json>

   REGLAS PARA ARGS:
   - Para tools simples (como 'obtener_datos_profesor'), envía solo el ID: {usuario_id_mongo}
   - Para 'consultar_alumno_especifico', envía un JSON así: {{"id_profesor": "{usuario_id_mongo}", "busqueda": "nombre o boleta"}}

PREGUNTA: {pregunta}
"""

# ============================================================
# 4. ENDPOINT PRINCIPAL (INTELIGENTE)
# ============================================================

@app.post("/preguntar")
async def preguntar(data: Pregunta):
    pregunta = data.pregunta.strip()
    identificador_entrada = data.identificador.strip()
    
    # ---------------------------------------------------------
    # PASO 1: VERIFICAR USUARIO Y ROL (Usando query_db)
    # ---------------------------------------------------------
    datos_usuario = buscar_usuario_sistema(identificador_entrada)
    
    if not datos_usuario:
        return {"respuesta": f"No pude encontrar un usuario con la boleta/RFC: {identificador_entrada}. Verifica tus datos."}
    
    # Extraemos los datos reales de la BD
    usuario_id_mongo = datos_usuario["mongo_id"] # El ID tipo "690eac..."
    rol_detectado = datos_usuario["rol"]         # "Alumno" o "Profesor"
    nombre_usuario = datos_usuario["nombre"]
    
    print(f"✅ Usuario: {nombre_usuario} | Rol: {rol_detectado} | ID Mongo: {usuario_id_mongo}")

    # ---------------------------------------------------------
    # PASO 2: SELECCIONAR TOOLS SEGÚN ROL
    # ---------------------------------------------------------
    if rol_detectado.lower() in ["profesor", "docente", "maestro"]:
        tools_activas = tools_profesores
    else:
        # Default a alumnos
        tools_activas = tools_alumnos

    if not tools_activas and rol_detectado.lower() == "profesor":
        return {"respuesta": "Hola profe. Mis herramientas de profesor están en mantenimiento, pero puedo responder dudas generales."}

    # ---------------------------------------------------------
    # PASO 3: PREPARAR CONTEXTO Y PROMPT
    # ---------------------------------------------------------
    
    # A. Historial
    historial_corto = optimizar_historial(data.historial, max_pares=2)
    texto_historial = ""
    for msg in historial_corto:
        r = "Usuario" if msg.get('role') == 'user' else "TecnoBurro"
        texto_historial += f"{r}: {msg.get('content', '')}\n"

    # B. RAG (Reglamentos)
    chunks = buscar_chunks_hibridos(pregunta)
    nombres_tools = ", ".join([t.name for t in tools_activas])
    
    # C. Construcción del Prompt
    # OJO: Pasamos 'usuario_id_mongo' para que el LLM sepa qué ID usar en los ARGS
    prompt = construir_prompt(
        pregunta, 
        "\n---\n".join(chunks), 
        nombres_tools, 
        usuario_id_mongo, 
        rol_detectado, 
        texto_historial
    )
    
    # ---------------------------------------------------------
    # PASO 4: PRIMERA LLAMADA AL LLM (RAZONAMIENTO)
    # ---------------------------------------------------------
    chat_completion = await client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model=MODELO_LLM,
        temperature=0.1, 
    )
    respuesta_raw = (chat_completion.choices[0].message.content or "").strip()

    # Si no pide tool, regresamos la respuesta directa
    if "TOOL:" not in respuesta_raw:
        return {"respuesta": respuesta_raw}

    # ---------------------------------------------------------
    # PASO 5: EJECUCIÓN DE HERRAMIENTA (MEJORADO)
    # ---------------------------------------------------------
    try:
        segmentos = respuesta_raw.split("TOOL:")
        parte_comando = segmentos[1].strip()
        lineas = parte_comando.split("\n")
        tool_name = lineas[0].strip()
        
        # --- Lógica de Argumentos Inteligente ---
        args_input = usuario_id_mongo # Default
        
        # Buscamos la línea ARGS:
        for linea in lineas:
            if "ARGS:" in linea:
                raw_arg = linea.replace("ARGS:", "").strip()
                if raw_arg and raw_arg not in ["''", '""']:
                    # Intentamos detectar si es JSON (para la búsqueda de alumnos)
                    if "{" in raw_arg and "}" in raw_arg:
                        try:
                            args_input = json.loads(raw_arg) # Convertimos a diccionario real
                        except:
                            args_input = raw_arg # Si falla, lo dejamos como texto
                    else:
                        args_input = raw_arg # Es texto simple (un ID)
                break

        # Buscar y Ejecutar
        tool_func = next((t for t in tools_activas if t.name == tool_name), None)
        
        if not tool_func: 
            return {"respuesta": f"Error: La herramienta '{tool_name}' no existe o no tienes permiso."}

        print(f"🛠️  Ejecutando: {tool_name}")
        print(f"📥  Args recibidos: {args_input} (Tipo: {type(args_input)})")
        
        # Invoke maneja diccionarios o strings automáticamente
        resultado = await tool_func.ainvoke(args_input) 
        
        # ---------------------------------------------------------
        # PASO 6: SEGUNDA LLAMADA (REDACCIÓN FINAL "ANTI-SISTEMA")
        # ---------------------------------------------------------
        prompt_redaccion = f"""
        Actúa como TecnoBurro. Estás hablando con un {rol_detectado}.
        
        INFORMACIÓN TÉCNICA OBTENIDA (NO MOSTRAR AL USUARIO):
        {str(resultado)}
        
        INSTRUCCIONES DE REDACCIÓN:
        1. Tu objetivo es responder la pregunta del usuario usando la información de arriba.
        2. Tono: Amable, profesional y directo.
        3. FORMATO: Usa Markdown, listas o negritas para que se vea limpio.
        4. PROHIBICIONES (IMPORTANTE):
           - NO digas "He consultado la base de datos".
           - NO digas "Según la herramienta X".
           - NO muestres IDs de MongoDB (como 690eac...) ni estructuras JSON.
           - Si la información es un error (ej: "No encontrado"), díselo amablemente.

        PREGUNTA DEL USUARIO: "{pregunta}"
        """
        
        chat_final = await client.chat.completions.create(
            messages=[{"role": "user", "content": prompt_redaccion}],
            model=MODELO_LLM,
            temperature=0.3, 
        )
        return {"respuesta": (chat_final.choices[0].message.content or "").strip()}

    except Exception as e:
        print(f"❌ Error procesando tool: {e}")
        return {"respuesta": "Tuve un problema técnico consultando esa información. Intenta de nuevo."}