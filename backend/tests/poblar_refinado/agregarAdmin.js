const API_URL = "https://paidea.onrender.com";


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

// --- Script principal ---
async function probarIntegracionCompleta() {
  console.log("=== Iniciando prueba de integración (con PeriodoAcademico y DiaSemana) ===");

  const created = {
    materias: [],
    clases: [],
    inscripcionClases: [],
    calificaciones: [],
    usuarios: [],
    materiasRaw: [],
    diaSemana: [], // Aquí guardamos los IDs de DiaSemana
    periodoAcademico: null,
    grupo: null,
    inscripcion: null
  };

  const testId = Date.now();
  let idCarrera; // Variable para almacenar la carrera encontrada
  let idAlumno;

  try {


    // 4) Crear Usuario alumno y profesor
    console.log("\n-- Creando usuario alumno y profesor --");
    // CORRECCIÓN CRÍTICA: Mover idCarrera dentro de dataAlumno
    const alumnoPayload = {
      boleta: 100000000,
      nombre: "José Floreano",
      correo: `admin0@admin.com`,
      contrasena: "Admin123",
      rol: "Administrativo",
      datosPersonales: { curp: `${testId}` },
    };
    const alumno = await apiCall('/usuario', 'POST', alumnoPayload);
    idAlumno = alumno._id ?? alumno.id_usuario ?? alumno.id;
    created.usuarios.push(idAlumno);
    console.log("Admin creado:", idAlumno);

  } catch (err) {
    console.error("\n ERROR DURANTE LA PRUEBA. La ejecución se detendrá.");
    console.error(err.message);
  }
}

// Ejecutar
probarIntegracionCompleta();