import React, { useState } from "react";
import Menu from "components/Menu";

export default function Ocupabilidad() {
  const [semestre, setSemestre] = useState("6");
  const [turno, setTurno] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const gruposOcupabilidad = [
    { grupo: "6CM1", materia: "Sistemas Distribuidos", profesor: "M. en C. Roberto Palacios Nava", turno: "Matutino", inscritos: 34, cupoMax: 35 },
    { grupo: "6CM2", materia: "Sistemas Distribuidos", profesor: "Dra. Laura Martínez Reyes", turno: "Matutino", inscritos: 32, cupoMax: 35 },
    { grupo: "6CV1", materia: "Sistemas Distribuidos", profesor: "Ing. Carlos Mendoza", turno: "Vespertino", inscritos: 26, cupoMax: 35 },
    { grupo: "6CM1", materia: "Compiladores", profesor: "Dr. Ulises Vélez Saldaña", turno: "Matutino", inscritos: 35, cupoMax: 35 },
    { grupo: "6CM2", materia: "Compiladores", profesor: "Dr. Edgardo Franco Martínez", turno: "Matutino", inscritos: 29, cupoMax: 35 },
    { grupo: "6CM1", materia: "Visión por Computadora", profesor: "Dra. Amparo Morales", turno: "Matutino", inscritos: 28, cupoMax: 30 },
    { grupo: "6CV1", materia: "Visión por Computadora", profesor: "M. en C. Juan Carlos Moreno", turno: "Vespertino", inscritos: 19, cupoMax: 30 },
    { grupo: "6CM1", materia: "Aprendizaje Profundo (Deep Learning)", profesor: "Dr. José Martínez Ramos", turno: "Matutino", inscritos: 31, cupoMax: 35 },
    { grupo: "6CV1", materia: "Aprendizaje Profundo (Deep Learning)", profesor: "Dr. Benjamín Luna Benoso", turno: "Vespertino", inscritos: 24, cupoMax: 35 },
  ];

  const filteredGrupos = gruposOcupabilidad.filter((g) => {
    const matchTurno = turno === "all" || g.turno.toLowerCase() === turno.toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      g.grupo.toLowerCase().includes(q) ||
      g.materia.toLowerCase().includes(q) ||
      g.profesor.toLowerCase().includes(q);
    return matchTurno && matchSearch;
  });

  return (
    <div className="min-h-screen bg-surface-ice font-body-md text-text-primary">
      <Menu />

      <main className="w-full max-w-[1440px] mx-auto pt-6 px-4 sm:px-6 lg:px-8 pb-16 space-y-6">
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              Ocupabilidad y Disponibilidad de Cupos
            </h1>
            <p className="text-xs sm:text-sm text-text-muted mt-0.5">
              Monitoreo en tiempo real de vacantes por grupo y asignatura · Periodo 2026-1 · ESCOM IPN
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sincronizado con SAES en vivo
            </span>
          </div>
        </section>

        {/* Filtros */}
        <section className="bg-surface-card rounded-2xl p-4 shadow-[8px_8px_20px_rgba(62,81,125,0.08),-6px_-6px_16px_#FFFFFF] flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[19px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar materia, grupo o profesor..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-container-low text-xs sm:text-sm focus:outline-none focus:bg-surface-card transition-all shadow-[inset_1px_1px_3px_rgba(62,81,125,0.08)]"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={turno}
              onChange={(e) => setTurno(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface-container-low text-xs font-semibold text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="all">Todos los Turnos</option>
              <option value="matutino">Turno Matutino</option>
              <option value="vespertino">Turno Vespertino</option>
            </select>
          </div>
        </section>

        {/* Grid de Grupos y Ocupabilidad */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGrupos.map((g, idx) => {
            const porcentaje = Math.round((g.inscritos / g.cupoMax) * 100);
            const vacantes = g.cupoMax - g.inscritos;
            const isLleno = vacantes <= 0;

            return (
              <div
                key={idx}
                className="bg-surface-card rounded-2xl p-5 shadow-[8px_8px_20px_rgba(62,81,125,0.08),-6px_-6px_16px_#FFFFFF] flex flex-col justify-between space-y-4 hover:-translate-y-0.5 transition-transform"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-lg bg-surface-container-low text-primary text-xs font-bold">
                      Grupo {g.grupo}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isLleno
                          ? "bg-red-100 text-error"
                          : vacantes <= 3
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {isLleno ? "Agotado" : `${vacantes} libres`}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-text-primary pt-1">{g.materia}</h3>
                  <p className="text-xs text-text-muted">{g.profesor} · Turno {g.turno}</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-surface-container-high/40">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-text-muted">Ocupación: {porcentaje}%</span>
                    <span className="text-primary">
                      {g.inscritos} / {g.cupoMax} Alumnos
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-surface-container-high rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLleno
                          ? "bg-error"
                          : vacantes <= 3
                          ? "bg-warning"
                          : "bg-gradient-to-r from-accent-blue to-primary"
                      }`}
                      style={{ width: `${Math.min(100, porcentaje)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}