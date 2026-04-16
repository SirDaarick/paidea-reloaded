// --- Configuración ---
const API_URL = "https://paidea.onrender.com";

// ✅ CONFIGURACIÓN DE PERÍODOS A CREAR
// Puedes agregar múltiples períodos en este array
const PERIODOS_A_CREAR = [
  {
    nombre: "2023-1",
    fechaInicio: { año: 2022, mes: 8 },
    fechaFinal: { año: 2023, mes: 1 } 
  },
  {
    nombre: "2022-2",
    fechaInicio: { año: 2022, mes: 2 },
    fechaFinal: { año: 2022, mes: 6 } 
  },
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

// --- Función para crear fecha ---
function crearFecha(año, mes) {
  // Crear fecha al primer día del mes a las 00:00:00
  return new Date(año, mes - 1, 1, 0, 0, 0, 0);
}

// --- Función para obtener el último día del mes ---
function obtenerUltimoDiaMes(año, mes) {
  // El día 0 del siguiente mes es el último día del mes actual
  return new Date(año, mes, 0).getDate();
}

// --- Función para crear fecha final (último día del mes) ---
function crearFechaFinal(año, mes) {
  const ultimoDia = obtenerUltimoDiaMes(año, mes);
  return new Date(año, mes - 1, ultimoDia, 23, 59, 59, 999);
}

// --- Función para formatear fecha ---
function formatearFecha(fecha) {
  const opciones = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'America/Mexico_City'
  };
  return fecha.toLocaleDateString('es-MX', opciones);
}

// --- Validar configuración de período ---
function validarPeriodo(periodo) {
  const errores = [];
  
  // Validar nombre
  if (!periodo.nombre || periodo.nombre.trim() === '') {
    errores.push('El nombre del período es obligatorio');
  }
  
  // Validar fecha de inicio
  if (!periodo.fechaInicio || !periodo.fechaInicio.año || !periodo.fechaInicio.mes) {
    errores.push('La fecha de inicio debe tener año y mes');
  } else {
    if (periodo.fechaInicio.año < 2000 || periodo.fechaInicio.año > 2100) {
      errores.push('El año de inicio debe estar entre 2000 y 2100');
    }
    if (periodo.fechaInicio.mes < 1 || periodo.fechaInicio.mes > 12) {
      errores.push('El mes de inicio debe estar entre 1 y 12');
    }
  }
  
  // Validar fecha final
  if (!periodo.fechaFinal || !periodo.fechaFinal.año || !periodo.fechaFinal.mes) {
    errores.push('La fecha final debe tener año y mes');
  } else {
    if (periodo.fechaFinal.año < 2000 || periodo.fechaFinal.año > 2100) {
      errores.push('El año final debe estar entre 2000 y 2100');
    }
    if (periodo.fechaFinal.mes < 1 || periodo.fechaFinal.mes > 12) {
      errores.push('El mes final debe estar entre 1 y 12');
    }
  }
  
  // Validar que fecha final sea posterior a fecha inicio
  if (errores.length === 0) {
    const fechaInicioObj = crearFecha(periodo.fechaInicio.año, periodo.fechaInicio.mes);
    const fechaFinalObj = crearFechaFinal(periodo.fechaFinal.año, periodo.fechaFinal.mes);
    
    if (fechaFinalObj <= fechaInicioObj) {
      errores.push('La fecha final debe ser posterior a la fecha de inicio');
    }
  }
  
  return errores;
}

