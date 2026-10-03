// src/demo/mockData.js
// Conjunto de datos enriquecidos representativos de ESCOM - IPN para el modo demostración 100% autónomo.

export const DEMO_USERS = {
  alumno: {
    id: 1,
    email: "cmendozar@alumno.ipn.mx",
    nombre: "Carlos",
    primer_apellido: "Mendoza",
    segundo_apellido: "Reyes",
    nombre_completo: "Carlos Mendoza Reyes",
    rol: "Alumno",
    activo: true,
    boleta: "2021630123",
    carrera: "Ingeniería en Sistemas Computacionales",
    promedio: 8.85,
    semestre: 6,
    rfc_profesor: null,
    academia: null,
    datos_personales: {
      curp: "MERC020512HDFRYS09",
      rfc: "MERC020512AB1",
      telefono: "55 1234 5678",
      sexo: "Masculino",
      fecha_nacimiento: "2002-05-12"
    },
    direccion: {
      calle: "Av. Juan de Dios Bátiz",
      numero_exterior: "S/N",
      numero_interior: null,
      colonia: "Nueva Industrial Vallejo",
      alcaldia: "Gustavo A. Madero",
      codigo_postal: "07738",
      estado: "Ciudad de México"
    }
  },

  profesor: {
    id: 2,
    email: "mpescador@ipn.mx",
    nombre: "Miriam",
    primer_apellido: "Pescador",
    segundo_apellido: "Rojas",
    nombre_completo: "Dra. Miriam Pescador Rojas",
    rol: "Profesor",
    activo: true,
    boleta: null,
    carrera: null,
    promedio: null,
    semestre: null,
    rfc_profesor: "PEAR750815AB1",
    academia: "Sistemas Distribuidos y Redes",
    cubiculo: "Edificio 2, Planta Alta, Cubículo 2105",
    datos_personales: {
      curp: "PEAR750815MDFJS04",
      rfc: "PEAR750815AB1",
      telefono: "55 9876 5432",
      sexo: "Femenino",
      fecha_nacimiento: "1975-08-15"
    },
    direccion: {
      calle: "Av. Instituto Politécnico Nacional",
      numero_exterior: "2580",
      numero_interior: "Depto 4B",
      colonia: "Lindavista",
      alcaldia: "Gustavo A. Madero",
      codigo_postal: "07300",
      estado: "Ciudad de México"
    }
  },

  admin: {
    id: 3,
    email: "admin@escom.ipn.mx",
    nombre: "Control",
    primer_apellido: "Escolar",
    segundo_apellido: "ESCOM",
    nombre_completo: "Departamento de Control Escolar ESCOM",
    rol: "Administrador",
    activo: true,
    boleta: null,
    carrera: null,
    promedio: null,
    semestre: null,
    rfc_profesor: null,
    academia: null,
    datos_personales: {
      curp: "CESC800101HDFXX01",
      rfc: "CESC800101IPN",
      telefono: "55 5729 6000 ext. 52000",
      sexo: "Indistinto",
      fecha_nacimiento: "1980-01-01"
    },
    direccion: {
      calle: "Av. Juan de Dios Bátiz esq. Miguel Othón de Mendizábal",
      numero_exterior: "S/N",
      numero_interior: "Edificio de Gobierno",
      colonia: "Nueva Industrial Vallejo",
      alcaldia: "Gustavo A. Madero",
      codigo_postal: "07738",
      estado: "Ciudad de México"
    }
  }
};

// Horario actual del alumno Carlos Mendoza
export const DEMO_ALUMNO_HORARIO = [
  {
    clase_id: 101,
    materia: "Sistemas Distribuidos",
    clave: "ISC-103",
    creditos: 7.5,
    grupo: "3CM1",
    aula: "Aula 2105 (Edificio 2)",
    profesor: "Dra. Miriam Pescador Rojas",
    horarios: [
      { dia: "Martes", inicio: "07:00", fin: "09:00" },
      { dia: "Jueves", inicio: "07:00", fin: "09:00" }
    ]
  },
  {
    clase_id: 102,
    materia: "Compiladores",
    clave: "ISC-104",
    creditos: 7.5,
    grupo: "3CM1",
    aula: "Aula 1104 (Edificio 1)",
    profesor: "Dr. Ulises Vélez Saldaña",
    horarios: [
      { dia: "Lunes", inicio: "10:30", fin: "12:00" },
      { dia: "Miércoles", inicio: "10:30", fin: "12:00" },
      { dia: "Viernes", inicio: "10:30", fin: "12:00" }
    ]
  },
  {
    clase_id: 103,
    materia: "Redes de Computadoras",
    clave: "ISC-105",
    creditos: 7.5,
    grupo: "3CM2",
    aula: "Laboratorio de Redes 2",
    profesor: "M. en C. Mario Aldape",
    horarios: [
      { dia: "Lunes", inicio: "07:00", fin: "08:30" },
      { dia: "Miércoles", inicio: "07:00", fin: "08:30" }
    ]
  },
  {
    clase_id: 104,
    materia: "Fundamentos de Inteligencia Artificial",
    clave: "IIA-101",
    creditos: 7.5,
    grupo: "3CM3",
    aula: "Aula 1202 (Edificio 1)",
    profesor: "Dr. Roberto Cruz Martínez",
    horarios: [
      { dia: "Martes", inicio: "09:00", fin: "10:30" },
      { dia: "Jueves", inicio: "09:00", fin: "10:30" }
    ]
  },
  {
    clase_id: 105,
    materia: "Administración de Proyectos",
    clave: "ISC-106",
    creditos: 6.0,
    grupo: "3CM1",
    aula: "Aula 2103 (Edificio 2)",
    profesor: "Dra. Claudia Rivera Sánchez",
    horarios: [
      { dia: "Viernes", inicio: "07:00", fin: "10:00" }
    ]
  }
];

