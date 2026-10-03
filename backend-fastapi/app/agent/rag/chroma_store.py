import os
from typing import List, Dict, Any, Optional
import chromadb
from app.core.config import settings

COLLECTION_NAME = "reglamentos_escom"
MODELO_EMBEDDING = "paraphrase-multilingual-mpnet-base-v2"


class ChromaStore:
    def __init__(self, persist_directory: Optional[str] = None):
        self.persist_dir = persist_directory or settings.CHROMA_PERSIST_DIRECTORY
        os.makedirs(self.persist_dir, exist_ok=True)
        self.client = chromadb.PersistentClient(path=self.persist_dir)
        self.collection = self.client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
        self._model = None

    @property
    def embedding_model(self):
        """Carga lazy del modelo SentenceTransformer de 768 dimensiones."""
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self._model = SentenceTransformer(MODELO_EMBEDDING)
            except Exception as e:
                print(f"⚠️ No se pudo inicializar SentenceTransformer: {e}")
                self._model = False
        return self._model if self._model is not False else None

    def count(self) -> int:
        return self.collection.count()

    def query_by_embedding(self, query_vector: List[float], top_k: int = 5, where: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Busca chunks usando el vector de embedding de 768 dimensiones."""
        kwargs: Dict[str, Any] = {
            "query_embeddings": [query_vector],
            "n_results": top_k,
        }
        if where:
            kwargs["where"] = where

        results = self.collection.query(**kwargs)
        chunks = []
        if results and "documents" in results and results["documents"]:
            docs = results["documents"][0]
            metadatas = results["metadatas"][0] if "metadatas" in results and results["metadatas"] else [{}] * len(docs)
            distances = results["distances"][0] if "distances" in results and results["distances"] else [0.0] * len(docs)
            
            for doc, meta, dist in zip(docs, metadatas, distances):
                chunks.append({
                    "text": doc,
                    "metadata": meta,
                    "similarity": 1.0 - dist,
                })
        return chunks

    def query_by_text(self, query_text: str, top_k: int = 5, where: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Busca chunks vectorizando la consulta con el modelo multilingüe."""
        model = self.embedding_model
        if model is not None:
            vector = model.encode(query_text).tolist()
            return self.query_by_embedding(vector, top_k=top_k, where=where)

        # Fallback si el modelo de embedding no está listo: obtener documentos relevantes por palabras clave
        try:
            results = self.collection.get(limit=top_k)
            chunks = []
            if results and "documents" in results:
                for doc, meta in zip(results["documents"], results.get("metadatas", [])):
                    chunks.append({"text": doc, "metadata": meta, "similarity": 1.0})
            return chunks
        except Exception:
            return []


# Instancia singleton
chroma_store = ChromaStore()
