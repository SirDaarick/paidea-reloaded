import re
import unicodedata
import os
import spacy 
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# ---------------------------------------------------------------------
# 1) Eliminación de ruido que NO debe aparecer en el RAG
# ---------------------------------------------------------------------
def limpiar_basura(texto: str) -> str:
    basura_patrones = [
        r"Gaceta Politécnica.*?\n",   # encabezados editoriales
        r"www\..*?\n",                # URLs basura
        r"Instituto Politécnico Nacional.*?\n",
        r"AÑO.*?VOL\..*?\n",
        r"ISSN.*?\n",
        r"\d{1,3}\s+13 de junio.*?\n",
        r"\d+\s+oiranidroartxE\s+oremúN",  # columnas mal pegadas
        r"—+", r"-{2,}", r"_{2,}",         # separadores raros
        r"Impreso en.*?\n",
        r"Teléfono.*?\n",
        r"Colaboradores.*?\n",
        r"Diseño.*?\n",
        r"Coordinación Editorial.*?\n",
        r"Directora General.*?\n",
    ]

    for patron in basura_patrones:
        texto = re.sub(patron, "", texto, flags=re.IGNORECASE)

    return texto


# ---------------------------------------------------------------------
# 2) Normalización del texto
#    (minus, sin acentos, sin símbolos, pero dejando estructura)
# ---------------------------------------------------------------------
def normalizar_simple(texto: str) -> str:
    # Minúsculas
    texto = texto.lower()

    # Quitar acentos
    texto = "".join(
        c for c in unicodedata.normalize("NFD", texto)
        if unicodedata.category(c) != "Mn"
    )

    # Reemplazar rarezas
    texto = texto.replace("º", "").replace("°", "")

    return texto


# ---------------------------------------------------------------------
# 3) IDENTIFICACIÓN AUTOMÁTICA
#    - Capítulos
#    - Artículos
#    - Exposición de Motivos
#    - Transitorios
# ---------------------------------------------------------------------
def marcar_secciones(texto: str) -> str:

    # --- Exposición de motivos ---
    texto = re.sub(
        r"exposición de motivos",
        r"# EXPOSICION DE MOTIVOS\nexposicion de motivos",
        texto,
        flags=re.IGNORECASE
    )

    # --- Transitorios ---
    texto = re.sub(
        r"transitorios",
        r"# TRANSITORIOS\ntransitorios",
        texto,
        flags=re.IGNORECASE
    )

    # --- Capítulos ---
    texto = re.sub(
        r"(cap[ií]tulo\s+[^\n]+)",
        r"# \1",
        texto,
        flags=re.IGNORECASE
    )

    # --- Artículos ---
    texto = re.sub(
        r"(art[ií]culo\s+\d+)",
        r"# \1",
        texto,
        flags=re.IGNORECASE
    )

    return texto


# ---------------------------------------------------------------------
# 4) Limpieza final (espacios, líneas vacías dobles)
# ---------------------------------------------------------------------
def limpiar_espaciado(texto: str) -> str:
    texto = re.sub(r"\n\s+\n", "\n\n", texto)   # dobles espacios
    texto = re.sub(r"[ ]{2,}", " ", texto)      # dobles espacios en línea
    return texto.strip()


# ---------------------------------------------------------------------
# 5) Pipeline completo
# ---------------------------------------------------------------------
def procesar_reglamento(entrada: str, salida_clean: str, salida_final: str):
    print("Leyendo archivo original...")
    with open(entrada, "r", encoding="utf-8") as f:
        texto = f.read()

    print("→ Eliminando basura editorial...")
    texto = limpiar_basura(texto)

    print("→ Normalizando texto...")
    texto_normalizado = normalizar_simple(texto)

    print("→ Guardando texto limpio (sin estructura)...")
    with open(salida_clean, "w", encoding="utf-8") as f:
        f.write(texto_normalizado)

    print("→ Detectando capítulos y artículos...")
    texto_final = marcar_secciones(texto_normalizado)

    print("→ Limpiando espaciado...")
    texto_final = limpiar_espaciado(texto_final)

    print("→ Guardando resultado final...")
    with open(salida_final, "w", encoding="utf-8") as f:
        f.write(texto_final)

    print(f"\n✔ Archivo normalizado creado: {salida_final}\n")
    
def lematizar (texto):
    
    #nltk.download("punkt")
    #nltk.download("stopwords")
    #nltk.download("wordnet")
    #nltk.download("punkt_tab") 
    
    texto = texto.lower()
    
    texto = re.sub(r"[^\w\s]", "", texto)
    
    texto = "".join(
    c for c in unicodedata.normalize("NFD", texto)
        if unicodedata.category(c) != "Mn"
    )
    
    tokens = word_tokenize(texto)
    
    stop_words = set(stopwords.words("spanish"))
    tokens = [t for t in tokens if t not in stop_words]
    
    nlp = spacy.load("es_core_news_sm")
    doc = nlp(" ".join(tokens))

    lemmas = [token.lemma_ for token in doc]
    
    return lemmas


# ---------------------------------------------------------------------
# EJECUCIÓN DIRECTA (si usas python preprocesado.py)
# ---------------------------------------------------------------------
if __name__ == "__main__":
    archivos = [
        "dictameninfogeneral_extracted.txt",
        "g-extra-1862_extracted.txt"
    ]

    for archivo in archivos:
        entrada = os.path.join(BASE_DIR, archivo)

        salida_clean = entrada.replace("_extracted.txt", "_clean.txt")
        salida_final = entrada.replace("_extracted.txt", "_normalizado.txt")

        print(f"\n Procesando {archivo} ...")
        procesar_reglamento(entrada, salida_clean, salida_final)