// --- Configuración ---
const API_URL = "https://paidea.onrender.com";

// Rango de boletas a borrar (ajusta según lo que creaste)
const BOLETA_INICIAL = 2022120001;
const BOLETA_FINAL = 2022120007; // Si creaste 50 alumnos

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

// --- Función principal ---
async function borrarAlumnosConInscripciones() {
  console.log("=== Borrado de Alumnos con Inscripciones y Calificaciones ===\n");
  console.log(`Rango de boletas: ${BOLETA_INICIAL} - ${BOLETA_FINAL}\n`);
  console.log("⚠️  ADVERTENCIA: Esta acción eliminará alumnos y todos sus datos relacionados.\n");

  try {
    // 1. Obtener todos los usuarios
    console.log("-- Obteniendo usuarios --");
    const todosUsuarios = await apiCall(`/usuario`);
    
    // Filtrar alumnos por rango de boletas
    const alumnosFiltrados = todosUsuarios.filter(u => {
      return u.rol === 'Alumno' && 
             u.boleta >= BOLETA_INICIAL && 
             u.boleta <= BOLETA_FINAL;
    });
    
    console.log(`✓ Total de usuarios: ${todosUsuarios.length}`);
    console.log(`✓ Alumnos a borrar: ${alumnosFiltrados.length}\n`);

    if (alumnosFiltrados.length === 0) {
      console.log("No se encontraron alumnos que coincidan con el rango de boletas.");
      return;
    }

    // Mostrar algunos ejemplos
    console.log("Ejemplos de alumnos a borrar:");
    alumnosFiltrados.slice(0, 5).forEach(a => {
      console.log(`  - ${a.nombre} (Boleta: ${a.boleta})`);
    });
    if (alumnosFiltrados.length > 5) {
      console.log(`  ... y ${alumnosFiltrados.length - 5} más`);
    }
    console.log();

    // 2. Obtener todas las inscripciones
    console.log("-- Obteniendo inscripciones --");
    const todasInscripciones = await apiCall(`/inscripcion`);
    
    const idsAlumnos = alumnosFiltrados.map(a => a._id || a.id);
    const inscripcionesABorrar = todasInscripciones.filter(i => {
      const idAlumno = i.idAlumno?._id || i.idAlumno;
      return idsAlumnos.includes(idAlumno);
    });
    
    console.log(`✓ Inscripciones a borrar: ${inscripcionesABorrar.length}\n`);

    // 3. Obtener todas las inscripciones a clases
    console.log("-- Obteniendo inscripciones a clases --");
    const todasInscripcionesClase = await apiCall(`/inscripcionclase`);
    
    const idsInscripciones = inscripcionesABorrar.map(i => i._id || i.id);
    const inscripcionesClaseABorrar = todasInscripcionesClase.filter(ic => {
      const idInscripcion = ic.idInscripcion?._id || ic.idInscripcion;
      return idsInscripciones.includes(idInscripcion);
    });
    
    console.log(`✓ Inscripciones a clases a borrar: ${inscripcionesClaseABorrar.length}\n`);

    // 4. Obtener todas las calificaciones
    console.log("-- Obteniendo calificaciones --");
    const todasCalificaciones = await apiCall(`/calificacion`);
    
    const idsInscripcionesClase = inscripcionesClaseABorrar.map(ic => ic._id || ic.id);
    const calificacionesABorrar = todasCalificaciones.filter(c => {
      const idInscripcionClase = c.idInscripcionClase?._id || c.idInscripcionClase;
      return idsInscripcionesClase.includes(idInscripcionClase);
    });
    
    console.log(`✓ Calificaciones a borrar: ${calificacionesABorrar.length}\n`);

    // 5. Mostrar resumen
    console.log("=== RESUMEN DE BORRADO ===");
    console.log(`Alumnos: ${alumnosFiltrados.length}`);
    console.log(`Inscripciones: ${inscripcionesABorrar.length}`);
    console.log(`Inscripciones a clases: ${inscripcionesClaseABorrar.length}`);
    console.log(`Calificaciones: ${calificacionesABorrar.length}`);
    console.log();

    // 6. Confirmar antes de borrar
    console.log("⚠️  Iniciando borrado en 5 segundos...");
    console.log("    Presiona Ctrl+C para cancelar");
    await esperar(5000);

    let calificacionesBorradas = 0;
    let calificacionesError = 0;
    let inscripcionesClaseBorradas = 0;
    let inscripcionesClaseError = 0;
    let inscripcionesBorradas = 0;
    let inscripcionesError = 0;
    let alumnosBorrados = 0;
    let alumnosError = 0;

    // 7. Borrar en orden inverso: calificaciones -> inscripcionesClase -> inscripciones -> alumnos
    
    console.log("\n-- Borrando calificaciones --\n");
    for (const calificacion of calificacionesABorrar) {
      try {
        const idCalificacion = calificacion._id || calificacion.id;
        await apiCall(`/calificacion/${idCalificacion}`, 'DELETE');
        calificacionesBorradas++;
        
        if (calificacionesBorradas % 10 === 0) {
          console.log(`  Progreso: ${calificacionesBorradas}/${calificacionesABorrar.length}`);
        }
        
        await esperar(20);
        
      } catch (error) {
        calificacionesError++;
        console.error(`✗ Error al borrar calificación:`, error.message);
      }
    }
    console.log(`✓ Calificaciones borradas: ${calificacionesBorradas}/${calificacionesABorrar.length}`);
    console.log(`✗ Errores: ${calificacionesError}\n`);

    console.log("-- Borrando inscripciones a clases --\n");
    for (const inscripcionClase of inscripcionesClaseABorrar) {
      try {
        const idInscripcionClase = inscripcionClase._id || inscripcionClase.id;
        await apiCall(`/inscripcionclase/${idInscripcionClase}`, 'DELETE');
        inscripcionesClaseBorradas++;
        
        if (inscripcionesClaseBorradas % 10 === 0) {
          console.log(`  Progreso: ${inscripcionesClaseBorradas}/${inscripcionesClaseABorrar.length}`);
        }
        
        await esperar(20);
        
      } catch (error) {
        inscripcionesClaseError++;
        console.error(`✗ Error al borrar inscripción a clase:`, error.message);
      }
    }
    console.log(`✓ Inscripciones a clases borradas: ${inscripcionesClaseBorradas}/${inscripcionesClaseABorrar.length}`);
    console.log(`✗ Errores: ${inscripcionesClaseError}\n`);

    console.log("-- Borrando inscripciones --\n");
    for (const inscripcion of inscripcionesABorrar) {
      try {
        const idInscripcion = inscripcion._id || inscripcion.id;
        await apiCall(`/inscripcion/${idInscripcion}`, 'DELETE');
        inscripcionesBorradas++;
        
        if (inscripcionesBorradas % 5 === 0) {
          console.log(`  Progreso: ${inscripcionesBorradas}/${inscripcionesABorrar.length}`);
        }
        
        await esperar(50);
        
      } catch (error) {
        inscripcionesError++;
        console.error(`✗ Error al borrar inscripción:`, error.message);
      }
    }
    console.log(`✓ Inscripciones borradas: ${inscripcionesBorradas}/${inscripcionesABorrar.length}`);
    console.log(`✗ Errores: ${inscripcionesError}\n`);

    console.log("-- Borrando alumnos --\n");
    for (const alumno of alumnosFiltrados) {
      try {
        const idAlumno = alumno._id || alumno.id;
        await apiCall(`/usuario/${idAlumno}`, 'DELETE');
        alumnosBorrados++;
        
        console.log(`✓ Alumno borrado: ${alumno.nombre} (${alumno.boleta})`);
        
        await esperar(100);
        
      } catch (error) {
        alumnosError++;
        console.error(`✗ Error al borrar alumno ${alumno.nombre}:`, error.message);
      }
    }

    // Resumen final
    console.log(`\n${'='.repeat(60)}`);
    console.log("RESUMEN FINAL DE BORRADO");
    console.log('='.repeat(60));
    console.log(`Calificaciones borradas: ${calificacionesBorradas}/${calificacionesABorrar.length}`);
    console.log(`  Errores: ${calificacionesError}`);
    console.log(`Inscripciones a clases borradas: ${inscripcionesClaseBorradas}/${inscripcionesClaseABorrar.length}`);
    console.log(`  Errores: ${inscripcionesClaseError}`);
    console.log(`Inscripciones borradas: ${inscripcionesBorradas}/${inscripcionesABorrar.length}`);
    console.log(`  Errores: ${inscripcionesError}`);
    console.log(`Alumnos borrados: ${alumnosBorrados}/${alumnosFiltrados.length}`);
    console.log(`  Errores: ${alumnosError}`);
    console.log("\n✓ Proceso de borrado completado.");

  } catch (error) {
    console.error("\n✗ ERROR GENERAL:", error.message);
    console.error(error.stack);
  }
}

// Ejecutar
borrarAlumnosConInscripciones();