import React, { useEffect, useState, useMemo } from "react";
import Menu from "components/Menu";
import Table from "components/Table";
import "styles/PlanEstudios.css";
import apiCall from "consultas/APICall.jsx";
import { useDatosGen } from "consultas/datos_alumno_gen.jsx";
import Espera from "./Espera";
import { useIdAlumno } from "consultas/idAlumno";

export default function Optativas() {
  const datosGen = useDatosGen();
  const [carrera, setCarrera] = useState(null);
  const [optativasPorSemestre, setOptativasPorSemestre] = useState(null);
  const [loading, setLoading] = useState(true);
  const idAlumno = useIdAlumno();

  useEffect(() => {
    async function fetchOptativas() {
      if (!datosGen || !idAlumno) return;

      try {
        const usuario = await apiCall(`/usuario/${idAlumno}`, "GET").catch(() => null);
        if (!usuario?.dataAlumno?.idCarrera) {
          throw new Error("No se encontró la carrera del alumno");
        }

        const idCarrera =
          usuario.dataAlumno.idCarrera._id || usuario.dataAlumno.idCarrera;

        const carreraData = await apiCall(`/carrera/${idCarrera}`, "GET");
        setCarrera(`${carreraData.nombre} (${carreraData.PlanAcademico})`);

        const todasMaterias = await apiCall("/materia", "GET");
        const optativas = todasMaterias.filter(
          m => m.optativa && m.idCarrera === idCarrera
        );

        const optativasPorSem = {};
        optativas.forEach(m => {
          if (!optativasPorSem[m.semestre]) {
            optativasPorSem[m.semestre] = [];
          }
          optativasPorSem[m.semestre].push({
            nombre: m.nombre,
            url: m.url || "https://www.google.com",
            clave: m.clave || "N/A",
            creditos: m.creditos || 0,
          });
        });

        setOptativasPorSemestre(optativasPorSem);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    }

    fetchOptativas();
  }, [datosGen, idAlumno]);

  const maxCols = useMemo(() => {
    if (!optativasPorSemestre) return 0;
    return Math.max(
      ...Object.values(optativasPorSemestre).map(m => m.length)
    );
  }, [optativasPorSemestre]);

  if (!datosGen || loading || !optativasPorSemestre || !idAlumno) {
    return <Espera />;
  }

  const semestresOrdenados = Object.keys(optativasPorSemestre)
    .map(Number)
    .sort((a, b) => a - b);

  /* -------------------------
     CONFIGURACIÓN TABLA
  -------------------------- */

  const columns = [
    { key: "semestre", label: "Semestre", width: "120px" },
    ...Array.from({ length: maxCols }).map((_, i) => ({
      key: `optativa_${i}`,
      label: `Optativa ${i + 1}`,
      width: "240px",
    })),
  ];

  const data = semestresOrdenados.map(sem => {
    const row = { semestre: `Sem. ${sem}` };
    optativasPorSemestre[sem].forEach((m, i) => {
      row[`optativa_${i}`] = m;
    });
    return row;
  });

  return (
    <div className="plan-estudios-container">
      <Menu />

      <div className="contenido-plan">
        <h1 className="titulo-principal">Optativas</h1>
        <h2 className="subtitulo">{carrera}</h2>

        <p style={{ marginBottom: "20px", color: "#64748b" }}>
          A continuación se muestran las materias optativas disponibles por semestre.
        </p>

        <Table
          columns={columns}
          data={data}
          emptyMessage="No hay optativas disponibles"
          renderCell={(item, key) => {
            if (key === "semestre") {
              return <strong>{item[key]}</strong>;
            }

            const materia = item[key];
            if (!materia) {
              return <span className="vacio">—</span>;
            }

            return (
              <a
                href={materia.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-materia"
              >
                {materia.nombre}
                <br />
                <span style={{ fontSize: "0.85em", color: "#64748b" }}>
                  {materia.clave}
                </span>
              </a>
            );
          }}
        />
      </div>
    </div>
  );
}
