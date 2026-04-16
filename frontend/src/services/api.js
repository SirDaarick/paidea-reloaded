// src/services/api.js
import axios from "axios";

const API_URL = "https://paidea.onrender.com"; // ✅ sin /api

// ========== USUARIOS / PROFESORES ==========

export const fetchProfesores = async () => {
  const res = await axios.get(`${API_URL}/usuario/profesores`);
  return res.data;
};

export const fetchProfesorById = async (id) => {
  const res = await axios.get(`${API_URL}/usuario/${id}`);
  return res.data;
};

export const updateProfesor = async (id, data) => {
  const res = await axios.put(`${API_URL}/usuario/${id}`, data);
  return res.data;
};

export const deleteProfesor = async (id) => {
  const res = await axios.delete(`${API_URL}/usuario/${id}`);
  return res.data;
};

// ========== GRUPOS ==========

export const fetchGruposProfesor = async (profesorId) => {
  const res = await axios.get(`${API_URL}/grupo/profesor/${profesorId}`);
  return res.data;
};

export const fetchGrupoById = async (grupoId) => {
  const res = await axios.get(`${API_URL}/grupo/${grupoId}`);
  return res.data;
};

// ========== CLASES ==========

export const fetchClasesGrupo = async (grupoId) => {
  const res = await axios.get(`${API_URL}/clase/grupo/${grupoId}`);
  return res.data;
};

export const fetchClaseById = async (claseId) => {
  const res = await axios.get(`${API_URL}/clase/${claseId}`);
  return res.data;
};

// ========== ASISTENCIAS ==========

export const fetchAsistenciasGrupo = async (claseId) => {
  const res = await axios.get(
    `${API_URL}/inscripcionClase/asistencias/clase/${claseId}`
  );
  return res.data;
};

export const guardarAsistencias = async (grupoId, materiaId, asistencias) => {
  const res = await axios.post(
    `${API_URL}/inscripcionClase/asistencias/${grupoId}/${materiaId}`,
    asistencias
  );
  return res.data;
};

// ========== CALIFICACIONES ==========

export const fetchCalificacionesGrupo = async (grupoId, materiaId) => {
  const res = await axios.get(
    `${API_URL}/calificacion/grupo/${grupoId}/materia/${materiaId}`
  );
  return res.data;
};

export const fetchCalificacionesGrupoParcial = async (grupoId, materiaId, parcial) => {
  const res = await axios.get(
    `${API_URL}/calificacion/grupo/${grupoId}/materia/${materiaId}/parcial/${parcial}`
  );
  return res.data;
};

export const guardarCalificaciones = async (grupoId, materiaId, calificaciones) => {
  const res = await axios.post(
    `${API_URL}/calificacion/grupo/${grupoId}/materia/${materiaId}`,
    calificaciones
  );
  return res.data;
};

export const fetchCalificacionesPorAlumno = async (alumnoId) => {
  const res = await axios.get(`${API_URL}/calificacion/alumno/${alumnoId}`);
  return res.data;
};

export const fetchResumenGruposProfesor = async (profesorId) => {
  const res = await axios.get(`${API_URL}/calificacion/profesor/${profesorId}/resumen-grupos`);
  return res.data;
};

// ========== INSCRIPCIONES ==========

export const fetchInscripciones = async (filtros = {}) => {
  const res = await axios.get(`${API_URL}/inscripcion`, { params: filtros });
  return res.data;
};

export const fetchInscripcionesPorGrupo = async (grupoId) => {
  const res = await axios.get(`${API_URL}/inscripcion/grupo/${grupoId}`);
  return res.data;
};

// Mapas de carrera ↔ letra en el grupo
const CAREER_BY_LETTER = { A: "LCD", B: "IA", C: "ISC" };
const LETTER_BY_CAREER = { LCD: "A", IA: "B", ISC: "C" };
const TURNO_BY_LETTER = { M: "MATUTINO", V: "VESPERTINO" };

function upper(s) { return (s ?? "").toString().trim().toUpperCase(); }
function firstLetter(s) { const m = upper(s).match(/[A-Z]/); return m ? m[0] : ""; }
function groupLetterCareer(grp) { return CAREER_BY_LETTER[firstLetter(grp)] || ""; }
function groupLetterTurno(grp) {
  const g = upper(grp);
  return TURNO_BY_LETTER[g[2]] || ""; // 0:sem, 1:letra carrera, 2:turno
}
function groupSemester(grp) {
  const g = upper(grp);
  const m = g.match(/^(\d)/);
  return m ? m[1] : ""; // primer dígito
}
function normalizeSem(sem) {
  // acepta "6", "Sexto (6º)", etc.
  const s = upper(sem);
  const m = s.match(/\d+/);
  return m ? m[0] : "";
}
function normalizeTurno(t) {
  const u = upper(t);
  if (u.startsWith("M")) return "MATUTINO";
  if (u.startsWith("V")) return "VESPERTINO";
  return "";
}

