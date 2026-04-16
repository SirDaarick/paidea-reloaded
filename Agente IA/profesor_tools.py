# profesor_tools.py (VERSIÓN SEGURA - REPORTE GENERAL)
from langchain.tools import tool
import os
import pymongo
from bson import ObjectId
import datetime

# --- CONEXIÓN ---
URI_SISTEMA = os.environ.get("MONGO_SISTEMA_URI")
if not URI_SISTEMA:
    raise RuntimeError("Falta variable de entorno MONGO_SISTEMA_URI.")
client = pymongo.MongoClient(URI_SISTEMA)
db = client["test"] 

# COLECCIONES
coll_usuarios = db["usuarios"]
coll_clases = db["clases"]
coll_materias = db["materias"]
coll_grupos = db["grupos"]
coll_ets = db["ets"]
coll_insc_clase = db["inscripcionclases"]
coll_inscripcion = db["inscripcions"]
coll_calificaciones = db["calificacions"]
coll_diasemana = db["diasemanas"]
DIAS_SEMANA = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]

# ============================================================
# 🔹 HELPER: Búsqueda segura de Alumno (Triple Check)
# ============================================================
def buscar_usuario_seguro(raw_id):
    """
    Intenta encontrar un usuario en la BD probando 3 estrategias de ID.
    Evita que salga 'None' o 'Desconocido' por errores de formato (String vs ObjectId).
    """
    # 1. Si el ID viene vacío o nulo, no buscamos nada
    if not raw_id: return None
    
    # Intento 1: Búsqueda directa (tal cual viene el dato)
    user = coll_usuarios.find_one({"_id": raw_id})
    
    # Intento 2: Si falló y el ID es texto, intentamos convertirlo a ObjectId
    # (Esto pasa mucho si importaste datos desde un JSON o CSV)
    if not user and isinstance(raw_id, str) and ObjectId.is_valid(raw_id):
        user = coll_usuarios.find_one({"_id": ObjectId(raw_id)})
        
    # Intento 3: Si falló y el ID es un objeto ObjectId, intentamos convertirlo a String
    # (Esto pasa a veces en bases de datos antiguas o migradas)
    if not user and isinstance(raw_id, ObjectId):
        user = coll_usuarios.find_one({"_id": str(raw_id)})
        
    return user

# ============================================================
# 🔹 HELPER: Búsqueda segura de Horario (Triple Check)
# ============================================================
def buscar_dia_seguro(raw_id):
    """Busca en 'diasemana' probando ObjectId y String."""
    if not raw_id: return None
    
    # Debug interno
    # print(f"  > Buscando día con ID: {raw_id} (Tipo: {type(raw_id)})")

    # Intento 1: Directo
    dia = coll_diasemana.find_one({"_id": raw_id})
    
    # Intento 2: Como ObjectId (si viene string)
    if not dia and isinstance(raw_id, str) and ObjectId.is_valid(raw_id):
        dia = coll_diasemana.find_one({"_id": ObjectId(raw_id)})
        
    # Intento 3: Como String (si viene ObjectId)
    if not dia and isinstance(raw_id, ObjectId):
        dia = coll_diasemana.find_one({"_id": str(raw_id)})
        
    return dia
# ============================================================
# 🔹 TOOLS DE PROFESOR
# ============================================================

@tool
async def obtener_datos_profesor(id_mongo: str):
    """Regresa datos generales del profesor."""
    try:
        if not ObjectId.is_valid(id_mongo): return {"error": "ID inválido"}
        profe = coll_usuarios.find_one({"_id": ObjectId(id_mongo)})
        if not profe: return {"error": "Profesor no encontrado"}
        return {
            "nombre": profe.get("nombre"),
            "correo": profe.get("correo"),
            "rfc": profe.get("datosPersonales", {}).get("rfc", "N/A")
        }
    except Exception as e:
        return {"error": f"Error Mongo: {str(e)}"}

