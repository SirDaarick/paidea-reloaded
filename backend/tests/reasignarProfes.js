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

// --- Verificar traslapes de horario ---
function verificarTraslapesHorario(claseNueva, clasesYaAsignadas) {
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
    
    for (const claseAsignada of clasesYaAsignadas) {
      const horarioAsignado = claseAsignada.horario?.[dia];
      
      // ✅ Si la clase asignada NO tiene horario en este día, continuar (no hay traslape)
      if (!horarioAsignado || !horarioAsignado.idDia) continue;
      
      // ✅ Extraer el ID del día asignado
      let idDiaAsignado;
      if (typeof horarioAsignado.idDia === 'object' && horarioAsignado.idDia !== null) {
        idDiaAsignado = (horarioAsignado.idDia._id || horarioAsignado.idDia.id || horarioAsignado.idDia).toString();
      } else {
        idDiaAsignado = horarioAsignado.idDia.toString();
      }
      
      // ✅ Comparar IDs (ahora ambos son strings)
      if (idDiaNuevo === idDiaAsignado) {
        return true; // HAY TRASLAPE
      }
    }
  }
  
  return false; // NO hay traslape
}

// --- Función principal ---
async function reasignarProfesores() {
  console.log("=== Reasignando Profesores sin Traslapes de Horario ===\n");
  console.log(`Período: ${PERIODO_ACTUAL.nombre} (${PERIODO_ACTUAL.id})\n`);

  try {
    // 1. Obtener todos los profesores
    console.log("-- Obteniendo profesores --");
    const todosUsuarios = await apiCall('/usuario');
    const profesores = todosUsuarios.filter(u => u.rol === 'Profesor');
    console.log(`✓ Profesores encontrados: ${profesores.length}\n`);

    if (profesores.length === 0) {
      console.error("✗ No hay profesores disponibles");
      return;
    }

    // 2. Obtener todas las clases
    console.log("-- Obteniendo todas las clases --");
    const todasClases = await apiCall('/clase');
    console.log(`✓ Clases obtenidas: ${todasClases.length}`);

    // 3. Filtrar solo las clases del período actual
    const clasesDelPeriodoActual = todasClases.filter(clase => {
      const idPeriodoClase = clase.idGrupo?.idPeriodo?._id || clase.idGrupo?.idPeriodo;
      return idPeriodoClase === PERIODO_ACTUAL.id;
    });

    console.log(`✓ Clases del período actual: ${clasesDelPeriodoActual.length}\n`);

    // 4. Crear mapa de clases asignadas por profesor
    const clasesPorProfesor = new Map();
    profesores.forEach(prof => {
      const idProf = prof._id || prof.id;
      clasesPorProfesor.set(idProf, []);
    });

    let clasesActualizadas = 0;
    let clasesConError = 0;
    let profesoresSinAsignar = 0;
    let traslapesEvitados = 0;

    console.log("-- Reasignando profesores a clases --\n");

    // 5. Procesar cada clase
    for (const clase of clasesDelPeriodoActual) {
      const idClase = clase._id || clase.id;
      const nombreMateria = clase.idMateria?.nombre || 'Materia desconocida';
      const nombreGrupo = clase.idGrupo?.nombre || 'Grupo desconocido';

      try {
        // Buscar un profesor sin traslape
        let profesorAsignado = null;
        let intentos = 0;
        const profesoresAleatorios = [...profesores].sort(() => Math.random() - 0.5);

        for (const profesor of profesoresAleatorios) {
          intentos++;
          const idProfesor = profesor._id || profesor.id;
          const clasesDelProfesor = clasesPorProfesor.get(idProfesor) || [];

          // Verificar si hay traslape de horario
          if (!verificarTraslapesHorario(clase, clasesDelProfesor)) {
            profesorAsignado = profesor;
            break;
          } else {
            traslapesEvitados++;
          }
        }

        if (!profesorAsignado) {
          console.log(`⚠️  No se pudo asignar profesor sin traslape:`);
          console.log(`   Clase: ${nombreMateria} - ${nombreGrupo}`);
          console.log(`   ID: ${idClase}`);
          console.log(`   Intentos: ${intentos}/${profesores.length}\n`);
          profesoresSinAsignar++;
          continue;
        }

        const idProfesorAsignado = profesorAsignado._id || profesorAsignado.id;
        const nombreProfesor = profesorAsignado.nombre || 'Profesor sin nombre';

        // Actualizar la clase con el nuevo profesor
        await apiCall(`/clase/${idClase}`, 'PUT', {
          idProfesor: idProfesorAsignado
        });

        // Agregar la clase al registro del profesor
        clasesPorProfesor.get(idProfesorAsignado).push(clase);

        clasesActualizadas++;
        console.log(`✓ [${clasesActualizadas}/${clasesDelPeriodoActual.length}] ${nombreMateria} - ${nombreGrupo}`);
        console.log(`  Profesor: ${nombreProfesor} (${idProfesorAsignado})`);
        console.log(`  Total de clases del profesor: ${clasesPorProfesor.get(idProfesorAsignado).length}\n`);

      } catch (error) {
        console.error(`✗ Error actualizando clase ${idClase}:`, error.message);
        clasesConError++;
      }
    }

    // 6. Resumen de carga por profesor
    console.log(`\n${'='.repeat(70)}`);
    console.log("RESUMEN DE CARGA POR PROFESOR");
    console.log('='.repeat(70));

    const profesoresConClases = Array.from(clasesPorProfesor.entries())
      .filter(([_, clases]) => clases.length > 0)
      .sort((a, b) => b[1].length - a[1].length);

    profesoresConClases.forEach(([idProf, clases]) => {
      const profesor = profesores.find(p => (p._id || p.id) === idProf);
      const nombreProf = profesor?.nombre || 'Desconocido';
      console.log(`${nombreProf}: ${clases.length} clases`);
    });

    // Resumen final
    console.log(`\n${'='.repeat(70)}`);
    console.log("RESUMEN FINAL");
    console.log('='.repeat(70));
    console.log(`Período: ${PERIODO_ACTUAL.nombre}`);
    console.log(`Total de clases: ${clasesDelPeriodoActual.length}`);
    console.log(`Clases actualizadas: ${clasesActualizadas}`);
    console.log(`Clases sin asignar: ${profesoresSinAsignar}`);
    console.log(`Clases con error: ${clasesConError}`);
    console.log(`Traslapes evitados: ${traslapesEvitados}`);
    console.log(`Profesores utilizados: ${profesoresConClases.length}/${profesores.length}`);
    console.log("\n✓ Proceso completado exitosamente.");

  } catch (error) {
    console.error("\n✗ ERROR GENERAL:", error.message);
    console.error(error.stack);
  }
}

// Ejecutar
reasignarProfesores();