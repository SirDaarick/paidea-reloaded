import React, { useMemo, useState, useEffect } from "react";
import MenuProfesor from "components/MenuProfesor.jsx";
import SelectField from "components/SelectField";
import { useGruposProfesor } from "hooks/useGruposProfesor";
import { useDesempenoGrupal } from "hooks/useDesempenoGrupal";
import { useIdProfesor } from "hooks/useIdProfesor";
import "styles/DesempeñoGrupal.css";

let recharts = {};
try {
  recharts = require("recharts");
} catch (_) { }

const {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  ResponsiveContainer
} = recharts;

const parciales = [
  { value: "P1", label: "1er Parcial" },
  { value: "P2", label: "2do Parcial" },
  { value: "P3", label: "3er Parcial" }
];

export default function DesempenoGrupal() {
  const { idProfesor } = useIdProfesor();
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);
  const [parcial, setParcial] = useState("P1");

  const { grupos } = useGruposProfesor(idProfesor);

  // Obtener calificaciones del grupo/materia/parcial seleccionado
  const { calificaciones, loading, promedio, aprobados, reprobados } = useDesempenoGrupal(
    grupoSeleccionado,
    materiaSeleccionada,
    parcial
  );

  // Opciones de grupos
  const gruposOptions = useMemo(() => grupos.map(g => ({
    value: g._id,
    label: g.nombre || 'Sin nombre',
  })) || [], [grupos]);

  const materiasOptions = useMemo(() => {
    if (!grupoSeleccionado) return [];
    const grupo = grupos.find(g => g._id === grupoSeleccionado);
    return (
      grupo?.materias?.map(m => ({
        value: m.id,
        label: m.nombre
      })) || []
    );
  }, [grupoSeleccionado, grupos]);

  useEffect(() => {
    if (gruposOptions.length > 0 && !grupoSeleccionado) {
      setGrupoSeleccionado(gruposOptions[0].value);
    }
  }, [gruposOptions, grupoSeleccionado]);

  useEffect(() => {
    if (materiasOptions.length > 0) {
      setMateriaSeleccionada(materiasOptions[0].value);
    } else {
      setMateriaSeleccionada(null);
    }
  }, [grupoSeleccionado]);

  const serie = useMemo(() => {
    if (!Array.isArray(calificaciones) || calificaciones.length === 0) {
      return [];
    }
    return calificaciones.map((alumno, idx) => ({
      x: `A${idx + 1}`,
      nombre: alumno.nombre,
      cal: alumno.calificacion ?? 0
    }));
  }, [calificaciones]);

  const grupoNombre =
    gruposOptions.find(g => g.value === grupoSeleccionado)?.label || "Grupo";
  const materiaNombre =
    materiasOptions.find(m => m.value === materiaSeleccionada)?.label ||
    "Materia";
  const parcialLabel =
    parciales.find(p => p.value === parcial)?.label || parcial;

  return (
    <>
      <MenuProfesor />

      {/* CONTENEDOR GENERAL (sin menú) */}
      <div className="dg-container">
        <h1 className="dg-title">Desempeño académico grupal</h1>

        <div className="dg-filtros">
          <SelectField
            label="Elegir grupo"
            value={grupoSeleccionado || ""}
            onChange={e => setGrupoSeleccionado(e.target.value)}
            options={gruposOptions}
          />

          <SelectField
            label="Elegir unidad de aprendizaje"
            value={materiaSeleccionada || ""}
            onChange={e => setMateriaSeleccionada(e.target.value)}
            options={materiasOptions}
          />

          <SelectField
            label="Elegir parcial"
            value={parcial}
            onChange={e => setParcial(e.target.value)}
            options={parciales}
          />

          <div className="dg-promedio">
            <strong>
              Promedio parcial:&nbsp;{loading ? "..." : promedio}
            </strong>
          </div>
        </div>

        {loading ? (
          <div className="dg-loading">Cargando calificaciones...</div>
        ) : serie.length === 0 ? (
          <div className="dg-empty">
            No hay calificaciones registradas para este grupo, materia y parcial.
          </div>
        ) : (
          <>
            {LineChart ? (
              <div className="dg-graficas">
                <div className="dg-card">
                  <h3>
                    Calificaciones — {grupoNombre} / {materiaNombre} —{" "}
                    {parcialLabel}
                  </h3>
                  <ResponsiveContainer width="100%" height="85%">
                    <LineChart data={serie}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="x" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="cal"
                        name="Calificación"
                        stroke="#8884d8"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="dg-card">
                  <h3>Estadísticas de Aprobación</h3>
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart
                      data={[
                        {
                          name: parcialLabel,
                          Aprobados: aprobados,
                          Reprobados: reprobados
                        }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Aprobados" fill="#82ca9d" />
                      <Bar dataKey="Reprobados" fill="#ff6b6b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="dg-table-wrapper">
                <table className="dg-table">
                  <thead>
                    <tr>
                      <th>Alumno</th>
                      <th>Nombre</th>
                      <th>Calificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serie.map(p => (
                      <tr key={p.x}>
                        <td>{p.x}</td>
                        <td>{p.nombre}</td>
                        <td>{p.cal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="dg-footer">
                  <b>Aprobados:</b> {aprobados} &nbsp;|&nbsp;
                  <b>Reprobados:</b> {reprobados}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