@tool
async def obtener_grupos_asignados(id_mongo: str):
    """Obtiene las CLASES asignadas para ver horarios y salones."""
    try:
        if not ObjectId.is_valid(id_mongo): return {"error": "ID inválido"}
        clases = list(coll_clases.find({"idProfesor": ObjectId(id_mongo)}))
        if not clases: return "No tienes grupos asignados."
            
        resultados = []
        for clase in clases:
            materia = coll_materias.find_one({"_id": clase.get("idMateria")})
            grupo = coll_grupos.find_one({"_id": clase.get("idGrupo")})
            resultados.append({
                "id_clase": str(clase["_id"]),
                "materia": materia.get("nombre", "N/A") if materia else "N/A",
                "grupo": grupo.get("nombre", "N/A") if grupo else "N/A",
                "salon": clase.get("salon")
            })
        return resultados
    except Exception as e:
        return {"error": f"Error: {str(e)}"}

@tool
async def obtener_lista_alumnos(id_clase: str):
    """
    Obtiene la lista completa de alumnos inscritos en una clase.
    Devuelve JSON estructurado con Nombre y Boleta.
    """
    try:
        if not ObjectId.is_valid(id_clase): return {"error": "ID de clase inválido"}
        
        # 1. Buscar relaciones
        relaciones = list(coll_insc_clase.find({"idClase": ObjectId(id_clase)}))
        if not relaciones: return "Clase sin alumnos inscritos."

        alumnos_list = []
        for rel in relaciones:
            # 2. Buscar Inscripción Global
            insc = coll_inscripcion.find_one({"_id": rel.get("idInscripcion")})
            if not insc: continue
            
            # 3. Buscar Alumno (Usando el Helper Seguro)
            alum = buscar_usuario_seguro(insc.get("idAlumno"))
            
            if alum:
                alumnos_list.append({
                    "nombre": alum.get("nombre", "Sin Nombre"),
                    "boleta": alum.get("boleta", "S/B"),
                    "correo": alum.get("correo", "N/A")
                })
        
        return alumnos_list if alumnos_list else "No se encontraron alumnos activos."
    except Exception as e:
        return {"error": f"Error: {str(e)}"}

@tool
async def obtener_reporte_promedios_profesor(id_profesor: str):
    """
    Genera un reporte de promedios de TODOS los grupos del profesor.
    Usa solo el ID del profesor por seguridad.
    """
    try:
        if not ObjectId.is_valid(id_profesor): return {"error": "ID de profesor inválido"}

        print(f"📊 Generando reporte para Profe ID: {id_profesor}")

        # 1. SEGURIDAD: Buscamos SOLO las clases que pertenecen a este profesor
        mis_clases = list(coll_clases.find({"idProfesor": ObjectId(id_profesor)}))
        
        if not mis_clases:
            return "No tienes clases asignadas, por lo tanto no hay promedios."

        reporte_final = []

        # 2. Iteramos sobre CADA clase del profesor
        for clase in mis_clases:
            # Obtener nombres para el reporte
            mat = coll_materias.find_one({"_id": clase.get("idMateria")})
            grup = coll_grupos.find_one({"_id": clase.get("idGrupo")})
            nombre_mat = mat.get("nombre", "Materia ???") if mat else "???"
            nombre_grup = grup.get("nombre", "Grupo ???") if grup else "???"
            
            # --- LÓGICA DE PROMEDIO (Interna) ---
            registros = list(coll_insc_clase.find({"idClase": clase["_id"]}))
            ids_inscripciones = [doc["_id"] for doc in registros]
            
            califs = list(coll_calificaciones.find({
                "idInscripcionClase": {"$in": ids_inscripciones}
            }))

            # Cálculo matemático
            suma = 0
            count = 0
            for c in califs:
                try:
                    suma += float(c.get("valor", 0))
                    count += 1
                except: pass
            
            promedio = round(suma / count, 2) if count > 0 else 0.0
            estado = "Sin calificaciones" if count == 0 else f"Promedio: {promedio}"

            reporte_final.append({
                "materia": nombre_mat,
                "grupo": nombre_grup,
                "alumnos_evaluados": count,
                "resultado": estado
            })

        return reporte_final

    except Exception as e:
        return {"error": f"Error generando reporte: {str(e)}"}

