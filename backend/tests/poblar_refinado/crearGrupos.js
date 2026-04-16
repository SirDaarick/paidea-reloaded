// Pao primero especifica la carrera, luego especifica el semestre, luego los grupos de ese semestre y asi, puedes borrar grupos de la lista para que sean menos
const API_URL = "https://paidea.onrender.com";
//const ID_CARRERA_DEFAULT = "690eacdab43948f952b9244f"; // IIA
const ID_CARRERA_DEFAULT = "692265322d970dc69b0fe295"; // LCD 
//const ID_CARRERA_DEFAULT = "692273ce2d970dc69b0fe298"; // ISC 2020 
const ID_PERIODO_DEFAULT = "690eacd9b43948f952b9243f"; // 2026-1
const semestre = 8;
let letraCarrera = "";
if (ID_CARRERA_DEFAULT === "692265322d970dc69b0fe295") {
    letraCarrera = "A";
}
else if (ID_CARRERA_DEFAULT === "690eacdab43948f952b9244f") {
    letraCarrera = "B";
}
else {
    letraCarrera = "C";
}

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

async function crearGruposGenericas() {
  console.log("=== Iniciando creación de 6 materias genéricas ===\n");

  const testId = Date.now();
  const gruposCreadas = [];

  // Definir las 6 materias genéricas
  const grupos = [
    {
        nombre: `${semestre}${letraCarrera}M1`,
        idPeriodo: ID_PERIODO_DEFAULT,
      idCarrera: ID_CARRERA_DEFAULT,
      semestre: semestre,
      turno: "Matutino",
    },
   /* {
      nombre: `${semestre}${letraCarrera}V2`,
        idPeriodo: ID_PERIODO_DEFAULT,
      idCarrera: ID_CARRERA_DEFAULT,
      semestre: semestre,
      turno: "Vespertino",
    },*/
    {
      nombre: `${semestre}${letraCarrera}V1`,
        idPeriodo: ID_PERIODO_DEFAULT,
      idCarrera: ID_CARRERA_DEFAULT,
      semestre: semestre,
      turno: "Vespertino",
    },
    /*{
      nombre: `${semestre}${letraCarrera}V4`,
        idPeriodo: ID_PERIODO_DEFAULT,
      idCarrera: ID_CARRERA_DEFAULT,
      semestre: semestre,
      turno: "Vespertino",
    } 
    {
      nombre: `${semestre}${letraCarrera}M5`,
        idPeriodo: ID_PERIODO_DEFAULT,
      idCarrera: ID_CARRERA_DEFAULT,
      semestre: semestre,
      turno: "Matutino",
    },
   {
      nombre: `${semestre}${letraCarrera}V6`,
        idPeriodo: ID_PERIODO_DEFAULT,
      idCarrera: ID_CARRERA_DEFAULT,
      semestre: semestre,
      turno: "Vespertino",
    }*/
  ];

  try {
    console.log("-- Creando grupos --\n");

    for (const grupo of grupos) {
      try {
        const grupoCreado = await apiCall('/grupo', 'POST', grupo);
        const idGrupo = grupoCreado._id ?? grupoCreado.id_grupo ?? grupoCreado.id;
        gruposCreadas.push(idGrupo);
        
        console.log(`✓ Grupo creado: "${grupo.nombre}"`);
        console.log(`  - Turno: ${grupo.turno}`);
        console.log(`  - Semestre: ${grupo.semestre}`);
        console.log(`  - idCarrera: ${grupo.idCarrera}`);
        console.log(`  - idPeriodo: ${grupo.idPeriodo}`);
        console.log(`  - ID: ${idGrupo}\n`);

      } catch (error) {
        console.error(`✗ Error al crear el grupo "${grupo.nombre}":`, error.message);
    
      }
    }

    // Resumen
    console.log("=== Resumen de creación ===");
    console.log(`Grupos creados exitosamente: ${gruposCreadas.length}/4`);
    console.log(`idCarrera usado: ${ID_CARRERA_DEFAULT}`);
    console.log(`IDs: ${gruposCreadas.join(', ')}`);
    console.log("\nCreación completada.");

  } catch (error) {
    console.error("\n✗ ERROR DURANTE LA CREACIÓN:", error.message);
  }
}

// Ejecutar
crearGruposGenericas();