import React, { useState } from "react";
import Menu from "components/Menu";
import escomMap from "assets/escomMap.jpg";
import salones12 from "assets/salones12.jpg";
import salones34 from "assets/salones34.jpg";
import salones56 from "assets/salones56.jpg";
import salones78 from "assets/salones78.jpg";

export default function Salones() {
  const [semestre, setSemestre] = useState("6");
  const [edificio, setEdificio] = useState("edif1");

  const getImageForSemester = () => {
    switch (semestre) {
      case "1":
      case "2":
        return salones12;
      case "3":
      case "4":
        return salones34;
      case "5":
      case "6":
        return salones56;
      case "7":
      case "8":
        return salones78;
      default:
        return salones56;
    }
  };

  const edificios = [
    { id: "edif1", nombre: "Edificio 1", descripcion: "Aulas 1101 a 1210, Gobierno, DAE, Auditorios", salones: ["1101", "1102", "1103", "1201", "1202", "1204"] },
    { id: "edif2", nombre: "Edificio 2", descripcion: "Aulas 2101 a 2210, Posgrado, Cubículos Docentes", salones: ["2101", "2104", "2201", "2202", "2204"] },
    { id: "lab", nombre: "Laboratorios Centrales", descripcion: "Lab. Inteligencia Artificial, Redes, Electrónica, Cómputo Móvil", salones: ["Lab IA 1", "Lab IA 2", "Lab Redes", "Lab Gráficos"] },
  ];

  return (
    <div className="min-h-screen bg-surface-ice font-body-md text-text-primary">
      <Menu />

      <main className="w-full max-w-[1440px] mx-auto pt-6 px-4 sm:px-6 lg:px-8 pb-16 space-y-6">
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              Distribución de Salones y Croquis ESCOM
            </h1>
            <p className="text-xs sm:text-sm text-text-muted mt-0.5">
              Ubicación física de aulas, laboratorios y distribución por semestre · Campus Lindavista IPN
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-muted">Semestre:</span>
            <select
              value={semestre}
              onChange={(e) => setSemestre(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface-card text-xs font-bold text-primary shadow-[inset_1px_1px_3px_rgba(62,81,125,0.08)] cursor-pointer focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={String(s)}>
                  {s}° Semestre
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Croquis e Infografía */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Mapa Campus (7 cols) */}
          <section className="lg:col-span-7 bg-surface-card rounded-2xl p-5 shadow-[8px_8px_20px_rgba(62,81,125,0.08),-6px_-6px_16px_#FFFFFF] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">apartment</span>
                <h2 className="text-base font-bold text-primary">Mapa General de Instalaciones</h2>
              </div>
              <span className="text-xs text-text-muted font-semibold">ESCOM Lindavista</span>
            </div>

            <div className="rounded-xl overflow-hidden shadow-inner bg-surface-container-low p-2 flex items-center justify-center">
              <img
                src={escomMap}
                alt="Mapa General ESCOM"
                className="max-h-[380px] w-auto object-contain rounded-lg shadow-sm"
              />
            </div>
          </section>

          {/* Selector de Edificio y Salones (5 cols) */}
          <section className="lg:col-span-5 bg-surface-card rounded-2xl p-5 shadow-[8px_8px_20px_rgba(62,81,125,0.08),-6px_-6px_16px_#FFFFFF] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high/40">
              <h2 className="text-base font-bold text-primary">Edificios y Salones Asignados</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-primary text-[10px] font-bold">
                {semestre}° Semestre
              </span>
            </div>

            <div className="space-y-2.5">
              {edificios.map((ed) => (
                <div
                  key={ed.id}
                  onClick={() => setEdificio(ed.id)}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all ${
                    edificio === ed.id
                      ? "bg-primary-container text-white shadow-md"
                      : "bg-surface-container-low text-text-primary hover:bg-surface-container"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm">{ed.nombre}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${edificio === ed.id ? "bg-white/20 text-white" : "bg-surface-card text-text-muted"}`}>
                      {ed.salones.length} aulas
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1 ${edificio === ed.id ? "text-white/80" : "text-text-muted"}`}>
                    {ed.descripcion}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {ed.salones.map((s) => (
                      <span
                        key={s}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          edificio === ed.id ? "bg-white/20 text-white" : "bg-surface-card text-primary"
                        }`}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Croquis de Salones del Semestre */}
            <div className="pt-2 border-t border-surface-container-high/40">
              <span className="text-xs font-bold text-text-muted block mb-2">
                Esquema de Salones ({semestre}° Semestre):
              </span>
              <div className="rounded-xl overflow-hidden bg-surface-container-low p-2">
                <img
                  src={getImageForSemester()}
                  alt={`Salones Semestre ${semestre}`}
                  className="w-full h-auto object-cover rounded-lg shadow-sm"
                />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