@tool
async def obtener_asignacion_ets(id_mongo: str):
    """
    Obtiene los exámenes ETS asignados al profesor, incluyendo Salón y HORARIO.
    """
    try:
        if not ObjectId.is_valid(id_mongo): return {"error": "ID inválido"}
        ets_list = list(coll_ets.find({"idProfesor": ObjectId(id_mongo)}))
        
        if not ets_list: return "No tienes ETS asignados actualmente."
        
        res = []
        for ex in ets_list:
            mat = coll_materias.find_one({"_id": ex.get("idMateria")})
            nombre_mat = mat.get("nombre") if mat else "N/A"
            salon = ex.get("salon", "Por definir")
            
            # --- LÓGICA DE HORARIO PARA ETS ---
            horario_txt = "Horario pendiente"
            
            # Caso A: El ETS tiene un 'idDia' apuntando a 'diasemanas'
            if ex.get("idDia"):
                obj_h = buscar_dia_seguro(ex["idDia"])
                if obj_h:
                    horario_txt = f"{obj_h.get('horarioInicio')} - {obj_h.get('horarioFinal')}"
            
            # Caso B: El ETS tiene fecha/hora escrita directamente (común en exámenes únicos)
            elif ex.get("fecha") or ex.get("hora"):
                fecha = ex.get("fecha", "") # Puede ser string ISO o texto
                hora = ex.get("hora", "")
                horario_txt = f"{fecha} {hora}".strip()

            # Caso C: Tiene turno
            elif ex.get("turno"):
                 horario_txt = f"Turno {ex.get('turno')}"

            res.append({
                "materia": nombre_mat, 
                "salon": salon, 
                "horario": horario_txt,
                "tipo": "Examen a Título de Suficiencia"
            })
            
        return res
    except Exception as e:
        return {"error": f"Error ETS: {str(e)}"}
    
@tool
async def obtener_horario_hoy_profesor(id_profesor: str):
    """
    Devuelve las clases de HOY (ajustado a hora México).
    Busca horas en 'diasemanas' y retorna la lista directa para evitar preguntas innecesarias del bot.
    """
    try:
        if not ObjectId.is_valid(id_profesor): return {"error": "ID inválido"}
        
        # 1. Ajuste de Zona Horaria (México -6h) para asegurar el día correcto
        utc_now = datetime.datetime.utcnow()
        mex_time = utc_now - datetime.timedelta(hours=6)
        hoy_idx = mex_time.weekday()
        hoy_nombre = DIAS_SEMANA[hoy_idx] 
        
        # Debug para ti (opcional)
        # print(f"Dia detectado: {hoy_nombre}")

        clases = list(coll_clases.find({"idProfesor": ObjectId(id_profesor)}))
        agenda = []

        for clase in clases:
            # Buscar configuración específica del día de HOY
            info_dia = clase.get("horario", {}).get(hoy_nombre, {})
            
            # Verificamos si tiene clase hoy (idDia no nulo)
            if info_dia and isinstance(info_dia, dict) and info_dia.get("idDia"):
                
                # --- BUSCAMOS LA HORA EN DIASEMANAS ---
                obj_horario = buscar_dia_seguro(info_dia["idDia"])
                
                if obj_horario:
                    inicio = obj_horario.get("horarioInicio", "?")
                    fin = obj_horario.get("horarioFinal", "?")
                    
                    mat = coll_materias.find_one({"_id": clase.get("idMateria")})
                    grup = coll_grupos.find_one({"_id": clase.get("idGrupo")})
                    
                    nombre_materia = mat.get("nombre", "Materia ???") if mat else "Materia ???"
                    nombre_grupo = grup.get("nombre", "G???") if grup else "G???"
                    
                    agenda.append({
                        "materia": nombre_materia,
                        "grupo": nombre_grupo,
                        "salon": clase.get("salon", "Sin Salón"),
                        "horario": f"{inicio} - {fin}"
                    })
                    
        if not agenda:
            return f"Hoy es {hoy_nombre.capitalize()} y NO tienes clases programadas en tu horario. Día libre."
            
        # Ordenamos por hora de inicio
        agenda.sort(key=lambda x: x["horario"])
        
        return {
            "mensaje": f"Aquí tienes tu horario para hoy {hoy_nombre.capitalize()}:",
            "clases": agenda
        }

    except Exception as e:
        return {"error": str(e)}
    