// --- Función principal ---
async function crearPeriodosAcademicos() {
  console.log("=== Creación de Períodos Académicos ===\n");
  console.log(`Períodos a crear: ${PERIODOS_A_CREAR.length}\n`);

  try {
    // 1. Obtener períodos existentes para verificar duplicados
    console.log("-- Obteniendo períodos existentes --");
    let periodosExistentes = [];
    try {
      periodosExistentes = await apiCall('/periodoacademico');
      console.log(`✓ Períodos existentes encontrados: ${periodosExistentes.length}\n`);
    } catch (error) {
      console.log("⚠️  No se pudieron obtener períodos existentes (puede que no haya ninguno)");
      console.log(`   Error: ${error.message}\n`);
    }

    const nombresExistentes = new Set(periodosExistentes.map(p => p.nombre));

    // 2. Validar y mostrar resumen de períodos a crear
    console.log("-- Validando períodos --\n");
    const periodosValidos = [];
    const periodosInvalidos = [];

    for (let i = 0; i < PERIODOS_A_CREAR.length; i++) {
      const periodo = PERIODOS_A_CREAR[i];
      console.log(`Período ${i + 1}: ${periodo.nombre}`);
      
      // Validar estructura
      const errores = validarPeriodo(periodo);
      
      if (errores.length > 0) {
        console.log(`  ✗ Inválido:`);
        errores.forEach(error => console.log(`    - ${error}`));
        periodosInvalidos.push({ periodo, errores });
        continue;
      }
      
      // Verificar si ya existe
      if (nombresExistentes.has(periodo.nombre)) {
        console.log(`  ⚠️  Ya existe un período con este nombre`);
        periodosInvalidos.push({ periodo, errores: ['Período duplicado'] });
        continue;
      }
      
      // Crear fechas
      const fechaInicio = crearFecha(periodo.fechaInicio.año, periodo.fechaInicio.mes);
      const fechaFinal = crearFechaFinal(periodo.fechaFinal.año, periodo.fechaFinal.mes);
      
      console.log(`  ✓ Válido`);
      console.log(`    Inicio: ${formatearFecha(fechaInicio)}`);
      console.log(`    Final:  ${formatearFecha(fechaFinal)}`);
      
      periodosValidos.push({
        ...periodo,
        fechaInicioObj: fechaInicio,
        fechaFinalObj: fechaFinal
      });
    }
    
    console.log();

    // 3. Mostrar resumen
    console.log(`${'='.repeat(60)}`);
    console.log("RESUMEN DE VALIDACIÓN");
    console.log('='.repeat(60));
    console.log(`Total a procesar: ${PERIODOS_A_CREAR.length}`);
    console.log(`Válidos: ${periodosValidos.length}`);
    console.log(`Inválidos/Duplicados: ${periodosInvalidos.length}`);
    console.log();

    if (periodosInvalidos.length > 0) {
      console.log("Períodos con problemas:");
      periodosInvalidos.forEach(({ periodo, errores }) => {
        console.log(`  - ${periodo.nombre}:`);
        errores.forEach(error => console.log(`    • ${error}`));
      });
      console.log();
    }

    if (periodosValidos.length === 0) {
      console.log("⚠️  No hay períodos válidos para crear.");
      return;
    }

    // 4. Confirmar creación
    console.log("Se crearán los siguientes períodos:\n");
    periodosValidos.forEach((p, i) => {
      console.log(`${i + 1}. ${p.nombre}`);
      console.log(`   ${formatearFecha(p.fechaInicioObj)} → ${formatearFecha(p.fechaFinalObj)}`);
    });
    console.log();

    // 5. Crear períodos
    console.log("-- Creando períodos académicos --\n");
    
    let creados = 0;
    let errores = 0;

    for (const periodo of periodosValidos) {
      try {
        const periodoData = {
          nombre: periodo.nombre.trim(),
          fechaInicio: periodo.fechaInicioObj.toISOString(),
          fechaFinal: periodo.fechaFinalObj.toISOString()
        };

        const resultado = await apiCall('/periodoacademico', 'POST', periodoData);
        creados++;
        
        const idCreado = resultado._id || resultado.id || 'N/A';
        console.log(`✓ Período creado: ${periodo.nombre}`);
        console.log(`  ID: ${idCreado}`);
        console.log(`  Inicio: ${formatearFecha(periodo.fechaInicioObj)}`);
        console.log(`  Final:  ${formatearFecha(periodo.fechaFinalObj)}`);
        console.log();

      } catch (error) {
        errores++;
        console.error(`✗ Error creando período ${periodo.nombre}:`);
        console.error(`  ${error.message}`);
        console.log();
      }
    }

    // 6. Resumen final
    console.log(`${'='.repeat(60)}`);
    console.log("RESUMEN FINAL");
    console.log('='.repeat(60));
    console.log(`Períodos creados exitosamente: ${creados}/${periodosValidos.length}`);
    console.log(`Errores al crear: ${errores}`);
    console.log(`Períodos inválidos/duplicados: ${periodosInvalidos.length}`);
    
    if (creados > 0) {
      console.log("\n✓ Proceso completado exitosamente.");
      console.log("\nPuedes usar estos períodos en tus scripts de población.");
    } else {
      console.log("\n⚠️  No se creó ningún período.");
    }

  } catch (error) {
    console.error("\n✗ ERROR GENERAL:", error.message);
    console.error(error.stack);
  }
}

// Ejecutar
crearPeriodosAcademicos();