# alumno_tools.py (OPTIMIZADO)
from langchain.tools import tool
import httpx
import re
import datetime

# URL del backend Node.js
BACKEND_URL = "http://localhost:3001"

# ============================================================
# 🔐 VALIDACIÓN DE OBJECTID
# ============================================================
def validar_objectid(valor: str):
    return isinstance(valor, str) and re.fullmatch(r"[0-9a-fA-F]{24}", valor)

# ============================================================
# 🌐 Función segura para requests GET (ASÍNCRONA)
# ============================================================
async def safe_get(url: str):
    """
    Ejecuta un GET asíncrono y regresa el JSON o un error controlado.
    """
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(url, timeout=5.0) # Timeout para no colgarse eternamente
            if res.status_code != 200:
                return {"error": f"Error del servidor: {res.status_code}"}
            return res.json()
    except Exception as e:
        return {"error": f"Error de conexión: {str(e)}"}

# ============================================================
# 🔹 TOOLS (Ahora son async def)
# ============================================================

@tool
async def obtener_materias_actuales(alumno_id: str):
    """Obtiene todas las materias en las que el alumno está inscrito actualmente."""
    if not validar_objectid(alumno_id): return {"error": "alumno_id inválido"}
    return await safe_get(f"{BACKEND_URL}/alumnos/{alumno_id}/materias-actuales")

@tool
async def obtener_calificaciones(alumno_id: str):
    """Devuelve las calificaciones registradas del alumno."""
    if not validar_objectid(alumno_id): return {"error": "alumno_id inválido"}
    return await safe_get(f"{BACKEND_URL}/alumnos/{alumno_id}/calificaciones")

@tool
async def obtener_clases_del_dia(entrada: str):
    """
    Devuelve las clases del alumno para un día específico.
    Si solo recibes el ID, asume que es para 'hoy'.
    Formato ideal: "<alumno_id>|<dia>"
    """
    entrada = entrada.strip()
    
    # 1. Detectar si viene con separador "|"
    if "|" in entrada:
        partes = entrada.split("|")
        alumno_id = partes[0].strip()
        dia = partes[1].strip().lower()
    else:
        # 2. Si no hay separador, asumimos que es solo el ID y calculamos el día de HOY
        alumno_id = entrada.strip()
        
        dias_semana = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]
        dia_hoy_idx = datetime.datetime.today().weekday()
        dia = dias_semana[dia_hoy_idx]

    # Validación básica
    if not validar_objectid(alumno_id):
        return {"error": "alumno_id inválido"}

    # Llamada al backend
    resultado = await safe_get(f"{BACKEND_URL}/alumnos/{alumno_id}/clases-dia/{dia}")
    
    # Agregamos una notita para que el LLM sepa qué día consultó
    if isinstance(resultado, list):
        return {"info_extra": f"Mostrando clases del día: {dia}", "clases": resultado}
        
    return resultado

@tool
async def obtener_creditos(alumno_id: str):
    """Devuelve los créditos cursados y totales."""
    if not validar_objectid(alumno_id): return {"error": "alumno_id inválido"}
    return await safe_get(f"{BACKEND_URL}/alumnos/{alumno_id}/creditos")

@tool
async def obtener_datos_alumno(alumno_id: str):
    """Regresa información general: nombre, carrera, promedio."""
    if not validar_objectid(alumno_id): return {"error": "alumno_id inválido"}
    return await safe_get(f"{BACKEND_URL}/alumnos/{alumno_id}/datos")

@tool
async def obtener_horario_completo(alumno_id: str):
    """Devuelve todas las clases organizadas por día."""
    if not validar_objectid(alumno_id): return {"error": "alumno_id inválido"}
    return await safe_get(f"{BACKEND_URL}/alumnos/{alumno_id}/horario")

@tool
async def obtener_clases_por_profesor(entrada: str):
    """Clases de un profesor. Formato: '<id>|<profesor>'"""
    try: alumno_id, profesor = entrada.split("|")
    except: return {"error": "Formato inválido"}
    if not validar_objectid(alumno_id): return {"error": "alumno_id inválido"}
    return await safe_get(f"{BACKEND_URL}/alumnos/{alumno_id}/clases-profesor/{profesor}")

@tool
async def obtener_inscripciones(alumno_id: str):
    """Historial de inscripciones."""
    if not validar_objectid(alumno_id): return {"error": "alumno_id inválido"}
    return await safe_get(f"{BACKEND_URL}/alumnos/{alumno_id}/inscripciones")

@tool
async def obtener_inscripcion_clases(entrada: str):
    """Clases de una inscripción pasada. Formato: '<id_alumno>|<id_inscripcion>'"""
    try: alumno_id, insc_id = entrada.split("|")
    except: return {"error": "Formato inválido"}
    if not validar_objectid(alumno_id) or not validar_objectid(insc_id): return {"error": "IDs inválidos"}
    return await safe_get(f"{BACKEND_URL}/alumnos/{alumno_id}/inscripcion-clases/{insc_id}")

@tool
async def obtener_materia(materia_id: str):
    """Datos de una materia."""
    if not validar_objectid(materia_id): return {"error": "materia_id inválido"}
    return await safe_get(f"{BACKEND_URL}/materias/{materia_id}")

@tool
async def obtener_semestres_cursados(alumno_id: str):
    """Determina semestre actual basado en materias."""
    if not validar_objectid(alumno_id): return {"error": "alumno_id inválido"}
    inscripciones = await safe_get(f"{BACKEND_URL}/alumnos/{alumno_id}/inscripciones")
    
    if isinstance(inscripciones, dict) and "error" in inscripciones: return inscripciones
    if not inscripciones or not isinstance(inscripciones, list): return {"error": "No hay inscripciones"}

    ultima = inscripciones[-1]
    
    if not isinstance(ultima, dict):
        return {"error": "Error en formato de inscripción"}
        
    insc_id = ultima.get("_id")
    
    if not insc_id:
        return {"error": "ID de inscripción no encontrado"}

    clases = await safe_get(f"{BACKEND_URL}/alumnos/{alumno_id}/inscripcion-clases/{insc_id}")
   
    semestres = set()
    
    if not isinstance(clases, list):
        return {"error": "No se pudieron obtener las clases"}

    for c in clases:
        if c.get("estatus", "").lower() in ("inscrito", "inscrita"):
            mat = await safe_get(f"{BACKEND_URL}/materias/{c['idMateria']}")
            if mat and "semestre" in mat: semestres.add(mat["semestre"])
            
    if not semestres: return {"error": "Sin materias activas"}
    return {"principal": max(semestres), "semestres": sorted(list(semestres))}

# Lista exportada
tools = [
    obtener_materias_actuales, obtener_calificaciones, obtener_clases_del_dia,
    obtener_creditos, obtener_datos_alumno, obtener_horario_completo,
    obtener_clases_por_profesor, obtener_inscripciones, obtener_inscripcion_clases,
    obtener_materia, obtener_semestres_cursados
]