@tool
async def identificar_alumnos_riesgo(id_profesor: str):
    """
    Analiza los grupos del profesor y detecta alumnos con promedio < 6.0.
    Ruta: Clases -> InscripcionClases -> Inscripcions -> Usuarios.
    Incluye corrección de IDs para evitar 'Alumno Desconocido'.
    """
    try:
        if not ObjectId.is_valid(id_profesor): return {"error": "ID de profesor inválido"}
        
        # 1. Traer todas las clases del profesor
        mis_clases = list(coll_clases.find({"idProfesor": ObjectId(id_profesor)}))
        if not mis_clases: return "No tienes clases asignadas para analizar."

        alumnos_riesgo = []
        # print(f"🔍 Analizando {len(mis_clases)} clases...") # Descomentar para depurar

        for clase in mis_clases:
            # --- Obtener nombres de Materia y Grupo (para el reporte) ---
            mat = coll_materias.find_one({"_id": clase.get("idMateria")})
            nombre_materia = mat.get("nombre", "Materia ???") if mat else "Materia ???"
            
            grup = coll_grupos.find_one({"_id": clase.get("idGrupo")})
            nombre_grupo = grup.get("nombre", "G???") if grup else "G???"

            # 2. Buscar lista de inscripciones en esta clase (coll_inscripcionclases)
            relaciones_inscripcion = list(coll_insc_clase.find({"idClase": clase["_id"]}))
            
            for relacion in relaciones_inscripcion:
                # ID de la relación inscripcion-clase (usado para buscar calificaciones)
                id_relacion = relacion["_id"]

                # 3. Buscar calificaciones (coll_calificacions)
                califs = list(coll_calificaciones.find({"idInscripcionClase": id_relacion}))
                
                # Si no hay calificaciones, saltamos (no podemos determinar riesgo aún)
                if not califs: continue 

                # 4. Cálculo matemático del promedio
                suma = 0.0
                count = 0
                for c in califs:
                    try:
                        # Aseguramos convertir a float, por si viene como int o string
                        val = float(c.get("valor", 0))
                        suma += val
                        count += 1
                    except: pass
                
                promedio = suma / count if count > 0 else 0.0

                # 5. DETECCIÓN: Si el promedio es reprobatorio
                if promedio < 6.0:
                    # --- AQUÍ EMPIEZA LA CORRECCIÓN DE "DESCONOCIDO" ---
                    
                    # A. Buscar la inscripción global (coll_inscripcions)
                    insc_global = coll_inscripcion.find_one({"_id": relacion.get("idInscripcion")})
                    
                    nombre_alumno = "Desconocido"
                    correo_alumno = "N/A"
                    
                    if insc_global and "idAlumno" in insc_global:
                        raw_id_alumno = insc_global["idAlumno"]
                        alumno = None

                        # B. Triple intento de búsqueda de usuario (Blindaje de IDs)
                        # Intento 1: Buscar tal cual viene (ObjectId o String)
                        alumno = coll_usuarios.find_one({"_id": raw_id_alumno})

                        # Intento 2: Si falló y es string, convertir a ObjectId
                        if not alumno and isinstance(raw_id_alumno, str) and ObjectId.is_valid(raw_id_alumno):
                            alumno = coll_usuarios.find_one({"_id": ObjectId(raw_id_alumno)})
                        
                        # Intento 3: Si falló y es ObjectId, convertir a String (casos raros)
                        if not alumno and isinstance(raw_id_alumno, ObjectId):
                            alumno = coll_usuarios.find_one({"_id": str(raw_id_alumno)})

                        # C. Asignar datos si se encontró
                        if alumno:
                            nombre_alumno = alumno.get("nombre", "Sin Nombre")
                            correo_alumno = alumno.get("correo", "N/A")
                        else:
                            # Log para depuración si sigue saliendo desconocido
                            print(f"⚠️ No se encontró usuario en colección. ID buscado: {raw_id_alumno}")

                    # 6. Agregar al reporte final
                    alumnos_riesgo.append({
                        "alumno": nombre_alumno,
                        "correo": correo_alumno,
                        "grupo": nombre_grupo,
                        "materia": nombre_materia,
                        "promedio_actual": round(promedio, 2),
                        "situacion": "Reprobando"
                    })

        if not alumnos_riesgo:
            return "✅ Análisis completado: No se encontraron alumnos con promedio reprobatorio."
        
        return alumnos_riesgo

    except Exception as e:
        return {"error": f"Error interno analizando riesgo: {str(e)}"}


