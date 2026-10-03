import React, { useState } from "react";
import Menu from "components/Menu";
import { useAuth } from "context/AuthContext";

export default function PlanEstudios() {
  const { user } = useAuth();
  const [selectedSemestre, setSelectedSemestre] = useState("all");
  const [modalMateria, setModalMateria] = useState(null);

  const semestres = [
    {
      sem: 1,
      materias: [
        { clave: "ISC-101", nombre: "Cálculo Diferencial e Integral", creditos: 8.0, estado: "Aprobada", calif: 8.5 },
        { clave: "ISC-102", nombre: "Álgebra Lineal", creditos: 7.0, estado: "Aprobada", calif: 9.0 },
        { clave: "ISC-103", nombre: "Fundamentos de Programación", creditos: 8.0, estado: "Aprobada", calif: 9.5 },
        { clave: "ISC-104", nombre: "Física para Computación", creditos: 7.0, estado: "Aprobada", calif: 8.0 },
      ],
    },
    {
      sem: 2,
      materias: [
        { clave: "ISC-201", nombre: "Cálculo Multivariable", creditos: 8.0, estado: "Aprobada", calif: 9.0 },
        { clave: "ISC-202", nombre: "Matemáticas Discretas", creditos: 7.5, estado: "Aprobada", calif: 8.0 },
        { clave: "ISC-203", nombre: "Estructuras de Datos", creditos: 8.0, estado: "Aprobada", calif: 10.0 },
        { clave: "ISC-204", nombre: "Circuitos Lógicos", creditos: 7.0, estado: "Aprobada", calif: 8.5 },
      ],
    },
    {
      sem: 3,
      materias: [
        { clave: "ISC-301", nombre: "Ecuaciones Diferenciales", creditos: 7.5, estado: "Aprobada", calif: 8.0 },
        { clave: "ISC-302", nombre: "Análisis y Diseño de Algoritmos", creditos: 8.0, estado: "Aprobada", calif: 9.0 },
        { clave: "ISC-303", nombre: "Programación Orientada a Objetos", creditos: 8.0, estado: "Aprobada", calif: 9.5 },
        { clave: "ISC-304", nombre: "Arquitectura de Computadoras", creditos: 7.0, estado: "Aprobada", calif: 8.0 },
      ],
    },
    {
      sem: 4,
      materias: [
        { clave: "ISC-401", nombre: "Probabilidad y Estadística", creditos: 7.0, estado: "Aprobada", calif: 8.5 },
        { clave: "ISC-402", nombre: "Bases de Datos Relacionales", creditos: 7.5, estado: "Aprobada", calif: 9.0 },
        { clave: "ISC-403", nombre: "Sistemas Operativos", creditos: 8.0, estado: "Aprobada", calif: 9.0 },
        { clave: "ISC-404", nombre: "Redes de Datos", creditos: 7.0, estado: "Aprobada", calif: 8.5 },
      ],
    },
    {
      sem: 5,
      materias: [
        { clave: "ISC-501", nombre: "Teoría de la Computación", creditos: 7.5, estado: "Aprobada", calif: 8.5 },
        { clave: "ISC-502", nombre: "Ingeniería de Software", creditos: 8.0, estado: "Aprobada", calif: 9.5 },
        { clave: "ISC-503", nombre: "Redes Avanzadas", creditos: 7.0, estado: "Aprobada", calif: 8.5 },
        { clave: "ISC-504", nombre: "Bases de Datos Distribuidas", creditos: 7.5, estado: "Aprobada", calif: 9.0 },
      ],
    },
    {
      sem: 6,
      materias: [
        { clave: "IA-601", nombre: "Sistemas Distribuidos", creditos: 6.5, estado: "Aprobada", calif: 9.5 },
        { clave: "IA-602", nombre: "Compiladores", creditos: 7.0, estado: "Aprobada", calif: 9.0 },
        { clave: "IA-603", nombre: "Visión por Computadora", creditos: 7.5, estado: "Cursando", calif: null },
        { clave: "IA-604", nombre: "Aprendizaje Profundo (Deep Learning)", creditos: 8.0, estado: "Cursando", calif: null },
      ],
    },
    {
      sem: 7,
      materias: [
        { clave: "ISC-701", nombre: "Trabajo Terminal I", creditos: 8.0, estado: "Pendiente", calif: null },
        { clave: "ISC-702", nombre: "Criptografía y Seguridad", creditos: 7.5, estado: "Pendiente", calif: null },
        { clave: "ISC-703", nombre: "Optativa Profesional I", creditos: 7.5, estado: "Pendiente", calif: null },
        { clave: "ISC-704", nombre: "Optativa Profesional II", creditos: 7.5, estado: "Pendiente", calif: null },
      ],
    },
    {
      sem: 8,
      materias: [
        { clave: "ISC-801", nombre: "Trabajo Terminal II", creditos: 8.0, estado: "Pendiente", calif: null },
        { clave: "ISC-802", nombre: "Gestión de Proyectos de Software", creditos: 7.0, estado: "Pendiente", calif: null },
        { clave: "ISC-803", nombre: "Optativa Profesional III", creditos: 7.5, estado: "Pendiente", calif: null },
        { clave: "ISC-804", nombre: "Optativa Profesional IV", creditos: 7.5, estado: "Pendiente", calif: null },
      ],
    },
  ];

  const carrera = user?.alumno?.carrera?.nombre || "Ingeniería en Sistemas Computacionales";

  return (
    <div className="min-h-screen bg-surface-ice font-body-md text-text-primary">
      <Menu />

      <main className="w-full max-w-[1440px] mx-auto pt-6 px-4 sm:px-6 lg:px-8 pb-16 space-y-6">
        {/* Encabezado */}
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-0.5 rounded-full bg-surface-container-low text-primary text-xs font-semibold shadow-[inset_1px_1px_2px_rgba(62,81,125,0.08)]">
                Plan Curricular Vigente
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Alumno Regular
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              Malla Curricular Interactiva
            </h1>
            <p className="text-xs sm:text-sm text-text-muted">
              {carrera} · Plan de Estudios 2020 · Sistema SATCA
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-surface-card text-primary text-xs font-bold shadow-[6px_6px_16px_rgba(62,81,125,0.08),-4px_-4px_12px_#ffffff] flex items-center gap-2 hover:-translate-y-0.5 transition-all"
            >
              <span className="material-symbols-outlined text-[18px] text-accent-blue">map</span>
              <span>Descargar Mapa Curricular (PDF)</span>
            </button>
          </div>
        </section>

        {/* Tarjetas Clay de Métricas (KPIs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-surface-card shadow-[8px_8px_20px_rgba(62,81,125,0.07),-6px_-6px_16px_#ffffff] flex flex-col justify-between">
            <span className="text-xs text-text-muted font-semibold">Total de Créditos</span>
            <div className="my-2">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-extrabold text-primary">224</span>
                <span className="text-xs text-text-muted">/ 350 SATCA</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-surface-ice p-0.5 shadow-[inset_1px_1px_3px_rgba(62,81,125,0.12)]">
                <div className="h-full rounded-full bg-accent-blue" style={{ width: "64%" }}></div>
              </div>
            </div>
            <span className="text-[11px] text-text-muted">64% de avance · 126 restantes</span>
          </div>

          <div className="p-5 rounded-2xl bg-surface-card shadow-[8px_8px_20px_rgba(62,81,125,0.07),-6px_-6px_16px_#ffffff] flex flex-col justify-between">
            <span className="text-xs text-text-muted font-semibold">Materias Obligatorias</span>
            <div className="my-2">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-extrabold text-primary">26</span>
                <span className="text-xs text-text-muted">/ 38 unidades</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-surface-ice p-0.5 shadow-[inset_1px_1px_3px_rgba(62,81,125,0.12)]">
                <div className="h-full rounded-full bg-secondary" style={{ width: "68%" }}></div>
              </div>
            </div>
            <span className="text-[11px] text-text-muted">68% acreditado</span>
          </div>

          <div className="p-5 rounded-2xl bg-surface-card shadow-[8px_8px_20px_rgba(62,81,125,0.07),-6px_-6px_16px_#ffffff] flex flex-col justify-between">
            <span className="text-xs text-text-muted font-semibold">Línea Optativa</span>
            <div className="my-2">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-extrabold text-primary">2</span>
                <span className="text-xs text-text-muted">/ 4 materias</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-surface-ice p-0.5 shadow-[inset_1px_1px_3px_rgba(62,81,125,0.12)]">
                <div className="h-full rounded-full bg-tertiary" style={{ width: "50%" }}></div>
              </div>
            </div>
            <span className="text-[11px] text-text-muted">50% seleccionado</span>
          </div>

          <div className="p-5 rounded-2xl bg-surface-card shadow-[8px_8px_20px_rgba(62,81,125,0.07),-6px_-6px_16px_#ffffff] flex flex-col justify-between">
            <span className="text-xs text-text-muted font-semibold">Electivas y Actividades</span>
            <div className="my-2">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-extrabold text-emerald-800">15</span>
                <span className="text-xs text-text-muted">/ 15 SATCA</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-surface-ice p-0.5 shadow-[inset_1px_1px_3px_rgba(62,81,125,0.12)]">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: "100%" }}></div>
              </div>
            </div>
            <span className="text-[11px] text-emerald-700 font-bold">Completado ✓</span>
          </div>
        </div>

        {/* Malla por Semestres en Grid */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {semestres.map((semData) => (
              <div
                key={semData.sem}
                className="bg-surface-card rounded-2xl p-4 shadow-[8px_8px_20px_rgba(62,81,125,0.06),-6px_-6px_16px_#ffffff] flex flex-col gap-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-surface-container-high/40">
                  <span className="text-xs font-bold text-primary">{semData.sem}° Semestre</span>
                  <span className="text-[10px] text-text-muted">{semData.materias.length} materias</span>
                </div>

                <div className="space-y-2">
                  {semData.materias.map((m) => {
                    const isAprobada = m.estado === "Aprobada";
                    const isCursando = m.estado === "Cursando";

                    return (
                      <div
                        key={m.clave}
                        onClick={() => setModalMateria(m)}
                        className={`p-3 rounded-xl cursor-pointer hover:-translate-y-0.5 transition-all text-xs flex flex-col justify-between gap-1.5 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.9),2px_2px_6px_rgba(62,81,125,0.06)] ${
                          isAprobada
                            ? "bg-emerald-50/70 border-l-3 border-emerald-500"
                            : isCursando
                            ? "bg-amber-50/70 border-l-3 border-amber-500"
                            : "bg-surface-container-low border-l-3 border-surface-container-high"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-text-muted">{m.clave}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              isAprobada
                                ? "bg-emerald-100 text-emerald-800"
                                : isCursando
                                ? "bg-amber-100 text-amber-800"
                                : "bg-surface-container text-text-muted"
                            }`}
                          >
                            {isAprobada ? `${m.calif}` : isCursando ? "En Curso" : "Pendiente"}
                          </span>
                        </div>
                        <span className="font-bold text-text-primary line-clamp-2 leading-tight">{m.nombre}</span>
                        <span className="text-[10px] text-text-muted">{m.creditos} Créditos SATCA</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal de Detalle de Materia */}
        {modalMateria && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface-card rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded bg-surface-container-low text-xs font-mono font-bold text-primary">
                    {modalMateria.clave}
                  </span>
                  <h3 className="text-lg font-extrabold text-primary mt-1">{modalMateria.nombre}</h3>
                </div>
                <button
                  onClick={() => setModalMateria(null)}
                  className="p-1 rounded-full text-text-muted hover:bg-surface-container-low"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="p-3.5 bg-surface-container-low rounded-xl text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-muted">Valor Curricular:</span>
                  <span className="font-bold text-text-primary">{modalMateria.creditos} Créditos SATCA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Estado Actual:</span>
                  <span className="font-bold text-primary">{modalMateria.estado}</span>
                </div>
                {modalMateria.calif && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Calificación Obtenida:</span>
                    <span className="font-extrabold text-emerald-800">{modalMateria.calif.toFixed(1)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-muted">Tipo de Asignatura:</span>
                  <span className="font-bold text-text-primary">Tronco Profesional Obligatorio</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setModalMateria(null)}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-container"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
