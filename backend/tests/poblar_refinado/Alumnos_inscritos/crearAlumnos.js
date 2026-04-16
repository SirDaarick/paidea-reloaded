import fs from 'fs';

// --- Configuración ---
const API_URL = "https://paidea.onrender.com";
const ID_CARRERA_DEFAULT = "690eacdab43948f952b9244f"; // IIA
//const ID_CARRERA_DEFAULT = "692265322d970dc69b0fe295"; // LCD 
// const ID_CARRERA_DEFAULT = "692273ce2d970dc69b0fe298"; // ISC 2020 

//CONFIGURACIÓN DE PERÍODOS PASADOS
const PERIODOS_PASADOS = [
  //{ id: "693760fc7059ce707e55cc5f", nombre: "2022-2" },
  //{ id: "693760fc7059ce707e55cc5d", nombre: "2023-1" },
  //{ id: "693760d2a5d4dea828f2cf86", nombre: "2023-2" },
  { id: "693760d2a5d4dea828f2cf84", nombre: "2024-1" },
  { id: "690eace7b43948f952b924cb", nombre: "2024-2" },
  { id: "690eace7b43948f952b924c9", nombre: "2025-1" },
  { id: "690eace7b43948f952b924c7", nombre: "2025-2" },
];

// ✅ PERÍODO ACTUAL
const PERIODO_ACTUAL = { id: "690eacd9b43948f952b9243f", nombre: "2026-1" };

const CONFIGURACION_PROGRESION = {
  semestreMaximo: 5,
  
  prerrequisitos: [
    { semestre: 4, requiere: 1 },
    { semestre: 5, requiere: 2 },
    { semestre: 6, requiere: 3 },
    { semestre: 7, requiere: 4 },
    { semestre: 8, requiere: 5 },
  ],
  
  materiasMinPorPeriodo: 4,
  materiasMaxPorPeriodo: 6,
  
  probabilidadCursarTodas: 0.7,
  
  probabilidadReprobar: 0.25,
  probabilidadReprobarSegundaVez: 0,
  
  probabilidadPresentarExtra: 0.7,
  probabilidadAprobarExtra: 0.6,
  
  // ✅ Configuración de optativas
  maxOptativasSexto: 2,    // Máximo 2 optativas de 6to semestre
  maxOptativasSeptimo: 2,  // Máximo 2 optativas de 7mo semestre
};

const NUM_ALUMNOS = 1;
const BOLETA_INICIAL = 2023120017;

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
                   'Carlos', 'Isabel', 'Miguel', 'Paulina','Sarai','Jonathan', 'Patricia', 
                   'Roberto', 'Elena', 'Fernando','Irving','Jesus',
                   'Diego', 'Sofía', 'Andrés', 'Valeria', 'Jorge', 'Daniela', 'Ricardo', 'Paola',
                   'Alejandro', 'Gabriela', 'Francisco', 'Mariana', 'Raúl', 'Victoria'];
  const apellidos = ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández',
                     'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez',
                     'Morales', 'Jiménez', 'Cruz', 'Reyes', 'Díaz', 'Vargas', 'Castro', 'Torales',
                     'Ortiz', 'Ruiz', 'Mendoza', 'Silva', 'Rojas', 'Vega', 'Aguilar','Ramos'];
  
  const nombre = nombres[Math.floor(Math.random() * nombres.length)];
  const apellido1 = apellidos[Math.floor(Math.random() * apellidos.length)];
  const apellido2 = apellidos[Math.floor(Math.random() * apellidos.length)];
  
  return `${nombre} ${apellido1} ${apellido2}`;
}

// --- Generar calificación aleatoria ---
function generarCalificacion(aprobada, esDecimal = false) {
  if (aprobada) {
    if (esDecimal) {
      return (Math.random() * 4 + 6).toFixed(1);
    } else {
      return Math.floor(Math.random() * 5) + 6; // 6-10
    }
  } else {
    // ✅ Reprobatorias siempre enteras
    return Math.floor(Math.random() * 6); // 0-5
  }
}

// --- Calcular promedio de calificaciones parciales ---
function calcularPromedioP1P2P3(calif1, calif2, calif3) {
  const promedio = (parseFloat(calif1) + parseFloat(calif2) + parseFloat(calif3)) / 3;
  
  if (promedio < 6 && promedio >= 5) {
    return Math.floor(promedio); // 5.9 → 5, 5.5 → 5
  } else {
    return Math.round(promedio); // 9.5 → 10, 9.4 → 9
  }
}
// --- Calcular créditos de materias ---
function calcularCreditos(materias) {
  return materias.reduce((total, materia) => total + (materia.creditos || 0), 0);
}

