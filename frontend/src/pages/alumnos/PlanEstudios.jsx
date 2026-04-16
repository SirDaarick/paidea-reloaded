import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Menu from "components/Menu";
import Table from "components/Table";
import "styles/PlanEstudios.css";
import apiCall from "consultas/APICall.jsx";
import { useDatosGen } from "consultas/datos_alumno_gen.jsx";
import Espera from "./Espera";
import { useIdAlumno } from "consultas/idAlumno";

export default function PlanEstudios() {
  const datosGen = useDatosGen();
  const [carrera, setCarrera] = useState(null);
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const idAlumno = useIdAlumno();

  useEffect(() => {
    async function fetchPlanEstudios() {
      if (!datosGen || !idAlumno) return;

      try {
        const usuario = await apiCall(`/usuario/${idAlumno}`, "GET").catch(() => null);
        if (!usuario?.dataAlumno?.idCarrera) {
          throw new Error("No se encontró la carrera del alumno");
        }

        const idCarrera = usuario.dataAlumno.idCarrera._id || usuario.dataAlumno.idCarrera;
        const carreraData = await apiCall(`/carrera/${idCarrera}`, "GET");

        setCarrera(`${carreraData.nombre} (${carreraData.PlanAcademico})`);
        const cantidadSemestres = carreraData.cantidadSemestres || 8;

        const todasMaterias = await apiCall("/materia", "GET");
        const materiasCarrera = todasMaterias.filter(
          m => !m.optativa && m.idCarrera === idCarrera
        );

        const optativasSemestre = await apiCall("/optativasSemestre", "GET").catch(() => []);

        const planPorSemestre = {};
        for (let i = 1; i <= cantidadSemestres; i++) {
          planPorSemestre[i] = [];
        }

        materiasCarrera.forEach(m => {
          const sem = m.semestre || 1;
          planPorSemestre[sem].push({
            nombre: m.nombre,
            url: m.url,
            esOptativa: false,
          });
        });

        optativasSemestre.forEach(cfg => {
          const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
          for (let i = 0; i < cfg.num_optativas; i++) {
            planPorSemestre[cfg.semestre].push({
              nombre: `Optativa ${letras[i]}`,
              url: null,
              esOptativa: true,
            });
          }
        });

        setPlanSeleccionado(planPorSemestre);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    }

    fetchPlanEstudios();
  }, [datosGen, idAlumno]);

  const maxCols = useMemo(() => {
    if (!planSeleccionado) return 0;
    return Math.max(...Object.values(planSeleccionado).map(m => m.length));
  }, [planSeleccionado]);

  if (!datosGen || loading || !planSeleccionado || !idAlumno) {
    return <Espera />;
  }

  /* -------------------------
     CONFIGURACIÓN DE LA TABLA
  -------------------------- */

  const columns = [
    { key: "semestre", label: "Semestre", width: "120px" },
    ...Array.from({ length: maxCols }).map((_, i) => ({
      key: `materia_${i}`,
      label: `Materia ${i + 1}`,
      width: "220px",
    })),
  ];

  const data = Object.entries(planSeleccionado).map(([sem, materias]) => {
    const row = { semestre: `Sem. ${sem}` };
    materias.forEach((m, i) => {
      row[`materia_${i}`] = m;
    });
    return row;
  });

  return (
    <div className="plan-estudios-container">
      <Menu />

      <div className="contenido-plan">
        <h1 className="titulo-principal">Plan de estudios</h1>
        <h2 className="subtitulo">{carrera}</h2>

        <Table
          columns={columns}
          data={data}
          renderCell={(item, key) => {
            if (key === "semestre") {
              return <strong>{item[key]}</strong>;
            }

            const materia = item[key];
            if (!materia) return <span className="vacio">—</span>;

            return materia.esOptativa ? (
              <Link to="/alumno/optativas" className="link-materia">
                {materia.nombre}
              </Link>
            ) : (
              <a
                href={materia.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-materia"
              >
                {materia.nombre}
              </a>
            );
          }}
        />

        <div className="enlaces">
          <ul>
            <li>
              <Link to="/alumno/optativas" className="enlace-optativas">
                Consultar optativas
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
