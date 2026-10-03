import React, { useState } from "react";
import Menu from "components/Menu";
import { useAuth } from "context/AuthContext";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function RendimientoAcademico() {
  const { user } = useAuth();

  const labels = ["Visión por Comp.", "Sist. Distribuidos", "Compiladores", "Deep Learning", "Redes Avanzadas"];
  const p1 = [9.0, 9.5, 8.5, 9.0, 8.0];
  const p2 = [8.5, 9.0, 9.0, 9.5, 8.5];
  const p3 = [9.5, 10.0, 9.5, 9.0, 9.0];

  const chartData = {
    labels,
    datasets: [
      {
        label: "Parcial 1",
        data: p1,
        backgroundColor: "#619BF5",
        borderRadius: 8,
      },
      {
        label: "Parcial 2",
        data: p2,
        backgroundColor: "#435ba2",
        borderRadius: 8,
      },
      {
        label: "Parcial 3",
        data: p3,
        backgroundColor: "#3e517d",
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: { family: "Inter", size: 12, weight: "bold" },
          color: "#1E2538",
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        min: 0,
        max: 10,
        ticks: { stepSize: 1, color: "#526079" },
        grid: { color: "rgba(62,81,125,0.06)" },
      },
      x: {
        ticks: { color: "#526079", font: { weight: "600" } },
        grid: { display: false },
      },
    },
  };

  const promedioCalculado = (
    labels.reduce((acc, _, i) => acc + (p1[i] + p2[i] + p3[i]) / 3, 0) / labels.length
  ).toFixed(2);

  return (
    <div className="min-h-screen bg-surface-ice font-body-md text-text-primary">
      <Menu />

      <main className="w-full max-w-[1440px] mx-auto pt-6 px-4 sm:px-6 lg:px-8 pb-16 space-y-6">
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              Rendimiento y Desempeño Académico
            </h1>
            <p className="text-xs sm:text-sm text-text-muted mt-0.5">
              Evaluaciones continuas · Periodo Escolar Activo 2026-1 · ESCOM IPN
            </p>
          </div>

          <div className="flex items-center gap-3 bg-surface-card px-4 py-2.5 rounded-2xl shadow-[8px_8px_20px_rgba(62,81,125,0.08),-6px_-6px_16px_#FFFFFF]">
            <span className="text-xs text-text-muted font-bold">Promedio Estimado Semestre:</span>
            <span className="text-xl font-extrabold text-primary">{promedioCalculado}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
              Aprobatorio
            </span>
          </div>
        </section>

        {/* Gráfica Clay */}
        <section className="bg-surface-card rounded-2xl p-6 shadow-[8px_8px_20px_rgba(62,81,125,0.08),-6px_-6px_16px_#FFFFFF] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-surface-container-high/40">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">bar_chart</span>
              <h2 className="text-base font-bold text-primary">Comparativa por Departamental / Parcial</h2>
            </div>
            <span className="text-xs text-text-muted font-semibold">Escala 0 - 10</span>
          </div>

          <div className="h-[360px] w-full pt-2">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </section>

        {/* Desglose por Materia en Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {labels.map((materia, idx) => {
            const promMateria = ((p1[idx] + p2[idx] + p3[idx]) / 3).toFixed(1);

            return (
              <div
                key={idx}
                className="bg-surface-card rounded-2xl p-5 shadow-[8px_8px_20px_rgba(62,81,125,0.08),-6px_-6px_16px_#FFFFFF] flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">{materia}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
                      {promMateria}
                    </span>
                  </div>
                  <span className="text-[11px] text-text-muted">6° Semestre · Turno Matutino</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-surface-container-low shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
                    <span className="text-[10px] text-text-muted block">1er Parcial</span>
                    <span className="font-extrabold text-primary">{p1[idx].toFixed(1)}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-surface-container-low shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
                    <span className="text-[10px] text-text-muted block">2do Parcial</span>
                    <span className="font-extrabold text-primary">{p2[idx].toFixed(1)}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-surface-container-low shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
                    <span className="text-[10px] text-text-muted block">3er Parcial</span>
                    <span className="font-extrabold text-primary">{p3[idx].toFixed(1)}</span>
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
