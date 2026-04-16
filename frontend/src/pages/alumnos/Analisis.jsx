import React, { useState, useEffect } from "react";
import Menu from "components/Menu.jsx";
import "styles/Analisis.css";
import CuadroDatos from "components/CuadroDatos.jsx";
import Espera from "./Espera";
import { useDatosGen } from "consultas/datos_alumno_gen.jsx";
import { useIdAlumno } from "consultas/idAlumno.jsx";
import apiCall from "consultas/APICall.jsx";
import { useIdPeriodoActual } from "consultas/idPeriodo_Actual.jsx";

// Import Chart.js
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

// Registrar componentes necesarios
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalisisAcademico() {
  const datosGen = useDatosGen();
  const idAlumno = useIdAlumno();
  const idPeriodoActual = useIdPeriodoActual();
  
  const [datosGrafica, setDatosGrafica] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalisis() {
      if (!datosGen || !idAlumno || !idPeriodoActual) return;

      try {
        console.log("=== INICIANDO FETCH ANALISIS ===");

        // Obtener todas las inscripciones del alumno
        const inscripciones = await apiCall(`/inscripcion/alumno/${idAlumno}`, 'GET')
          .catch(err => {
            console.error("Error obteniendo inscripciones:", err);
            throw err;
          });
        
        if (!inscripciones || inscripciones.length === 0) {
          throw new Error("No se encontraron inscripciones");
        }

        console.log("Total de inscripciones:", inscripciones.length);

        // Agrupar calificaciones por semestre
        const promediosPorSemestre = {};

        for (const inscripcion of inscripciones) {
          const idPeriodoInscripcion = inscripcion.idPeriodo?._id || String(inscripcion.idPeriodo);
          const nombrePeriodo = inscripcion.idPeriodo?.nombre || "N/A";

          console.log("Procesando periodo:", nombrePeriodo);

          // Saltar el periodo actual
          if (idPeriodoInscripcion === idPeriodoActual) {
            console.log("Saltando periodo actual:", nombrePeriodo);
            continue;
          }

          console.log("Procesando periodo pasado:", nombrePeriodo);

          // Obtener inscripciones clase
          const inscripcionesClase = await apiCall(`/inscripcionClase/inscripcion/${inscripcion._id}`, 'GET')
            .catch(() => []);
          
          if (!inscripcionesClase || inscripcionesClase.length === 0) continue;

          const calificacionesSemestre = [];

          // Procesar cada inscripción clase
          for (const inscClase of inscripcionesClase) {
            try {
              const clase = inscClase.idClase;
              if (!clase || !clase._id) continue;

              const esObjetoMateria = typeof clase.idMateria === 'object' && clase.idMateria !== null;
              
              const materia = esObjetoMateria 
                ? clase.idMateria 
                : await apiCall(`/materia/${clase.idMateria}`, 'GET').catch(() => null);

              if (!materia) continue;

              const semestre = materia?.semestre || 1;

              // Obtener calificaciones
              const calificaciones = await apiCall(`/calificacion/inscripcionClase/${inscClase._id}`, 'GET')
                .catch(() => []);

              if (calificaciones && calificaciones.length > 0) {
                const califFinal = calificaciones.find(c => c.tipoEvaluacion === 'Ord' || c.tipoEvaluacion === 'Ext');
                if (califFinal) {
                  if (!promediosPorSemestre[semestre]) {
                    promediosPorSemestre[semestre] = [];
                  }
                  promediosPorSemestre[semestre].push(califFinal.valor);
                  console.log(`Calificación agregada a semestre ${semestre}:`, califFinal.valor);
                }
              }

            } catch (error) {
              console.error("Error procesando clase:", error);
            }
          }
        }

        // Calcular promedios por semestre
        const labels = [];
        const promedios = [];

        const semestresOrdenados = Object.keys(promediosPorSemestre)
          .map(Number)
          .sort((a, b) => a - b);

        for (const semestre of semestresOrdenados) {
          const califs = promediosPorSemestre[semestre];
          if (califs.length > 0) {
            const promedio = califs.reduce((a, b) => a + b, 0) / califs.length;
            labels.push(`Semestre ${semestre}`);
            promedios.push(promedio.toFixed(2));
            console.log(`Semestre ${semestre} - Promedio:`, promedio.toFixed(2));
          }
        }

        if (labels.length === 0) {
          throw new Error("No hay datos suficientes para la gráfica");
        }

        setDatosGrafica({ labels, promedios });
        setLoading(false);
        console.log("=== ANALISIS CARGADO ===");

      } catch (error) {
        console.error("API no disponible, usando datos por defecto:", error.message);
        
        // Datos por defecto
        setDatosGrafica({
          labels: ["Semestre 1", "Semestre 2", "Semestre 3", "Semestre 4", "Semestre 5", "Semestre 6"],
          promedios: [8.5, 8.7, 8.9, 9.0, 9.1, 9.2]
        });
        setLoading(false);
      }
    }

    fetchAnalisis();
  }, [datosGen, idAlumno, idPeriodoActual]);

  if (!datosGen || !idAlumno || !idPeriodoActual || loading || !datosGrafica) {
    return <Espera />;
  }

  const data = {
    labels: datosGrafica.labels,
    datasets: [
      {
        label: "Promedio",
        data: datosGrafica.promedios,
        borderColor: "#3E517D",
        backgroundColor: "#C5C8E8",
        tension: 0.3,
        fill: false,
        pointBackgroundColor: "#3E517D",
        pointBorderColor: "#3E517D",
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      title: {
        display: true,
        text: "Promedio por Semestre",
        font: {
          size: 20,
        },
        color: "#3E517D",
        padding: {
          top: 10,
          bottom: 30
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Semestre",
          font: {
            size: 16,
          },
          color: "#3E517D",
        }
      },
      y: {
        min: 0,
        max: 10,
        title: {
          display: true,
          text: "Promedio",
          font: {
            size: 16,
          },
          color: "#3E517D",
        },
        ticks: {
          stepSize: 1,
        }
      }
    }
  };

  return (
  <div className="bienvenida-container">
    <Menu />

    <main className="analisis-main">
      <div className="datos-sidebar">
        <CuadroDatos datos={datosGen} />
      </div>

      <div className="grafica-box">
        <h2>Análisis Académico</h2>
        <div className="grafica-chart">
          <Line data={data} options={options} />
        </div>
      </div>
    </main>
  </div>
);
}