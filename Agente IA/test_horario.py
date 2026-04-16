import os
import asyncio
from profesor_tools import obtener_horario_hoy_profesor
import pymongo
import datetime
URI = os.environ.get("MONGO_SISTEMA_URI")
if not URI:
    raise RuntimeError("Falta variable de entorno MONGO_SISTEMA_URI.")
client = pymongo.MongoClient(URI)
db = client["test"] 

async def main():
    print("🧪 Probando Horario de Hoy...")

    # 1. Buscamos un profesor activo (usamos al de las pruebas anteriores)
    # O buscamos uno en 'clases'
    clase_random = db.clases.find_one()
    if not clase_random:
        print("❌ No hay clases.")
        return
        
    id_profe = str(clase_random["idProfesor"])
    print(f"👨‍🏫 Usando Profe ID: {id_profe}")
    
    # 2. Imprimir qué día detecta el sistema
    dias = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]
    hoy = dias[datetime.datetime.now().weekday()]
    print(f"📅 El sistema detecta que hoy es: {hoy.upper()}")

    # 3. Ejecutar Tool
    resultado = await obtener_horario_hoy_profesor.ainvoke(id_profe)
    
    print("\n📄 RESULTADO (Real):")
    print(resultado)
    
    # OJO: Si hoy no tiene clase, saldrá "Día libre".
    # Eso es correcto, pero para ver si funciona el código, intenta cambiar la fecha de tu PC 
    # o confiar en que si sale "Día libre" es porque buscó y no encontró (lo cual es éxito).

if __name__ == "__main__":
    asyncio.run(main())