function verificarTraslapesHorario(claseNueva, clasesYaInscritas) {
  const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  
  for (const dia of diasSemana) {
    const horarioNuevo = claseNueva.horario?.[dia];
    
    // ✅ Si la clase nueva NO tiene horario en este día, continuar
    if (!horarioNuevo || !horarioNuevo.idDia) continue;
    
    // ✅ Extraer el ID del día (puede venir como objeto o como string)
    let idDiaNuevo;
    if (typeof horarioNuevo.idDia === 'object' && horarioNuevo.idDia !== null) {
      idDiaNuevo = (horarioNuevo.idDia._id || horarioNuevo.idDia.id || horarioNuevo.idDia).toString();
    } else {
      idDiaNuevo = horarioNuevo.idDia.toString();
    }
    
    for (const claseInscrita of clasesYaInscritas) {
      const horarioInscrito = claseInscrita.horario?.[dia];
      
      // ✅ Si la clase inscrita NO tiene horario en este día, continuar (no hay traslape)
      if (!horarioInscrito || !horarioInscrito.idDia) continue;
      
      // ✅ Extraer el ID del día inscrito
      let idDiaInscrito;
      if (typeof horarioInscrito.idDia === 'object' && horarioInscrito.idDia !== null) {
        idDiaInscrito = (horarioInscrito.idDia._id || horarioInscrito.idDia.id || horarioInscrito.idDia).toString();
      } else {
        idDiaInscrito = horarioInscrito.idDia.toString();
      }
      
      // ✅ Comparar IDs (ahora ambos son strings)
      if (idDiaNuevo === idDiaInscrito) {
        return true; // HAY TRASLAPE
      }
    }
  }
  
  return false; // NO hay traslape
}


// --- Verificar cupo disponible en una clase ---
async function verificarCupoDisponible(idClase, cupoMaximo) {
  try {
    const response = await apiCall(`/inscripcionclase/clase/${idClase}/conteo`);
    const inscritos = response.inscritos || 0;
    return inscritos < cupoMaximo;
  } catch (error) {
    console.error(`Error verificando cupo para clase ${idClase}:`, error.message);
    return false; // Por seguridad, si falla la consulta, no permitir inscripción
  }
}

// --- Verificar si un semestre está completo ---
function semestreCompleto(semestre, materiasDelSemestre, materiasAprobadas, optativasCursadas) {
  // Separar obligatorias y optativas
  const obligatorias = materiasDelSemestre.filter(m => !m.optativa);
  const optativas = materiasDelSemestre.filter(m => m.optativa);
  
  // Todas las obligatorias deben estar aprobadas
  const obligatoriasCompletas = obligatorias.every(materia => {
    const idMateria = materia._id || materia.id;
    return materiasAprobadas.has(idMateria);
  });
  
  if (!obligatoriasCompletas) return false;
  
  // Para optativas, verificar según el semestre
  if (optativas.length > 0) {
    let requeridasOptativas = 0;
    
    if (semestre === 6) {
      requeridasOptativas = Math.min(CONFIGURACION_PROGRESION.maxOptativasSexto, optativas.length);
    } else if (semestre === 7) {
      requeridasOptativas = Math.min(CONFIGURACION_PROGRESION.maxOptativasSeptimo, optativas.length);
    }
    
    // Contar cuántas optativas de este semestre están aprobadas
    const optativasAprobadas = optativas.filter(m => {
      const idMateria = m._id || m.id;
      return materiasAprobadas.has(idMateria);
    }).length;
    
    return optativasAprobadas >= requeridasOptativas;
  }
  
  return true;
}

// --- Verificar si se puede cursar un semestre según prerrequisitos ---
function puedesCursarSemestre(semestre, semestresCompletados, configuracion) {
  const regla = configuracion.prerrequisitos.find(p => p.semestre === semestre);
  
  if (!regla) {
    return true;
  }
  
  return semestresCompletados.has(regla.requiere);
}

// --- Obtener semestres disponibles para cursar ---
function obtenerSemestresDisponibles(semestresCompletados, semestreMaximo, configuracion) {
  const disponibles = [];
  
  for (let sem = 1; sem <= semestreMaximo; sem++) {
    if (semestresCompletados.has(sem)) {
      continue;
    }
    
    if (puedesCursarSemestre(sem, semestresCompletados, configuracion)) {
      disponibles.push(sem);
    }
  }
  
  return disponibles;
}

