import React from "react";
import MenuProfesor from "components/MenuProfesor";
import Button from "components/Button";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { useResumenGruposProfesor } from "hooks/useResumenGruposProfesor";
import { useIdProfesor } from "hooks/useIdProfesor";

import "styles/ReportesProfesor.css";

export default function ReportesProfesor() {
  const { idProfesor } = useIdProfesor();

  // Obtener resumen de todos los grupos
  const { resumenGrupos, loading, aprobadosTotales, reprobadosTotales } = useResumenGruposProfesor(idProfesor);

  const colores = {
    p1: "#2563eb",
    p2: "#16a34a",
    p3: "#f97316",
  };

  return (
    <>
      <MenuProfesor />

      <div className="reportes-container">
        {/* TÍTULO DE LA PÁGINA */}
        <h1 className="titulo-principal">
          Desempeño académico general
        </h1>

        <p className="descripcion">
          Visualiza el comportamiento de las calificaciones de tus alumnos por
          grupo y parcial.
        </p>

        {loading ? (
          <div className="estado">Cargando reportes...</div>
        ) : resumenGrupos.length === 0 ? (
          <div className="estado vacio">
            No hay grupos asignados o no hay calificaciones registradas.
          </div>
        ) : (
          <div className="layout-reportes">
            {/* ===== GRÁFICAS ===== */}
            <section className="graficas-section imprimir-solo">
              {/* TÍTULO SOLO PARA PDF */}
              <h2 className="titulo-pdf">
                Reporte de desempeño académico
              </h2>

              {resumenGrupos.map((grupo) => (
                <div className="grafica-card" key={grupo.grupoId}>
                  <h3>
                    Grupo: {grupo.grupoNombre || "Sin nombre"}
                  </h3>

                  {grupo.alumnos && grupo.alumnos.length > 0 ? (
                    <ResponsiveContainer width="100%" height="85%">
                      <LineChart data={grupo.alumnos}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="boleta"
                          tick={{ fontSize: 10 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="p1"
                          name="1er Parcial"
                          stroke={colores.p1}
                          dot
                        />
                        <Line
                          type="monotone"
                          dataKey="p2"
                          name="2do Parcial"
                          stroke={colores.p2}
                          dot
                        />
                        <Line
                          type="monotone"
                          dataKey="p3"
                          name="3er Parcial"
                          stroke={colores.p3}
                          dot
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="sin-datos">
                      Sin alumnos inscritos
                    </div>
                  )}
                </div>
              ))}
            </section>

            {/* ===== RESUMEN ===== */}
            <aside className="resumen">
              <h3>Resumen</h3>
              <p>
                <b>Aprobados Totales:</b> {aprobadosTotales}
              </p>
              <p>
                <b>Reprobados Totales:</b> {reprobadosTotales}
              </p>

              <Button onClick={() => window.print()}>
                Imprimir PDF
              </Button>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
