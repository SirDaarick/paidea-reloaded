// src/demo/mockApiHandler.js
// Manejador central de peticiones simuladas en memoria para el modo demostración autónomo de PAIDEA.

import {
  DEMO_USERS,
  DEMO_ALUMNO_HORARIO,
  DEMO_ALUMNO_KARDEX,
  DEMO_ALUMNO_CITA,
  DEMO_PROFESOR_CLASES,
  DEMO_CARRERAS,
  DEMO_PERIODOS,
  DEMO_PROFESORES_LIST
} from "./mockData";

export async function handleDemoApiCall(endpoint, method = "GET", body = null) {
  // Simular latencia de red realista de 150 a 250ms
  await new Promise((resolve) => setTimeout(resolve, 180));

  const cleanEndpoint = endpoint.replace(/^\/api\/v1/, "");
  const currentRole = (localStorage.getItem("userRole") || "alumno").toLowerCase();

  // 1. AUTENTICACIÓN: Login
  if (endpoint.includes("/auth/login")) {
    const id = (body?.identificador || "").toLowerCase().trim();
    let selected = DEMO_USERS.alumno;

    if (id.includes("prof") || id.includes("pear") || id.includes("miriam")) {
      selected = DEMO_USERS.profesor;
    } else if (id.includes("admin") || id.includes("escolar") || id.includes("control")) {
      selected = DEMO_USERS.admin;
    }

    const rawRole = selected.rol.toLowerCase();
    const normalizedRole = rawRole === "administrador" ? "admin" : rawRole;

    return {
      access_token: `demo_jwt_token_${normalizedRole}`,
      token_type: "bearer",
      rol: selected.rol,
      nombre_completo: selected.nombre_completo,
      boleta_o_rfc: selected.boleta || selected.rfc_profesor || null
    };
  }

  // 2. AUTENTICACIÓN: Perfil Actual (/auth/me)
  if (endpoint.includes("/auth/me")) {
    if (currentRole === "profesor") return DEMO_USERS.profesor;
    if (currentRole === "admin" || currentRole === "administrador") return DEMO_USERS.admin;
    return DEMO_USERS.alumno;
  }

  // 3. ALUMNOS: Horario
  if (endpoint.includes("/alumnos/me/horario") || endpoint.includes("/horario/alumno")) {
    return DEMO_ALUMNO_HORARIO;
  }

  // 4. ALUMNOS: Kárdex
  if (endpoint.includes("/alumnos/me/kardex") || endpoint.includes("/kardex/alumno")) {
    return DEMO_ALUMNO_KARDEX;
  }

  // 5. PROFESORES: Clases asignadas
  if (endpoint.includes("/profesores/me/clases") || endpoint.includes("/clase/profesor")) {
    return DEMO_PROFESOR_CLASES;
  }

  // 6. COMPATIBILIDAD LEGACY: Profesores
  if (endpoint.includes("/usuario/profesores")) {
    return DEMO_PROFESORES_LIST;
  }

  // 7. COMPATIBILIDAD LEGACY: Alumno por Boleta
  if (endpoint.includes("/usuario/boleta/")) {
    const alumno = DEMO_USERS.alumno;
    return {
      _id: String(alumno.id),
      nombre: alumno.nombre,
      primerApellido: alumno.primer_apellido,
      segundoApellido: alumno.segundo_apellido,
      correo: alumno.email,
      rol: "Alumno",
      boleta: alumno.boleta,
      promedio: alumno.promedio,
      carrera: alumno.carrera
    };
  }

  // 8. COMPATIBILIDAD LEGACY: Profesor por RFC
  if (endpoint.includes("/usuario/rfc/")) {
    const prof = DEMO_USERS.profesor;
    return {
      _id: String(prof.id),
      nombre: prof.nombre,
      primerApellido: prof.primer_apellido,
      segundoApellido: prof.segundo_apellido,
      correo: prof.email,
      rol: "Profesor",
      rfc: prof.rfc_profesor
    };
  }

  // 9. COMPATIBILIDAD LEGACY: Usuario por ID
  if (endpoint.match(/\/usuario\/[a-zA-Z0-9_-]+$/)) {
    if (currentRole === "profesor") {
      return {
        _id: String(DEMO_USERS.profesor.id),
        nombre: DEMO_USERS.profesor.nombre,
        primerApellido: DEMO_USERS.profesor.primer_apellido,
        segundoApellido: DEMO_USERS.profesor.segundo_apellido,
        correo: DEMO_USERS.profesor.email,
        rol: "Profesor",
        dataProfesor: { rfc: DEMO_USERS.profesor.rfc_profesor }
      };
    }
    return {
      _id: String(DEMO_USERS.alumno.id),
      nombre: DEMO_USERS.alumno.nombre,
      primerApellido: DEMO_USERS.alumno.primer_apellido,
      segundoApellido: DEMO_USERS.alumno.segundo_apellido,
      correo: DEMO_USERS.alumno.email,
      rol: "Alumno",
      dataAlumno: {
        boleta: DEMO_USERS.alumno.boleta,
        idCarrera: "carr_1",
        promedio: DEMO_USERS.alumno.promedio
      }
    };
  }

  // 10. CARRERAS
  if (endpoint.includes("/carrera")) {
    if (endpoint.match(/\/carrera\/[a-zA-Z0-9_-]+$/)) {
      return DEMO_CARRERAS[0];
    }
    return DEMO_CARRERAS;
  }

  // 11. PERIODOS ACADÉMICOS
  if (endpoint.includes("/periodoAcademico") || endpoint.includes("/periodoInscripcion")) {
    return DEMO_PERIODOS;
  }

  // 12. GRUPOS DE PROFESOR
  if (endpoint.includes("/grupo/profesor")) {
    return DEMO_PROFESOR_CLASES.map((c) => ({
      _id: String(c.id),
      nombre: c.grupo,
      turno: "Matutino",
      materia: {
        _id: String(c.id),
        nombre: c.materia,
        clave: c.clave
      },
      aula: c.aula
    }));
  }

  // 13. GRUPOS GENERALES
  if (endpoint.includes("/grupo")) {
    return [
      { _id: "grp_1", nombre: "3CM1", turno: "Matutino", semestre: 3 },
      { _id: "grp_2", nombre: "3CV2", turno: "Vespertino", semestre: 3 },
      { _id: "grp_3", nombre: "3CM3", turno: "Matutino", semestre: 3 }
    ];
  }

  // 14. CITAS DE REINSCRIPCIÓN
  if (endpoint.includes("/cita")) {
    return [
      {
        _id: "cita_1",
        fecha: DEMO_ALUMNO_CITA.fecha_hora,
        hora: "09:15",
        boleta: DEMO_USERS.alumno.boleta,
        nombre: DEMO_USERS.alumno.nombre_completo,
        promedio: DEMO_USERS.alumno.promedio,
        periodo: "2026-2",
        estatus: "Asignada"
      }
    ];
  }

  // 15. AGENTE CONVERSACIONAL: Hilos de conversación
  if (endpoint.includes("/agent/threads")) {
    return [
      {
        id: 101,
        titulo: "Asesoría TecnoBurro 2.0",
        activo: true,
        updated_at: new Date().toISOString()
      }
    ];
  }

  // 16. MUTACIONES (POST / PUT / DELETE)
  // En modo demo, simulamos éxito protegiendo los datos
  if (method === "POST" || method === "PUT" || method === "DELETE") {
    console.log(`[Modo Demo] Operación ${method} interceptada en ${endpoint}: Datos protegidos de solo lectura.`);
    return {
      status: "success",
      demo: true,
      mensaje: "Acción simulada exitosamente en Modo Demostración.",
      data: body || {}
    };
  }

  // Fallback para cualquier otra ruta GET
  return [];
}
