import fs from 'fs';

// --- Configuración ---
const API_URL = "https://paidea.onrender.com";
const ID_CARRERA_DEFAULT = "690eacdab43948f952b9244f"; // IIA
//const ID_CARRERA_DEFAULT = "692265322d970dc69b0fe295"; // LCD 
// const ID_CARRERA_DEFAULT = "692273ce2d970dc69b0fe298"; // ISC 2020 

//CONFIGURACIÓN DE PERÍODOS (puedes agregar N períodos)
const PERIODOS_PASADOS = [
  //{ id: "693760fc7059ce707e55cc5f", nombre: "2022-2" },
  //{ id: "693760fc7059ce707e55cc5d", nombre: "2023-1" },
  //{ id: "693760d2a5d4dea828f2cf86", nombre: "2023-2" },
  //{ id: "693760d2a5d4dea828f2cf84", nombre: "2024-1" },
  { id: "690eace7b43948f952b924cb", nombre: "2024-2" },
  { id: "690eace7b43948f952b924c9", nombre: "2025-1" },
  { id: "690eace7b43948f952b924c7", nombre: "2025-2" },
];

const CONFIGURACION_PROGRESION = {
  semestreMaximo: 3,  // Hasta qué semestre pueden llegar los alumnos

  // Reglas de prerrequisitos: Para cursar semestre X, debes haber completado semestre Y
  // Formato: { semestre: X, requiere: Y }
  // Significa: "Para cursar materias de semestre X, debes haber completado TODO el semestre Y"
  prerrequisitos: [
    { semestre: 4, requiere: 1 },  // Para 4to necesitas completar 1ro
    { semestre: 5, requiere: 2 },  // Para 5to necesitas completar 2do
    { semestre: 6, requiere: 3 },  // Para 6to necesitas completar 3ro
    { semestre: 7, requiere: 4 },  // Para 7mo necesitas completar 4to
    { semestre: 8, requiere: 5 },  // Para 8vo necesitas completar 5to
  ],

  // Estrategia de inscripción: cuántas materias tomar por período
  materiasMinPorPeriodo: 4,
  materiasMaxPorPeriodo: 6,

  // Probabilidad de cursar todas las materias de un semestre (0-1)
  // 1.0 = siempre cursará todas las materias disponibles
  // 0.5 = 50% de probabilidad de cursar todas vs tomar cantidad aleatoria
  probabilidadCursarTodas: 0.7,

  // ✅ Configuración de reprobación
  probabilidadReprobar: 0.4,  // 15% de probabilidad de reprobar una materia
  probabilidadReprobarSegundaVez: 0,  // 5% de probabilidad de reprobar en segunda oportunidad
};

const NUM_ALUMNOS = 3;
const BOLETA_INICIAL = 2025010013;

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

// --- Generar nombre aleatorio ---
function generarNombreAleatorio() {
  const nombres = ['Juan', 'María', 'Pedro', 'Ana', 'Luis', 'Carmen', 'José', 'Laura',
    'Carlos', 'Isabel', 'Miguel', 'Patricia', 'Roberto', 'Elena', 'Fernando',
    'Diego', 'Sofía', 'Andrés', 'Valeria', 'Jorge', 'Daniela', 'Ricardo', 'Paola',
    'Alejandro', 'Gabriela', 'Francisco', 'Mariana', 'Raúl', 'Victoria'];
  const apellidos = ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández',
    'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez',
    'Morales', 'Jiménez', 'Cruz', 'Reyes', 'Díaz', 'Vargas', 'Castro',
    'Ortiz', 'Ruiz', 'Mendoza', 'Silva', 'Rojas', 'Vega', 'Aguilar'];

  const nombre = nombres[Math.floor(Math.random() * nombres.length)];
  const apellido1 = apellidos[Math.floor(Math.random() * apellidos.length)];
  const apellido2 = apellidos[Math.floor(Math.random() * apellidos.length)];

  return `${nombre} ${apellido1} ${apellido2}`;
}

// --- Generar calificación aleatoria ---
function generarCalificacion(aprobada) {
  if (aprobada) {
    // Calificación aprobatoria: 6 a 10
    return Math.floor(Math.random() * 5) + 6;
  } else {
    // Calificación reprobatoria: 0 a 5
    return Math.floor(Math.random() * 6);
  }
}

// --- Calcular créditos de materias ---
function calcularCreditos(materias) {
  return materias.reduce((total, materia) => total + (materia.creditos || 0), 0);
}

