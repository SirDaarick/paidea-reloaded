import os
import pymongo
from bson import ObjectId
import unicodedata

# --- CONEXIÓN ÚNICA ---
URI_SISTEMA = os.environ.get("MONGO_SISTEMA_URI")
if not URI_SISTEMA:
    raise RuntimeError("Falta variable de entorno MONGO_SISTEMA_URI.")
DB_SISTEMA = "test"
COLL_USUARIOS = "usuarios"

client = pymongo.MongoClient(URI_SISTEMA)
db = client[DB_SISTEMA] 
# Esta variable es la que usan tus funciones de test de carrera
db_sistema = db 
coll_usuarios = db[COLL_USUARIOS]

print("✅ Módulo query_db conectado a MongoDB Usuarios")

# --- UTILERÍA ---
def buscar_usuario_sistema(entrada_usuario: str):
    """
    Busca usuario por Boleta, Correo o RFC (ubicado en datosPersonales).
    """
    if not entrada_usuario: return None

    entrada_usuario = str(entrada_usuario).strip()
    print(f"🔍 query_db buscando: '{entrada_usuario}'")
    
    # 1. Lista de condiciones para buscar texto exacto
    condiciones = [
        {"correo": entrada_usuario},
        {"datosPersonales.rfc": entrada_usuario}, # <--- ¡ESTA ES LA CLAVE!
        {"rfc": entrada_usuario},      # Por si acaso en algunos está en la raíz
        {"boleta": entrada_usuario}    # Por si la boleta es string
    ]
    
    # 2. Si son puros números, agregamos búsqueda como Entero (para Boletas)
    if entrada_usuario.isdigit():
        condiciones.append({"boleta": int(entrada_usuario)})

    query = { "$or": condiciones }
    
    try:
        usuario = coll_usuarios.find_one(query)

        if not usuario:
            print("❌ No se encontró en Mongo.")
            return None

        # 3. Extraemos rol y nombre
        rol = usuario.get("rol", "Alumno")
        nombre = usuario.get("nombre", "Usuario")
        
        # Corrección: Mongo devuelve _id como ObjectId, lo pasamos a string
        return {
            "mongo_id": str(usuario["_id"]), 
            "rol": rol,
            "nombre": nombre
        }
    except Exception as e:
        print(f"❌ Error en consulta Mongo: {e}")
        return None

def normalizar_texto(texto):
    if not texto: return ""
    return ''.join(c for c in unicodedata.normalize('NFD', texto)
                   if unicodedata.category(c) != 'Mn').lower()

def obtener_id_carrera(usuario_id_str):
    print(f"\n🔍 Buscando usuario con ID: {usuario_id_str}")
    try:
        oid = ObjectId(usuario_id_str)
        usuario = db["usuarios"].find_one({"_id": oid})
        
        # --- DEBUG: IMPRIMIR DATOS DEL ALUMNO ---
        if usuario:
            print(f"Usuario encontrado: {usuario.get('nombre', 'Sin Nombre')}")
            print(f"Datos completos del usuario:\n{usuario}")
            
            if "dataAlumno" in usuario:
                id_carrera = usuario["dataAlumno"].get("idCarrera")
                print(f"🎓 Carrera detectada (ID): {id_carrera}")
                return id_carrera
            else:
                print("❌ El usuario existe pero no tiene el campo 'dataAlumno'.")
        else:
            print("❌ No se encontró ningún usuario con ese ID en la colección 'usuarios'.")
            
    except Exception as e:
        print(f"❌ Error obteniendo carrera: {e}")
    return None

def obtener_materias_por_carrera(carrera_id):
    print(f"\n📚 Buscando materias para la carrera ID: {carrera_id}")
    catalogo = {}
    
    # Filtramos en MongoDB usando el campo 'idCarrera'
    cursor = db["materias"].find({"idCarrera": carrera_id})
    lista_materias = list(cursor) # Convertimos a lista para poder contar
    
    print(f"🔢 Se encontraron {len(lista_materias)} documentos en la colección 'materias' con ese idCarrera.")

    for doc in lista_materias:
        nombre_limpio = normalizar_texto(doc.get("nombre", ""))
        if nombre_limpio:
            catalogo[nombre_limpio] = {
                "nombre": doc.get("nombre"),
                "creditos": doc.get("creditos")
            }
    return catalogo

# --- BLOQUE PRINCIPAL CORREGIDO ---
if __name__ == "__main__":
    print("=== INICIANDO PRUEBA DE CONEXIÓN ===")
    
    # PASO 1: Obtener el ID de la carrera primero
    id_carrera_encontrado = obtener_id_carrera(usuario_id)
    
    if id_carrera_encontrado:
        # PASO 2: Usar ese ID de carrera para buscar las materias
        resultado = obtener_materias_por_carrera(id_carrera_encontrado)
        
        print(f"\n✅ Total materias procesadas en el catálogo: {len(resultado)}")
        
        if resultado:
            primera_llave = list(resultado.keys())[0]
            print(f"Ejemplo: {primera_llave} -> {resultado[primera_llave]['nombre']}")
    else:
        print("\n⛔ No se puede buscar materias porque no se encontró la carrera del alumno.")
        
    print(buscar_usuario_sistema("2023000000"))