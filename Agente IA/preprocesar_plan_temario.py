import os
import unicodedata
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_DIR = os.path.join(BASE_DIR, "TXTS")
OUTPUT_DIR = os.path.join(BASE_DIR, "TXTS")

# ---------------------------------------------------------
# 1) Quitar acentos
# ---------------------------------------------------------
def quitar_acentos(texto: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", texto)
        if unicodedata.category(c) != "Mn"
    )

# ---------------------------------------------------------
# 2) Normalización SIMPLE (la misma lógica que tus compañeros)
# ---------------------------------------------------------
def normalizar_texto(texto: str) -> str:
    texto = texto.lower()                     # minúsculas
    texto = quitar_acentos(texto)             # sin acentos
    texto = re.sub(r"[^\w\s:,.()/-]", "", texto)  # quitar símbolos raros
    texto = re.sub(r"\s+\n", "\n", texto)     # quitar espacios antes de saltos
    texto = re.sub(r"\n{3,}", "\n\n", texto)  # no más de 2 saltos seguidos
    return texto.strip()

# ---------------------------------------------------------
# 3) Procesar un archivo .txt
# ---------------------------------------------------------
def procesar_archivo(nombre_archivo: str):
    entrada = os.path.join(INPUT_DIR, nombre_archivo)
    
    # generar nombre de salida
    salida = entrada.replace("_clean.txt", "_normalizado.txt")

    print(f"\n📌 Procesando: {nombre_archivo}")

    # leer archivo
    with open(entrada, "r", encoding="utf-8") as f:
        texto = f.read()

    # normalizar
    texto_normalizado = normalizar_texto(texto)

    # guardar
    with open(salida, "w", encoding="utf-8") as f:
        f.write(texto_normalizado)

    print(f"✔ Archivo generado: {os.path.basename(salida)}")

# ---------------------------------------------------------
# 4) Archivos a procesar
# ---------------------------------------------------------

ARCHIVOS = [
    "plan_ISC_clean.txt",
    "plan_IIA_clean.txt",
    "plan_LCD_clean.txt",
    "temarios_isc_clean.txt",
    "temarios_ia_clean.txt",
    "temarios_LCD_clean.txt"
]

# ---------------------------------------------------------
# 5) Ejecución
# ---------------------------------------------------------
if __name__ == "__main__":
    print("\n=== NORMALIZANDO PLANES Y TEMARIOS ===\n")

    for archivo in ARCHIVOS:
        procesar_archivo(archivo)

    print("\n🎉 PROCESO COMPLETADO: Todos los normalizados están listos.\n")