// --- Verificar si un semestre está completo ---
function semestreCompleto(semestre, materiasDelSemestre, materiasAprobadas) {
  // Un semestre está completo si TODAS sus materias obligatorias han sido APROBADAS
  const todasAprobadas = materiasDelSemestre.every(materia => {
    const idMateria = materia._id || materia.id;
    return materiasAprobadas.has(idMateria);
  });

  return todasAprobadas;
}

// --- Verificar si se puede cursar un semestre según prerrequisitos ---
function puedesCursarSemestre(semestre, semestresCompletados, configuracion) {
  // Buscar si este semestre tiene prerrequisito
  const regla = configuracion.prerrequisitos.find(p => p.semestre === semestre);

  if (!regla) {
    // No hay prerrequisito, se puede cursar
    return true;
  }

  // Verificar si el semestre requerido está completo
  return semestresCompletados.has(regla.requiere);
}

// --- Obtener semestres disponibles para cursar ---
function obtenerSemestresDisponibles(semestresCompletados, semestreMaximo, configuracion) {
  const disponibles = [];

  for (let sem = 1; sem <= semestreMaximo; sem++) {
    // Si ya está completo, no lo agregamos
    if (semestresCompletados.has(sem)) {
      continue;
    }

    // Verificar si cumple prerrequisitos
    if (puedesCursarSemestre(sem, semestresCompletados, configuracion)) {
      disponibles.push(sem);
    }
  }

  return disponibles;
}

