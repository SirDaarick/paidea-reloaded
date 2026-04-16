# Make sure your virtual environment (.venv) is active
# Ensure you have run: pip install sentence-transformers torch

from sentence_transformers import SentenceTransformer
import json
import os
import sys
import time # To estimate processing time

def load_chunks_from_json(filepath):
    """Loads chunk data (list of dictionaries) from a JSON file."""
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
        print(f"Error cargando chunks desde {filepath}: {e}")
        return None

def save_embeddings_to_json(embeddings_data, output_filename):
    """Guarda los datos con embeddings (lista de diccionarios) en un archivo JSON."""
    try:
        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(embeddings_data, f, ensure_ascii=False, indent=2)
        print(f"Embeddings guardados exitosamente en {output_filename}")
    except Exception as e:
        print(f"Error guardando embeddings en {output_filename}: {e}")

# --- Configuration ---
# Use a pre-trained model. 'all-MiniLM-L6-v2' is good for English/Spanish mix, fast, 384 dimensions.
# 'paraphrase-multilingual-mpnet-base-v2' is larger but potentially better for multilingual (768 dimensions).
#MODEL_NAME = 'all-MiniLM-L6-v2'
MODEL_NAME = 'paraphrase-multilingual-mpnet-base-v2' # Alternative

# Determine directories
script_directory = os.path.dirname(os.path.abspath(sys.argv[0]))
input_directory = script_directory # Where *_chunks.json files are
output_directory = script_directory # Where *_embeddings.json files will be saved

# List of JSON files containing the text chunks
chunk_files_to_process = [
    #"becas_chunks.json",
    #"dictamen_chunks.json",
    "plan_IIA_chunks.json",
    "plan_ISC_chunks.json",
    "plan_LCD_chunks.json",
    #"reglamento_general_chunks.json",
    #"reglamento_chunks.json"
]


# --- Load Embedding Model ---
print(f"Cargando el modelo de embedding: {MODEL_NAME}...")
# This might take a moment the first time as it downloads the model
try:
    model = SentenceTransformer(MODEL_NAME)
    print("Modelo cargado exitosamente.")
except Exception as e:
    print(f"Error al cargar el modelo '{MODEL_NAME}'. Asegúrate de tener conexión a internet la primera vez y que PyTorch esté instalado. Error: {e}")
    sys.exit(1) # Exit if model fails to load

# --- Main Processing Loop ---
print("\nIniciando generación de embeddings...")
total_start_time = time.time()

for chunk_file in chunk_files_to_process:
    input_filepath = os.path.join(input_directory, chunk_file)
    print(f"\nProcesando archivo: {chunk_file}")

    # 1. Load Chunks
    chunks_data = load_chunks_from_json(input_filepath)
    if not chunks_data:
        print(f"Omitiendo archivo {chunk_file} debido a error de carga.")
        continue

    # 2. Generate Embeddings for all chunks in the file
    print(f"Generando embeddings para {len(chunks_data)} chunks...")
    start_time = time.time()

    # Extract just the text parts to process them potentially faster in a batch
    texts_to_embed = [chunk['text'] for chunk in chunks_data if 'text' in chunk]

    if not texts_to_embed:
        print(f"No se encontró texto para generar embeddings en {chunk_file}. Omitiendo.")
        continue

    # Generate embeddings (model.encode can take a list of strings)
    embeddings = model.encode(texts_to_embed, show_progress_bar=True)
    end_time = time.time()
    print(f"Embeddings generados en {end_time - start_time:.2f} segundos.")

    # 3. Add Embeddings back to the dictionaries
    # Ensure the number of embeddings matches the number of texts extracted
    if len(embeddings) == len(texts_to_embed):
        updated_chunks_data = []
        embedding_index = 0
        for chunk in chunks_data:
             # Check if this chunk originally had text
             if 'text' in chunk:
                 # Convert numpy array (if it is) to a standard Python list for JSON
                 chunk['embedding_vector'] = embeddings[embedding_index].tolist()
                 updated_chunks_data.append(chunk)
                 embedding_index += 1
             else:
                 # If a chunk somehow had no text, just pass it through without embedding
                 updated_chunks_data.append(chunk)
    else:
        print(f"Error: Mismatch between number of texts ({len(texts_to_embed)}) and embeddings ({len(embeddings)}) for {chunk_file}. Omitiendo guardado.")
        continue

    # 4. Save the updated data (with embeddings)
    base_filename = os.path.splitext(chunk_file)[0].replace("_chunks", "")
    output_json_filename = os.path.join(output_directory, f"{base_filename}_embeddings.json")
    save_embeddings_to_json(updated_chunks_data, output_json_filename)

    # --- Optional: Display Sample ---
    if updated_chunks_data:
        print("--- Primer chunk con embedding (ejemplo) ---")
        sample_data = updated_chunks_data[0].copy() # Create a copy to modify for display
        # Shorten the embedding vector for printing
        if 'embedding_vector' in sample_data and len(sample_data['embedding_vector']) > 10:
             sample_data['embedding_vector'] = sample_data['embedding_vector'][:5] + ["..."] + sample_data['embedding_vector'][-5:]
        print(json.dumps(sample_data, indent=2, ensure_ascii=False))


total_end_time = time.time()
print(f"\nProceso completado en {total_end_time - total_start_time:.2f} segundos.")