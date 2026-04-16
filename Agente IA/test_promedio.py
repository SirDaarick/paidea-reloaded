import os
import asyncio
from profesor_tools import obtener_reporte_promedios_profesor
import pymongo
URI = os.environ.get("MONGO_SISTEMA_URI")
if not URI:
    raise RuntimeError("Falta variable de entorno MONGO_SISTEMA_URI.")
client = pymongo.MongoClient(URI)
db = client["test"] 

async def main():
    print("🧪 Generando Reporte General de Promedios...")

    # Buscamos en la colección CORRECTA ('calificacions')
    pista = db.calificacions.find_one() # <--- Ojo aquí también para el test
    
    if not pista:
        print("❌ Sigue saliendo vacía. Revisa si hay datos.")
        return

    # Rastreo inverso para encontrar al profesor dueño de esa calificación
    try:
        insc = db.inscripcionclases.find_one({"_id": pista["idInscripcionClase"]})
        if not insc:
            print("❌ Calificación huérfana (sin inscripción).")
            return
            
        clase = db.clases.find_one({"_id": insc["idClase"]})
        id_profe_real = str(clase["idProfesor"])

        print(f"👨‍🏫 Usando ID de Profesor Real: {id_profe_real}")

        # Ejecutamos la tool ya corregida
        resultado = await obtener_reporte_promedios_profesor.ainvoke(id_profe_real)
        
        print("\n📄 REPORTE OBTENIDO:")
        import pprint
        pprint.pprint(resultado)
        
    except Exception as e:
        print(f"❌ Error en el rastreo: {e}")

if __name__ == "__main__":
    asyncio.run(main())