@tool
async def verificar_avance_calificaciones(id_profesor: str):
    """
    Revisa qué porcentaje de alumnos han sido evaluados en cada grupo.
    Útil para saber si faltan calificaciones por subir.
    """
    try:
        if not ObjectId.is_valid(id_profesor): return {"error": "ID inválido"}
        
        mis_clases = list(coll_clases.find({"idProfesor": ObjectId(id_profesor)}))
        if not mis_clases: return "No tienes clases asignadas."

        reporte_avance = []

        for clase in mis_clases:
            # Contexto
            mat = coll_materias.find_one({"_id": clase.get("idMateria")})
            grup = coll_grupos.find_one({"_id": clase.get("idGrupo")})
            nombre_materia = mat.get("nombre", "N/A") if mat else "N/A"
            nombre_grupo = grup.get("nombre", "N/A") if grup else "N/A"

            # 1. Total de alumnos inscritos (Expectativa)
            rels = list(coll_insc_clase.find({"idClase": clase["_id"]}))
            total_alumnos = len(rels)

            if total_alumnos == 0:
                reporte_avance.append({
                    "materia": nombre_materia,
                    "grupo": nombre_grupo,
                    "estado": "Sin alumnos inscritos"
                })
                continue

            # 2. Total de alumnos con calificación (Realidad)
            # Buscamos cuántas de esas inscripciones tienen registro en 'calificacions'
            ids_rels = [r["_id"] for r in rels]
            con_calificacion = coll_calificaciones.count_documents({
                "idInscripcionClase": {"$in": ids_rels}
            })

            # 3. Cálculo de porcentaje
            faltantes = total_alumnos - con_calificacion
            porcentaje = int((con_calificacion / total_alumnos) * 100)

            estado_txt = "✅ Completo" if faltantes == 0 else f"⚠️ Faltan {faltantes}"

            reporte_avance.append({
                "materia": nombre_materia,
                "grupo": nombre_grupo,
                "avance": f"{con_calificacion}/{total_alumnos} ({porcentaje}%)",
                "estado": estado_txt
            })
            
        return reporte_avance

    except Exception as e:
        return {"error": str(e)}