// Kárdex oficial de Carlos Mendoza
export const DEMO_ALUMNO_KARDEX = {
  promedio: 8.85,
  creditos_totales: 352.0,
  creditos_acumulados: 215.0,
  porcentaje_avance: 61.08,
  materias_aprobadas: 24,
  materias_reprobadas: 1,
  materias: [
    { clave: "ISC-001", nombre: "Cálculo Diferencial e Integral", semestre: 1, calificacion: 9, periodo: "2023-1", estatus: "Aprobada" },
    { clave: "ISC-002", nombre: "Álgebra Lineal", semestre: 1, calificacion: 8, periodo: "2023-1", estatus: "Aprobada" },
    { clave: "ISC-003", nombre: "Fundamentos de Programación", semestre: 1, calificacion: 10, periodo: "2023-1", estatus: "Aprobada" },
    { clave: "ISC-004", nombre: "Física Clásica", semestre: 1, calificacion: 8, periodo: "2023-1", estatus: "Aprobada" },
    { clave: "ISC-005", nombre: "Estructuras de Datos", semestre: 2, calificacion: 9, periodo: "2023-2", estatus: "Aprobada" },
    { clave: "ISC-006", nombre: "Programación Orientada a Objetos", semestre: 2, calificacion: 10, periodo: "2023-2", estatus: "Aprobada" },
    { clave: "ISC-007", nombre: "Matemáticas Discretas", semestre: 2, calificacion: 8, periodo: "2023-2", estatus: "Aprobada" },
    { clave: "ISC-008", nombre: "Ecuaciones Diferenciales", semestre: 2, calificacion: 7, periodo: "2023-2", estatus: "Aprobada" },
    { clave: "ISC-009", nombre: "Bases de Datos Relacionales", semestre: 3, calificacion: 9, periodo: "2024-1", estatus: "Aprobada" },
    { clave: "ISC-010", nombre: "Arquitectura de Computadoras", semestre: 3, calificacion: 8, periodo: "2024-1", estatus: "Aprobada" },
    { clave: "ISC-011", nombre: "Teoría de la Computación", semestre: 3, calificacion: 9, periodo: "2024-1", estatus: "Aprobada" },
    { clave: "ISC-012", nombre: "Probabilidad y Estadística", semestre: 3, calificacion: 8, periodo: "2024-1", estatus: "Aprobada" },
    { clave: "ISC-013", nombre: "Sistemas Operativos", semestre: 4, calificacion: 9, periodo: "2024-2", estatus: "Aprobada" },
    { clave: "ISC-014", nombre: "Diseño de Sistemas", semestre: 4, calificacion: 10, periodo: "2024-2", estatus: "Aprobada" },
    { clave: "ISC-015", nombre: "Ingeniería de Software", semestre: 4, calificacion: 9, periodo: "2024-2", estatus: "Aprobada" },
    { clave: "ISC-016", nombre: "Algoritmia Avanzada", semestre: 4, calificacion: 5, periodo: "2024-2", estatus: "Reprobada" },
    { clave: "ISC-016", nombre: "Algoritmia Avanzada (ETS)", semestre: 4, calificacion: 8, periodo: "2025-1", estatus: "Aprobada" },
    { clave: "ISC-017", nombre: "Tecnologías para la Web", semestre: 5, calificacion: 10, periodo: "2025-1", estatus: "Aprobada" },
    { clave: "ISC-018", nombre: "Desarrollo de Aplicaciones Móviles", semestre: 5, calificacion: 9, periodo: "2025-1", estatus: "Aprobada" },
    { clave: "ISC-019", nombre: "Seguridad Informática", semestre: 5, calificacion: 8, periodo: "2025-1", estatus: "Aprobada" }
  ]
};

// Cita de reinscripción activa
export const DEMO_ALUMNO_CITA = {
  fecha_hora: "2026-02-14T09:15:00",
  fecha_formateada: "14 de Febrero de 2026 a las 09:15 AM",
  prioridad: "Alta",
  motivo_prioridad: "Promedio destacado (8.85) sin adeudo de materias",
  estatus: "Confirmada",
  periodo: "2026-2"
};

