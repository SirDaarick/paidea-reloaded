// borrarETS.js
// --- Configuración ---
const API_URL = "https://paidea.onrender.com";
const ID_CARRERA_DEFAULT = "690eacdab43948f952b9244f"; // IIA
const ID_PERIODO_DEFAULT = "690eacd9b43948f952b9243f"; // 2026-1
const SEMESTRES_A_BORRAR = [1, 2, 3]; // Modifica según necesites

// --- Función auxiliar para llamadas API ---
async function apiCall(endpoint, method = 'GET', body = null) {
  const options = { method, headers: {} };
  if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  try {
    const res = await fetch(`${API_URL}${endpoint}`, options);
    let data = null;
    const text = await res.text();
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) {
      const msg = data && (data.detalle || data.message || data.error) 
        ? (data.detalle || data.message || data.error) 
        : JSON.stringify(data);
      throw new Error(`Error ${res.status} en ${method} ${endpoint}: ${msg}`);
    }
    return data;
  } catch (error) {
    console.error(`apiCall falló -> ${method} ${endpoint}:`, error.message);
    throw error;
  }
}

// --- Función para esperar ---
function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Función principal para borrar ETS ---
async function borrarETSPorSemestre() {
  console.log("=== Iniciando borrado de ETS ===\n");
  console.log(`Carrera: ${ID_CARRERA_DEFAULT}`);
  console.log(`Periodo: ${ID_PERIODO_DEFAULT}`);
  console.log(`Semestres a borrar: ${SEMESTRES_A_BORRAR.join(', ')}\n`);
  console.log("⚠️  ADVERTENCIA: Esta acción eliminará ETS permanentemente.\n");

  try {
    // 1. Obtener todos los ETS
    console.log("-- Obteniendo ETS --");
    const todosETS = await apiCall(`/ets`);
    console.log(`✓ Total de ETS en el sistema: ${todosETS.length}\n`);

    // 2. Obtener todas las materias para filtrar por semestre
    console.log("-- Obteniendo materias --");
    const todasMaterias = await apiCall(`/materia`);
    
    // Crear mapa de materias para búsqueda rápida
    const materiasMap = {};
    todasMaterias.forEach(m => {
      const id = m._id || m.id;
      materiasMap[id.toString()] = m;
    });

    // 3. Filtrar ETS que pertenecen a la carrera, periodo y semestres seleccionados
    const etsABorrar = todosETS.filter(ets => {
      const idCarreraETS = ets.idCarrera?._id || ets.idCarrera;
      const idPeriodoETS = ets.idPeriodo?._id || ets.idPeriodo;
      const idMateriaETS = ets.idMateria?._id || ets.idMateria;
      
      const materiaETS = materiasMap[idMateriaETS?.toString()];
      
      return idCarreraETS?.toString() === ID_CARRERA_DEFAULT &&
             idPeriodoETS?.toString() === ID_PERIODO_DEFAULT &&
             materiaETS &&
             SEMESTRES_A_BORRAR.includes(materiaETS.semestre);
    });

    console.log(`-- ETS a borrar --`);
    console.log(`Total: ${etsABorrar.length}\n`);

    if (etsABorrar.length === 0) {
      console.log("No hay ETS para borrar.");
      return;
    }

    // 4. Mostrar resumen por semestre
    console.log("=== Resumen por semestre ===");
    const etsPorSemestre = {};
    etsABorrar.forEach(ets => {
      const idMateria = ets.idMateria?._id || ets.idMateria;
      const materia = materiasMap[idMateria?.toString()];
      if (materia) {
        if (!etsPorSemestre[materia.semestre]) {
          etsPorSemestre[materia.semestre] = [];
        }
        etsPorSemestre[materia.semestre].push(ets);
      }
    });

    Object.keys(etsPorSemestre).sort().forEach(semestre => {
      console.log(`Semestre ${semestre}: ${etsPorSemestre[semestre].length} ETS`);
    });
    console.log();

    // 5. Confirmar antes de borrar
    console.log("⚠️  Iniciando borrado en 3 segundos...");
    await esperar(3000);

    // 6. Borrar ETS
    let borrados = 0;
    let errores = 0;

    console.log("\n-- Borrando ETS --\n");
    for (const ets of etsABorrar) {
      try {
        const idETS = ets._id || ets.id;
        await apiCall(`/ets/${idETS}`, 'DELETE');
        borrados++;
        
        const idMateria = ets.idMateria?._id || ets.idMateria;
        const materia = materiasMap[idMateria?.toString()];
        const nombreMateria = materia?.nombre || 'N/A';
        
        console.log(`✓ ETS borrado: ${nombreMateria}`);
        
        // Pequeña pausa para no saturar el servidor
        await esperar(100);
        
      } catch (error) {
        errores++;
        console.error(`✗ Error al borrar ETS:`, error.message);
      }
    }

    // Resumen final
    console.log("\n=== Resumen de borrado ===");
    console.log(`ETS borrados exitosamente: ${borrados}/${etsABorrar.length}`);
    console.log(`Errores: ${errores}`);
    console.log("\n✓ Proceso completado.");

  } catch (error) {
    console.error("\n✗ ERROR DURANTE EL BORRADO:", error.message);
  }
}

// Ejecutar
borrarETSPorSemestre();