@tool
async def obtener_horario_semanal(id_profesor: str):
    """
    Devuelve el horario semanal buscando las horas en la colección 'diasemana'.
    Versión con DEBUG para encontrar errores.
    """
    try:
        if not ObjectId.is_valid(id_profesor): return {"error": "ID inválido"}
        
        print(f"\n🐛 DEBUG SEMANAL: Buscando clases para profe {id_profesor}")
        clases = list(coll_clases.find({"idProfesor": ObjectId(id_profesor)}))
        
        if not clases: 
            print("🐛 DEBUG: No se encontraron documentos en 'clases'.")
            return "No hay clases asignadas."

        agenda_semanal = {dia: [] for dia in DIAS_SEMANA} 
        clases_encontradas = 0

        for clase in clases:
            # Datos básicos
            mat = coll_materias.find_one({"_id": clase.get("idMateria")})
            nombre_materia = mat.get("nombre", "Materia ???") if mat else "Materia ???"
            horario_full = clase.get("horario", {})
            
            print(f"🐛 DEBUG: Revisando clase '{nombre_materia}' (ID: {clase['_id']})")
            print(f"   -> Estructura horario: {horario_full}")

            for dia in DIAS_SEMANA:
                info_dia = horario_full.get(dia)
                
                # Validamos si existe referencia
                if info_dia and isinstance(info_dia, dict) and info_dia.get("idDia"):
                    raw_id = info_dia["idDia"]
                    print(f"   -> Encontrado {dia}: idDia={raw_id}")
                    
                    obj_horario = buscar_dia_seguro(raw_id)
                    
                    if obj_horario:
                        inicio = obj_horario.get("horarioInicio", "?")
                        fin = obj_horario.get("horarioFinal", "?")
                        print(f"      -> ¡ÉXITO! Hora: {inicio}-{fin}")
                        
                        agenda_semanal[dia].append({
                            "materia": nombre_materia,
                            "hora": f"{inicio} - {fin}",
                            "salon": clase.get("salon", "Sin Salón")
                        })
                        clases_encontradas += 1
                    else:
                        print(f"      -> ❌ ERROR: El idDia {raw_id} NO EXISTE en la colección 'diasemana'.")

        # Formatear respuesta
        agenda_final = []
        dias_ordenados = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]
        
        for dia in dias_ordenados:
            bloques = agenda_semanal.get(dia, [])
            if bloques:
                bloques.sort(key=lambda x: x["hora"])
                agenda_final.append({"dia": dia.capitalize(), "clases": bloques})
        
        if not agenda_final:
            return "No se encontró horario. (Revisa la consola para ver los logs de DEBUG)."
            
        return agenda_final

    except Exception as e:
        print(f"❌ ERROR CRÍTICO: {str(e)}")
        return {"error": f"Error procesando horario: {str(e)}"}
    
@tool
async def identificar_top_estudiantes(id_profesor: str):
    """
    Identifica a los alumnos con promedio >= 9.0 en los grupos del profesor.
    Útil para recomendaciones, cuadro de honor o proyectos.
    """
    try:
        if not ObjectId.is_valid(id_profesor): return {"error": "ID inválido"}
        
        mis_clases = list(coll_clases.find({"idProfesor": ObjectId(id_profesor)}))
        cuadro_honor = []

        for clase in mis_clases:
            mat = coll_materias.find_one({"_id": clase.get("idMateria")})
            nombre_materia = mat.get("nombre") if mat else "Materia??"
            
            rels = list(coll_insc_clase.find({"idClase": clase["_id"]}))
            
            for rel in rels:
                califs = list(coll_calificaciones.find({"idInscripcionClase": rel["_id"]}))
                if not califs: continue 

                suma = sum([float(c.get("valor", 0)) for c in califs])
                promedio = suma / len(califs)

                # CRITERIO DE EXCELENCIA
                if promedio >= 9.0:
                    insc_global = coll_inscripcion.find_one({"_id": rel.get("idInscripcion")})
                    if insc_global:
                        alum = buscar_usuario_seguro(insc_global.get("idAlumno"))
                        if alum:
                            cuadro_honor.append({
                                "alumno": alum.get("nombre"),
                                "boleta": alum.get("boleta", "S/B"),
                                "materia": nombre_materia,
                                "promedio_final": round(promedio, 2),
                                "destacado": "⭐ Excelencia"
                            })
        
        # Ordenamos de mayor promedio a menor
        cuadro_honor.sort(key=lambda x: x["promedio_final"], reverse=True)
        
        return cuadro_honor if cuadro_honor else "No hay alumnos con promedio superior a 9.0 aún."
    except Exception as e:
        return {"error": str(e)}
    
