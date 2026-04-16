import fs from 'fs';

// --- Configuración ---
const API_URL = "https://paidea.onrender.com";
//const ID_CARRERA_DEFAULT = "690eacdab43948f952b9244f"; // IIA
const ID_CARRERA_DEFAULT = "692265322d970dc69b0fe295"; // LCD 
// const ID_CARRERA_DEFAULT = "692273ce2d970dc69b0fe298"; // ISC 2020 
const ID_PERIODO_DEFAULT = "690eacd9b43948f952b9243f"; // 2026-1
const SEMESTRES_A_PROCESAR = [1,2,3,4,5,6,7,8]; // Modifica esta lista según necesites

const MAX_CLASES_POR_GRUPO = 7;

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

// --- Cargar configuración de horarios ---
function cargarConfiguracionHorarios() {
  try {
    const data = fs.readFileSync('./configuracion-horarios.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error al cargar configuración de horarios:", error.message);
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
    primerDigito = 1;
  }
  
  const segundoDigito = Math.floor(Math.random() * 3); // 0, 1, o 2
  const tercerDigito = Math.floor(Math.random() * 2); // 0 o 1
  const cuartoDigito = Math.floor(Math.random() * 10); // 0-9
  
  return `${primerDigito}${segundoDigito}${tercerDigito}${cuartoDigito}`;
}

// --- Función para separar materias obligatorias y optativas ---
function separarMaterias(materias) {
  // Usar el campo 'optativa' (boolean) del modelo
  const obligatorias = materias.filter(m => !m.optativa);
  const optativas = materias.filter(m => m.optativa);
  return { obligatorias, optativas };
}

// --- Función para distribuir optativas inteligentemente ---
function distribuirOptativas(optativas, numGrupos, espaciosDisponiblesPorGrupo) {
  const distribucion = Array(numGrupos).fill(null).map(() => []);
  
  if (espaciosDisponiblesPorGrupo <= 0) {
    console.log("  ⚠️  No hay espacio para optativas (materias obligatorias ocupan todo)");
    return distribucion;
  }
  
  // Distribuir de forma rotativa para maximizar variedad
  let grupoActual = 0;
  
  for (const optativa of optativas) {
    // Buscar grupo con espacio
    let intentos = 0;
    while (distribucion[grupoActual].length >= espaciosDisponiblesPorGrupo && intentos < numGrupos) {
      grupoActual = (grupoActual + 1) % numGrupos;
      intentos++;
    }
    
    // Si encontramos espacio, asignar
    if (distribucion[grupoActual].length < espaciosDisponiblesPorGrupo) {
      distribucion[grupoActual].push(optativa);
      grupoActual = (grupoActual + 1) % numGrupos;
    } else {
      console.log(`  ⚠️  No hay más espacio para optativa: ${optativa.nombre}`);
      break;
    }
  }
  
  return distribucion;
}

// --- Función principal para crear clases ---
async function crearClasesInteligente() {
  console.log("=== Iniciando creación inteligente de clases ===\n");
  console.log(`Carrera: ${ID_CARRERA_DEFAULT}`);
  console.log(`Periodo: ${ID_PERIODO_DEFAULT}`);
  console.log(`Semestres a procesar: ${SEMESTRES_A_PROCESAR.join(', ')}`);
  console.log(`Máximo clases por grupo: ${MAX_CLASES_POR_GRUPO}\n`);

  try {
    // 0. Cargar configuración de horarios
    console.log("-- Cargando configuración de horarios --");
    const configuracionHorarios = cargarConfiguracionHorarios();
    console.log("✓ Configuración cargada");
    console.log(`  Bloques matutinos: ${configuracionHorarios.matutino.bloques.length}`);
    console.log(`  Bloques vespertinos: ${configuracionHorarios.vespertino.bloques.length}\n`);

    // 1. Obtener profesores
    console.log("-- Obteniendo profesores --");
    const profesores = await obtenerProfesores();
    console.log(`✓ Profesores disponibles: ${profesores.length}\n`);

    // 2. Obtener todos los grupos
    console.log("-- Obteniendo grupos --");
    const todosGrupos = await apiCall(`/grupo`);
    
    if (!todosGrupos || todosGrupos.length === 0) {
      console.log("No se encontraron grupos.");
      return;
    }
    
    // Filtrar por carrera, periodo y semestre
    const gruposFiltrados = todosGrupos.filter(g => {
      const idGrupo = g.idCarrera?._id || g.idCarrera;
      const idPeriodo = g.idPeriodo?._id || g.idPeriodo;
      return idGrupo === ID_CARRERA_DEFAULT && 
             idPeriodo === ID_PERIODO_DEFAULT &&
             SEMESTRES_A_PROCESAR.includes(g.semestre);
    });
    
    console.log(`✓ Total de grupos encontrados: ${todosGrupos.length}`);
    console.log(`✓ Grupos filtrados: ${gruposFiltrados.length}\n`);

    if (gruposFiltrados.length === 0) {
      console.log("No se encontraron grupos que coincidan con los filtros.");
      return;
    }

    // 3. Obtener todas las materias
    console.log("-- Obteniendo materias --");
    const todasMaterias = await apiCall(`/materia`);
    
    const materiasFiltradas = todasMaterias.filter(m => {
      const idMateria = m.idCarrera?._id || m.idCarrera;
      return idMateria === ID_CARRERA_DEFAULT;
    });
    
    console.log(`✓ Total de materias: ${todasMaterias.length}`);
    console.log(`✓ Materias de la carrera: ${materiasFiltradas.length}\n`);

    // 4. Crear clases por semestre
    let clasesCreadas = 0;
    let clasesError = 0;
    const salonesAsignados = {};
    
    // Agrupar por semestre para distribuir optativas inteligentemente
    const gruposPorSemestre = {};
    gruposFiltrados.forEach(g => {
      if (!gruposPorSemestre[g.semestre]) {
        gruposPorSemestre[g.semestre] = [];
      }
      gruposPorSemestre[g.semestre].push(g);
    });

    for (const semestre of Object.keys(gruposPorSemestre)) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`SEMESTRE ${semestre}`);
      console.log('='.repeat(60));
      
      const gruposSemestre = gruposPorSemestre[semestre];
      const materiasSemestre = materiasFiltradas.filter(m => m.semestre === parseInt(semestre));
      const { obligatorias, optativas } = separarMaterias(materiasSemestre);
      
      console.log(`Grupos: ${gruposSemestre.length}`);
      console.log(`Materias obligatorias: ${obligatorias.length}`);
      console.log(`Materias optativas: ${optativas.length}`);
      
      // Mostrar las materias
      if (obligatorias.length > 0) {
        console.log("\n  📗 Obligatorias:");
        obligatorias.forEach(m => console.log(`    - ${m.nombre}`));
      }
      
      if (optativas.length > 0) {
        console.log("\n  📘 Optativas:");
        optativas.forEach(m => console.log(`    - ${m.nombre}`));
      }
      
      // Verificar que las materias obligatorias quepan
      if (obligatorias.length > MAX_CLASES_POR_GRUPO) {
        console.log(`\n⚠️  ADVERTENCIA: ${obligatorias.length} materias obligatorias exceden el límite de ${MAX_CLASES_POR_GRUPO}`);
      }
      
      // Distribuir optativas entre grupos
      const espaciosParaOptativas = Math.max(0, MAX_CLASES_POR_GRUPO - obligatorias.length);
      const optativasDistribuidas = distribuirOptativas(optativas, gruposSemestre.length, espaciosParaOptativas);
      
      console.log(`\n  Espacios disponibles para optativas por grupo: ${espaciosParaOptativas}`);
      
      // Crear clases para cada grupo
      for (let i = 0; i < gruposSemestre.length; i++) {
        const grupo = gruposSemestre[i];
        const idGrupo = grupo._id || grupo.id;
        
        console.log(`\n--- Grupo: ${grupo.nombre} (${grupo.turno}) ---`);
        
        // Generar salón único
        if (!salonesAsignados[idGrupo]) {
          salonesAsignados[idGrupo] = generarSalon(ID_CARRERA_DEFAULT);
        }
        const salonGrupo = salonesAsignados[idGrupo];
        console.log(`  Salón: ${salonGrupo}`);
        
        // Determinar bloques según turno
        const bloquesDisponibles = grupo.turno === "Matutino" 
          ? configuracionHorarios.matutino.bloques 
          : configuracionHorarios.vespertino.bloques;
        
        // Combinar materias: obligatorias + optativas asignadas a este grupo
        const materiasGrupo = [
          ...obligatorias,
          ...(optativasDistribuidas[i] || [])
        ].slice(0, MAX_CLASES_POR_GRUPO);
        
        console.log(`  Total de clases a crear: ${materiasGrupo.length}`);
        console.log(`    - Obligatorias: ${obligatorias.length}`);
        console.log(`    - Optativas: ${(optativasDistribuidas[i] || []).length}`);
        
        // Crear clases
        for (let j = 0; j < materiasGrupo.length; j++) {
  const materia = materiasGrupo[j];
  const bloque = bloquesDisponibles[j % bloquesDisponibles.length];
  
  try {
    const profesorAleatorio = seleccionarProfesorAleatorio(profesores);
    const idProfesor = profesorAleatorio._id || profesorAleatorio.id;
    const nombreProfesor = profesorAleatorio.nombre || 'N/A';
    
    // Crear objeto de horario con IDs específicos por día
    const horario = {};
    Object.keys(bloque.horario).forEach(dia => {
      horario[dia] = {
        idDia: bloque.horario[dia]
      };
    });
    
    // Crear la clase
    const claseData = {
      idGrupo: idGrupo,
      idMateria: materia._id || materia.id,
      salon: salonGrupo,
      cupoMaximo: 30,
      idProfesor: idProfesor,
      horario: horario
    };
    
    await apiCall('/clase', 'POST', claseData);
    clasesCreadas++;
    
    // Obtener información de horarios para mostrar
    const diasClase = Object.keys(bloque.horario);
    const tipoMateria = materia.optativa ? "📘 Optativa" : "📗 Obligatoria";
    console.log(`    ✓ ${tipoMateria}: ${materia.nombre}`);
    console.log(`      Profesor: ${nombreProfesor}`);
    console.log(`      Días: ${diasClase.join(', ')}`);
    console.log(`      ${bloque.nombre}`);
    
  } catch (error) {
    clasesError++;
    console.error(`    ✗ Error: ${materia.nombre}`);
    console.error(`      ${error.message}`);
  }
}
      }
    }

    // Resumen final
    console.log(`\n${'='.repeat(60)}`);
    console.log("RESUMEN FINAL");
    console.log('='.repeat(60));
    console.log(`Grupos procesados: ${gruposFiltrados.length}`);
    console.log(`Clases creadas exitosamente: ${clasesCreadas}`);
    console.log(`Clases con error: ${clasesError}`);
    console.log(`Profesores en rotación: ${profesores.length}`);
    console.log("\n✓ Proceso completado.");

  } catch (error) {
    console.error("\n✗ ERROR GENERAL:", error.message);
    console.error(error.stack);
  }
}

// Ejecutar
crearClasesInteligente();