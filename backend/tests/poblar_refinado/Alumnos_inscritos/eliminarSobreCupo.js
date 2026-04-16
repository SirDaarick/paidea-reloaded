import fs from 'fs';

// --- Configuración ---
const API_URL = "https://paidea.onrender.com";

// ✅ PERÍODO ACTUAL
const PERIODO_ACTUAL = { id: "690eacd9b43948f952b9243f", nombre: "2026-1" };

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

// --- Función principal ---
async function eliminarSobrecupo() {
  console.log("=== Eliminando Sobrecupo en Clases del Período Actual ===\n");
  console.log(`Período: ${PERIODO_ACTUAL.nombre} (${PERIODO_ACTUAL.id})\n`);

  try {
    // 1. Obtener todas las clases
    console.log("-- Obteniendo todas las clases --");
    const todasClases = await apiCall('/clase');
    console.log(`✓ Clases obtenidas: ${todasClases.length}`);

    // 2. Filtrar solo las clases del período actual
    const clasesDelPeriodoActual = todasClases.filter(clase => {
      const idPeriodoClase = clase.idGrupo?.idPeriodo?._id || clase.idGrupo?.idPeriodo;
      return idPeriodoClase === PERIODO_ACTUAL.id;
    });

    console.log(`✓ Clases del período actual: ${clasesDelPeriodoActual.length}\n`);

    let clasesRevisadas = 0;
    let clasesConSobrecupo = 0;
    let inscripcionesEliminadas = 0;
    let calificacionesEliminadas = 0;

    // 3. Revisar cada clase del período actual
    for (const clase of clasesDelPeriodoActual) {
      const idClase = clase._id || clase.id;
      const cupoMaximo = clase.cupoMaximo || 30;
      const nombreMateria = clase.idMateria?.nombre || 'Materia desconocida';
      const nombreGrupo = clase.idGrupo?.nombre || 'Grupo desconocido';

      clasesRevisadas++;

      try {
        // Obtener conteo de inscritos
        const response = await apiCall(`/inscripcionclase/clase/${idClase}/conteo`);
        const inscritos = response.inscritos || 0;

        if (inscritos > cupoMaximo) {
          const sobrecupo = inscritos - cupoMaximo;
          console.log(`⚠️  SOBRECUPO DETECTADO:`);
          console.log(`   Clase: ${nombreMateria} - ${nombreGrupo}`);
          console.log(`   ID: ${idClase}`);
          console.log(`   Cupo máximo: ${cupoMaximo}`);
          console.log(`   Inscritos: ${inscritos}`);
          console.log(`   Sobrecupo: ${sobrecupo}`);
          
          clasesConSobrecupo++;

          // Obtener todas las inscripciones de esta clase
          const inscripcionesClase = await apiCall(`/inscripcionclase/clase/${idClase}`);
          
          if (!inscripcionesClase || inscripcionesClase.length === 0) {
            console.log(`   ⚠️  No se pudieron obtener las inscripciones\n`);
            continue;
          }

          // Ordenar aleatoriamente y tomar las que sobran
          const inscripcionesAleatorias = inscripcionesClase.sort(() => Math.random() - 0.5);
          const inscripcionesAEliminar = inscripcionesAleatorias.slice(0, sobrecupo);

          console.log(`   🗑️  Eliminando ${inscripcionesAEliminar.length} inscripciones aleatorias...`);

          // Eliminar cada inscripción y sus calificaciones
          for (const inscripcionClase of inscripcionesAEliminar) {
            const idInscripcionClase = inscripcionClase._id || inscripcionClase.id;

            try {
              // Obtener calificaciones asociadas
              const calificaciones = await apiCall(`/calificacion/inscripcionClase/${idInscripcionClase}`);
              
              // Eliminar cada calificación
              for (const calificacion of calificaciones) {
                const idCalificacion = calificacion._id || calificacion.id;
                await apiCall(`/calificacion/${idCalificacion}`, 'DELETE');
                calificacionesEliminadas++;
              }

              // Eliminar la inscripción clase
              await apiCall(`/inscripcionclase/${idInscripcionClase}`, 'DELETE');
              inscripcionesEliminadas++;

            } catch (error) {
              console.error(`   ✗ Error eliminando inscripción ${idInscripcionClase}:`, error.message);
            }
          }

          console.log(`   ✓ Clase corregida: ${cupoMaximo}/${cupoMaximo} inscritos\n`);

        } else if (inscritos === cupoMaximo) {
          console.log(`✓ Clase llena (sin sobrecupo): ${nombreMateria} - ${nombreGrupo} (${inscritos}/${cupoMaximo})`);
        }

      } catch (error) {
        console.error(`✗ Error procesando clase ${idClase}:`, error.message);
      }
    }

    // Resumen final
    console.log(`\n${'='.repeat(70)}`);
    console.log("RESUMEN FINAL");
    console.log('='.repeat(70));
    console.log(`Período: ${PERIODO_ACTUAL.nombre}`);
    console.log(`Clases revisadas: ${clasesRevisadas}`);
    console.log(`Clases con sobrecupo: ${clasesConSobrecupo}`);
    console.log(`Inscripciones eliminadas: ${inscripcionesEliminadas}`);
    console.log(`Calificaciones eliminadas: ${calificacionesEliminadas}`);
    console.log("\n✓ Proceso completado exitosamente.");

  } catch (error) {
    console.error("\n✗ ERROR GENERAL:", error.message);
    console.error(error.stack);
  }
}

// Ejecutar
eliminarSobrecupo();