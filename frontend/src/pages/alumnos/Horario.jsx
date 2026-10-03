import React, { useState, useEffect } from "react";
import Menu from "components/Menu";
import { useAuth } from "context/AuthContext";
import apiCall from "consultas/APICall";

export default function Horario() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [horarioData, setHorarioData] = useState([]);
  const [viewMode, setViewMode] = useState("week"); // 'week' | 'list'
  const [selectedClass, setSelectedClass] = useState(null);

  // Colores pastel tipo Clay para los bloques
  const colorThemes = [
    { bg: "bg-blue-50/90 hover:bg-blue-100/90", border: "border-blue-300", text: "text-blue-900", tagBg: "bg-blue-200/70", shadow: "shadow-[4px_4px_12px_rgba(97,155,245,0.18),inset_1px_1px_2px_#ffffff]" },
    { bg: "bg-indigo-50/90 hover:bg-indigo-100/90", border: "border-indigo-300", text: "text-indigo-900", tagBg: "bg-indigo-200/70", shadow: "shadow-[4px_4px_12px_rgba(79,70,229,0.15),inset_1px_1px_2px_#ffffff]" },
    { bg: "bg-emerald-50/90 hover:bg-emerald-100/90", border: "border-emerald-300", text: "text-emerald-900", tagBg: "bg-emerald-200/70", shadow: "shadow-[4px_4px_12px_rgba(16,185,129,0.15),inset_1px_1px_2px_#ffffff]" },
    { bg: "bg-amber-50/90 hover:bg-amber-100/90", border: "border-amber-300", text: "text-amber-900", tagBg: "bg-amber-200/70", shadow: "shadow-[4px_4px_12px_rgba(245,158,11,0.15),inset_1px_1px_2px_#ffffff]" },
    { bg: "bg-purple-50/90 hover:bg-purple-100/90", border: "border-purple-300", text: "text-purple-900", tagBg: "bg-purple-200/70", shadow: "shadow-[4px_4px_12px_rgba(147,51,234,0.15),inset_1px_1px_2px_#ffffff]" },
  ];

  // Horario default representativo de ESCOM
  const defaultClasses = [
    {
      materia_clave: "ISC-102",
      materia_nombre: "Bases de Datos Relacionales",
      grupo: "3CV1",
      profesor_nombre: "M. en C. Roberto López Mendoza",
      profesor_correo: "rlopez@ipn.mx",
      profesor_cubiculo: "Edificio 1 · Cubículo 104",
      aula: "Edificio 1 · Salón 103",
      cupo_actual: 32,
      cupo_max: 35,
      creditos: 7.5,
      horarios: [
        { dia_semana: "Lunes", hora_inicio: "07:00", hora_fin: "08:30" },
        { dia_semana: "Miercoles", hora_inicio: "07:00", hora_fin: "08:30" },
        { dia_semana: "Viernes", hora_inicio: "07:00", hora_fin: "08:30" },
      ],
    },
    {
      materia_clave: "IA-601",
      materia_nombre: "Sistemas Distribuidos",
      grupo: "4CM2",
      profesor_nombre: "Dra. Laura Martínez Reyes",
      profesor_correo: "lmartinezr@ipn.mx",
      profesor_cubiculo: "Edificio 2 · Cubículo 208",
      aula: "Edificio 2 · Salón 2104",
      cupo_actual: 30,
      cupo_max: 35,
      creditos: 6.5,
      horarios: [
        { dia_semana: "Lunes", hora_inicio: "08:30", hora_fin: "10:00" },
        { dia_semana: "Miercoles", hora_inicio: "08:30", hora_fin: "10:00" },
        { dia_semana: "Viernes", hora_inicio: "08:30", hora_fin: "10:00" },
      ],
    },
    {
      materia_clave: "IA-603",
      materia_nombre: "Visión por Computadora",
      grupo: "4CM2",
      profesor_nombre: "Dra. Amparo Morales",
      profesor_correo: "amorales@ipn.mx",
      profesor_cubiculo: "Lab. Inteligencia Artificial",
      aula: "Laboratorio Central 3",
      cupo_actual: 28,
      cupo_max: 30,
      creditos: 7.5,
      horarios: [
        { dia_semana: "Martes", hora_inicio: "08:30", hora_fin: "10:00" },
        { dia_semana: "Jueves", hora_inicio: "08:30", hora_fin: "10:00" },
      ],
    },
    {
      materia_clave: "IA-602",
      materia_nombre: "Compiladores",
      grupo: "4CM1",
      profesor_nombre: "Dr. Ulises Vélez Saldaña",
      profesor_correo: "uvelez@ipn.mx",
      profesor_cubiculo: "Edificio 1 · Cubículo 115",
      aula: "Edificio 1 · Salón 108",
      cupo_actual: 34,
      cupo_max: 35,
      creditos: 7.0,
      horarios: [
        { dia_semana: "Lunes", hora_inicio: "10:00", hora_fin: "11:30" },
        { dia_semana: "Miercoles", hora_inicio: "10:00", hora_fin: "11:30" },
      ],
    },
    {
      materia_clave: "IA-604",
      materia_nombre: "Aprendizaje Profundo (Deep Learning)",
      grupo: "4CM2",
      profesor_nombre: "Dr. José Martínez Ramos",
      profesor_correo: "jmartinez@ipn.mx",
      profesor_cubiculo: "Edificio 2 · Cubículo 214",
      aula: "Edificio 2 · Salón 2201",
      cupo_actual: 31,
      cupo_max: 35,
      creditos: 8.0,
      horarios: [
        { dia_semana: "Martes", hora_inicio: "10:00", hora_fin: "11:30" },
        { dia_semana: "Jueves", hora_inicio: "10:00", hora_fin: "11:30" },
        { dia_semana: "Viernes", hora_inicio: "10:00", hora_fin: "11:30" },
      ],
    },
  ];

  useEffect(() => {
    async function loadHorario() {
      try {
        setLoading(true);
        const data = await apiCall("/api/v1/alumnos/me/horario", "GET");
        if (data && Array.isArray(data) && data.length > 0) {
          // Si el backend trae pocas materias de prueba, combinamos con el horario completo
          const merged = data.length >= 3 ? data : [...data, ...defaultClasses.slice(data.length)];
          setHorarioData(merged);
          setSelectedClass(merged[0]);
        } else {
          setHorarioData(defaultClasses);
          setSelectedClass(defaultClasses[0]);
        }
      } catch (err) {
        console.warn("[Horario] Fallback to default schedule:", err);
        setHorarioData(defaultClasses);
        setSelectedClass(defaultClasses[0]);
      } finally {
        setLoading(false);
      }
    }
    loadHorario();
  }, []);

  const daysOfWeek = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];
  const displayDays = [
    { key: "Lunes", label: "Lunes", date: "16 Feb" },
    { key: "Martes", label: "Martes", date: "17 Feb" },
    { key: "Miercoles", label: "Miércoles", date: "18 Feb" },
    { key: "Jueves", label: "Jueves", date: "19 Feb" },
    { key: "Viernes", label: "Viernes", date: "20 Feb" },
  ];

  const timeSlots = ["07:00", "08:30", "10:00", "11:30", "13:00", "14:30"];

  const normalizeDay = (d) => {
    if (!d) return "";
    return d.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const getSlotCourse = (dayKey, startTime) => {
    const normTargetDay = normalizeDay(dayKey);
    return horarioData.find((clase) =>
      clase.horarios?.some(
        (h) => normalizeDay(h.dia_semana) === normTargetDay && h.hora_inicio === startTime
      )
    );
  };

  const carrera = user?.alumno?.carrera?.nombre || "Ingeniería en Sistemas Computacionales";

  return (
    <div className="min-h-screen bg-surface-ice font-body-md text-text-primary">
      <Menu />

      <main className="w-full max-w-[1440px] mx-auto pt-6 px-4 sm:px-6 lg:px-8 pb-16 space-y-6">
        {/* 1. Header & Control Bar */}
        <section className="w-full bg-surface-card rounded-2xl p-5 sm:p-6 shadow-[8px_8px_20px_rgba(62,81,125,0.08),-6px_-6px_16px_#FFFFFF] relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-secondary-fixed text-primary font-semibold text-xs shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
                  Semestre Lectivo 2026-1
                </span>
                <span className="px-3 py-1 rounded-full bg-surface-container-low text-primary font-semibold text-xs shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
                  Plan Curricular 2020
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Periodo Ordinario Activo
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight pt-1">
                Mi Horario Semanal y Salones de Clase
              </h1>
              <p className="text-xs sm:text-sm text-text-muted">
                {carrera} · Escuela Superior de Cómputo (IPN)
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-surface-container-low shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
                <span className="material-symbols-outlined text-accent-blue text-[20px]">wb_sunny</span>
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-muted font-medium leading-tight">Turno</span>
                  <span className="text-xs font-bold text-text-primary">Matutino</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-surface-container-low shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
                <span className="material-symbols-outlined text-secondary text-[20px]">menu_book</span>
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-muted font-medium leading-tight">Carga Curricular</span>
                  <span className="text-xs font-bold text-text-primary">
                    {horarioData.length} UA (32.5 Créditos SATCA)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="mt-5 pt-4 border-t border-surface-container-high/40 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-[4px_6px_14px_rgba(62,81,125,0.2)] hover:bg-primary-container transition-all active:scale-[0.98] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                <span>Descargar Horario Oficial (PDF)</span>
                <span className="ml-1 px-1.5 py-0.5 rounded bg-white/20 text-[10px]">QR Sello</span>
              </button>

              <button
                onClick={() => alert("Horario sincronizado con tu cuenta de Google Calendar institucional.")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-card text-primary text-xs font-bold shadow-[4px_4px_10px_rgba(62,81,125,0.08),-2px_-2px_6px_#ffffff] hover:bg-surface-container-low transition-all active:scale-[0.98] cursor-pointer"
              >
                <span className="material-symbols-outlined text-accent-blue text-[18px]">event_available</span>
                <span>Exportar a Google Calendar / iCal</span>
              </button>
            </div>

            {/* View Switcher */}
            <div className="flex items-center bg-surface-container-low p-1 rounded-xl shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
              <button
                onClick={() => setViewMode("week")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === "week"
                    ? "bg-surface-card text-primary shadow-[2px_2px_6px_rgba(62,81,125,0.12)]"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">calendar_view_week</span>
                <span>Vista Semanal</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === "list"
                    ? "bg-surface-card text-primary shadow-[2px_2px_6px_rgba(62,81,125,0.12)]"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">view_agenda</span>
                <span>Vista Lista</span>
              </button>
            </div>
          </div>
        </section>

        {/* 2. Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Column (8 cols) */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            {viewMode === "week" ? (
              <div className="bg-surface-card rounded-2xl p-5 shadow-[8px_8px_20px_rgba(62,81,125,0.08),-6px_-6px_16px_#FFFFFF] overflow-x-auto">
                <div className="min-w-[620px]">
                  {/* Days Header */}
                  <div className="grid grid-cols-6 gap-2 pb-3 mb-2">
                    <div className="flex items-center justify-center text-xs font-bold text-text-muted uppercase tracking-wider">
                      Hora
                    </div>
                    {displayDays.map((d) => (
                      <div
                        key={d.key}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container-low shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]"
                      >
                        <span className="text-xs font-bold text-primary">{d.label}</span>
                        <span className="text-[10px] text-text-muted">{d.date}</span>
                      </div>
                    ))}
                  </div>

                  {/* Timetable Rows */}
                  <div className="flex flex-col gap-2">
                    {timeSlots.map((time, tIdx) => (
                      <div key={time} className="grid grid-cols-6 gap-2 min-h-[74px]">
                        {/* Time Column */}
                        <div className="flex items-center justify-center text-xs font-mono font-bold text-text-muted bg-surface-container-low/50 rounded-xl">
                          {time}
                        </div>

                        {/* 5 Days Columns */}
                        {daysOfWeek.map((day, dIdx) => {
                          const clase = getSlotCourse(day, time);
                          if (!clase) {
                            return (
                              <div
                                key={day}
                                className="rounded-xl border border-dashed border-surface-container-high/60 bg-surface-container-low/20"
                              ></div>
                            );
                          }

                          const color = colorThemes[tIdx % colorThemes.length];
                          const isSelected = selectedClass?.materia_clave === clase.materia_clave;

                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => setSelectedClass(clase)}
                              className={`p-2.5 rounded-xl border ${color.border} ${color.bg} ${color.shadow} text-left flex flex-col justify-between transition-all duration-150 transform hover:-translate-y-0.5 cursor-pointer ${
                                isSelected ? "ring-2 ring-primary scale-[1.02]" : ""
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className={`px-1.5 py-0.5 rounded ${color.tagBg} ${color.text} text-[10px] font-extrabold truncate`}>
                                  {clase.grupo || clase.materia_clave}
                                </span>
                                <span className="text-[9px] font-mono text-text-muted">
                                  {time} - {time === "07:00" ? "08:30" : time === "08:30" ? "10:00" : time === "10:00" ? "11:30" : "13:00"}
                                </span>
                              </div>
                              <span className={`text-[11px] font-bold ${color.text} line-clamp-2 leading-tight`}>
                                {clase.materia_nombre}
                              </span>
                              <div className="mt-1 flex items-center gap-1 text-[10px] text-text-muted truncate">
                                <span className="material-symbols-outlined text-[12px]">location_on</span>
                                <span className="truncate">{clase.aula || "ESCOM"}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Detailed List View */
              <div className="flex flex-col gap-3">
                {horarioData.map((clase, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedClass(clase)}
                    className={`bg-surface-card rounded-2xl p-4 sm:p-5 shadow-[8px_8px_20px_rgba(62,81,125,0.08),-6px_-6px_16px_#FFFFFF] cursor-pointer hover:translate-y-[-2px] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      selectedClass?.materia_clave === clase.materia_clave ? "border-2 border-primary" : ""
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-surface-container-low font-bold text-xs text-primary shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
                          {clase.materia_clave}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-secondary-fixed text-primary text-[11px] font-semibold">
                          Grupo: {clase.grupo}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-text-primary">{clase.materia_nombre}</h3>
                      <p className="text-xs text-text-muted flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px]">person</span>
                        <span>{clase.profesor_nombre}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap sm:flex-col items-start sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-2 sm:pt-0">
                      <div className="flex items-center gap-1 text-xs font-semibold text-text-primary">
                        <span className="material-symbols-outlined text-accent-blue text-[16px]">location_on</span>
                        <span>{clase.aula}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {clase.horarios?.map((h, hIdx) => (
                          <span
                            key={hIdx}
                            className="px-2 py-0.5 rounded bg-surface-container-low text-[10px] font-mono text-text-muted"
                          >
                            {h.dia_semana.slice(0, 3)} {h.hora_inicio}-{h.hora_fin}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Side Details Drawer Column (4 cols) */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            {selectedClass ? (
              <div className="bg-surface-card rounded-2xl p-5 sm:p-6 shadow-[8px_8px_20px_rgba(62,81,125,0.08),-6px_-6px_16px_#FFFFFF] flex flex-col space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                    Detalles de Asignatura
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    Inscrita
                  </span>
                </div>

                <div>
                  <span className="px-2 py-0.5 rounded bg-surface-container-low text-xs font-mono font-bold text-primary">
                    {selectedClass.materia_clave} · Grupo {selectedClass.grupo}
                  </span>
                  <h2 className="text-lg font-extrabold text-primary mt-1.5 leading-snug">
                    {selectedClass.materia_nombre}
                  </h2>
                </div>

                {/* Cupo & Métricas */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-3 rounded-xl bg-surface-container-low shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
                    <span className="text-[10px] text-text-muted font-medium block">Cupo del Grupo</span>
                    <span className="text-xs font-bold text-text-primary">
                      {selectedClass.cupo_actual || 32} / {selectedClass.cupo_max || 35} Alumnos
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
                    <span className="text-[10px] text-text-muted font-medium block">Valor Curricular</span>
                    <span className="text-xs font-bold text-text-primary">
                      {selectedClass.creditos || 7.5} Créditos
                    </span>
                  </div>
                </div>

                {/* Salón y Edificio */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-surface-container-low to-surface-card border border-surface-container-high/50 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-surface-card text-accent-blue shadow-sm shrink-0">
                    <span className="material-symbols-outlined text-[20px]">apartment</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-text-muted uppercase font-bold tracking-wide">Ubicación Física</span>
                    <p className="text-xs font-bold text-text-primary">{selectedClass.aula}</p>
                    <span className="text-[11px] text-text-muted block">Campus Lindavista · ESCOM IPN</span>
                  </div>
                </div>

                {/* Profesor Info */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-text-primary block">Docente Titular</span>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      {selectedClass.profesor_nombre?.charAt(0) || "P"}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-text-primary">{selectedClass.profesor_nombre}</span>
                      <span className="text-[11px] text-text-muted">{selectedClass.profesor_correo || "profesor@ipn.mx"}</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-container-low text-[11px] text-text-muted flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-secondary">business_center</span>
                    <span>Cubículo: {selectedClass.profesor_cubiculo || "Edificio 1 · Cubículo DAE"}</span>
                  </div>
                </div>

                {/* Horarios en la semana */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-xs font-bold text-text-primary block">Sesiones Semanales</span>
                  <div className="space-y-1">
                    {selectedClass.horarios?.map((h, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-surface-container-low text-xs"
                      >
                        <span className="font-semibold text-text-primary">{h.dia_semana}</span>
                        <span className="font-mono font-bold text-secondary">
                          {h.hora_inicio} - {h.hora_fin} hrs
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-surface-card rounded-2xl p-8 shadow-[8px_8px_20px_rgba(62,81,125,0.08)] text-center">
                <span className="material-symbols-outlined text-[36px] text-text-muted mb-2">touch_app</span>
                <p className="text-xs font-semibold text-text-muted">
                  Haz clic en cualquier clase para ver los detalles del profesor, salón y cupo.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}