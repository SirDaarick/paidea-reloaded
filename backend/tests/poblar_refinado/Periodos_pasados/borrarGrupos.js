// --- Configuración ---
const API_URL = "https://paidea.onrender.com";
// const ID_CARRERA_DEFAULT = "692265322d970dc69b0fe295"; // LCD 
const ID_CARRERA_DEFAULT = "690eacdab43948f952b9244f"; // IIA

// *** CONFIGURACIÓN: Lista de períodos y semestres a borrar ***
// Formato: { idPeriodo: "id", nombre: "nombre", semestres: [lista de semestres] }
const PERIODOS_SEMESTRES_A_BORRAR = [
  {
    idPeriodo: "690eace7b43948f952b924cb",
    nombre: "2024-2",
    semestres: [1, 2, 3, 4, 5, 6, 7] // Semestres a borrar de este período
  },
  {
    idPeriodo: "690eace7b43948f952b924c9",
    nombre: "2025-1",
    semestres: [1, 2, 3, 4, 5, 6, 7] // Semestres a borrar de este período
  },
  {
    idPeriodo: "690eace7b43948f952b924c7",
    nombre: "2025-2",
    semestres: [1, 2, 3, 4, 5, 6, 7] // Semestres a borrar de este período
  }
];

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

// --- Función principal para borrar grupos por período y semestre ---
async function borrarGruposPorPeriodoYSemestre() {
  console.log("=== Borrado de Grupos por Período y Semestre ===\n");
  console.log(`Carrera: ${ID_CARRERA_DEFAULT}\n`);
  
  // Mostrar configuración
  console.log("Configuración de borrado:");
  PERIODOS_SEMESTRES_A_BORRAR.forEach(config => {
    console.log(`  Período ${config.nombre} (${config.idPeriodo}):`);
    console.log(`    Semestres: ${config.semestres.join(', ')}`);
  });
  console.log("\n⚠️  ADVERTENCIA: Esta acción eliminará grupos y sus clases permanentemente.\n");

  try {
    // 1. Obtener todos los grupos
    console.log("-- Obteniendo grupos --");
    const todosGrupos = await apiCall(`/grupo`);
    console.log(`✓ Total de grupos en el sistema: ${todosGrupos.length}\n`);

    // 2. Filtrar grupos según la configuración
    const gruposFiltrados = [];
    const gruposPorPeriodo = {};

    for (const config of PERIODOS_SEMESTRES_A_BORRAR) {
      const gruposConfig = todosGrupos.filter(g => {
        const idCarrera = g.idCarrera?._id || g.idCarrera;
        const idPeriodo = g.idPeriodo?._id || g.idPeriodo;
        return idCarrera === ID_CARRERA_DEFAULT && 
               idPeriodo === config.idPeriodo &&
               config.semestres.includes(g.semestre);
      });

      gruposPorPeriodo[config.idPeriodo] = {
        nombre: config.nombre,
        grupos: gruposConfig,
        semestres: config.semestres
      };

      gruposFiltrados.push(...gruposConfig);
    }

    console.log(`✓ Grupos filtrados a borrar: ${gruposFiltrados.length}\n`);

    if (gruposFiltrados.length === 0) {
      console.log("No se encontraron grupos que coincidan con los filtros.");
      return;
    }

    // 3. Obtener todas las clases
    console.log("-- Obteniendo clases --");
    const todasClases = await apiCall(`/clase`);
    console.log(`✓ Total de clases en el sistema: ${todasClases.length}\n`);

    // 4. Filtrar clases que pertenecen a los grupos seleccionados
    const idsGruposFiltrados = gruposFiltrados.map(g => g._id || g.id);
    const clasesABorrar = todasClases.filter(c => {
      const idGrupoClase = c.idGrupo?._id || c.idGrupo;
      return idsGruposFiltrados.includes(idGrupoClase);
    });

    console.log(`✓ Clases asociadas a borrar: ${clasesABorrar.length}\n`);

    // 5. Mostrar resumen detallado por período y semestre
    console.log("=== Resumen detallado de borrado ===\n");
    
    for (const config of PERIODOS_SEMESTRES_A_BORRAR) {
      const info = gruposPorPeriodo[config.idPeriodo];
      
      console.log(`Período: ${info.nombre} (${config.idPeriodo})`);
      console.log(`Semestres: ${info.semestres.join(', ')}`);
      console.log(`Total de grupos: ${info.grupos.length}`);
      
      // Agrupar por semestre
      const gruposPorSem = {};
      info.semestres.forEach(sem => {
        gruposPorSem[sem] = info.grupos.filter(g => g.semestre === sem);
      });

      // Mostrar detalle por semestre
      info.semestres.forEach(sem => {
        const gruposSem = gruposPorSem[sem];
        console.log(`\n  Semestre ${sem}: ${gruposSem.length} grupo(s)`);
        
        gruposSem.forEach(grupo => {
          const idGrupo = grupo._id || grupo.id;
          const clasesGrupo = clasesABorrar.filter(c => {
            const idGrupoClase = c.idGrupo?._id || c.idGrupo;
            return idGrupoClase === idGrupo;
          });
          console.log(`    - ${grupo.nombre} (${grupo.turno}): ${clasesGrupo.length} clases`);
        });
      });
      
      console.log(); // Línea en blanco entre períodos
    }

    // 6. Resumen total
    console.log(`${'='.repeat(60)}`);
    console.log("RESUMEN TOTAL:");
    console.log(`  Períodos afectados: ${PERIODOS_SEMESTRES_A_BORRAR.length}`);
    console.log(`  Grupos a borrar: ${gruposFiltrados.length}`);
    console.log(`  Clases a borrar: ${clasesABorrar.length}`);
    console.log(`${'='.repeat(60)}\n`);

    // 7. Confirmar antes de borrar
    console.log("⚠️  Iniciando borrado en 5 segundos...");
    console.log("    Presiona Ctrl+C para cancelar\n");
    await esperar(5000);

    let clasesBorradas = 0;
    let clasesError = 0;
    let gruposBorrados = 0;
    let gruposError = 0;

    // 8. Primero borrar clases
    console.log("-- Borrando clases --\n");
    for (const clase of clasesABorrar) {
      try {
        const idClase = clase._id || clase.id;
        await apiCall(`/clase/${idClase}`, 'DELETE');
        clasesBorradas++;
        
        const nombreMateria = clase.idMateria?.nombre || 'N/A';
        const nombreGrupo = clase.idGrupo?.nombre || 'N/A';
        console.log(`✓ Clase borrada: ${nombreMateria} - Grupo: ${nombreGrupo}`);
        
        await esperar(50);
        
      } catch (error) {
        clasesError++;
        console.error(`✗ Error al borrar clase:`, error.message);
      }
    }

    console.log(`\n✓ Clases borradas: ${clasesBorradas}/${clasesABorrar.length}`);
    console.log(`✗ Errores en clases: ${clasesError}\n`);

    // 9. Luego borrar grupos
    console.log("-- Borrando grupos --\n");
    for (const grupo of gruposFiltrados) {
      try {
        const idGrupo = grupo._id || grupo.id;
        await apiCall(`/grupo/${idGrupo}`, 'DELETE');
        gruposBorrados++;
        
        const idPeriodo = grupo.idPeriodo?._id || grupo.idPeriodo;
        const nombrePeriodo = PERIODOS_SEMESTRES_A_BORRAR.find(p => p.idPeriodo === idPeriodo)?.nombre || 'N/A';
        
        console.log(`✓ Grupo borrado: ${grupo.nombre} - Período: ${nombrePeriodo} - Semestre: ${grupo.semestre}`);
        
        await esperar(50);
        
      } catch (error) {
        gruposError++;
        console.error(`✗ Error al borrar grupo ${grupo.nombre}:`, error.message);
      }
    }

    // 10. Resumen final
    console.log(`\n${'='.repeat(60)}`);
    console.log("RESUMEN FINAL DE BORRADO");
    console.log('='.repeat(60));
    console.log(`Clases borradas: ${clasesBorradas}/${clasesABorrar.length}`);
    console.log(`  Errores: ${clasesError}`);
    console.log(`Grupos borrados: ${gruposBorrados}/${gruposFiltrados.length}`);
    console.log(`  Errores: ${gruposError}`);
    
    // Mostrar detalle por período
    console.log("\nDetalle por período:");
    for (const config of PERIODOS_SEMESTRES_A_BORRAR) {
      const info = gruposPorPeriodo[config.idPeriodo];
      const gruposBorradosPeriodo = info.grupos.filter(g => {
        const idGrupo = g._id || g.id;
        return gruposFiltrados.some(gf => (gf._id || gf.id) === idGrupo);
      }).length;
      
      console.log(`  ${info.nombre}: ${gruposBorradosPeriodo} grupos (semestres ${info.semestres.join(', ')})`);
    }
    
    console.log("\n✓ Proceso de borrado completado.");

  } catch (error) {
    console.error("\n✗ ERROR GENERAL:", error.message);
    console.error(error.stack);
  }
}

// Ejecutar
borrarGruposPorPeriodoYSemestre();