// --- Función principal ---
async function poblarAlumnosConInscripciones() {
  console.log("=== Poblando Alumnos con Inscripciones y Calificaciones (Sistema Robusto con Reprobación) ===\n");
  console.log(`Número de alumnos a crear: ${NUM_ALUMNOS}`);
  console.log(`Carrera: ${ID_CARRERA_DEFAULT}`);
  console.log(`Períodos configurados: ${PERIODOS_PASADOS.length}`);
  console.log(`Semestre máximo: ${CONFIGURACION_PROGRESION.semestreMaximo}`);
  console.log(`Probabilidad de reprobar: ${(CONFIGURACION_PROGRESION.probabilidadReprobar * 100).toFixed(0)}%`);
  console.log(`Probabilidad de reprobar 2da vez: ${(CONFIGURACION_PROGRESION.probabilidadReprobarSegundaVez * 100).toFixed(0)}%`);
  console.log(`\nReglas de prerrequisitos:`);
  CONFIGURACION_PROGRESION.prerrequisitos.forEach(regla => {
    console.log(`  - Para cursar ${regla.semestre}° semestre → Debes completar ${regla.requiere}° semestre`);
  });
  console.log();

  try {
    // 1. Obtener todas las clases de períodos pasados
    console.log("-- Obteniendo clases de períodos pasados --");
    const todasClases = await apiCall('/clase');

    const clasesPorPeriodo = {};
    for (const periodo of PERIODOS_PASADOS) {
      clasesPorPeriodo[periodo.id] = [];
    }

    for (const clase of todasClases) {
      const idPeriodoClase = clase.idGrupo?.idPeriodo?._id || clase.idGrupo?.idPeriodo;

      if (idPeriodoClase && clasesPorPeriodo[idPeriodoClase] !== undefined) {
        clasesPorPeriodo[idPeriodoClase].push(clase);
      }
    }

    for (const periodo of PERIODOS_PASADOS) {
      console.log(`  Período ${periodo.nombre}: ${clasesPorPeriodo[periodo.id].length} clases`);
    }
    console.log("");

    // 2. Obtener todas las materias y agrupar por semestre
    console.log("-- Obteniendo materias --");
    const todasMaterias = await apiCall('/materia');
    const materiasPorId = {};
    const materiasPorSemestre = {};

    // Inicializar estructura para todos los semestres
    for (let i = 1; i <= CONFIGURACION_PROGRESION.semestreMaximo; i++) {
      materiasPorSemestre[i] = [];
    }

    todasMaterias.forEach(m => {
      materiasPorId[m._id || m.id] = m;

      const idCarrera = m.idCarrera?._id || m.idCarrera;
      if (idCarrera === ID_CARRERA_DEFAULT &&
        !m.optativa &&
        m.semestre >= 1 &&
        m.semestre <= CONFIGURACION_PROGRESION.semestreMaximo) {
        materiasPorSemestre[m.semestre].push(m);
      }
    });

    console.log(`✓ Materias cargadas: ${todasMaterias.length}`);
    for (let i = 1; i <= CONFIGURACION_PROGRESION.semestreMaximo; i++) {
      if (materiasPorSemestre[i].length > 0) {
        console.log(`  - ${i}° semestre: ${materiasPorSemestre[i].length} materias obligatorias`);
      }
    }
    console.log();

    // 3. Crear mapeo de clases por materia y período
    const clasesPorMateriaYPeriodo = {};
    for (const periodo of PERIODOS_PASADOS) {
      clasesPorMateriaYPeriodo[periodo.id] = {};

      clasesPorPeriodo[periodo.id].forEach(clase => {
        const idMateria = clase.idMateria?._id || clase.idMateria;
        if (!clasesPorMateriaYPeriodo[periodo.id][idMateria]) {
          clasesPorMateriaYPeriodo[periodo.id][idMateria] = [];
        }
        clasesPorMateriaYPeriodo[periodo.id][idMateria].push(clase);
      });
    }

    let alumnosCreados = 0;
    let inscripcionesCreadas = 0;
    let inscripcionesClaseCreadas = 0;
    let calificacionesCreadas = 0;
    let materiasReprobadasTotal = 0;

    // 4. Crear alumnos
    console.log("-- Creando alumnos e inscripciones --\n");

    for (let i = 0; i < NUM_ALUMNOS; i++) {
      const boleta = BOLETA_INICIAL + i;
      const nombre = generarNombreAleatorio();
      const correo = `alumno${boleta}@alumno.ipn.mx`;

      console.log(`\n${'='.repeat(70)}`);
      console.log(`ALUMNO ${i + 1}/${NUM_ALUMNOS}: ${nombre}`);
      console.log(`Boleta: ${boleta}`);
      console.log('='.repeat(70));

      try {
        // Crear el alumno
        const alumnoData = {
          boleta: boleta,
          nombre: nombre,
          correo: correo,
          contrasena: 'Alumno123',
          rol: 'Alumno',
          dataAlumno: {
            idCarrera: ID_CARRERA_DEFAULT,
            promedio: 0,
            creditosCursados: 0,
            situacionEscolar: 'Regular'
          }
        };

        const alumnoCreado = await apiCall('/usuario', 'POST', alumnoData);
        const idAlumno = alumnoCreado._id || alumnoCreado.id;
        alumnosCreados++;

        console.log(`✓ Alumno creado: ${idAlumno}`);

        let creditosTotales = 0;
        let sumaCalificaciones = 0;
        let materiasAprobadas = 0;
        let materiasReprobadas = 0;

        // ✅ Rastreo de progreso del alumno
        const materiasYaCursadas = new Set();  // IDs de materias que ya fueron cursadas (aprobadas o reprobadas)
        const materiasAprobadasSet = new Set(); // IDs de materias APROBADAS
        const materiasReprobadasSet = new Set(); // IDs de materias REPROBADAS (pendientes)
        const intentosPorMateria = new Map(); // Contador de intentos por materia (máximo 2)
        const semestresCompletados = new Set(); // Números de semestres completados

        // 5. Procesar cada período
        for (let indicePeriodo = 0; indicePeriodo < PERIODOS_PASADOS.length; indicePeriodo++) {
          const periodo = PERIODOS_PASADOS[indicePeriodo];
          const esUltimoPeriodo = indicePeriodo === PERIODOS_PASADOS.length - 1;

          console.log(`\n  --- Período ${periodo.nombre} (${indicePeriodo + 1}/${PERIODOS_PASADOS.length}) ---`);

          const clasesDisponibles = clasesPorPeriodo[periodo.id];

          if (!clasesDisponibles || clasesDisponibles.length === 0) {
            console.log(`  ⚠️  No hay clases disponibles en este período`);
            continue;
          }

          // Verificar semestres completados al inicio de este período
          for (let sem = 1; sem <= CONFIGURACION_PROGRESION.semestreMaximo; sem++) {
            if (semestreCompleto(sem, materiasPorSemestre[sem], materiasAprobadasSet)) {
              semestresCompletados.add(sem);
            }
          }

          // Mostrar estado de progreso
          if (semestresCompletados.size > 0) {
            console.log(`  📚 Semestres completados: ${Array.from(semestresCompletados).sort((a, b) => a - b).join(', ')}`);
          }
          if (materiasReprobadasSet.size > 0) {
            console.log(`  ⚠️  Materias reprobadas pendientes: ${materiasReprobadasSet.size}`);
          }

          // Obtener semestres disponibles para cursar
          const semestresDisponibles = obtenerSemestresDisponibles(
            semestresCompletados,
            CONFIGURACION_PROGRESION.semestreMaximo,
            CONFIGURACION_PROGRESION
          );

          if (semestresDisponibles.length === 0 && materiasReprobadasSet.size === 0) {
            console.log(`  ⚠️  No hay semestres disponibles para cursar (ya completó todo o faltan prerrequisitos)`);
            continue;
          }

          if (semestresDisponibles.length > 0) {
            console.log(`  📖 Semestres disponibles para cursar: ${semestresDisponibles.join(', ')}`);
          }

          // ✅ Seleccionar materias para este período
          const clasesSeleccionadas = [];
          const materiasSeleccionadas = [];

          let materiasRestantes = CONFIGURACION_PROGRESION.materiasMaxPorPeriodo;

          // ✅ PRIORIDAD 1: Recursar materias reprobadas
          if (materiasReprobadasSet.size > 0) {
            console.log(`  🔄 Recursando materias reprobadas (${materiasReprobadasSet.size})`);

            for (const idMateriaReprobada of materiasReprobadasSet) {
              if (materiasRestantes <= 0) break;

              const materia = materiasPorId[idMateriaReprobada];
              if (!materia) continue;

              // Verificar que no haya excedido intentos
              const intentos = intentosPorMateria.get(idMateriaReprobada) || 0;
              if (intentos >= 2) {
                console.log(`    ⛔ ${materia.nombre} - Máximo de intentos alcanzado`);
                continue;
              }

              // Buscar una clase de esta materia en este período
              const clasesMateria = clasesPorMateriaYPeriodo[periodo.id][idMateriaReprobada] || [];

              if (clasesMateria.length === 0) {
                console.log(`    ⚠️  No hay clases para recursar: ${materia.nombre}`);
                continue;
              }

              // Seleccionar una clase aleatoria
              const claseAleatoria = clasesMateria[Math.floor(Math.random() * clasesMateria.length)];
              clasesSeleccionadas.push({
                clase: claseAleatoria,
                materia: materia,
                esRecursada: true
              });
              materiasSeleccionadas.push(materia);
              materiasRestantes--;
            }
          }

          // ✅ PRIORIDAD 2: Cursar materias nuevas
          if (materiasRestantes > 0 && semestresDisponibles.length > 0) {
            // Estrategia: priorizar completar el semestre más bajo disponible
            semestresDisponibles.sort((a, b) => a - b);

            for (const semestreObjetivo of semestresDisponibles) {
              if (materiasRestantes <= 0) break;

              const materiasDelSemestre = materiasPorSemestre[semestreObjetivo];

              // Filtrar materias no cursadas de este semestre
              const materiasNoCursadas = materiasDelSemestre.filter(m => {
                const idMateria = m._id || m.id;
                return !materiasYaCursadas.has(idMateria);
              });

              if (materiasNoCursadas.length === 0) continue;

              // Decidir si cursar todas o algunas
              const cursarTodas = Math.random() < CONFIGURACION_PROGRESION.probabilidadCursarTodas;

              let materiasATomar;
              if (cursarTodas && materiasNoCursadas.length <= materiasRestantes) {
                // Cursar todas las materias restantes del semestre
                materiasATomar = materiasNoCursadas;
                console.log(`  🎯 Intentando completar ${semestreObjetivo}° semestre (${materiasNoCursadas.length} materias)`);
              } else {
                // Cursar algunas materias
                const cantidad = Math.min(
                  Math.floor(Math.random() * (CONFIGURACION_PROGRESION.materiasMaxPorPeriodo - CONFIGURACION_PROGRESION.materiasMinPorPeriodo + 1)) + CONFIGURACION_PROGRESION.materiasMinPorPeriodo,
                  materiasNoCursadas.length,
                  materiasRestantes
                );

                const materiasMezcladas = [...materiasNoCursadas].sort(() => Math.random() - 0.5);
                materiasATomar = materiasMezcladas.slice(0, cantidad);
                console.log(`  📝 Cursando ${cantidad} materias de ${semestreObjetivo}° semestre`);
              }

              // Inscribir las materias seleccionadas
              for (const materia of materiasATomar) {
                const idMateria = materia._id || materia.id;

                // Buscar una clase de esta materia en este período
                const clasesMateria = clasesPorMateriaYPeriodo[periodo.id][idMateria] || [];

                if (clasesMateria.length === 0) {
                  console.log(`    ⚠️  No hay clases para: ${materia.nombre}`);
                  continue;
                }

                // Seleccionar una clase aleatoria
                const claseAleatoria = clasesMateria[Math.floor(Math.random() * clasesMateria.length)];
                clasesSeleccionadas.push({
                  clase: claseAleatoria,
                  materia: materia,
                  esRecursada: false
                });
                materiasSeleccionadas.push(materia);
                materiasYaCursadas.add(idMateria);
                materiasRestantes--;

                if (materiasRestantes <= 0) break;
              }

              if (materiasRestantes <= 0) break;
            }
          }

          if (clasesSeleccionadas.length === 0) {
            console.log(`  ⚠️  No se pudieron seleccionar clases`);
            continue;
          }

          const creditosPeriodo = calcularCreditos(materiasSeleccionadas);

          try {
            // Crear inscripción
            const inscripcionData = {
              idAlumno: idAlumno,
              idPeriodo: periodo.id,
              fechaInscripcion: new Date(),
              creditos: creditosPeriodo
            };

            const inscripcionCreada = await apiCall('/inscripcion', 'POST', inscripcionData);
            const idInscripcion = inscripcionCreada._id || inscripcionCreada.id;
            inscripcionesCreadas++;

            console.log(`  ✓ Inscripción creada: ${idInscripcion}`);
            console.log(`    Créditos: ${creditosPeriodo}`);
            console.log(`    Clases inscritas: ${clasesSeleccionadas.length}`);

            creditosTotales += creditosPeriodo;

            // 6. Crear inscripciones a clases y calificaciones
            for (const item of clasesSeleccionadas) {
              const clase = item.clase;
              const materia = item.materia;
              const esRecursada = item.esRecursada;

              const idClase = clase._id || clase.id;
              const idMateria = materia._id || materia.id;
              const nombreMateria = clase.idMateria?.nombre || materia.nombre || 'Materia';
              const semestreMateria = clase.idMateria?.semestre || materia.semestre || '?';

              try {
                // ✅ Determinar si aprueba o reprueba
                let aprueba = true;
                let probabilidadReprobar = CONFIGURACION_PROGRESION.probabilidadReprobar;

                if (esRecursada) {
                  // Es una materia recursada, menor probabilidad de reprobar
                  probabilidadReprobar = CONFIGURACION_PROGRESION.probabilidadReprobarSegundaVez;

                  // Solo puede reprobar en última oportunidad si NO es el último período
                  if (!esUltimoPeriodo) {
                    aprueba = Math.random() >= probabilidadReprobar;
                  } else {
                    // En el último período, si es recursada, siempre aprueba
                    aprueba = true;
                  }
                } else {
                  // Primera vez cursando la materia
                  aprueba = Math.random() >= probabilidadReprobar;
                }

                // Si es última oportunidad (2do intento) y último período, forzar aprobación
                const intentos = intentosPorMateria.get(idMateria) || 0;
                if (intentos === 1 && esUltimoPeriodo) {
                  aprueba = true;
                }

                const estatus = aprueba ? 'Aprobado' : 'Reprobado';
                const calificacion = generarCalificacion(aprueba);

                // Actualizar contador de intentos
                intentosPorMateria.set(idMateria, (intentosPorMateria.get(idMateria) || 0) + 1);

                // Crear inscripción a clase
                const inscripcionClaseData = {
                  idInscripcion: idInscripcion,
                  idClase: idClase,
                  estatus: estatus
                };

                const inscripcionClaseCreada = await apiCall('/inscripcionclase', 'POST', inscripcionClaseData);
                const idInscripcionClase = inscripcionClaseCreada._id || inscripcionClaseCreada.id;
                inscripcionesClaseCreadas++;

                // Crear calificación
                const calificacionData = {
                  idInscripcionClase: idInscripcionClase,
                  valor: calificacion,
                  fechaRegistro: new Date(),
                  tipoEvaluacion: 'Ord'
                };

                await apiCall('/calificacion', 'POST', calificacionData);
                calificacionesCreadas++;

                // ✅ Actualizar sets según resultado
                if (aprueba) {
                  materiasAprobadasSet.add(idMateria);
                  materiasReprobadasSet.delete(idMateria); // Remover de reprobadas si estaba
                  materiasAprobadas++;

                  const emoji = esRecursada ? '🔄✓' : '✓';
                  const etiqueta = esRecursada ? ' (Recursada)' : '';
                  console.log(`    ${emoji} [${semestreMateria}°] ${nombreMateria}: ${calificacion}${etiqueta}`);
                } else {
                  materiasReprobadasSet.add(idMateria);
                  materiasReprobadas++;
                  materiasReprobadasTotal++;

                  const intentosActuales = intentosPorMateria.get(idMateria);
                  console.log(`    ✗ [${semestreMateria}°] ${nombreMateria}: ${calificacion} (REPROBADA - Intento ${intentosActuales}/2)`);
                }

                sumaCalificaciones += calificacion;

              } catch (error) {
                console.error(`    ✗ Error en clase ${nombreMateria}:`, error.message);
              }
            }

          } catch (error) {
            console.error(`  ✗ Error creando inscripción período ${periodo.nombre}:`, error.message);
          }
        }

        // 7. Verificar semestres finales completados
        for (let sem = 1; sem <= CONFIGURACION_PROGRESION.semestreMaximo; sem++) {
          if (semestreCompleto(sem, materiasPorSemestre[sem], materiasAprobadasSet)) {
            semestresCompletados.add(sem);
          }
        }

        // 8. Determinar situación escolar
        let situacionEscolar = 'Regular';
        if (materiasReprobadasSet.size > 0) {
          situacionEscolar = 'Irregular';
        }

        // 9. Actualizar promedio y créditos del alumno
        const totalMaterias = materiasAprobadas + materiasReprobadas;
        if (totalMaterias > 0) {
          const promedio = (sumaCalificaciones / totalMaterias).toFixed(2);

          try {
            const actualizacionData = {
              dataAlumno: {
                idCarrera: ID_CARRERA_DEFAULT,
                promedio: parseFloat(promedio),
                creditosCursados: creditosTotales,
                situacionEscolar: situacionEscolar
              }
            };

            await apiCall(`/usuario/${idAlumno}`, 'PUT', actualizacionData);

            console.log(`\n  📊 RESUMEN FINAL DEL ALUMNO:`);
            console.log(`    Situación: ${situacionEscolar} ${situacionEscolar === 'Irregular' ? '⚠️' : '✅'}`);
            console.log(`    Promedio: ${promedio}`);
            console.log(`    Créditos cursados: ${creditosTotales}`);
            console.log(`    Materias aprobadas: ${materiasAprobadas}`);
            console.log(`    Materias reprobadas (histórico): ${materiasReprobadas}`);
            console.log(`    Materias pendientes: ${materiasReprobadasSet.size}`);
            console.log(`    Materias únicas cursadas: ${materiasYaCursadas.size}`);
            console.log(`    Semestres completados: ${Array.from(semestresCompletados).sort((a, b) => a - b).join(', ') || 'Ninguno completo'}`);

            if (materiasReprobadasSet.size > 0) {
              console.log(`    📋 Materias que debe:`);
              materiasReprobadasSet.forEach(idMat => {
                const mat = materiasPorId[idMat];
                const intentos = intentosPorMateria.get(idMat) || 0;
                if (mat) {
                  console.log(`      - ${mat.nombre} (Intentos: ${intentos}/2)`);
                }
              });
            }

          } catch (error) {
            console.error(`  ✗ Error actualizando alumno:`, error.message);
          }
        }

      } catch (error) {
        console.error(`✗ Error creando alumno ${nombre}:`, error.message);
      }
    }

    // Resumen final
    console.log(`\n${'='.repeat(70)}`);
    console.log("RESUMEN FINAL DEL PROCESO");
    console.log('='.repeat(70));
    console.log(`Alumnos creados: ${alumnosCreados}/${NUM_ALUMNOS}`);
    console.log(`Inscripciones creadas: ${inscripcionesCreadas}`);
    console.log(`Inscripciones a clases: ${inscripcionesClaseCreadas}`);
    console.log(`Calificaciones registradas: ${calificacionesCreadas}`);
    console.log(`Materias reprobadas (total): ${materiasReprobadasTotal}`);
    console.log(`\nPeriodos procesados: ${PERIODOS_PASADOS.length}`);
    PERIODOS_PASADOS.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.nombre} (${p.id})`);
    });
    console.log("\n✓ Proceso completado exitosamente.");

  } catch (error) {
    console.error("\n✗ ERROR GENERAL:", error.message);
    console.error(error.stack);
  }
}

// Ejecutar
poblarAlumnosConInscripciones();