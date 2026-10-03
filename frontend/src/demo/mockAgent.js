// src/demo/mockAgent.js
// Simulador autónomo de TecnoBurro 2.0 para el modo demostración 100% frontend.
// Reproduce fielmente el protocolo SSE (Tool Calling, Streaming de Tokens y Generative UI Widgets).

import { DEMO_USERS, DEMO_ALUMNO_HORARIO, DEMO_ALUMNO_KARDEX, DEMO_ALUMNO_CITA } from "./mockData";

export async function simulateAgentStream({ mensaje, threadId, user, onEvent }) {
  const query = (mensaje || "").toLowerCase().trim();
  const userName = user?.nombre || "Carlos";

  // Identificar intención y seleccionar respuesta simulada
  let tool = null;
  let responseText = "";

  if (query.includes("kardex") || query.includes("calificaci") || query.includes("promedio") || query.includes("credito")) {
    tool = "consultar_mi_kardex";
    responseText = 
`Hola ${userName}. He consultado tu kárdex oficial en el Sistema Institucional de Control Escolar de ESCOM.

📊 **Resumen Académico Actualizado (2026-1):**
- **Promedio General Ponderado:** 8.85
- **Créditos Totales del Plan:** 352.0 créditos
- **Créditos Acreditados:** 215.0 créditos (61.08% de avance curricular)
- **Materias Aprobadas:** 24 asignaturas
- **Situación Académica:** Regular. Mantienes un ritmo sobresaliente hacia el bloque de especialidad terminal.

Tus calificaciones más destacadas del último ciclo incluyen **Tecnologías para la Web (10)**, **Diseño de Sistemas (10)** y **Desarrollo de Aplicaciones Móviles (9)**.

[WIDGET:KARDEX:{"promedio":8.85,"creditos_totales":352.0,"creditos_obtenidos":215.0,"porcentaje_avance":61.08,"materias_aprobadas":24,"materias_reprobadas":0}]
[SUGGESTIONS:["¿Cuál es mi horario de clases vigente?", "¿Cuándo es mi cita de reinscripción?", "¿Qué materias optativas puedo cursar?"]]`;

  } else if (query.includes("horario") || query.includes("clase") || query.includes("salon") || query.includes("hoy")) {
    tool = "consultar_mi_horario";
    responseText = 
`Con gusto, ${userName}. Este es tu horario de clases oficial registrado para el periodo escolar **2026-1**:

📅 **Asignaturas y Profesores Asignados:**
1. 💻 **Sistemas Distribuidos** (ISC-103 | Grupo 3CM1)
   - Docente: Dra. Miriam Pescador Rojas
   - Horario: Martes y Jueves de 07:00 a 09:00 hrs | **Aula 2105 (Edificio 2)**
2. ⚙️ **Compiladores** (ISC-104 | Grupo 3CM1)
   - Docente: Dr. Ulises Vélez Saldaña
   - Horario: Lunes, Miércoles y Viernes de 10:30 a 12:00 hrs | **Aula 1104 (Edificio 1)**
3. 🌐 **Redes de Computadoras** (ISC-105 | Grupo 3CM2)
   - Docente: M. en C. Mario Aldape
   - Horario: Lunes y Miércoles de 07:00 a 08:30 hrs | **Laboratorio de Redes 2**
4. 🤖 **Fundamentos de IA** (IIA-101 | Grupo 3CM3)
   - Docente: Dr. Roberto Cruz Martínez
   - Horario: Martes y Jueves de 09:00 a 10:30 hrs | **Aula 1202 (Edificio 1)**
5. 📊 **Administración de Proyectos** (ISC-106 | Grupo 3CM1)
   - Docente: Dra. Claudia Rivera Sánchez
   - Horario: Viernes de 07:00 a 10:00 hrs | **Aula 2103 (Edificio 2)**

[WIDGET:SCHEDULE:{"total_materias":5,"periodo":"2026-1"}]
[SUGGESTIONS:["¿Dónde está el cubículo de la Dra. Miriam?", "Simular calificación en Compiladores", "Auditar asistencias y faltas"]]`;

  } else if (query.includes("simula") || query.includes("meta") || query.includes("compiladores")) {
    tool = "simular_calificacion_requerida";
    responseText = 
`🎯 **Simulación de Calificación Requerida — Compiladores (ISC-104)**

Analizando tus evaluaciones registradas con el **Dr. Ulises Vélez Saldaña**:
- **1er Parcial:** 8.0 (Peso: 30%)
- **2do Parcial:** 7.5 (Peso: 35%)
- **Promedio acumulado actual:** 7.71

Para alcanzar tu meta final deseada de **8.5**:
- Necesitas obtener al menos un **9.4 en el 3er Parcial** (Examen Teórico + Proyecto de Análisis Semántico con ANTLR).
- Con una calificación de **6.0 en el 3er Parcial**, apruebas la materia con promedio de **7.1**.
- Recuerda que el RGE no permite promedios con decimales reprobatorios menores a 6.0.

[SUGGESTIONS:["¿Dónde está el cubículo del profesor?", "Ver mi kárdex oficial", "Consultar fechas de exámenes ETS"]]`;

  } else if (query.includes("donde") || query.includes("ubicacion") || query.includes("cubiculo") || query.includes("profesor") || query.includes("miriam")) {
    tool = "ubicar_profesor_o_salon";
    responseText = 
`📍 **Ubicación de Docente en ESCOM:**

He localizado a la **Dra. Miriam Pescador Rojas**:
- **Academia:** Sistemas Distribuidos y Redes de Computadoras
- **Cubículo:** **Cubículo 2105**
- **Ubicación Física:** Edificio 2, Planta Alta (junto a los laboratorios de telemática)
- **Horario de Asesorías:** Martes y Jueves de 10:00 a 12:00 hrs.

[WIDGET:TEACHER_LOCATION:{"profesor":"Dra. Miriam Pescador Rojas","cubiculo":"Cubículo 2105 (Edificio 2, Planta Alta)","academia":"Sistemas Distribuidos y Redes"}]
[SUGGESTIONS:["¿Qué materias imparte la profesora?", "¿Cuál es mi horario de clases?", "¿Dónde queda el aula 1104?"]]`;

  } else if (query.includes("reglamento") || query.includes("articulo") || query.includes("normativa") || query.includes("dictamen") || query.includes("baja")) {
    tool = "consultar_reglamento_academico";
    responseText = 
`🏛️ **Consulta Normativa Oficial: Reglamento General de Estudios (RGE) del IPN**

Con base en la normativa politécnica vigente recuperada:

1. ⚖️ **Artículo 41 (Permanencia y Tiempo Límite):**
   El alumno tiene derecho a cursar sus estudios en un plazo máximo equivalente a **1.5 veces la duración estándar del plan de estudio** (para ISC son hasta 12 periodos lectivos regulares). Si se supera este límite o se adeuda una misma asignatura en tres ocasiones ordinarias, se causa baja reglamentaria debiendo solicitar dictamen ante la Comisión de Situación Escolar del Consejo General Consultivo.

2. 📝 **Artículo 47 (Exámenes a Título de Suficiencia - ETS):**
   Los ETS evalúan la totalidad del programa de estudios. Tienes derecho a inscribir hasta **2 asignaturas por periodo ordinario de ETS** y hasta 3 en periodo extraordinario, siempre y cuando no exista incompatibilidad de seriación o sanción disciplinaria.

3. ⏱️ **Artículo 45 (Asistencia Mínima Obligatoria):**
   Para tener derecho a evaluación ordinaria continua, se requiere cumplir con un mínimo del **80% de asistencias** efectivas durante el semestre.

[SUGGESTIONS:["¿Cómo tramito un dictamen escolar?", "¿Cuándo es mi cita de reinscripción?", "¿Cuáles son mis materias actuales?"]]`;

  } else if (query.includes("optativa") || query.includes("plan")) {
    tool = "consultar_optativas_y_plan";
    responseText = 
`📚 **Materias Optativas Disponibles para tu Plan Curricular (ISC 2020)**

Al encontrarte en **6to semestre** con 215 créditos acreditados, eres elegible para inscribir asignaturas de las siguientes líneas de especialidad:

🔹 **Línea de Cómputo en la Nube y Distribuido:**
- *Computación Tolerante a Fallas* (Cupos: 12 disponibles)
- *Arquitectura de Microservicios con Kubernetes* (Cupos: 8 disponibles)

🔹 **Línea de Ciencia de Datos y Machine Learning:**
- *Procesamiento de Lenguaje Natural* (Cupos: 15 disponibles)
- *Visión por Computadora* (Cupos: 10 disponibles)

🔹 **Línea de Ciberseguridad Institucional:**
- *Criptografía Aplicada y Análisis de Vulnerabilidades* (Cupos: 6 disponibles)

[SUGGESTIONS:["¿Cuándo es mi cita de reinscripción?", "¿Cuál es mi promedio acumulado?", "Ver mi horario actual"]]`;

  } else if (query.includes("cita") || query.includes("reinscripcion") || query.includes("tramite")) {
    tool = "consultar_estatus_mis_tramites";
    responseText = 
`📋 **Estatus de Cita de Reinscripción y Trámites Escolares**

📅 **Cita de Reinscripción Asignada (Periodo 2026-2):**
- **Fecha y Hora:** ${DEMO_ALUMNO_CITA.fecha_formateada}
- **Prioridad Institucional:** **${DEMO_ALUMNO_CITA.prioridad}** (Asignada por tu promedio de **8.85** y estatus como alumno regular).
- **Lugar:** Sistema SAES / Ventanilla Virtual PAIDEA.

📜 **Trámites Registrados:**
- *Solicitud de Constancia de Estudios con Créditos:* **Completada y Lista para Descarga**.

[SUGGESTIONS:["Ver mi kárdex oficial", "¿Qué materias optativas puedo cursar?", "Consultar horario de clases"]]`;

  } else {
    responseText = 
`Hola ${userName}. Como tu mentor académico inteligente en PAIDEA (ESCOM - IPN), estoy listo para orientarte.

Puedo ayudarte de forma inmediata con:
- 🎓 **Tu Kárdex Oficial y Créditos** (Promedio actual: 8.85)
- 📅 **Tu Horario de Clases y Salones** (Semestre 2026-1)
- 🎯 **Simuladores de Calificaciones** para tus parciales
- 📍 **Localización de Profesores y Cubículos** en los edificios de ESCOM
- 🏛️ **Reglamento General de Estudios** (Bajas, permanencia, Art. 41 y 47)
- 📋 **Citas de Reinscripción y Trámites Escolares**

¿Sobre qué área te gustaría consultar información?

[SUGGESTIONS:["¿Cuál es mi kárdex oficial?", "¿Cuál es mi horario de clases?", "¿Dónde está el cubículo de la Dra. Miriam?"]]`;
  }

  // 1. Emitir evento de hilo
  onEvent({ type: "thread", thread_id: threadId || 101 });

  // 2. Si hay herramienta involucrada, emitir tool_start y simular tiempo de búsqueda
  if (tool) {
    onEvent({ type: "tool_start", tool });
    await new Promise((r) => setTimeout(r, 450));
  }

  // 3. Emitir tokens con efecto de máquina de escribir progresiva
  const tokens = responseText.split(/(?<=\s|\[|\]|\n)/);
  let accumulated = "";

  for (let i = 0; i < tokens.length; i++) {
    const chunk = tokens[i];
    accumulated += chunk;
    onEvent({ type: "token", content: chunk });
    // Retardo sutil entre palabras para un renderizado ultra-fluido
    await new Promise((r) => setTimeout(r, 12));
  }

  // 4. Emitir fin de la transmisión
  onEvent({ type: "done", full_text: responseText });
}
