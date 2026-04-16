// --- Configuración ---
const API_URL = "https://paidea.onrender.com";
const ID_CARRERA_DEFAULT = "690eacdab43948f952b9244f"; // IIA
//const ID_CARRERA_DEFAULT = "692265322d970dc69b0fe295"; // LCD 
// const ID_CARRERA_DEFAULT = "692273ce2d970dc69b0fe298"; // ISC 2020 
const ID_PERIODO_DEFAULT = "690eacd9b43948f952b9243f"; // 2026-1

// *** CONFIGURACIÓN: Selecciona los semestres que quieres borrar ***
const SEMESTRES_A_BORRAR = [6]; // Modifica esta lista según necesites

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

// --- Función para esperar un tiempo ---
function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Función principal para borrar clases ---
async function borrarClasesPorSemestre() {
  console.log("=== Iniciando borrado de clases por semestre ===\n");
  console.log(`Carrera: ${ID_CARRERA_DEFAULT}`);
  console.log(`Periodo: ${ID_PERIODO_DEFAULT}`);
  console.log(`Semestres a borrar: ${SEMESTRES_A_BORRAR.join(', ')}\n`);
  console.log("⚠️  ADVERTENCIA: Esta acción eliminará clases permanentemente.\n");

  try {
    // 1. Obtener todos los grupos
    console.log("-- Obteniendo grupos --");
    const todosGrupos = await apiCall(`/grupo`);
    
    // Filtrar por carrera, periodo y semestre
    const gruposFiltrados = todosGrupos.filter(g => {
      const idGrupo = g.idCarrera?._id || g.idCarrera;
      const idPeriodo = g.idPeriodo?._id || g.idPeriodo;
      return idGrupo === ID_CARRERA_DEFAULT && idPeriodo === ID_PERIODO_DEFAULT &&
             SEMESTRES_A_BORRAR.includes(g.semestre);
    });
    
    console.log(`✓ Grupos encontrados que coinciden: ${gruposFiltrados.length}\n`);

    if (gruposFiltrados.length === 0) {
      console.log("No se encontraron grupos que coincidan con los filtros.");
      return;
    }

    // 2. Obtener todas las clases
    console.log("-- Obteniendo clases --");
    const todasClases = await apiCall(`/clase`);
    console.log(`✓ Total de clases en el sistema: ${todasClases.length}\n`);

    // 3. Filtrar clases que pertenecen a los grupos seleccionados
    const idsGruposFiltrados = gruposFiltrados.map(g => g._id || g.id);
    const clasesABorrar = todasClases.filter(c => {
      const idGrupoClase = c.idGrupo?._id || c.idGrupo;
      return idsGruposFiltrados.includes(idGrupoClase);
    });

    console.log(`-- Clases a borrar --`);
    console.log(`Total: ${clasesABorrar.length}\n`);

    if (clasesABorrar.length === 0) {
      console.log("No hay clases para borrar.");
      return;
    }

    // 4. Mostrar resumen por grupo
    console.log("=== Resumen por grupo ===");
    gruposFiltrados.forEach(grupo => {
      const idGrupo = grupo._id || grupo.id;
      const clasesGrupo = clasesABorrar.filter(c => {
        const idGrupoClase = c.idGrupo?._id || c.idGrupo;
        return idGrupoClase === idGrupo;
      });
      console.log(`Grupo: ${grupo.nombre} (Semestre ${grupo.semestre}) - ${clasesGrupo.length} clases`);
    });
    console.log();

    // 5. Confirmar antes de borrar
    console.log("⚠️  Iniciando borrado en 3 segundos...");
    await esperar(3000);

    // 6. Borrar clases
    let borradas = 0;
    let errores = 0;

    console.log("\n-- Borrando clases --\n");
    for (const clase of clasesABorrar) {
      try {
        const idClase = clase._id || clase.id;
        await apiCall(`/clase/${idClase}`, 'DELETE');
        borradas++;
        
        const nombreMateria = clase.idMateria?.nombre || 'N/A';
        const nombreGrupo = clase.idGrupo?.nombre || 'N/A';
        console.log(`✓ Clase borrada: ${nombreMateria} - Grupo: ${nombreGrupo}`);
        
        // Pequeña pausa para no saturar el servidor
        await esperar(100);
        
      } catch (error) {
        errores++;
        console.error(`✗ Error al borrar clase:`, error.message);
      }
    }

    // Resumen final
    console.log("\n=== Resumen de borrado ===");
    console.log(`Clases borradas exitosamente: ${borradas}/${clasesABorrar.length}`);
    console.log(`Errores: ${errores}`);
    console.log("\n✓ Proceso completado.");

  } catch (error) {
    console.error("\n✗ ERROR DURANTE EL BORRADO:", error.message);
  }
}

// Ejecutar
borrarClasesPorSemestre();