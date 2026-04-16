// --- Configuración ---
const API_URL = "https://paidea.onrender.com";
const ID_CARRERA_DEFAULT = "690eacdab43948f952b9244f"; // IIA
// const ID_CARRERA_DEFAULT = "692265322d970dc69b0fe295"; // LCD 
// const ID_CARRERA_DEFAULT = "692273ce2d970dc69b0fe298"; // ISC 2020 
const ID_PERIODO_DEFAULT = "690eacd9b43948f952b9243f"; // 2026-1

// *** CONFIGURACIÓN: Selecciona los semestres para los que se crearán ETS ***
const SEMESTRES_A_PROCESAR = [1, 2, 3, 4, 5, 6, 7, 8]; // Modifica esta lista según necesites

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

// --- Función para obtener profesores ---
async function obtenerProfesores() {
  try {
    const profesores = await apiCall('/usuario/profesores');
    if (!profesores || profesores.length === 0) {
      throw new Error("No se encontraron profesores disponibles");
    }
    return profesores;
  } catch (error) {
    console.error("Error al obtener profesores:", error.message);
    throw error;
  }
}

// --- Función para seleccionar un profesor aleatorio ---
function seleccionarProfesorAleatorio(profesores) {
  const indiceAleatorio = Math.floor(Math.random() * profesores.length);
  return profesores[indiceAleatorio];
}

// --- Función para obtener un DiaSemana aleatorio ---
async function obtenerDiaSemanaAleatorio() {
  try {
    const diasSemana = await apiCall('/diaSemana');
    if (!diasSemana || diasSemana.length === 0) {
      throw new Error("No se encontraron días de la semana disponibles");
    }
    const indiceAleatorio = Math.floor(Math.random() * diasSemana.length);
    return diasSemana[indiceAleatorio];
  } catch (error) {
    console.error("Error al obtener días de la semana:", error.message);
    throw error;
  }
}

// --- Función para generar número de salón según la carrera ---
function generarSalon(idCarrera) {
  let primerDigito;
  
  if (idCarrera === "690eacdab43948f952b9244f") { // IIA
    primerDigito = Math.random() < 0.5 ? 3 : 4;
  } else if (idCarrera === "692265322d970dc69b0fe295") { // LCD
    primerDigito = Math.random() < 0.5 ? 3 : 4;
  } else if (idCarrera === "692273ce2d970dc69b0fe298") { // ISC 2020
    primerDigito = Math.random() < 0.5 ? 1 : 2;
  } else {
    primerDigito = 1; // Por defecto
  }
  
  const segundoDigito = Math.floor(Math.random() * 3); // 0, 1, o 2
  const tercerDigito = Math.floor(Math.random() * 2); // 0 o 1
  const cuartoDigito = Math.floor(Math.random() * 10); // 0-9
  
  return `${primerDigito}${segundoDigito}${tercerDigito}${cuartoDigito}`;
}

// --- Función principal para crear ETS ---
async function crearETSAutomatico() {
  console.log("=== Iniciando creación automática de ETS ===\n");
  console.log(`Carrera: ${ID_CARRERA_DEFAULT}`);
  console.log(`Periodo: ${ID_PERIODO_DEFAULT}`);
  console.log(`Semestres a procesar: ${SEMESTRES_A_PROCESAR.join(', ')}\n`);

  try {
    // 1. Obtener profesores
    console.log("-- Obteniendo profesores --");
    const profesores = await obtenerProfesores();
    console.log(`✓ Profesores disponibles: ${profesores.length}\n`);

    // 2. Obtener todas las materias
    console.log("-- Obteniendo materias --");
    const todasMaterias = await apiCall(`/materia`);
    
    // Filtrar materias por carrera
    const materiasFiltradas = todasMaterias.filter(m => {
      const idMateria = m.idCarrera?._id || m.idCarrera;
      return idMateria === ID_CARRERA_DEFAULT;
    });
    
    console.log(`✓ Total de materias: ${todasMaterias.length}`);
    console.log(`✓ Materias de la carrera: ${materiasFiltradas.length}\n`);

    // 3. Filtrar materias obligatorias de los semestres seleccionados
    console.log("-- Filtrando materias obligatorias --");
    const materiasObligatorias = materiasFiltradas.filter(m => 
      !m.optativa && SEMESTRES_A_PROCESAR.includes(m.semestre)
    );
    
    console.log(`✓ Materias obligatorias a procesar: ${materiasObligatorias.length}\n`);

    if (materiasObligatorias.length === 0) {
      console.log("No se encontraron materias obligatorias para procesar.");
      return;
    }

    // 4. Agrupar por semestre para mejor visualización
    const materiasPorSemestre = {};
    materiasObligatorias.forEach(m => {
      if (!materiasPorSemestre[m.semestre]) {
        materiasPorSemestre[m.semestre] = [];
      }
      materiasPorSemestre[m.semestre].push(m);
    });

    // 5. Crear ETS para cada materia
    let etsCreados = 0;
    let etsError = 0;

    for (const semestre of Object.keys(materiasPorSemestre).sort()) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`SEMESTRE ${semestre}`);
      console.log('='.repeat(60));
      
      const materiasSemestre = materiasPorSemestre[semestre];
      console.log(`Total de materias obligatorias: ${materiasSemestre.length}\n`);

      for (const materia of materiasSemestre) {
        try {
          // Seleccionar profesor aleatorio
          const profesorAleatorio = seleccionarProfesorAleatorio(profesores);
          const idProfesor = profesorAleatorio._id || profesorAleatorio.id;
          const nombreProfesor = profesorAleatorio.nombre || 'N/A';

          // Obtener día/horario aleatorio
          const diaSemana = await obtenerDiaSemanaAleatorio();
          const idDiaSemana = diaSemana._id || diaSemana.id;

          // Generar salón
          const salon = generarSalon(ID_CARRERA_DEFAULT);

          // Crear ETS
          const etsData = {
            idProfesor: idProfesor,
            idCarrera: ID_CARRERA_DEFAULT,
            idMateria: materia._id || materia.id,
            idDiaSemana: idDiaSemana,
            idPeriodo: ID_PERIODO_DEFAULT,
            salon: salon
          };

          await apiCall('/ets', 'POST', etsData);
          etsCreados++;

          console.log(`  ✓ ETS creado: ${materia.nombre}`);
          console.log(`    Clave: ${materia.clave}`);
          console.log(`    Profesor: ${nombreProfesor}`);
          console.log(`    Horario: ${diaSemana.horarioInicio} - ${diaSemana.horarioFinal}`);
          console.log(`    Salón: ${salon}`);

        } catch (error) {
          etsError++;
          console.error(`  ✗ Error al crear ETS para ${materia.nombre}:`);
          console.error(`    ${error.message}`);
        }
      }
    }

    // Resumen final
    console.log(`\n${'='.repeat(60)}`);
    console.log("RESUMEN FINAL");
    console.log('='.repeat(60));
    console.log(`Materias procesadas: ${materiasObligatorias.length}`);
    console.log(`ETS creados exitosamente: ${etsCreados}`);
    console.log(`ETS con error: ${etsError}`);
    console.log(`Profesores en rotación: ${profesores.length}`);
    console.log("\n✓ Proceso completado.");

  } catch (error) {
    console.error("\n✗ ERROR GENERAL:", error.message);
    console.error(error.stack);
  }
}

// Ejecutar
crearETSAutomatico();