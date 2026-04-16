# Asegúrate de tener activo tu entorno virtual (.venv)
# Asegúrate de haber corrido: pip install pymongo

import pymongo
# --- CORRECCIÓN AQUÍ: Importamos los errores explícitamente ---
from pymongo.errors import ConfigurationError, ConnectionFailure, BulkWriteError
import json
import os
import sys
import time

def load_embeddings_from_json(filepath):
    """Carga datos con embeddings (lista de diccionarios) desde un archivo JSON."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: Archivo no encontrado en {filepath}")
        return None
    except json.JSONDecodeError:
        print(f"Error: El archivo {filepath} no contiene JSON válido.")
        return None
    except Exception as e:
        print(f"Error cargando embeddings desde {filepath}: {e}")
        return None

# --- Configuration ---
MONGO_CONNECTION_STRING = os.environ.get("MONGO_RAG_URI")
if not MONGO_CONNECTION_STRING:
    print("Error: Falta la variable de entorno MONGO_RAG_URI.")
    sys.exit(1)
DATABASE_NAME = "Base_Conocimiento"
COLLECTION_NAME = "reglamentos_embeddings_v3"

# Directorios
script_directory = os.path.dirname(os.path.abspath(sys.argv[0]))
input_directory = script_directory # Donde están los *_embeddings.json

# Lista de archivos JSON a cargar
embedding_files_to_load = [
    #"becas_embeddings.json",
    #"dictamen_embeddings.json",
    "plan_IIA_embeddings.json",
    "plan_ISC_embeddings.json",
    "plan_LCD_embeddings.json",
    #"reglamento_general_embeddings.json",
    #"reglamento_embeddings.json"
]

# --- Connect to MongoDB Atlas ---
print("Conectando a MongoDB Atlas...")
try:
    client = pymongo.MongoClient(MONGO_CONNECTION_STRING)
    # Ping the server to confirm connection
    client.admin.command('ping')
    print("Conexión a MongoDB Atlas exitosa!")
    db = client[DATABASE_NAME]
    collection = db[COLLECTION_NAME]
# --- CORRECCIÓN: Usamos los nombres directos de los errores ---
except ConfigurationError as e:
     print(f"Error de configuración de MongoDB: Verifica tu cadena de conexión. Detalles: {e}")
     sys.exit(1)
except ConnectionFailure as e:
    print(f"No se pudo conectar a MongoDB Atlas. Verifica tu conexión a internet, la cadena de conexión y la lista blanca de IP. Error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Ocurrió un error inesperado al conectar a MongoDB: {e}")
    sys.exit(1)

# --- Main Loading Loop ---
print("\nIniciando carga de datos a MongoDB...")
total_start_time = time.time()
total_docs_inserted = 0

for embedding_file in embedding_files_to_load:
    input_filepath = os.path.join(input_directory, embedding_file)
    print(f"\nProcesando archivo: {embedding_file}")

    # 1. Load data from JSON
    embeddings_data = load_embeddings_from_json(input_filepath)
    if not embeddings_data:
        print(f"Omitiendo archivo {embedding_file} debido a error de carga.")
        continue

    # 2. Insert into MongoDB
    if isinstance(embeddings_data, list) and len(embeddings_data) > 0:
        print(f"Insertando {len(embeddings_data)} documentos desde {embedding_file}...")
        start_time = time.time()
        try:
            # Insert the list of dictionaries directly
            result = collection.insert_many(embeddings_data, ordered=False) # ordered=False continues on errors
            inserted_count = len(result.inserted_ids)
            total_docs_inserted += inserted_count
            end_time = time.time()
            print(f"Se insertaron {inserted_count} documentos en {end_time - start_time:.2f} segundos.")
        # --- CORRECCIÓN: Usamos el nombre directo del error ---
        except BulkWriteError as bwe:
            # Handle potential errors during insertion (e.g., duplicate keys if you run it twice)
            print(f"Errores de escritura en lote: {bwe.details}")
            # Still count successful inserts if ordered=False
            total_docs_inserted += bwe.details.get('nInserted', 0)
            print(f"Se insertaron {bwe.details.get('nInserted', 0)} documentos antes del error.")
        except Exception as e:
            print(f"Ocurrió un error al insertar datos desde {embedding_file}: {e}")
    elif isinstance(embeddings_data, list) and len(embeddings_data) == 0:
         print(f"El archivo {embedding_file} está vacío. No hay documentos para insertar.")
    else:
        print(f"El archivo {embedding_file} no contiene una lista válida de documentos. Omitiendo.")


# --- Close Connection ---
print("\nCerrando conexión a MongoDB...")
client.close()
print("Conexión cerrada.")

total_end_time = time.time()
print(f"\nProceso total de carga completado en {total_end_time - total_start_time:.2f} segundos.")
print(f"Total de documentos insertados: {total_docs_inserted}")