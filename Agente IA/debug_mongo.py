import os
import pymongo
import numpy as np

# --- TUS CREDENCIALES ---
MONGO_CONNECTION_STRING = os.environ.get("MONGO_RAG_URI")
if not MONGO_CONNECTION_STRING:
    raise RuntimeError("Falta variable de entorno MONGO_RAG_URI.")
DATABASE_NAME = "Base_Conocimiento"
COLLECTION_NAME = "reglamentos_embeddings_v2"

client = pymongo.MongoClient(MONGO_CONNECTION_STRING)
collection = client[DATABASE_NAME][COLLECTION_NAME]

print("🔍 Iniciando escaneo de la base de datos...")

documentos = list(collection.find({}, {"embedding_vector": 1}))
print(f"📄 Total de documentos encontrados: {len(documentos)}")

errores = 0
correctos = 0

for i, doc in enumerate(documentos):
    vec = doc.get("embedding_vector")
    
    # Caso 1: Es None
    if vec is None:
        print(f"❌ Error en índice {i}: El vector es NULL. ID: {doc.get('_id')}")
        errores += 1
        continue

    # Caso 2: No es una lista (es string, int, etc)
    if not isinstance(vec, list):
        print(f"❌ Error en índice {i}: Tipo incorrecto ({type(vec)}). ID: {doc.get('_id')}")
        errores += 1
        continue
        
    # Caso 3: Longitud incorrecta
    if len(vec) != 768:
        print(f"❌ Error en índice {i}: Longitud extraña ({len(vec)}). ID: {doc.get('_id')}")
        errores += 1
        continue
    
    # Caso 4: Elementos dentro de la lista no son números (ej. strings o listas anidadas)
    try:
        arr = np.array(vec, dtype=np.float32)
        if arr.ndim != 1:
             print(f"❌ Error en índice {i}: Dimensión incorrecta ({arr.ndim}D). Posible lista anidada. ID: {doc.get('_id')}")
             errores += 1
             continue
    except Exception as e:
        print(f"❌ Error en índice {i}: No se pudo convertir a float. ID: {doc.get('_id')}")
        errores += 1
        continue

    correctos += 1

print("-" * 30)
print(f"✅ Documentos sanos: {correctos}")
print(f"❌ Documentos corruptos: {errores}")