@tool
async def consultar_alumno_especifico(id_profesor: str, busqueda: str):
    """
    [NUEVA] Busca un alumno por NOMBRE o BOLETA en todos tus grupos.
    Útil cuando preguntan: "¿Cómo va Juan?", "¿Qué calificación tiene la boleta 2023...?"
    ARGS:
    - id_profesor: El ID de mongo del profesor actual.
    - busqueda: El nombre (o parte del nombre) o número de boleta a buscar.
    """
    try:
        if not ObjectId.is_valid(id_profesor): return {"error": "ID profesor inválido"}
        
        # Normalizamos la búsqueda (minúsculas y sin espacios extra)
        busqueda_str = str(busqueda).lower().strip()
        
        # 1. Obtenemos todas las clases del profesor
        mis_clases = list(coll_clases.find({"idProfesor": ObjectId(id_profesor)}))
        if not mis_clases: return "No tienes clases para buscar alumnos."

        resultados = []

        # 2. Recorremos clase por clase
        for clase in mis_clases:
            # Datos visuales de la materia y grupo
            mat = coll_materias.find_one({"_id": clase.get("idMateria")})
            nombre_materia = mat.get("nombre", "Materia??") if mat else "Materia??"
            
            grup = coll_grupos.find_one({"_id": clase.get("idGrupo")})
            nombre_grupo = grup.get("nombre", "G??") if grup else "G??"
            
            # 3. Buscamos en la lista de asistencia de esa clase
            rels = list(coll_insc_clase.find({"idClase": clase["_id"]}))
            
            for rel in rels:
                # Obtenemos la inscripción global (OJO con el nombre de tu colección: inscripcions)
                insc_global = coll_inscripcion.find_one({"_id": rel.get("idInscripcion")})
                if not insc_global: continue
                
                # Usamos el helper seguro para encontrar al alumno
                alumno = buscar_usuario_seguro(insc_global.get("idAlumno"))
                if not alumno: continue

                # 4. Verificamos si coincide con la búsqueda (Nombre o Boleta)
                nombre_real = str(alumno.get("nombre", "")).lower()
                boleta_real = str(alumno.get("boleta", ""))
                
                # Si el texto buscado está en el nombre O en la boleta...
                if busqueda_str in nombre_real or busqueda_str in boleta_real:
                    
                    # 5. ¡Encontrado! Buscamos sus notas en esta materia
                    califs = list(coll_calificaciones.find({"idInscripcionClase": rel["_id"]}))
                    notas = [float(c.get("valor", 0)) for c in califs]
                    promedio = sum(notas)/len(notas) if notas else 0.0

                    # 6. Guardamos el resultado
                    resultados.append({
                        "alumno": alumno.get("nombre"),
                        "boleta": alumno.get("boleta", "S/B"),
                        "materia": nombre_materia,
                        "grupo": nombre_grupo,
                        "promedio": round(promedio, 2),
                        "notas_parciales": notas
                    })

        if not resultados:
            return f"No encontré a nadie que coincida con '{busqueda}' en tus listas."
        
        return resultados

    except Exception as e:
        return {"error": f"Error buscando alumno: {str(e)}"}
    

# LISTA FINAL
tools = [
    obtener_datos_profesor,
    obtener_grupos_asignados,
    obtener_lista_alumnos,
    consultar_alumno_especifico,
    identificar_alumnos_riesgo,
    obtener_reporte_promedios_profesor,
    obtener_horario_hoy_profesor,
    obtener_asignacion_ets,
    # --- NUEVAS ---
    verificar_avance_calificaciones,
    obtener_horario_semanal,
    identificar_top_estudiantes
]