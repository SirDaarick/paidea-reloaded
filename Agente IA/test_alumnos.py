import os
import asyncio
from profesor_tools import obtener_lista_alumnos
import pymongo
from bson import ObjectId

# --- CONEXIÓN DE PRUEBA ---
URI = os.environ.get("MONGO_SISTEMA_URI")
if not URI:
    raise RuntimeError("Falta variable de entorno MONGO_SISTEMA_URI.")
client = pymongo.MongoClient(URI)
db = client["test"] 

async def main():
    print("==================================================")
    print("🧪  DIAGNÓSTICO DE LISTA DE ALUMNOS")
    print("==================================================")

    # PASO 1: Buscar una 'Pista' (Una clase que tenga alumnos inscritos)
    # Buscamos en 'inscripcionclases' porque ahí están los vínculos reales.
    pista = db.inscripcionclases.find_one()

    if not pista:
        print("❌ CRÍTICO: La colección 'inscripcionclases' está vacía.")
        print("   -> No hay ningún alumno inscrito en ninguna materia en la BD.")
        return

    # Extraemos el ID de la clase real
    id_clase_real = str(pista["idClase"])
    print(f"✅ Se encontró evidencia de inscripción.")
    print(f"   -> Usaremos el ID de Clase: {id_clase_real} para la prueba.")
    
    # OPCIONAL: Buscar el nombre de la materia para saber qué estamos probando
    clase_doc = db.clases.find_one({"_id": pista["idClase"]})
    if clase_doc:
        materia_doc = db.materias.find_one({"_id": clase_doc["idMateria"]})
        nombre_mat = materia_doc.get("nombre") if materia_doc else "Desconocida"
        print(f"   -> Materia correspondiente: {nombre_mat}")

    print("-" * 50)

    # PASO 2: Ejecutar la Tool (Como si fuera el Chatbot)
    print(f"🤖 Ejecutando tool: obtener_lista_alumnos('{id_clase_real}')...")
    
    resultado = await obtener_lista_alumnos.ainvoke(id_clase_real)

    # PASO 3: Mostrar resultados
    print("\n📄 RESULTADO DEL CHATBOT:")
    print(resultado)

    # Verificación
    if isinstance(resultado, dict) and "detalle" in resultado:
        print(f"\n🎉 ¡ÉXITO! Se recuperaron {resultado['total_inscritos']} alumnos.")
        print("   La cadena (Clase -> Inscripción -> Alumno) funciona perfectamente.")
    elif isinstance(resultado, str) and "No se encontraron" in resultado:
        print("\n⚠️ La consulta corrió bien, pero no devolvió nombres (datos incompletos en usuarios).")
    else:
        print("\n❌ Error en la estructura de respuesta.")

if __name__ == "__main__":
    asyncio.run(main())