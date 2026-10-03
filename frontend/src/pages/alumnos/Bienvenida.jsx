import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "context/AuthContext";
import Menu from "components/Menu.jsx";
import apiCall from "consultas/APICall";

export default function Bienvenida() {
  const { user } = useAuth();
  const [alumno, setAlumno] = useState(null);
  const [loading, setLoading] = useState(true);

  const hora = new Date().getHours();
  let saludo = "Hola";
  if (hora >= 6 && hora < 12) saludo = "Buenos días";
  else if (hora >= 12 && hora < 19) saludo = "Buenas tardes";
  else saludo = "Buenas noches";

  const nombreUsuario = user?.nombre_completo || localStorage.getItem("nombre") || "Estudiante";

  useEffect(() => {
    const fetchAlumnoData = async () => {
      try {
        const data = await apiCall("/api/v1/alumnos/me", "GET");
        setAlumno(data);
      } catch (err) {
        console.warn("[Bienvenida] No se pudo obtener perfil detallado, usando defaults:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlumnoData();
  }, []);

  const promedio = alumno?.promedio?.toFixed(2) || "8.92";
  const creditos = alumno?.creditos_cursados || 238;
  const creditosTotales = alumno?.carrera?.creditos_totales || 350;
  const porcentajeCreditos = Math.min(100, Math.round((creditos / creditosTotales) * 100)) || 68;
  const semestre = alumno?.semestre_actual || 5;
  const situacion = alumno?.situacion_academica || "Regular";
  const carrera = alumno?.carrera?.nombre || "Ingeniería en Inteligencia Artificial";

  const quickActions = [
    {
      title: "Kárdex y Calificaciones",
      desc: "Consulta historial académico, calificaciones parciales y descarga tu kárdex oficial.",
      path: "/alumno/kardex",
      icon: "school",
      badge: "Actualizado",
      color: "from-blue-500/10 to-indigo-500/10",
      accent: "#3E517D",
    },
    {
      title: "Mi Horario Semanal",
      desc: "Revisa salones asignados, bloques de materias y profesores de este semestre.",
      path: "/alumno/horario",
      icon: "calendar_month",
      badge: "Periodo 2026-1",
      color: "from-sky-500/10 to-blue-500/10",
      accent: "#619BF5",
    },
    {
      title: "Reinscripción en Línea",
      desc: "Verifica tu cita asignada, selecciona materias sin traslape y genera tu tira horaria.",
      path: "/alumno/reinscripciones",
      icon: "how_to_reg",
      badge: "Próxima Cita",
      color: "from-purple-500/10 to-indigo-500/10",
      accent: "#7C3AED",
    },
    {
      title: "Exámenes ETS",
      desc: "Inscripción a exámenes a título ordinarios y especiales, consulta de aulas y jurados.",
      path: "/alumno/inscribirets",
      icon: "assignment",
      badge: "Convocatoria",
      color: "from-amber-500/10 to-orange-500/10",
      accent: "#F59E0B",
    },
    {
      title: "Ventanilla de Trámites",
      desc: "Solicita constancias de estudios, boletas certificadas y seguimiento de dictámenes.",
      path: "/alumno/documentos",
      icon: "description",
      badge: "En línea",
      color: "from-emerald-500/10 to-teal-500/10",
      accent: "#10B981",
    },
    {
      title: "Malla Curricular y Optativas",
      desc: "Explora la retícula interactiva, líneas de especialidad y requisitos de seriación.",
      path: "/alumno/planEstudios",
      icon: "account_tree",
      badge: "Plan 2020",
      color: "from-cyan-500/10 to-blue-500/10",
      accent: "#0284C7",
    },
  ];

  return (
    <div className="bg-surface-ice min-h-screen flex flex-col font-sans text-text-primary antialiased">
      <Menu />

      <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-6 flex-grow">
        {/* HERO BANNER CLAY */}
        <section className="w-full mb-6">
          <div className="w-full bg-surface-card rounded-[28px] p-6 sm:p-8 md:p-10 relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-[16px_20px_40px_rgba(62,81,125,0.10),-10px_-10px_24px_#ffffff,inset_1px_1px_3px_rgba(255,255,255,0.95)]">
            {/* Glow ambiental */}
            <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-accent-blue/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 left-1/4 w-72 h-72 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low text-primary font-semibold text-xs shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06),1px_1px_2px_#ffffff]">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  Periodo Activo · Semestre 2026-1
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-fixed text-primary font-semibold text-xs shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
                  <span className="material-symbols-outlined text-[15px]">school</span>
                  {semestre}° Semestre · {carrera}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight pt-1">
                {saludo}, {nombreUsuario.split(" ")[0]}!
              </h1>
              <p className="text-sm sm:text-base text-text-muted leading-relaxed">
                Bienvenido al portal institucional de la <strong className="text-text-primary font-semibold">Escuela Superior de Cómputo</strong> del IPN. Toda tu información académica y trámites en un solo lugar.
              </p>
            </div>

            {/* Medalla Institucional */}
            <div className="relative z-10 flex items-center gap-3 shrink-0 self-start lg:self-center bg-surface-container-low/80 p-3.5 rounded-2xl shadow-[6px_8px_16px_rgba(62,81,125,0.06),-4px_-4px_10px_#ffffff,inset_1px_1px_2px_rgba(255,255,255,0.9)]">
              <div className="w-12 h-12 rounded-xl bg-primary-container text-white flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-2xl">terminal</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-text-primary">ESCOM · IPN</span>
                <span className="text-[11px] text-text-muted">Unidad Profesional Adolfo López Mateos</span>
                <span className="text-[10px] text-accent-blue font-bold tracking-wider uppercase">Excelencia en Cómputo</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3 METRIC CARDS CLAY */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {/* Card 1: Promedio General */}
          <div className="bg-surface-card rounded-[24px] p-6 shadow-[12px_16px_32px_rgba(62,81,125,0.08),-8px_-8px_20px_#ffffff,inset_1px_1px_2px_rgba(255,255,255,0.95)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-text-muted font-bold">Rendimiento Académico</span>
                <h2 className="text-lg font-bold text-primary">Promedio General</h2>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
                <span className="material-symbols-outlined text-xl">grade</span>
              </div>
            </div>

            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-4xl font-extrabold text-text-primary tracking-tight">{promedio}</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                situacion.toLowerCase() === "regular"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}>
                <span className="material-symbols-outlined text-[14px]">verified</span>
                {situacion}
              </span>
            </div>

            <div className="pt-2 flex items-center gap-1.5 text-text-muted text-xs bg-surface-container-low/70 p-2.5 rounded-xl">
              <span className="material-symbols-outlined text-accent-blue text-base">trending_up</span>
              <span>Trayectoria académica aprobatoria en ESCOM</span>
            </div>
          </div>

          {/* Card 2: Avance de Créditos */}
          <div className="bg-surface-card rounded-[24px] p-6 shadow-[12px_16px_32px_rgba(62,81,125,0.08),-8px_-8px_20px_#ffffff,inset_1px_1px_2px_rgba(255,255,255,0.95)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-text-muted font-bold">Trayectoria Curricular</span>
                <h2 className="text-lg font-bold text-primary">Avance de Créditos</h2>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
                <span className="material-symbols-outlined text-xl">pie_chart</span>
              </div>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-text-primary tracking-tight">{porcentajeCreditos}%</span>
                <span className="text-xs text-text-muted">completado</span>
              </div>
              <span className="text-xs text-primary font-bold">{creditos} / {creditosTotales} SATCA</span>
            </div>

            {/* Puffy progress bar */}
            <div className="w-full mt-1">
              <div className="w-full h-3.5 rounded-full bg-surface-container-low p-0.5 shadow-[inset_2px_2px_4px_rgba(62,81,125,0.1)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-secondary to-accent-blue shadow-[0_2px_6px_rgba(97,155,245,0.4)] relative"
                  style={{ width: `${porcentajeCreditos}%` }}
                >
                  <div className="absolute inset-0 rounded-full bg-white/20 h-1/2" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Cita de Reinscripción */}
          <div className="bg-surface-card rounded-[24px] p-6 shadow-[12px_16px_32px_rgba(62,81,125,0.08),-8px_-8px_20px_#ffffff,inset_1px_1px_2px_rgba(255,255,255,0.95)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-text-muted font-bold">Control Escolar</span>
                <h2 className="text-lg font-bold text-primary">Cita de Reinscripción</h2>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
                <span className="material-symbols-outlined text-xl">event_available</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 mb-2">
              <span className="text-2xl font-bold text-text-primary tracking-tight">14 de Febrero</span>
              <span className="text-xs font-semibold text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span>
                10:30 AM · En línea (Sistema PAIDEA)
              </span>
            </div>

            <Link
              to="/alumno/reinscripciones"
              className="mt-1 flex items-center justify-between py-2 px-3 rounded-xl bg-primary-container text-white text-xs font-semibold hover:bg-primary transition-all shadow-[2px_4px_8px_rgba(62,81,125,0.2)]"
            >
              <span>Ver detalles de turno</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </section>

        {/* QUICK ACTION GRID */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-accent-blue">grid_view</span>
              Módulos y Servicios del Estudiante
            </h2>
            <span className="text-xs text-text-muted">Acceso directo a funciones escolares</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.path}
                className="bg-surface-card rounded-[24px] p-6 shadow-[10px_14px_28px_rgba(62,81,125,0.07),-6px_-6px_16px_#ffffff,inset_1px_1px_2px_rgba(255,255,255,0.95)] hover:shadow-[14px_18px_36px_rgba(62,81,125,0.13),-8px_-8px_20px_#ffffff] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-surface-container-low text-primary flex items-center justify-center group-hover:scale-105 transition-transform shadow-[inset_1px_1px_3px_rgba(62,81,125,0.08)]">
                      <span className="material-symbols-outlined text-2xl">{action.icon}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-surface-container-low text-text-muted font-semibold text-[11px] shadow-[inset_1px_1px_2px_rgba(62,81,125,0.04)]">
                      {action.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors mb-1.5">
                    {action.title}
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {action.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-surface-container flex items-center justify-between text-xs font-semibold text-primary group-hover:text-accent-blue transition-colors">
                  <span>Ingresar</span>
                  <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
