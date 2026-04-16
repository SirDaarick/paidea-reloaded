import os
import sys
import json

def load_text_from_file(filepath):
    """Carga el contenido de texto desde un archivo."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"Error: Archivo no encontrado en {filepath}")
        return None
    except Exception as e:
        print(f"Error cargando texto desde {filepath}: {e}")
        return None

def save_chunks_to_json(chunks_data, output_filename):
    """Guarda los datos de los chunks (lista de diccionarios) en un archivo JSON."""
    try:
        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(chunks_data, f, ensure_ascii=False, indent=2)
        print(f"Chunks guardados exitosamente en {output_filename}")
    except Exception as e:
        print(f"Error guardando chunks en {output_filename}: {e}")

# --- Configuración ---
script_directory = os.path.dirname(os.path.abspath(__file__))
input_directory = script_directory
output_directory = script_directory

txt_files_to_chunk = [
    #"becas.txt",
    #"dictamen.txt",
    "plan_IIA.txt",
    "plan_ISC.txt",
    "plan_LCD.txt",
    #"reglamento_general.txt",
    #"reglamento.txt"
]

# --- Bucle Principal ---
print("Iniciando proceso de chunking por saltos de línea...")

for txt_file in txt_files_to_chunk:
    full_path = os.path.join(input_directory, txt_file)
    print(f"\nCargando texto desde: {txt_file}")
    document_text = load_text_from_file(full_path)

    if document_text:
        # --- LÓGICA CORREGIDA ---
        # En lugar de usar un splitter que agrupa por tamaño,
        # cortamos directamente por cada salto de línea.
        
        # 1. Obtenemos todas las líneas
        lines = document_text.splitlines()
        
        # 2. Limpiamos: Quitamos espacios al inicio/final y descartamos líneas vacías
        chunks_text = [line.strip() for line in lines if line.strip()]

        # 3. Construimos el JSON
        chunks_for_json = []
        base_filename_no_ext = os.path.splitext(txt_file)[0]
        
        for i, chunk_content in enumerate(chunks_text):
            # Filtro de seguridad: Si la línea es muy corta (ej. "hola"), suele ser ruido.
            # Puedes ajustar este número o quitar el if si quieres guardar todo.
            if len(chunk_content) < 5: 
                continue

            chunk_data = {
                "chunk_id": f"{base_filename_no_ext}_chunk_{i+1}",
                "source": txt_file,
                "text": chunk_content
            }
            chunks_for_json.append(chunk_data)

        print(f"Se dividió {txt_file} en {len(chunks_for_json)} chunks.")

        output_json_filename = os.path.join(output_directory, f"{base_filename_no_ext}_chunks.json")
        save_chunks_to_json(chunks_for_json, output_json_filename)

        if chunks_for_json:
            print("--- Ejemplo de chunk 1 ---")
            print(json.dumps(chunks_for_json[0], indent=2, ensure_ascii=False))
    else:
        print(f"Se omitió el chunking para {txt_file} por error.")

print("\nChunking completado.")