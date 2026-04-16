import fs from 'fs';

// --- Configuración ---
const API_URL = "https://paidea.onrender.com";
const ID_CARRERA_DEFAULT = "690eacdab43948f952b9244f"; // IIA

// ✅ PERÍODO ACTUAL
const PERIODO_ACTUAL = { id: "690eacd9b43948f952b9243f", nombre: "2026-1" };

// 📋 LISTA DE BOLETAS A PROCESAR
const BOLETAS = [
  "2024122020",
  "2024122021",
  "2024122022",
  "2024122023",
  "2024122024",
  // ... agregar más boletas aquí
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

// --- Función principal ---
async function inscribirAlumnosEnETS() {
  console.log("=== Inscripción Automática de ETS ===\n");
  console.log(`Período actual: ${PERIODO_ACTUAL.nombre} (${PERIODO_ACTUAL.id})`);
  console.log(`Boletas a procesar: ${BOLETAS.length}`);
  console.log();

  let stats = {
    alumnosEncontrados: 0,
    alumnosNoEncontrados: 0,
    inscripcionesCreadas: 0,
    inscripcionesYaExistian: 0,
    etsInscritos: 0,
    errores: 0
  };

  try {
    // 1. Obtener todas las materias para mapeo
    console.log("-- Obteniendo materias --");
    const todasMaterias = await apiCall('/materia', 'GET');
    const materiasMap = {};
    todasMaterias.forEach(m => {
      if (m._id) materiasMap[m._id.toString()] = m;
    });
    console.log(`✓ Materias cargadas: ${todasMaterias.length}\n`);

    // 2. Obtener todos los ETS disponibles agrupados por materia
    console.log("-- Obteniendo ETS disponibles --");
    const todosETS = await apiCall('/ets', 'GET');
    const etsPorMateria = {};
    
    todosETS.forEach(ets => {
      const idMateria = (ets.idMateria?._id || ets.idMateria)?.toString();
      if (idMateria) {
        if (!etsPorMateria[idMateria]) {
          etsPorMateria[idMateria] = [];
        }
        etsPorMateria[idMateria].push(ets);
      }
    });
    console.log(`✓ ETS cargados: ${todosETS.length}\n`);

    // 3. Procesar cada boleta
    for (let i = 0; i < BOLETAS.length; i++) {
      const boleta = BOLETAS[i];
      
      console.log(`\n${'='.repeat(70)}`);
      console.log(`PROCESANDO ${i + 1}/${BOLETAS.length}: Boleta ${boleta}`);
      console.log('='.repeat(70));

      try {
        // 3.1. Buscar al alumno por boleta
        console.log("  Buscando alumno...");
        const usuarios = await apiCall('/usuario', 'GET');
        const alumno = usuarios.find(u => u.boleta?.toString() === boleta.toString());

        if (!alumno) {
          console.log(`  ✗ Alumno no encontrado con boleta: ${boleta}`);
          stats.alumnosNoEncontrados++;
          continue;
        }

        const idAlumno = alumno._id || alumno.id;
        const nombreAlumno = alumno.nombre || "Desconocido";
        stats.alumnosEncontrados++;
        console.log(`  ✓ Alumno encontrado: ${nombreAlumno} (${idAlumno})`);

        // 3.2. Verificar si ya tiene inscripción en el período actual
        console.log("  Verificando inscripción en período actual...");
        const todasInscripciones = await apiCall(`/inscripcion/alumno/${idAlumno}`, 'GET')
          .catch(() => []);

        let inscripcionActual = todasInscripciones.find(insc => {
          const idPeriodo = (insc.idPeriodo?._id || insc.idPeriodo)?.toString();
          return idPeriodo === PERIODO_ACTUAL.id;
        });

        let idInscripcion;

        if (inscripcionActual) {
          idInscripcion = inscripcionActual._id || inscripcionActual.id;
          console.log(`  ℹ️  Ya tiene inscripción en el período actual: ${idInscripcion}`);
          stats.inscripcionesYaExistian++;
        } else {
          // 3.3. Crear inscripción en el período actual
          console.log("  Creando inscripción en período actual...");
          const inscripcionData = {
            idAlumno: idAlumno,
            idPeriodo: PERIODO_ACTUAL.id,
            fechaInscripcion: new Date(),
            creditos: 0 // Sin clases, solo ETS
          };

          const inscripcionCreada = await apiCall('/inscripcion', 'POST', inscripcionData);
          idInscripcion = inscripcionCreada._id || inscripcionCreada.id;
          console.log(`  ✓ Inscripción creada: ${idInscripcion}`);
          stats.inscripcionesCreadas++;
        }

        // 3.4. Obtener materias reprobadas del alumno
        console.log("  Obteniendo materias reprobadas...");
        const materiasReprobadas = await apiCall(
          `/inscripcionClase/alumno/${idAlumno}/materias-reprobadas`,
          'GET'
        ).catch(() => []);

        console.log(`  → Materias reprobadas: ${materiasReprobadas.length}`);

        if (materiasReprobadas.length === 0) {
          console.log(`  ✓ Alumno sin materias reprobadas (situación regular)`);
          continue;
        }

        // 3.5. Obtener inscripciones ETS existentes
        const inscripcionesETSExistentes = await apiCall(
          `/inscripcionETS/inscripcion/${idInscripcion}`,
          'GET'
        ).catch(() => []);

        const idsETSYaInscritos = new Set(
          inscripcionesETSExistentes.map(ins => {
            const idETS = ins.idETS?._id || ins.idETS;
            return idETS?.toString();
          })
        );

        console.log(`  → ETS ya inscritos: ${idsETSYaInscritos.size}`);

        // 3.6. Inscribir en ETS de materias reprobadas
        console.log("  Inscribiendo en ETS disponibles...");
        let etsInscritosAlumno = 0;

        for (const materiaRep of materiasReprobadas) {
          // Buscar la materia en el mapa por nombre
          const materiaEncontrada = Object.values(materiasMap).find(m =>
            m.nombre === materiaRep.materia
          );

          if (!materiaEncontrada) {
            console.log(`    ⚠️  Materia no encontrada: ${materiaRep.materia}`);
            continue;
          }

          const idMateria = materiaEncontrada._id.toString();

          // Verificar si hay ETS disponibles para esta materia
          const etsDisponibles = etsPorMateria[idMateria] || [];

          if (etsDisponibles.length === 0) {
            console.log(`    ⚠️  No hay ETS disponibles para: ${materiaRep.materia}`);
            continue;
          }

          // Inscribir en el primer ETS disponible que no esté ya inscrito
          for (const ets of etsDisponibles) {
            const idETS = (ets._id || ets.id)?.toString();

            // Verificar si ya está inscrito en este ETS
            if (idsETSYaInscritos.has(idETS)) {
              console.log(`    ℹ️  Ya inscrito en ETS de: ${materiaRep.materia}`);
              break; // Ya tiene un ETS de esta materia, pasar a la siguiente
            }

            try {
              // Crear inscripción ETS
              const inscripcionETSData = {
                idETS: idETS,
                idInscripcion: idInscripcion
              };

              await apiCall('/inscripcionETS', 'POST', inscripcionETSData);
              console.log(`    ✓ Inscrito en ETS: ${materiaRep.materia}`);
              etsInscritosAlumno++;
              stats.etsInscritos++;
              idsETSYaInscritos.add(idETS); // Marcar como inscrito
              break; // Solo inscribir en un ETS por materia
            } catch (error) {
              console.error(`    ✗ Error al inscribir ETS ${materiaRep.materia}:`, error.message);
              stats.errores++;
            }
          }
        }

        console.log(`  📊 Total ETS inscritos para este alumno: ${etsInscritosAlumno}`);

      } catch (error) {
        console.error(`  ✗ Error procesando boleta ${boleta}:`, error.message);
        stats.errores++;
      }
    }

    // Resumen final
    console.log(`\n${'='.repeat(70)}`);
    console.log("RESUMEN FINAL");
    console.log('='.repeat(70));
    console.log(`Boletas procesadas: ${BOLETAS.length}`);
    console.log(`Alumnos encontrados: ${stats.alumnosEncontrados}`);
    console.log(`Alumnos no encontrados: ${stats.alumnosNoEncontrados}`);
    console.log(`Inscripciones creadas: ${stats.inscripcionesCreadas}`);
    console.log(`Inscripciones ya existentes: ${stats.inscripcionesYaExistian}`);
    console.log(`Total ETS inscritos: ${stats.etsInscritos}`);
    console.log(`Errores: ${stats.errores}`);
    console.log("\n✓ Proceso completado.");

  } catch (error) {
    console.error("\n✗ ERROR GENERAL:", error.message);
    console.error(error.stack);
  }
}

// Ejecutar
inscribirAlumnosEnETS();