// Catálogo de grupos de ejemplo por carrera/semestre/turno
// Notación: SEM(5/6/7) + letra carrera (A/LCD, B/IA, C/ISC) + turno (M/V) + consecutivo
const GRUPOS = {
  IA: ["5BM1", "5BV1", "6BM1", "6BV1", "7BM1", "7BV1"],
  ISC: ["5CM1", "5CV1", "6CM1", "6CV1", "7CM1", "7CV1"],
  LCD: ["5AM1", "5AV1", "6AM1", "6AV1", "7AM1", "7AV1"],
};

// Devuelve grupos válidos para los selects, filtrando por carrera/semestre/turno
export function fetchGrupos({ carrera, semestre, turno } = {}) {
  const carr = upper(carrera);            // "IA" | "ISC" | "LCD"
  const sem = normalizeSem(semestre);     // "5" | "6" | "7"
  const tur = normalizeTurno(turno);      // "MATUTINO" | "VESPERTINO"

  let base = GRUPOS[carr] || [];
  if (!base.length) return [];

  if (sem) base = base.filter(g => groupSemester(g) === sem);
  if (tur) base = base.filter(g => groupLetterTurno(g) === tur);

  return base;
}

export async function fetchClases({ carrera, semestre, turno, grupo } = {}) {
  const carr = upper(carrera);            // "IA" | "ISC" | "LCD"
  const sem = normalizeSem(semestre);    // "5" | "6" | "7"
  const tur = normalizeTurno(turno);     // "MATUTINO"/"VESPERTINO" o ""
  const grp = upper(grupo);              // p. ej. "6BM1" o ""

  // Necesario mínimo: carrera + semestre
  if (!carr || !sem) return [];

  // 1) Partimos de todos los grupos válidos para carrera+semestre
  let grupos = fetchGrupos({ carrera: carr, semestre: sem, turno: "" }); // sin turno aún

  // 2) Si hay turno, filtramos por turno
  if (tur) {
    grupos = grupos.filter(g => groupLetterTurno(g) === tur);
  }

  // 3) Si hay grupo específico, nos quedamos sólo con ese
  if (grp) {
    grupos = grupos.filter(g => g === grp);
  }

  if (!grupos.length) return [];

  // Datos de ejemplo (mock)
  const materias = [
    { clave: "3209", nombre: "METODOLOGÍA DE LA INVESTIGACIÓN", profesor: "SALAZAR / MALDONADO", capacidad: 40 },
    { clave: "3209B", nombre: "SISTEMAS MULTIAGENTES", profesor: "PORTILLO / CEBRERO", capacidad: 35 },
    { clave: "3304", nombre: "CÓMPUTO PARALELO", profesor: "L.A. IBÁÑEZ", capacidad: 30 },
    { clave: "3305", nombre: "REDES NEURONALES Y APRENDIZAJE PROFUNDO", profesor: "JUAN IRVING", capacidad: 35 },
    { clave: "3306", nombre: "ING. SOFTWARE PARA SISTEMAS INTELIGENTES", profesor: "IDALIA MALDONADO", capacidad: 35 },
    { clave: "3307", nombre: "INTERACCIÓN HUMANO-COMPUTADORA", profesor: "IDALIA MALDONADO", capacidad: 35 },
  ];

  // Generamos clases para **cada grupo** resultante
  const rows = [];
  for (const g of grupos) {
    const base = `${carr}-${sem}-${normalizeTurno(groupLetterTurno(g))}-${g}`;
    materias.forEach((m, idx) => {
      rows.push({
        claseId: `${base}-${m.clave}-${idx}`,
        grupo: g,
        clave: m.clave,
        materia: m.nombre,
        profesor: m.profesor,
        capacidad: m.capacidad,
        horario: {
          Lunes: "12:00-13:30",
          Martes: idx % 2 ? "13:30-15:00" : "",
          Miércoles: "12:00-13:30",
          Jueves: idx % 2 ? "" : "13:30-15:00",
          Viernes: "",
        },
      });
    });
  }

  return rows;
}