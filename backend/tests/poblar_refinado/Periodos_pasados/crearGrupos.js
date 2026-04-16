import fs from 'fs';

// --- Configuración ---
const API_URL = "https://paidea.onrender.com";
const ID_CARRERA_DEFAULT = "690eacdab43948f952b9244f"; // IIA
//const ID_CARRERA_DEFAULT = "692265322d970dc69b0fe295"; // LCD 
// const ID_CARRERA_DEFAULT = "692273ce2d970dc69b0fe298"; // ISC 2020 

// Configurar los 3 períodos pasados (ajusta estos IDs según tu BD)
const PERIODOS_PASADOS = [
  { id: "693760fc7059ce707e55cc5f", nombre: "2022-2" },
  { id: "693760fc7059ce707e55cc5d", nombre: "2023-1" },
  { id: "693760d2a5d4dea828f2cf86", nombre: "2023-2" },
  { id: "693760d2a5d4dea828f2cf84", nombre: "2024-1" },
  { id: "690eace7b43948f952b924cb", nombre: "2024-2" },
  { id: "690eace7b43948f952b924c9", nombre: "2025-1" },
  { id: "690eace7b43948f952b924c7", nombre: "2025-2" }
];

const SEMESTRES_POR_PERIODO = {
  //"693760fc7059ce707e55cc5f": [1],
  //"693760fc7059ce707e55cc5d": [1, 2],
  //"693760d2a5d4dea828f2cf86": [1, 2, 3],
  "693760d2a5d4dea828f2cf84": [4],
  "690eace7b43948f952b924cb": [4, 5],
  "690eace7b43948f952b924c9": [4, 5, 6],
  "690eace7b43948f952b924c7": [4, 5, 6, 7]
};

const GRUPOS_POR_SEMESTRE = 2; // Cuántos grupos crear por semestre
const TURNOS = ['Matutino', 'Vespertino'];
const SEMESTRE_MAXIMO = 8; // ✅ Semestre máximo a procesar

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

// --- Obtener un profesor cualquiera (solo para cumplir requisito de ID) ---
async function obtenerUnProfesor() {
  try {
    const profesores = await apiCall('/usuario/profesores');
    if (!profesores || profesores.length === 0) {
      throw new Error("No se encontraron profesores disponibles");
    }
    return profesores[0]._id || profesores[0].id;
  } catch (error) {
    console.error("Error al obtener profesor:", error.message);
    throw error;
  }
}

// --- Obtener un día cualquiera (solo para cumplir requisito de horario) ---
async function obtenerUnDia() {
  try {
    const dias = await apiCall('/diasemana');
    if (!dias || dias.length === 0) {
      throw new Error("No se encontraron días disponibles");
    }
    return dias[0]._id || dias[0].id;
  } catch (error) {
    console.error("Error al obtener día:", error.message);
    throw error;
  }
}

