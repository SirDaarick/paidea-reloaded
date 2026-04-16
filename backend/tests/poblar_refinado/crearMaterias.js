// Pao primero especifica la carrera, luego especifica el semestre, luego las materias de ese semestre y asi, puedes borrar materias de la lista para que sean menos
const API_URL = "http://localhost:3001";
//const ID_CARRERA_DEFAULT = "690eacdab43948f952b9244f"; // IIA
//const ID_CARRERA_DEFAULT = "692265322d970dc69b0fe295"; // LCD 
const ID_CARRERA_DEFAULT = "692273ce2d970dc69b0fe298"; // ISC 2020 

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
      const msg = data && (data.detalle || data.message || data.error) ? (data.detalle || data.message || data.error) : JSON.stringify(data);
      throw new Error(`Error ${res.status} en ${method} ${endpoint}: ${msg}`);
    }
    return data;
  } catch (error) {
    console.error(`apiCall fallo -> ${method} ${endpoint}:`, error.message);
    throw error;
  }
}

async function crearMateriasGenericas() {
  console.log("=== Iniciando creación de 6 materias genéricas ===\n");

  const testId = Date.now();
  const materiasCreadas = [];

  // Definir las 6 materias genéricas
  const materias = [
    {
      idCarrera: ID_CARRERA_DEFAULT,
      clave: `C505`,
      nombre: "Formulación y Evaluación de Proyectos Infromáticos",
      creditos: 6,
      semestre: 5,
      optativa: false,
      url: "https://www.escom.ipn.mx/docs/oferta/uaISC2020/formulacionEvaluacionProyectosInformaticos.pdf"
    },
    {
      idCarrera: ID_CARRERA_DEFAULT,
      clave: `C506`,
      nombre: "Compiladores",
      creditos: 7.5,
      semestre: 5,
      optativa: false,
      url: "https://www.escom.ipn.mx/docs/oferta/uaISC2020/compiladores.pdf"
    },
    {
      idCarrera: ID_CARRERA_DEFAULT,
      clave: `C507`,
      nombre: "Redes de Computadoras",
      creditos: 7.5,
      semestre: 5,
      optativa: false,
      url: "https://www.escom.ipn.mx/docs/oferta/uaISC2020/redesComputadoras_ISC2020.pdf"
    },
    {
      idCarrera: ID_CARRERA_DEFAULT,
      clave: `C601`,
      nombre: "Sistemas en Chip",
      creditos: 7.5,
      semestre: 6,
      optativa: false,
      url: "https://www.escom.ipn.mx/docs/oferta/uaISC2020/sistemasChip_ISC2020.pdf"
    },
    {
      idCarrera: ID_CARRERA_DEFAULT,
      clave: `O301`,
      nombre: "Computer Graphics",
      creditos: 7.5,
      semestre: 6,
      optativa: true,
      url: "https://www.escom.ipn.mx/docs/oferta/uaoISC2020/computerGraphics.pdf"
    },
    {
      idCarrera: ID_CARRERA_DEFAULT,
      clave: `O302`,
      nombre: "Genetic Algorithms",
      creditos: 7.5,
      semestre: 6,
      optativa: true,
      url: "https://www.escom.ipn.mx/docs/oferta/uaoISC2020/geneticAlgorithms.pdf"
    }
  ];

  try {
    console.log("-- Creando materias --\n");

    for (const materia of materias) {
      try {
        const materiaCreada = await apiCall('/materia', 'POST', materia);
        const idMateria = materiaCreada._id ?? materiaCreada.id_materia ?? materiaCreada.id;
        materiasCreadas.push(idMateria);
        
        console.log(`✓ Materia creada: "${materia.nombre}"`);
        console.log(`  - Clave: ${materia.clave}`);
        console.log(`  - Créditos: ${materia.creditos}`);
        console.log(`  - Semestre: ${materia.semestre}`);
        console.log(`  - Optativa: ${materia.optativa ? 'Sí' : 'No'}`);
        console.log(`  - idCarrera: ${materia.idCarrera}`);
        console.log(`  - ID: ${idMateria}\n`);

      } catch (error) {
        console.error(`✗ Error al crear materia "${materia.nombre}":`, error.message);
        
        // Si es error de clave duplicada, intentar con nueva clave
        if (error.message.includes('duplicada') || error.message.includes('11000')) {
          console.log(`  Reintentando con nueva clave...\n`);
          materia.clave = `${materia.clave}-${Math.random().toString(36).substring(7)}`;
          
          try {
            const materiaCreada = await apiCall('/materia', 'POST', materia);
            const idMateria = materiaCreada._id ?? materiaCreada.id_materia ?? materiaCreada.id;
            materiasCreadas.push(idMateria);
            console.log(`✓ Materia creada con nueva clave: "${materia.nombre}" (${materia.clave})\n`);
          } catch (retryError) {
            console.error(`✗ Error en reintento:`, retryError.message, '\n');
          }
        }
      }
    }

    // Resumen
    console.log("=== Resumen de creación ===");
    console.log(`Materias creadas exitosamente: ${materiasCreadas.length}/6`);
    console.log(`idCarrera usado: ${ID_CARRERA_DEFAULT}`);
    console.log(`IDs: ${materiasCreadas.join(', ')}`);
    console.log("\nCreación completada.");

  } catch (error) {
    console.error("\n✗ ERROR DURANTE LA CREACIÓN:", error.message);
  }
}

// Ejecutar
crearMateriasGenericas();