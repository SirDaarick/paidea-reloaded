import os
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
import json
import glob
from pathlib import Path
from app.agent.rag.chroma_store import chroma_store


def ingest_all_embeddings(source_dir: str = None) -> None:
    if not source_dir:
        # Por defecto buscamos la carpeta en la raíz del proyecto
        base_dir = Path(__file__).resolve().parents[4] # paidea-reloaded root
        source_dir = os.path.join(base_dir, "Agente IA", "v3", "embeddings")

    print(f"📂 Buscando archivos JSON de embeddings en: {source_dir}")
    json_files = glob.glob(os.path.join(source_dir, "*_embeddings.json"))

    if not json_files:
        print(f"❌ No se encontraron archivos de embeddings en {source_dir}")
        return

    total_chunks_ingested = 0

    for file_path in json_files:
        filename = os.path.basename(file_path)
        print(f"  📄 Procesando {filename}...")

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            if not isinstance(data, list):
                print(f"  ⚠️ El archivo {filename} no contiene una lista de chunks.")
                continue

            ids = []
            documents = []
            embeddings = []
            metadatas = []

            for idx, item in enumerate(data):
                raw_id = item.get("chunk_id") or f"{filename}_{idx}"
                text = item.get("text", "").strip()
                source = item.get("source") or filename.replace("_embeddings.json", "")
                vector = item.get("embedding_vector")

                if not text or not vector:
                    continue

                ids.append(str(raw_id))
                documents.append(text)
                embeddings.append(vector)
                metadatas.append({
                    "source": str(source),
                    "file": filename,
                    "index": idx,
                })

            # Inserción en bloques (batches) de 250 para no sobrecargar memoria
            batch_size = 250
            for i in range(0, len(ids), batch_size):
                end_i = i + batch_size
                chroma_store.collection.upsert(
                    ids=ids[i:end_i],
                    documents=documents[i:end_i],
                    embeddings=embeddings[i:end_i],
                    metadatas=metadatas[i:end_i],
                )

            total_chunks_ingested += len(ids)
            print(f"    ✅ {len(ids)} chunks agregados a ChromaDB desde {filename}")

        except Exception as e:
            print(f"  ❌ Error procesando {filename}: {e}")

    print("-------------------------------------------------------")
    print(f"🎉 Ingesta completada. Chunks totales en ChromaDB: {chroma_store.count()}")
    print("-------------------------------------------------------")


if __name__ == "__main__":
    ingest_all_embeddings()