// ✅ --- Seleccionar materias considerando optativas ---
function seleccionarMateriasParaCursar(
  semestreObjetivo, 
  materiasPorSemestre, 
  materiasYaCursadas,
  optativasCursadasPorSemestre,
  materiasRestantes,
  cursarTodas,
  configuracion
) {
  const materiasDelSemestre = materiasPorSemestre[semestreObjetivo];
  
  // Separar obligatorias y optativas
  const obligatorias = materiasDelSemestre.filter(m => !m.optativa);
  const optativas = materiasDelSemestre.filter(m => m.optativa);
  
  // Filtrar obligatorias no cursadas
  const obligatoriasNoCursadas = obligatorias.filter(m => {
    const idMateria = m._id || m.id;
    return !materiasYaCursadas.has(idMateria);
  });
  
  // Determinar cuántas optativas puede cursar de este semestre
  let maxOptativasSemestre = 0;
  if (semestreObjetivo === 6) {
    maxOptativasSemestre = configuracion.maxOptativasSexto;
  } else if (semestreObjetivo === 7) {
    maxOptativasSemestre = configuracion.maxOptativasSeptimo;
  }
  
  const optativasYaCursadas = optativasCursadasPorSemestre.get(semestreObjetivo) || 0;
  const optativasDisponibles = Math.max(0, maxOptativasSemestre - optativasYaCursadas);
  
  // Filtrar optativas no cursadas
  const optativasNoCursadas = optativas.filter(m => {
    const idMateria = m._id || m.id;
    return !materiasYaCursadas.has(idMateria);
  }).slice(0, optativasDisponibles);
  
  // Combinar materias disponibles
  const todasDisponibles = [...obligatoriasNoCursadas, ...optativasNoCursadas];
  
  if (todasDisponibles.length === 0) return [];
  
  // Decidir cuántas tomar
  let materiasATomar;
  if (cursarTodas && todasDisponibles.length <= materiasRestantes) {
    materiasATomar = todasDisponibles;
  } else {
    const cantidad = Math.min(
      Math.floor(Math.random() * (configuracion.materiasMaxPorPeriodo - configuracion.materiasMinPorPeriodo + 1)) + configuracion.materiasMinPorPeriodo,
      todasDisponibles.length,
      materiasRestantes
    );
    
    // Priorizar obligatorias
    const obligatoriasPrioritarias = obligatoriasNoCursadas.slice(0, cantidad);
    const espacioParaOptativas = cantidad - obligatoriasPrioritarias.length;
    const optativasSeleccionadas = optativasNoCursadas.slice(0, espacioParaOptativas);
    
    materiasATomar = [...obligatoriasPrioritarias, ...optativasSeleccionadas];
  }
  
  return materiasATomar;
}