// --- Función principal ---
async function poblarGruposYClasesPeriodosPasados() {
  console.log("=== Poblando Grupos y Clases de Períodos Pasados ===");
  console.log("(Con campos vacíos: sin horarios específicos, profesores ni salones)\n");
  console.log(`Carrera: ${ID_CARRERA_DEFAULT}`);
  console.log(`Períodos a procesar: ${PERIODOS_PASADOS.length}`);
  console.log(`Semestre máximo: ${SEMESTRE_MAXIMO}\n`);

  try {
    // 1. Obtener un profesor y un día genéricos (solo para cumplir validaciones)
    console.log("-- Obteniendo datos básicos para validaciones --");
    const idProfesorGenerico = await obtenerUnProfesor();
    const idDiaGenerico = await obtenerUnDia();
    console.log(`✓ Profesor genérico: ${idProfesorGenerico}`);
    console.log(`✓ Día genérico: ${idDiaGenerico}\n`);

    // 2. Obtener todas las materias de la carrera
    console.log("-- Obteniendo materias --");
    const todasMaterias = await apiCall(`/materia`);
    const materiasFiltradas = todasMaterias.filter(m => {
      const idMateria = m.idCarrera?._id || m.idCarrera;
      return idMateria === ID_CARRERA_DEFAULT;
    });
    console.log(`✓ Materias de la carrera: ${materiasFiltradas.length}\n`);

    // ✅ Agrupar materias por semestre (solo obligatorias, hasta SEMESTRE_MAXIMO)
    const materiasPorSemestre = {};
    materiasFiltradas.forEach(m => {
      if (!m.optativa && m.semestre >= 1 && m.semestre <= SEMESTRE_MAXIMO) {
        if (!materiasPorSemestre[m.semestre]) {
          materiasPorSemestre[m.semestre] = [];
        }
        materiasPorSemestre[m.semestre].push(m);
      }
    });

    // Mostrar resumen de materias por semestre
    console.log("Materias obligatorias por semestre:");
    for (let sem = 1; sem <= SEMESTRE_MAXIMO; sem++) {
      if (materiasPorSemestre[sem] && materiasPorSemestre[sem].length > 0) {
        console.log(`  ${sem}° semestre: ${materiasPorSemestre[sem].length} materias`);
      }
    }
    console.log();

    let gruposCreados = 0;
    let clasesCreadas = 0;
    const gruposCreatedData = {}; // Para almacenar los grupos creados

    // 3. Procesar cada período
    for (const periodo of PERIODOS_PASADOS) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`PERÍODO: ${periodo.nombre} (${periodo.id})`);
      console.log('='.repeat(60));

      const semestres = SEMESTRES_POR_PERIODO[periodo.id];
      
      if (!semestres) {
        console.log(`⚠️  No hay semestres configurados para este período`);
        continue;
      }

      console.log(`Semestres a crear: ${semestres.join(', ')}`);

      // Procesar cada semestre del período
      for (const semestre of semestres) {
        console.log(`\n--- SEMESTRE ${semestre} ---`);
        
        const materiasSemestre = materiasPorSemestre[semestre] || [];
        console.log(`Materias obligatorias: ${materiasSemestre.length}`);

        if (materiasSemestre.length === 0) {
          console.log(`⚠️  No hay materias para este semestre`);
          continue;
        }

        // Mostrar las materias
        console.log(`Materias:`);
        materiasSemestre.forEach(m => {
          console.log(`  - ${m.nombre}`);
        });

        // Crear grupos para este semestre
        for (let i = 0; i < GRUPOS_POR_SEMESTRE; i++) {
          const turno = TURNOS[i % TURNOS.length];
          const nombreGrupo = `${semestre}${String.fromCharCode(65 + i)}${turno.charAt(0)}`;
          
          console.log(`\n  Creando grupo: ${nombreGrupo} (${turno})`);

          try {
            // Crear el grupo
            const grupoData = {
              nombre: nombreGrupo,
              idCarrera: ID_CARRERA_DEFAULT,
              semestre: semestre,
              turno: turno,
              idPeriodo: periodo.id
            };

            const grupoCreado = await apiCall('/grupo', 'POST', grupoData);
            const idGrupo = grupoCreado._id || grupoCreado.id;
            gruposCreados++;
            
            console.log(`    ✓ Grupo creado: ${idGrupo}`);

            // Guardar referencia del grupo
            if (!gruposCreatedData[periodo.id]) {
              gruposCreatedData[periodo.id] = {};
            }
            if (!gruposCreatedData[periodo.id][semestre]) {
              gruposCreatedData[periodo.id][semestre] = [];
            }
            gruposCreatedData[periodo.id][semestre].push({
              id: idGrupo,
              nombre: nombreGrupo,
              turno: turno
            });

            // Crear clases para todas las materias del semestre
            // SIN salón, con profesor genérico y horario mínimo
            for (const materia of materiasSemestre) {
              try {
                // Crear horario mínimo (solo un día con el ID genérico)
                const horario = {
                  lunes: {
                    idDia: idDiaGenerico
                  }
                };

                // Crear la clase SIN salón (null), SIN profesor (null) y horario mínimo
                const claseData = {
                  idGrupo: idGrupo,
                  idMateria: materia._id || materia.id,
                  salon: null,
                  cupoMaximo: 30,
                  idProfesor: null,
                  horario: horario
                };

                await apiCall('/clase', 'POST', claseData);
                clasesCreadas++;
                
                console.log(`      ✓ Clase creada: ${materia.nombre}`);
                
              } catch (error) {
                console.error(`      ✗ Error creando clase: ${materia.nombre}`);
                console.error(`        ${error.message}`);
              }
            }

          } catch (error) {
            console.error(`  ✗ Error creando grupo ${nombreGrupo}:`, error.message);
          }
        }
      }
    }

    // Resumen final
    console.log(`\n${'='.repeat(60)}`);
    console.log("RESUMEN FINAL");
    console.log('='.repeat(60));
    console.log(`Períodos procesados: ${PERIODOS_PASADOS.length}`);
    console.log(`Grupos creados: ${gruposCreados}`);
    console.log(`Clases creadas: ${clasesCreadas}`);
    
    // Resumen por semestre
    console.log("\nGrupos creados por semestre:");
    const gruposPorSemestre = {};
    for (let sem = 1; sem <= SEMESTRE_MAXIMO; sem++) {
      gruposPorSemestre[sem] = 0;
    }
    
    Object.values(gruposCreatedData).forEach(periodo => {
      Object.keys(periodo).forEach(sem => {
        gruposPorSemestre[parseInt(sem)] += periodo[sem].length;
      });
    });
    
    for (let sem = 1; sem <= SEMESTRE_MAXIMO; sem++) {
      if (gruposPorSemestre[sem] > 0) {
        console.log(`  ${sem}° semestre: ${gruposPorSemestre[sem]} grupos`);
      }
    }
    
    console.log("\nNOTA: Todas las clases tienen:");
    console.log("  - Salón: null");
    console.log("  - Profesor: null");
    console.log("  - Horario: mínimo (solo lunes con día genérico)");
    console.log("\n✓ Proceso completado.");

    // Guardar información de grupos creados para el siguiente script
    fs.writeFileSync('./grupos-periodos-pasados.json', JSON.stringify(gruposCreatedData, null, 2));
    console.log("\n✓ Información de grupos guardada en 'grupos-periodos-pasados.json'");

  } catch (error) {
    console.error("\n✗ ERROR GENERAL:", error.message);
    console.error(error.stack);
  }
}

// Ejecutar
poblarGruposYClasesPeriodosPasados();