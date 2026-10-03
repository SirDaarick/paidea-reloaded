import React, { useState, useEffect } from "react";
import Menu from "components/Menu";
import { useAuth } from "context/AuthContext";
import apiCall from "consultas/APICall";

export default function Reinscripciones() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cita, setCita] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ minutes: 41, seconds: 48 });
  const [selectedSemester, setSelectedSemester] = useState("6");
  const [searchQuery, setSearchQuery] = useState("");
  const [enrolledCourses, setEnrolledCourses] = useState(["IA-604", "IA-602", "IA-601"]);
  const [successModal, setSuccessModal] = useState(false);

  // Catálogo completo de grupos disponibles para reinscripción en ESCOM
  const catalog = [
    {
      clave: "IA-603",
      materia: "Visión por Computadora",
      semestre: 6,
      creditos: 7.5,
      prerrequisitos: "Procesamiento Digital de Señales",
      grupos: [
        {
          grupo: "6IA1",
          profesor: "Dra. Amparo Morales",
          horario: "Mar, Jue 08:30 - 10:00",
          salon: "Edif. 1 · Salón 1204",
          cupo_actual: 31,
          cupo_max: 35,
          estado: "disponible",
        },
        {
          grupo: "6IA2",
          profesor: "M. en C. Roberto Palacios Nava",
          horario: "Mar, Jue 10:00 - 12:15",
          salon: "Edif. 1 · Salón 1204",
          cupo_actual: 34,
          cupo_max: 35,
          estado: "disponible",
        },
        {
          grupo: "6IA3",
          profesor: "Dr. Ulises Vélez Saldaña",
          horario: "Lun, Mié 13:00 - 15:15",
          salon: "Lab. Visión y Gráficos",
          cupo_actual: 35,
          cupo_max: 35,
          estado: "agotado",
        },
      ],
    },
    {
      clave: "IA-604",
      materia: "Aprendizaje Profundo (Deep Learning)",
      semestre: 6,
      creditos: 8.0,
      prerrequisitos: "Redes Neuronales y Métodos Estadísticos",
      grupos: [
        {
          grupo: "6IA1",
          profesor: "Dr. José Martínez Ramos",
          horario: "Mar, Jue 10:00 - 12:15",
          salon: "Laboratorio de IA 1 (Edif. 1)",
          cupo_actual: 23,
          cupo_max: 35,
          estado: "disponible",
        },
      ],
    },
    {
      clave: "IA-602",
      materia: "Compiladores",
      semestre: 6,
      creditos: 7.0,
      prerrequisitos: "Teoría de la Computación",
      grupos: [
        {
          grupo: "6IA1",
          profesor: "Dr. Edgardo Franco Martínez",
          horario: "Lun, Mié 11:30 - 13:00",
          salon: "Edif. 2 · Salón 2201",
          cupo_actual: 27,
          cupo_max: 35,
          estado: "disponible",
        },
      ],
    },
    {
      clave: "IA-601",
      materia: "Sistemas Distribuidos",
      semestre: 6,
      creditos: 6.5,
      prerrequisitos: "Sistemas Operativos y Redes",
      grupos: [
        {
          grupo: "6IA1",
          profesor: "M. en C. Roberto Palacios",
          horario: "Lun, Mié, Vie 07:00 - 08:30",
          salon: "Edif. 1 · Salón 1204",
          cupo_actual: 32,
          cupo_max: 35,
          estado: "disponible",
        },
      ],
    },
    {
      clave: "IA-504",
      materia: "Redes de Computadoras Avanzadas",
      semestre: 5,
      creditos: 6.5,
      prerrequisitos: "Arquitectura de Computadoras",
      grupos: [
        {
          grupo: "5IA2",
          profesor: "Ing. Sandra Ortiz Mendoza",
          horario: "Lun, Mié 07:00 - 09:00",
          salon: "Edif. 1 · Salón 1102",
          cupo_actual: 29,
          cupo_max: 35,
          estado: "conflicto", // Se empalma con 6IA1 si está inscrito a las 07:00
        },
      ],
    },
  ];

  // Temporizador regresivo en vivo
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Carga de cita desde FastAPI
  useEffect(() => {
    async function loadCita() {
      try {
        setLoading(true);
        const data = await apiCall("/api/v1/alumnos/me/cita", "GET");
        setCita(data);
      } catch (err) {
        console.warn("[Reinscripcion] Error fetching cita:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCita();
  }, []);

  const toggleCourseEnrollment = (clave) => {
    if (enrolledCourses.includes(clave)) {
      setEnrolledCourses(enrolledCourses.filter((c) => c !== clave));
    } else {
      setEnrolledCourses([...enrolledCourses, clave]);
    }
  };

  // Calcular créditos inscritos
  const totalCreditos = enrolledCourses.reduce((acc, clave) => {
    const found = catalog.find((c) => c.clave === clave);
    return acc + (found ? found.creditos : 0);
  }, 0);

  const alumnoNombre = user?.nombre_completo || "Carlos Pérez Ramírez";
  const carrera = user?.alumno?.carrera?.nombre || "Ingeniería en Sistemas Computacionales";
  const promedio = user?.alumno?.promedio || 8.92;

  const filteredCatalog = catalog.filter((item) => {
    const matchSem = selectedSemester === "all" || String(item.semestre) === String(selectedSemester);
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q || item.materia.toLowerCase().includes(q) || item.clave.toLowerCase().includes(q);
    return matchSem && matchSearch;
  });

  return (
    <div className="min-h-screen bg-surface-ice font-body-md text-text-primary">
      <Menu />

      <main className="w-full max-w-[1440px] mx-auto pt-6 px-4 sm:px-6 lg:px-8 pb-16 space-y-6">
        {/* 1. Banner & Header con Cita */}
        <section className="flex flex-col gap-4 w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-text-muted text-xs uppercase tracking-wider mb-1">
                <span className="material-symbols-outlined text-[16px] text-accent-blue">school</span>
                <span>ESCOM · Dirección de Asuntos Escolares y SAES</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                Proceso de Reinscripción Semestral
              </h1>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5">
                Periodo Escolar 2026-1 · Plan 2020 · {carrera}
              </p>
            </div>

            <div className="flex items-center gap-2 bg-surface-card px-4 py-2 rounded-full shadow-[4px_4px_10px_rgba(62,81,125,0.08),-2px_-2px_6px_#ffffff] text-xs font-semibold text-text-muted">
              <span className="material-symbols-outlined text-[18px] text-tertiary">calendar_today</span>
              <span>
                Cita Ordinaria: <strong className="text-text-primary">14 de Febrero de 2026</strong>
              </span>
            </div>
          </div>

          {/* Tarjeta Clay Principal de Cita */}
          <div className="bg-surface-card rounded-2xl p-5 sm:p-6 shadow-[8px_8px_20px_rgba(62,81,125,0.08),-6px_-6px_16px_#FFFFFF] relative overflow-hidden">
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Info Cita */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shadow-[inset_1px_1px_2px_rgba(16,185,129,0.15)]">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                    </span>
                    Cita Activa · Turno en Curso
                  </span>
                  <span className="px-3 py-1 rounded-full bg-secondary-fixed text-primary text-xs font-semibold">
                    Turno Preferente #142
                  </span>
                </div>

                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-primary">
                    Viernes 14 de Febrero de 2026 · 10:30 AM
                  </h2>
                  <p className="text-xs sm:text-sm text-text-muted leading-relaxed mt-1">
                    Cita asignada por algoritmo de prelación SAES-PAIDEA:{" "}
                    <strong className="text-text-primary">Promedio General {promedio} (Top 12%)</strong> · Alumno Regular sin adeudos académicos ni administrativos.
                  </p>
                </div>

                {/* Mini estadísticas de carga */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-surface-container-low flex items-center gap-3 shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
                    <div className="p-2 rounded-lg bg-surface-card text-primary shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">award_star</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-text-muted font-medium">Créditos autorizados</span>
                      <span className="text-xs font-bold text-text-primary">Hasta 45.0 SATCA máx.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container-low flex items-center gap-3 shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
                    <div className="p-2 rounded-lg bg-surface-card text-tertiary shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">auto_stories</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-text-muted font-medium">Carga sugerida</span>
                      <span className="text-xs font-bold text-text-primary">5 a 6 Unidades de Aprendizaje</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Temporizador Volumétrico Clay 3D */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-b from-surface-ice to-surface-card shadow-[inset_1px_1px_3px_#ffffff,4px_4px_12px_rgba(62,81,125,0.08)]">
                <div className="flex items-center gap-1.5 text-text-muted text-xs uppercase tracking-wide font-bold mb-2">
                  <span className="material-symbols-outlined text-[16px] text-amber-500">timer</span>
                  <span>Tiempo restante de ventana:</span>
                </div>

                <div className="flex items-center justify-center gap-2 font-mono font-extrabold text-3xl sm:text-4xl text-primary my-1">
                  <div className="px-3 py-1.5 rounded-xl bg-surface-card shadow-[4px_4px_10px_rgba(62,81,125,0.1),-2px_-2px_6px_#ffffff] flex flex-col items-center">
                    <span>00</span>
                    <span className="text-[9px] text-text-muted font-sans font-normal uppercase">hrs</span>
                  </div>
                  <span className="text-secondary opacity-40 -mt-2">:</span>
                  <div className="px-3 py-1.5 rounded-xl bg-surface-card shadow-[4px_4px_10px_rgba(62,81,125,0.1),-2px_-2px_6px_#ffffff] flex flex-col items-center text-primary-container">
                    <span>{String(timeLeft.minutes).padStart(2, "0")}</span>
                    <span className="text-[9px] text-text-muted font-sans font-normal uppercase">min</span>
                  </div>
                  <span className="text-secondary opacity-40 -mt-2">:</span>
                  <div className="px-3 py-1.5 rounded-xl bg-surface-card shadow-[4px_4px_10px_rgba(62,81,125,0.1),-2px_-2px_6px_#ffffff] flex flex-col items-center text-accent-blue">
                    <span>{String(timeLeft.seconds).padStart(2, "0")}</span>
                    <span className="text-[9px] text-text-muted font-sans font-normal uppercase">seg</span>
                  </div>
                </div>

                <div className="w-full mt-3 flex flex-col gap-1.5">
                  <div className="h-2.5 w-full bg-surface-container-high rounded-full overflow-hidden p-0.5 shadow-[inset_1px_1px_3px_rgba(62,81,125,0.12)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-blue to-primary transition-all duration-700"
                      style={{ width: `${(timeLeft.minutes / 60) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-text-muted text-[11px]">
                    <span>Ventana de 60 minutos</span>
                    <span className="text-primary font-bold">Cierra 11:30 AM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Área Split View: Catálogo vs Carrito Inscrito */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Catálogo de Asignaturas (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="bg-surface-card rounded-2xl p-4 shadow-[8px_8px_20px_rgba(62,81,125,0.08),-6px_-6px_16px_#FFFFFF] flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">list_alt</span>
                  <h2 className="text-base sm:text-lg font-bold text-text-primary">
                    Catálogo de Grupos Disponibles
                  </h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-primary text-xs font-semibold">
                  6° Semestre · Tronco Profesional
                </span>
              </div>

              {/* Buscador y filtro */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-8 relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-text-muted text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar materia por nombre o clave..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-low text-xs sm:text-sm placeholder:text-text-muted focus:outline-none focus:bg-surface-card transition-all shadow-[inset_1px_1px_3px_rgba(62,81,125,0.08)]"
                  />
                </div>
                <div className="sm:col-span-4 relative flex items-center">
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs font-semibold text-text-primary appearance-none cursor-pointer focus:outline-none shadow-[inset_1px_1px_3px_rgba(62,81,125,0.08)]"
                  >
                    <option value="6">6° Semestre (Plan 2020)</option>
                    <option value="5">5° Semestre (Recursamiento)</option>
                    <option value="all">Todos los Semestres</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Lista de Asignaturas del Catálogo */}
            <div className="space-y-3.5">
              {filteredCatalog.map((item) => {
                const isEnrolled = enrolledCourses.includes(item.clave);

                return (
                  <div
                    key={item.clave}
                    className="bg-surface-card rounded-2xl p-4 sm:p-5 shadow-[8px_8px_20px_rgba(62,81,125,0.08),-6px_-6px_16px_#FFFFFF] flex flex-col gap-3 transition-transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-primary font-bold text-sm shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)] shrink-0">
                          <span className="material-symbols-outlined text-[22px]">school</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm sm:text-base font-bold text-text-primary">{item.materia}</h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-container-low text-text-muted font-bold">
                              {item.clave}
                            </span>
                          </div>
                          <span className="text-xs text-text-muted block mt-0.5">
                            {item.creditos} Créditos SATCA · Prerrequisito: {item.prerrequisitos}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                          isEnrolled ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-secondary"
                        }`}
                      >
                        {isEnrolled ? "En Carrito" : "Disponible"}
                      </span>
                    </div>

                    {/* Grupos disponibles de la materia */}
                    <div className="space-y-2 pt-1 border-t border-surface-container-high/40">
                      {item.grupos.map((g, gIdx) => {
                        const isConflict = g.estado === "conflicto";
                        const isFull = g.estado === "agotado";

                        return (
                          <div
                            key={gIdx}
                            className={`p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                              isConflict
                                ? "bg-red-50/70 border border-red-200"
                                : isFull
                                ? "bg-surface-container-low/60 opacity-60"
                                : "bg-surface-container-low"
                            }`}
                          >
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${isConflict ? "text-error" : "text-text-primary"}`}>
                                  Grupo {g.grupo}
                                </span>
                                <span className="text-xs text-text-muted">· {g.profesor}</span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-text-muted flex-wrap">
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px] text-accent-blue">schedule</span>
                                  {g.horario}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px] text-secondary">meeting_room</span>
                                  {g.salon}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isFull
                                    ? "bg-surface-container-high text-text-muted"
                                    : isConflict
                                    ? "bg-red-100 text-error"
                                    : g.cupo_max - g.cupo_actual <= 3
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {isFull ? "Cupo Agotado" : `${g.cupo_max - g.cupo_actual} lugares`}
                              </span>

                              {isFull ? (
                                <button
                                  disabled
                                  className="px-3 py-1.5 rounded-lg bg-surface-container-high text-text-muted text-xs font-semibold cursor-not-allowed"
                                >
                                  Sin Cupo
                                </button>
                              ) : isConflict ? (
                                <button
                                  onClick={() => alert("Conflicto de horario: Se empalma con otra materia ya inscrita.")}
                                  className="px-3 py-1.5 rounded-lg bg-red-100 text-error text-xs font-bold flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-[16px]">warning</span>
                                  Empalme
                                </button>
                              ) : isEnrolled ? (
                                <button
                                  onClick={() => toggleCourseEnrollment(item.clave)}
                                  className="px-3 py-1.5 rounded-lg bg-surface-card text-emerald-800 text-xs font-bold shadow-[2px_2px_6px_rgba(62,81,125,0.1)] flex items-center gap-1 hover:bg-red-50 hover:text-error transition-all cursor-pointer group"
                                  title="Quitar del carrito"
                                >
                                  <span className="material-symbols-outlined text-[16px] text-emerald-600 group-hover:hidden">
                                    check_circle
                                  </span>
                                  <span className="material-symbols-outlined text-[16px] text-error hidden group-hover:inline">
                                    close
                                  </span>
                                  <span className="group-hover:hidden">Inscrita</span>
                                  <span className="hidden group-hover:inline">Quitar</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => toggleCourseEnrollment(item.clave)}
                                  className="px-3.5 py-1.5 rounded-lg bg-primary-container text-white text-xs font-bold shadow-sm hover:opacity-95 transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[16px]">add</span>
                                  <span>+ Inscribir</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Columna Derecha: Carrito de Reinscripción y Resumen (5 cols) */}
          <div className="lg:col-span-5 sticky top-24 space-y-4">
            <div className="bg-surface-card rounded-2xl p-5 sm:p-6 shadow-[8px_8px_20px_rgba(62,81,125,0.08),-6px_-6px_16px_#FFFFFF] flex flex-col space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">assignment_turned_in</span>
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                    Mi Pre-Horario Seleccionado
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-primary text-xs font-bold">
                  {enrolledCourses.length} Asignaturas
                </span>
              </div>

              {/* Barra de Créditos SATCA */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-text-muted">Créditos Acumulados:</span>
                  <span className="text-primary">{totalCreditos} / 45.0 SATCA máx.</span>
                </div>
                <div className="h-2.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-blue to-primary rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (totalCreditos / 45) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Lista de Materias en el carrito */}
              <div className="space-y-2 pt-1 max-h-[360px] overflow-y-auto pr-1">
                {enrolledCourses.length === 0 ? (
                  <div className="p-6 text-center text-text-muted text-xs">
                    No has agregado asignaturas aún. Selecciona materias del catálogo.
                  </div>
                ) : (
                  enrolledCourses.map((clave) => {
                    const found = catalog.find((c) => c.clave === clave);
                    if (!found) return null;

                    return (
                      <div
                        key={clave}
                        className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between gap-3 shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-text-primary">{found.materia}</span>
                          <span className="text-[10px] text-text-muted">
                            {found.clave} · {found.creditos} Créditos · Grupo {found.grupos[0]?.grupo}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleCourseEnrollment(clave)}
                          className="w-7 h-7 rounded-lg bg-surface-card text-error hover:bg-red-100 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                          title="Eliminar del pre-registro"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Botón de Confirmación Definitiva */}
              <div className="pt-3 border-t border-surface-container-high/40 space-y-2">
                <button
                  type="button"
                  onClick={() => setSuccessModal(true)}
                  disabled={enrolledCourses.length === 0}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-primary to-primary-container text-white font-bold text-sm shadow-[4px_6px_16px_rgba(62,81,125,0.25)] hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                  <span>Confirmar Reinscripción Definitiva</span>
                </button>
                <p className="text-[11px] text-text-muted text-center leading-tight">
                  Al confirmar, se reservan tus lugares en el SAES y se emite tu comprobante oficial con sello digital.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Modal de Éxito al Confirmar Reinscripción */}
        {successModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface-card rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[16px_20px_40px_rgba(62,81,125,0.2)] text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center shadow-[inset_1px_1px_2px_rgba(16,185,129,0.2)]">
                <span className="material-symbols-outlined text-[36px]">check_circle</span>
              </div>
              <h3 className="text-xl font-extrabold text-primary">¡Reinscripción Exitosa!</h3>
              <p className="text-xs sm:text-sm text-text-muted">
                Tus <strong>{enrolledCourses.length} asignaturas</strong> han sido registradas para el periodo{" "}
                <strong>2026-1</strong> con {totalCreditos} créditos SATCA.
              </p>
              <div className="p-3 bg-surface-container-low rounded-xl text-xs font-mono text-text-muted">
                FOLIO REINSC: REINS-2026-1-ESCOM-{Math.floor(100000 + Math.random() * 900000)}
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => setSuccessModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-container transition-all"
                >
                  Aceptar y Ver Horario
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}