// Clases del profesor Dra. Miriam Pescador
export const DEMO_PROFESOR_CLASES = [
  {
    id: 201,
    materia: "Sistemas Distribuidos",
    clave: "ISC-103",
    grupo: "3CM1",
    aula: "Aula 2105 (Edificio 2)",
    cupo_maximo: 35,
    inscritos: 32,
    horarios: [
      { dia: "Martes", inicio: "07:00", fin: "09:00" },
      { dia: "Jueves", inicio: "07:00", fin: "09:00" }
    ]
  },
  {
    id: 202,
    materia: "Bases de Datos Avanzadas",
    clave: "ISC-205",
    grupo: "3CV2",
    aula: "Aula 1102 (Edificio 1)",
    cupo_maximo: 30,
    inscritos: 28,
    horarios: [
      { dia: "Lunes", inicio: "14:00", fin: "16:00" },
      { dia: "Miércoles", inicio: "14:00", fin: "16:00" }
    ]
  }
];

// Carreras para formularios administrativos
export const DEMO_CARRERAS = [
  { _id: "carr_1", id: 1, clave: "ISC", nombre: "Ingeniería en Sistemas Computacionales", creditos_totales: 352.0 },
  { _id: "carr_2", id: 2, clave: "IIA", nombre: "Ingeniería en Inteligencia Artificial", creditos_totales: 360.0 },
  { _id: "carr_3", id: 3, clave: "LCD", nombre: "Licenciatura en Ciencia de Datos", creditos_totales: 348.0 }
];

// Periodos académicos
export const DEMO_PERIODOS = [
  {
    _id: "per_2026_1",
    id: 1,
    clave: "2026-1",
    nombre: "Periodo Escolar 2026-1",
    fechaInicio: "2026-01-26",
    fechaFinal: "2026-06-20",
    activo: true
  },
  {
    _id: "per_2025_2",
    id: 2,
    clave: "2025-2",
    nombre: "Periodo Escolar 2025-2",
    fechaInicio: "2025-08-15",
    fechaFinal: "2025-12-18",
    activo: false
  }
];

// Profesores para listados administrativos
export const DEMO_PROFESORES_LIST = [
  {
    _id: "prof_1",
    nombre: "Miriam",
    primerApellido: "Pescador",
    segundoApellido: "Rojas",
    correo: "mpescador@ipn.mx",
    rol: "Profesor",
    datosPersonales: {
      rfc: "PEAR750815AB1",
      curp: "PEAR750815MDFJS04",
      telefono: "55 9876 5432"
    },
    profesorData: {
      academia: "Sistemas Distribuidos y Redes",
      cubiculo: "Edificio 2, Planta Alta, Cubículo 2105"
    }
  },
  {
    _id: "prof_2",
    nombre: "Ulises",
    primerApellido: "Vélez",
    segundoApellido: "Saldaña",
    correo: "uvelez@ipn.mx",
    rol: "Profesor",
    datosPersonales: {
      rfc: "VESU800312XX9",
      curp: "VESU800312HDFLL02",
      telefono: "55 5729 6000 ext. 52021"
    },
    profesorData: {
      academia: "Ciencias de la Computación",
      cubiculo: "Edificio 1, Cubículo 1104"
    }
  },
  {
    _id: "prof_3",
    nombre: "Claudia",
    primerApellido: "Rivera",
    segundoApellido: "Sánchez",
    correo: "criveras@ipn.mx",
    rol: "Profesor",
    datosPersonales: {
      rfc: "RISC820921PQ3",
      curp: "RISC820921MDFMN07",
      telefono: "55 5729 6000 ext. 52018"
    },
    profesorData: {
      academia: "Ingeniería de Software y Gestión",
      cubiculo: "Edificio 2, Cubículo 2103"
    }
  }
];

// Alumnos de ejemplo precargados para el modal de alta masiva (sin necesidad de archivo Excel)
export const DEMO_ALUMNOS_EJEMPLO = [
  {
    nombre: "Mariana Sofía González Pérez",
    curp: "GOPM030415MDFRRN01",
    correo: "mgonzalezp03@alumno.ipn.mx",
    carrera: "Ingeniería en Inteligencia Artificial",
    periodo: "Periodo Escolar 2026-1"
  },
  {
    nombre: "Diego Alejandro Torres Morales",
    curp: "TOMD021108HDFRRL09",
    correo: "dtorresm02@alumno.ipn.mx",
    carrera: "Ingeniería en Sistemas Computacionales",
    periodo: "Periodo Escolar 2026-1"
  },
  {
    nombre: "Valeria Ximena Castillo Ruiz",
    curp: "CARV030922MDFSLN05",
    correo: "vcastillor03@alumno.ipn.mx",
    carrera: "Licenciatura en Ciencia de Datos",
    periodo: "Periodo Escolar 2026-1"
  },
  {
    nombre: "Emiliano Vázquez Hernández",
    curp: "VAHE020730HDFZRN03",
    correo: "evazquezh02@alumno.ipn.mx",
    carrera: "Ingeniería en Sistemas Computacionales",
    periodo: "Periodo Escolar 2026-1"
  }
];