// --- Función principal ---
async function poblarAlumnosConInscripciones() {
  console.log("=== Poblando Alumnos con Períodos Pasados y Período Actual ===\n");
  console.log(`Número de alumnos a crear: ${NUM_ALUMNOS}`);
  console.log(`Carrera: ${ID_CARRERA_DEFAULT}`);
  console.log(`Períodos pasados: ${PERIODOS_PASADOS.length}`);
  console.log(`Período actual: ${PERIODO_ACTUAL.nombre}`);
  console.log(`Semestre máximo: ${CONFIGURACION_PROGRESION.semestreMaximo}`);
  console.log(`Max optativas 6to: ${CONFIGURACION_PROGRESION.maxOptativasSexto}`);
  console.log(`Max optativas 7mo: ${CONFIGURACION_PROGRESION.maxOptativasSeptimo}`);
  console.log();

  try {
    // 1. Obtener todas las clases
    console.log("-- Obteniendo clases --");
    const todasClases = await apiCall('/clase');
    
    const clasesPorPeriodo = {};
    for (const periodo of PERIODOS_PASADOS) {
      clasesPorPeriodo[periodo.id] = [];
    }
    clasesPorPeriodo[PERIODO_ACTUAL.id] = [];

    for (const clase of todasClases) {
      const idPeriodoClase = clase.idGrupo?.idPeriodo?._id || clase.idGrupo?.idPeriodo;
      
      if (idPeriodoClase && clasesPorPeriodo[idPeriodoClase] !== undefined) {
        clasesPorPeriodo[idPeriodoClase].push(clase);
      }
    }

    console.log("Períodos pasados:");
    for (const periodo of PERIODOS_PASADOS) {
      console.log(`  ${periodo.nombre}: ${clasesPorPeriodo[periodo.id].length} clases`);
    }
    console.log(`Período actual:`);
    console.log(`  ${PERIODO_ACTUAL.nombre}: ${clasesPorPeriodo[PERIODO_ACTUAL.id].length} clases`);
    console.log("");

    // 2. Obtener todas las materias y agrupar por semestre
    console.log("-- Obteniendo materias --");
    const todasMaterias = await apiCall('/materia');
    const materiasPorId = {};
    const materiasPorSemestre = {};
    
    for (let i = 1; i <= CONFIGURACION_PROGRESION.semestreMaximo; i++) {
      materiasPorSemestre[i] = [];
    }
    
    todasMaterias.forEach(m => {
      materiasPorId[m._id || m.id] = m;
      
      const idCarrera = m.idCarrera?._id || m.idCarrera;
      if (idCarrera === ID_CARRERA_DEFAULT && 
          m.semestre >= 1 && 
          m.semestre <= CONFIGURACION_PROGRESION.semestreMaximo) {
        materiasPorSemestre[m.semestre].push(m);
      }
    });
    
    console.log(`✓ Materias cargadas: ${todasMaterias.length}`);
    for (let i = 1; i <= CONFIGURACION_PROGRESION.semestreMaximo; i++) {
      if (materiasPorSemestre[i].length > 0) {
        const obligatorias = materiasPorSemestre[i].filter(m => !m.optativa).length;
        const optativas = materiasPorSemestre[i].filter(m => m.optativa).length;
        console.log(`  - ${i}° semestre: ${obligatorias} obligatorias, ${optativas} optativas`);
      }
    }
    console.log();

    // 3. Crear mapeo de clases por materia y período
    const clasesPorMateriaYPeriodo = {};
    const todosLosPeriodos = [...PERIODOS_PASADOS, PERIODO_ACTUAL];
    
    for (const periodo of todosLosPeriodos) {
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
    let extrasCreados = 0;
    let traslapesEvitados = 0;

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
        
        const materiasYaCursadas = new Set();
        const materiasAprobadasSet = new Set();
        const materiasReprobadasSet = new Set();
        const intentosPorMateria = new Map();
        const semestresCompletados = new Set();
        
        // ✅ Rastreo de optativas cursadas por semestre
        const optativasCursadasPorSemestre = new Map(); // semestre -> cantidad
        
        const calificacionFinalPorMateria = new Map();

        // ========================================================================
        // 5. PROCESAR PERÍODOS PASADOS (similar al código anterior pero con optativas)
        // ========================================================================
        console.log(`\n  ${'─'.repeat(66)}`);
        console.log(`  PERÍODOS PASADOS`);
        console.log(`  ${'─'.repeat(66)}`);
        
        for (let indicePeriodo = 0; indicePeriodo < PERIODOS_PASADOS.length; indicePeriodo++) {
          const periodo = PERIODOS_PASADOS[indicePeriodo];
          const esUltimoPeriodoPasado = indicePeriodo === PERIODOS_PASADOS.length - 1;
          
          console.log(`\n  --- Período ${periodo.nombre} (${indicePeriodo + 1}/${PERIODOS_PASADOS.length}) ---`);
          
          const clasesDisponibles = clasesPorPeriodo[periodo.id];
          
          if (!clasesDisponibles || clasesDisponibles.length === 0) {
            console.log(`  ⚠️  No hay clases disponibles en este período`);
            continue;
          }

          // Verificar semestres completados
          for (let sem = 1; sem <= CONFIGURACION_PROGRESION.semestreMaximo; sem++) {
            if (semestreCompleto(sem, materiasPorSemestre[sem], materiasAprobadasSet, optativasCursadasPorSemestre)) {
              semestresCompletados.add(sem);
            }
          }
          
          if (semestresCompletados.size > 0) {
            console.log(`  📚 Semestres completados: ${Array.from(semestresCompletados).sort((a, b) => a - b).join(', ')}`);
          }
          if (materiasReprobadasSet.size > 0) {
            console.log(`  ⚠️  Materias reprobadas pendientes: ${materiasReprobadasSet.size}`);
          }
          
          const semestresDisponibles = obtenerSemestresDisponibles(
            semestresCompletados, 
            CONFIGURACION_PROGRESION.semestreMaximo,
            CONFIGURACION_PROGRESION
          );
          
          if (semestresDisponibles.length === 0 && materiasReprobadasSet.size === 0) {
            console.log(`  ⚠️  No hay semestres disponibles para cursar`);
            continue;
          }
          
          if (semestresDisponibles.length > 0) {
            console.log(`  📖 Semestres disponibles: ${semestresDisponibles.join(', ')}`);
          }
          
          const clasesSeleccionadas = [];
          const materiasSeleccionadas = [];
          
          let materiasRestantes = CONFIGURACION_PROGRESION.materiasMaxPorPeriodo;
          
          // PRIORIDAD 1: Recursar materias reprobadas
          if (materiasReprobadasSet.size > 0) {
            console.log(`  🔄 Recursando materias reprobadas (${materiasReprobadasSet.size})`);
            
            for (const idMateriaReprobada of materiasReprobadasSet) {
              if (materiasRestantes <= 0) break;
              
              const materia = materiasPorId[idMateriaReprobada];
              if (!materia) continue;
              
              const intentos = intentosPorMateria.get(idMateriaReprobada) || 0;
              if (intentos >= 2) {
                console.log(`    ⛔ ${materia.nombre} - Máximo de intentos alcanzado`);
                continue;
              }
              
              const clasesMateria = clasesPorMateriaYPeriodo[periodo.id][idMateriaReprobada] || [];
              
              if (clasesMateria.length === 0) {
                console.log(`    ⚠️  No hay clases para recursar: ${materia.nombre}`);
                continue;
              }
              
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
          
          // PRIORIDAD 2: Cursar materias nuevas (con control de optativas)
          if (materiasRestantes > 0 && semestresDisponibles.length > 0) {
            semestresDisponibles.sort((a, b) => a - b);
            
            for (const semestreObjetivo of semestresDisponibles) {
              if (materiasRestantes <= 0) break;
              
              const cursarTodas = Math.random() < CONFIGURACION_PROGRESION.probabilidadCursarTodas;
              
              // ✅ Usar función que maneja optativas
              const materiasATomar = seleccionarMateriasParaCursar(
                semestreObjetivo,
                materiasPorSemestre,
                materiasYaCursadas,
                optativasCursadasPorSemestre,
                materiasRestantes,
                cursarTodas,
                CONFIGURACION_PROGRESION
              );
              
              if (materiasATomar.length === 0) continue;
              
              console.log(`  📝 Cursando ${materiasATomar.length} materias de ${semestreObjetivo}° semestre`);
              
              for (const materia of materiasATomar) {
                const idMateria = materia._id || materia.id;
                
                const clasesMateria = clasesPorMateriaYPeriodo[periodo.id][idMateria] || [];
                
                if (clasesMateria.length === 0) {
                  console.log(`    ⚠️  No hay clases para: ${materia.nombre}`);
                  continue;
                }
                
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

            // Crear inscripciones a clases y calificaciones (código similar al anterior)
            for (const item of clasesSeleccionadas) {
              const clase = item.clase;
              const materia = item.materia;
              const esRecursada = item.esRecursada;
              
              const idClase = clase._id || clase.id;
              const idMateria = materia._id || materia.id;
              const nombreMateria = clase.idMateria?.nombre || materia.nombre || 'Materia';
              const semestreMateria = clase.idMateria?.semestre || materia.semestre || '?';
              const esOptativa = materia.optativa || false;
              
              try {
                let aprueba = true;
                let probabilidadReprobar = CONFIGURACION_PROGRESION.probabilidadReprobar;
                
                if (esRecursada) {
                  probabilidadReprobar = CONFIGURACION_PROGRESION.probabilidadReprobarSegundaVez;
                  
                  if (!esUltimoPeriodoPasado) {
                    aprueba = Math.random() >= probabilidadReprobar;
                  } else {
                    aprueba = true;
                  }
                } else {
                  aprueba = Math.random() >= probabilidadReprobar;
                }
                
                const intentos = intentosPorMateria.get(idMateria) || 0;
                if (intentos === 1 && esUltimoPeriodoPasado) {
                  aprueba = true;
                }
                
                let estatusFinal = aprueba ? 'Aprobado' : 'Reprobado';
                let calificacionOrd = generarCalificacion(aprueba, false);
                
                intentosPorMateria.set(idMateria, (intentosPorMateria.get(idMateria) || 0) + 1);
                
                let presentaExtra = false;
                let califExtra = null;
                
                if (!aprueba && calificacionOrd < 6) {
                  presentaExtra = Math.random() < CONFIGURACION_PROGRESION.probabilidadPresentarExtra;
                  
                  if (presentaExtra) {
                    const apruebaExtra = Math.random() < CONFIGURACION_PROGRESION.probabilidadAprobarExtra;
                    califExtra = generarCalificacion(apruebaExtra, false);
                    
                    if (apruebaExtra) {
                      estatusFinal = 'Aprobado';
                    }
                  }
                }
                
                const inscripcionClaseData = {
                  idInscripcion: idInscripcion,
                  idClase: idClase,
                  estatus: estatusFinal
                };

                const inscripcionClaseCreada = await apiCall('/inscripcionclase', 'POST', inscripcionClaseData);
                const idInscripcionClase = inscripcionClaseCreada._id || inscripcionClaseCreada.id;
                inscripcionesClaseCreadas++;

                await apiCall('/calificacion', 'POST', {
                  idInscripcionClase: idInscripcionClase,
                  valor: calificacionOrd,
                  fechaRegistro: new Date(),
                  tipoEvaluacion: 'Ord'
                });
                calificacionesCreadas++;
                
                if (presentaExtra && califExtra !== null) {
                  await apiCall('/calificacion', 'POST', {
                    idInscripcionClase: idInscripcionClase,
                    valor: califExtra,
                    fechaRegistro: new Date(),
                    tipoEvaluacion: 'Ext'
                  });
                  calificacionesCreadas++;
                  extrasCreados++;
                }

                if (estatusFinal === 'Aprobado') {
                  materiasAprobadasSet.add(idMateria);
                  materiasReprobadasSet.delete(idMateria);
                  materiasAprobadas++;
                  
                  // ✅ Contar optativa si fue aprobada
                  if (esOptativa) {
                    const cantidadActual = optativasCursadasPorSemestre.get(semestreMateria) || 0;
                    optativasCursadasPorSemestre.set(semestreMateria, cantidadActual + 1);
                  }
                  
                  const califFinal = (presentaExtra && califExtra !== null && califExtra >= 6) ? califExtra : calificacionOrd;
                  calificacionFinalPorMateria.set(idMateria, califFinal);
                  
                  const emoji = esRecursada ? '🔄✓' : '✓';
                  const etiqueta = esRecursada ? ' (Recursada)' : '';
                  const tipoMateria = esOptativa ? ' [Optativa]' : '';
                  const infoExtra = presentaExtra ? ` [Ord: ${calificacionOrd}, Ext: ${califExtra}]` : '';
                  console.log(`    ${emoji} [${semestreMateria}°] ${nombreMateria}${tipoMateria}: ${califFinal}${etiqueta}${infoExtra}`);
                } else {
                  materiasReprobadasSet.add(idMateria);
                  materiasReprobadas++;
                  materiasReprobadasTotal++;
                  
                  const intentosActuales = intentosPorMateria.get(idMateria);
                  const infoExtra = presentaExtra ? ` [Ext: ${califExtra}]` : ' (No presentó Ext)';
                  console.log(`    ✗ [${semestreMateria}°] ${nombreMateria}: ${calificacionOrd}${infoExtra} (REPROBADA - Intento ${intentosActuales}/2)`);
                }

                if (estatusFinal === 'Aprobado') {
                  const califParaPromedio = (presentaExtra && califExtra !== null && califExtra >= 6) ? califExtra : calificacionOrd;
                  sumaCalificaciones += califParaPromedio;
                }

              } catch (error) {
                console.error(`    ✗ Error en clase ${nombreMateria}:`, error.message);
              }
            }

          } catch (error) {
            console.error(`  ✗ Error creando inscripción período ${periodo.nombre}:`, error.message);
          }
        }

        // ========================================================================
        // 6. PROCESAR PERÍODO ACTUAL (CON VALIDACIÓN DE TRASLAPES)
        // ========================================================================
        console.log(`\n  ${'─'.repeat(66)}`);
        console.log(`  PERÍODO ACTUAL: ${PERIODO_ACTUAL.nombre}`);
        console.log(`  ${'─'.repeat(66)}`);
        
        for (let sem = 1; sem <= CONFIGURACION_PROGRESION.semestreMaximo; sem++) {
          if (semestreCompleto(sem, materiasPorSemestre[sem], materiasAprobadasSet, optativasCursadasPorSemestre)) {
            semestresCompletados.add(sem);
          }
        }
        
        if (semestresCompletados.size > 0) {
          console.log(`  📚 Semestres completados: ${Array.from(semestresCompletados).sort((a, b) => a - b).join(', ')}`);
        }
        if (materiasReprobadasSet.size > 0) {
          console.log(`  ⚠️  Materias reprobadas pendientes: ${materiasReprobadasSet.size}`);
        }
        
        const semestresDisponiblesActual = obtenerSemestresDisponibles(
          semestresCompletados, 
          CONFIGURACION_PROGRESION.semestreMaximo,
          CONFIGURACION_PROGRESION
        );
        
        if (semestresDisponiblesActual.length > 0) {
          console.log(`  📖 Semestres disponibles: ${semestresDisponiblesActual.join(', ')}`);
        }
        
        const clasesSeleccionadasActual = [];
        const materiasSeleccionadasActual = [];
        
        // ✅ Array para rastrear clases ya inscritas (para validar traslapes)
        const clasesInscritasActual = [];
        
        let materiasRestantesActual = CONFIGURACION_PROGRESION.materiasMaxPorPeriodo;
        
        // PRIORIDAD 1: Recursar materias reprobadas
        if (materiasReprobadasSet.size > 0) {
          console.log(`  🔄 Recursando materias reprobadas (${materiasReprobadasSet.size})`);
          
          for (const idMateriaReprobada of materiasReprobadasSet) {
            if (materiasRestantesActual <= 0) break;
            
            const materia = materiasPorId[idMateriaReprobada];
            if (!materia) continue;
            
            const clasesMateria = clasesPorMateriaYPeriodo[PERIODO_ACTUAL.id][idMateriaReprobada] || [];
            
            if (clasesMateria.length === 0) {
              console.log(`    ⚠️  No hay clases para recursar: ${materia.nombre}`);
              continue;
            }
            
            let claseSeleccionada = null;
            let intentosClase = 0;

            for (const clase of clasesMateria) {
              intentosClase++;
              const idClase = clase._id || clase.id;
              const cupoMaximo = clase.cupoMaximo || 30;
              
              // Verificar traslape
              const hayTraslape = verificarTraslapesHorario(clase, clasesInscritasActual);
              if (hayTraslape) {
                traslapesEvitados++;
                continue; // Probar con la siguiente clase de esta materia
              }
              
              // Verificar cupo
              const tieneCupo = await verificarCupoDisponible(idClase, cupoMaximo);
              if (!tieneCupo) {
                continue; // Probar con la siguiente clase de esta materia
              }
              
              // ✅ Clase válida encontrada
              claseSeleccionada = clase;
              break;
            }

            if (!claseSeleccionada) {
              console.log(`    ⚠️  No hay clases disponibles para: ${materia.nombre} (${intentosClase} clases revisadas)`);
              continue;
            }
            
            clasesSeleccionadasActual.push({
              clase: claseSeleccionada,
              materia: materia,
              esRecursada: true
            });
            materiasSeleccionadasActual.push(materia);
            clasesInscritasActual.push(claseSeleccionada);
            materiasRestantesActual--;
          }
        }
        
        // PRIORIDAD 2: Cursar materias nuevas (con control de optativas y traslapes)
        if (materiasRestantesActual > 0 && semestresDisponiblesActual.length > 0) {
          semestresDisponiblesActual.sort((a, b) => a - b);
          
          for (const semestreObjetivo of semestresDisponiblesActual) {
            if (materiasRestantesActual <= 0) break;
            
            const cursarTodas = Math.random() < CONFIGURACION_PROGRESION.probabilidadCursarTodas;
            
            const materiasATomar = seleccionarMateriasParaCursar(
              semestreObjetivo,
              materiasPorSemestre,
              materiasYaCursadas,
              optativasCursadasPorSemestre,
              materiasRestantesActual,
              cursarTodas,
              CONFIGURACION_PROGRESION
            );
            
            if (materiasATomar.length === 0) continue;
            
            console.log(`  📝 Cursando ${materiasATomar.length} materias de ${semestreObjetivo}° semestre`);
            
            for (const materia of materiasATomar) {
              const idMateria = materia._id || materia.id;
              
              const clasesMateria = clasesPorMateriaYPeriodo[PERIODO_ACTUAL.id][idMateria] || [];
              
              if (clasesMateria.length === 0) {
                console.log(`    ⚠️  No hay clases para: ${materia.nombre}`);
                continue;
              }
              
              let claseSeleccionada = null;
              let intentosClase = 0;

              for (const clase of clasesMateria) {
                intentosClase++;
                const idClase = clase._id || clase.id;
                const cupoMaximo = clase.cupoMaximo || 30;
                
                // Verificar traslape
                const hayTraslape = verificarTraslapesHorario(clase, clasesInscritasActual);
                if (hayTraslape) {
                  traslapesEvitados++;
                  continue; // Probar con la siguiente clase de esta materia
                }
                
                // Verificar cupo
                const tieneCupo = await verificarCupoDisponible(idClase, cupoMaximo);
                if (!tieneCupo) {
                  continue; // Probar con la siguiente clase de esta materia
                }
                
                // ✅ Clase válida encontrada
                claseSeleccionada = clase;
                break;
              }

              if (!claseSeleccionada) {
                console.log(`    ⚠️  No hay clases disponibles para: ${materia.nombre} (${intentosClase} clases revisadas)`);
                continue;
              }
              
              clasesSeleccionadasActual.push({
                clase: claseSeleccionada,
                materia: materia,
                esRecursada: false
              });
              materiasSeleccionadasActual.push(materia);
              clasesInscritasActual.push(claseSeleccionada);
              materiasYaCursadas.add(idMateria);
              materiasRestantesActual--;
              
              if (materiasRestantesActual <= 0) break;
            }
            
            if (materiasRestantesActual <= 0) break;
          }
        }

        if (clasesSeleccionadasActual.length === 0) {
          console.log(`  ⚠️  No se pudieron seleccionar clases para el período actual`);
        } else {
          const creditosPeriodoActual = calcularCreditos(materiasSeleccionadasActual);

          try {
            const inscripcionDataActual = {
              idAlumno: idAlumno,
              idPeriodo: PERIODO_ACTUAL.id,
              fechaInscripcion: new Date(),
              creditos: creditosPeriodoActual
            };

            const inscripcionCreadaActual = await apiCall('/inscripcion', 'POST', inscripcionDataActual);
            const idInscripcionActual = inscripcionCreadaActual._id || inscripcionCreadaActual.id;
            inscripcionesCreadas++;
            
            console.log(`  ✓ Inscripción creada: ${idInscripcionActual}`);
            console.log(`    Créditos: ${creditosPeriodoActual}`);
            console.log(`    Clases inscritas: ${clasesSeleccionadasActual.length}`);

            for (const item of clasesSeleccionadasActual) {
              const clase = item.clase;
              const materia = item.materia;
              const esRecursada = item.esRecursada;
              
              const idClase = clase._id || clase.id;
              const idMateria = materia._id || materia.id;
              const nombreMateria = clase.idMateria?.nombre || materia.nombre || 'Materia';
              const semestreMateria = clase.idMateria?.semestre || materia.semestre || '?';
              const esOptativa = materia.optativa || false;
              
              try {
                const inscripcionClaseDataActual = {
                  idInscripcion: idInscripcionActual,
                  idClase: idClase,
                  estatus: 'Inscrito'
                };

                const inscripcionClaseCreadaActual = await apiCall('/inscripcionclase', 'POST', inscripcionClaseDataActual);
                const idInscripcionClaseActual = inscripcionClaseCreadaActual._id || inscripcionClaseCreadaActual.id;
                inscripcionesClaseCreadas++;

                const P1 = parseFloat(generarCalificacion(Math.random() > 0.3, true));
                const P2 = parseFloat(generarCalificacion(Math.random() > 0.3, true));
                const P3 = parseFloat(generarCalificacion(Math.random() > 0.3, true));
                
                await apiCall('/calificacion', 'POST', {
                  idInscripcionClase: idInscripcionClaseActual,
                  valor: P1,
                  fechaRegistro: new Date(),
                  tipoEvaluacion: 'P1'
                });
                calificacionesCreadas++;
                
                await apiCall('/calificacion', 'POST', {
                  idInscripcionClase: idInscripcionClaseActual,
                  valor: P2,
                  fechaRegistro: new Date(),
                  tipoEvaluacion: 'P2'
                });
                calificacionesCreadas++;
                
                await apiCall('/calificacion', 'POST', {
                  idInscripcionClase: idInscripcionClaseActual,
                  valor: P3,
                  fechaRegistro: new Date(),
                  tipoEvaluacion: 'P3'
                });
                calificacionesCreadas++;
                
                const promedioOrd = calcularPromedioP1P2P3(P1, P2, P3);
                const apruebaOrd = promedioOrd >= 6;
                
                await apiCall('/calificacion', 'POST', {
                  idInscripcionClase: idInscripcionClaseActual,
                  valor: promedioOrd,
                  fechaRegistro: new Date(),
                  tipoEvaluacion: 'Ord'
                });
                calificacionesCreadas++;
                
                let presentaExtraActual = false;
                let califExtraActual = null;
                
                if (!apruebaOrd && promedioOrd < 6) {
                  presentaExtraActual = Math.random() < CONFIGURACION_PROGRESION.probabilidadPresentarExtra;
                  
                  if (presentaExtraActual) {
                    const apruebaExtra = Math.random() < CONFIGURACION_PROGRESION.probabilidadAprobarExtra;
                    califExtraActual = parseFloat(generarCalificacion(apruebaExtra, false)); 
                    
                    await apiCall('/calificacion', 'POST', {
                      idInscripcionClase: idInscripcionClaseActual,
                      valor: califExtraActual,
                      fechaRegistro: new Date(),
                      tipoEvaluacion: 'Ext'
                    });
                    calificacionesCreadas++;
                    extrasCreados++;
                  }
                }
                
                const etiqueta = esRecursada ? ' (Recursada)' : '';
                const tipoMateria = esOptativa ? ' [Optativa]' : '';
                const infoCalifs = `[P1: ${P1}, P2: ${P2}, P3: ${P3}, Ord: ${promedioOrd}]`;
                const infoExtra = presentaExtraActual ? `, Ext: ${califExtraActual}` : '';
                const emoji = apruebaOrd || (presentaExtraActual && califExtraActual >= 6) ? '📝' : '⚠️';
                
                console.log(`    ${emoji} [${semestreMateria}°] ${nombreMateria}${tipoMateria}${etiqueta} ${infoCalifs}${infoExtra}`);

              } catch (error) {
                console.error(`    ✗ Error en clase ${nombreMateria}:`, error.message);
              }
            }

          } catch (error) {
            console.error(`  ✗ Error creando inscripción período actual:`, error.message);
          }
        }

        // 7. Actualizar alumno
        for (let sem = 1; sem <= CONFIGURACION_PROGRESION.semestreMaximo; sem++) {
          if (semestreCompleto(sem, materiasPorSemestre[sem], materiasAprobadasSet, optativasCursadasPorSemestre)) {
            semestresCompletados.add(sem);
          }
        }

        let situacionEscolar = 'Regular';
        if (materiasReprobadasSet.size > 0) {
          situacionEscolar = 'Irregular';
        }

        const totalMaterias = materiasAprobadas + materiasReprobadas;
        if (totalMaterias > 0) {
          const promedio = (sumaCalificaciones / materiasAprobadas).toFixed(2);
          
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
            console.log(`    Promedio (períodos pasados): ${promedio}`);
            console.log(`    Créditos cursados: ${creditosTotales}`);
            console.log(`    Materias aprobadas: ${materiasAprobadas}`);
            console.log(`    Materias reprobadas (histórico): ${materiasReprobadas}`);
            console.log(`    Materias pendientes: ${materiasReprobadasSet.size}`);
            console.log(`    Materias únicas cursadas: ${materiasYaCursadas.size}`);
            console.log(`    Semestres completados: ${Array.from(semestresCompletados).sort((a, b) => a - b).join(', ') || 'Ninguno completo'}`);
            console.log(`    Clases en período actual: ${clasesSeleccionadasActual.length}`);
            
            // Mostrar optativas cursadas
            if (optativasCursadasPorSemestre.size > 0) {
              console.log(`    Optativas cursadas:`);
              for (const [sem, cant] of optativasCursadasPorSemestre) {
                console.log(`      - ${sem}° semestre: ${cant}`);
              }
            }
            
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
    console.log(`Extraordinarios presentados: ${extrasCreados}`);
    console.log(`Traslapes de horario evitados: ${traslapesEvitados}`);
    console.log(`Materias reprobadas (total histórico): ${materiasReprobadasTotal}`);
    console.log("\n✓ Proceso completado exitosamente.");

  } catch (error) {
    console.error("\n✗ ERROR GENERAL:", error.message);
    console.error(error.stack);
  }
}

// Ejecutar
poblarAlumnosConInscripciones();