import os
import asyncio
from profesor_tools import obtener_datos_profesor, obtener_grupos_asignados, obtener_asignacion_ets
import pymongo
from pprint import pprint

# Usamos la misma conexión solo para buscar un ID de prueba válido
URI = os.environ.get("MONGO_SISTEMA_URI")
if not URI:
    raise RuntimeError("Falta variable de entorno MONGO_SISTEMA_URI.")
client = pymongo.MongoClient(URI)
db = client["test"]

async def main():
    print("==================================================")
    print("🧪  DIAGNÓSTICO DE TOOLS DE PROFESOR")
    print("==================================================")

    # ---------------------------------------------------------
    # CASO 1: Probar con el ID específico que me compartiste
    # ---------------------------------------------------------
    id_juan_irving = "6912b0615d5b0d7d32a1f887"
    print(f"\n🔵 PRUEBA 1: Consultando al Dr. Juan Irving ({id_juan_irving})")
    
    datos = await obtener_datos_profesor.ainvoke(id_juan_irving)
    print("   -> Datos Personales:", datos)

    grupos = await obtener_grupos_asignados.ainvoke(id_juan_irving)
    print(f"   -> Grupos Asignados: {grupos}")

    # ---------------------------------------------------------
    # CASO 2: Prueba "A prueba de fallos" (Busca un profe con clase real)
    # ---------------------------------------------------------
    print("\n🔵 PRUEBA 2: Buscando un profesor que SI tenga clases en el sistema...")
    
    # Buscamos una clase cualquiera en la colección 'clases'
    clase_random = db.clases.find_one()
    
    if clase_random:
        id_profe_activo = str(clase_random["idProfesor"])
        print(f"   -> Encontrada clase '{clase_random['_id']}' impartida por ID: {id_profe_activo}")
        
        # Probamos las tools con este ID que SEGURO tiene datos
        print(f"   -> Consultando groups del ID {id_profe_activo}...")
        grupos_activos = await obtener_grupos_asignados.ainvoke(id_profe_activo)
        
        print("\n   📄 RESULTADO DETALLADO DE GRUPOS:")
        pprint(grupos_activos)
        
        # Validación rápida
        if isinstance(grupos_activos, list) and len(grupos_activos) > 0:
            print("\n   ✅ ¡ÉXITO! El join manual (Clase -> Materia + Grupo) funcionó.")
            print(f"      Se recuperó la materia: '{grupos_activos[0]['materia']}'")
            print(f"      Del grupo: '{grupos_activos[0]['grupo']}'")
        else:
            print("\n   ⚠️ Algo raro pasó. Se encontró clase pero la tool no devolvió lista.")
    else:
        print("   ❌ No hay ninguna clase registrada en la colección 'clases'.")

    # ---------------------------------------------------------
    # CASO 3: Prueba de ETS
    # ---------------------------------------------------------
    print("\n🔵 PRUEBA 3: Consultando ETS asignados...")
    # Buscamos un ETS cualquiera
    ets_random = db.ets.find_one()
    if ets_random:
        id_profe_ets = str(ets_random["idProfesor"])
        print(f"   -> ETS encontrado para el profe ID: {id_profe_ets}")
        res_ets = await obtener_asignacion_ets.ainvoke(id_profe_ets)
        pprint(res_ets)
    else:
        print("   -> No hay ETS registrados en la base de datos.")

if __name__ == "__main__":
    asyncio.run(main())