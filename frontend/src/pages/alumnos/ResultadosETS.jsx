// === ResultadosETS.jsx ===
import React, { useEffect, useState } from "react";
import Menu from "components/Menu.jsx";
import Table from "components/Table.jsx";
import CuadroDatos from "components/CuadroDatos.jsx"; 
import Espera from "./Espera.jsx";
import NoCalificacion from "./NoCalificacion.jsx";
import { useDatosGen } from "consultas/datos_alumno_gen.jsx";
import { useIdAlumno } from "consultas/idAlumno.jsx";
import apiCall from "consultas/APICall.jsx";
import "styles/ResultadosETS.css";

export default function ResultadosETS() {
  const datosGen = useDatosGen();
  const idAlumno = useIdAlumno();

  const [cargando, setCargando] = useState(true);
  const [resultados, setResultados] = useState([]);

  useEffect(() => {
    async function cargarResultados() {
      if (!datosGen || !idAlumno) return;

      try {
        console.log("=== CARGANDO RESULTADOS ETS ===");
        console.time("Carga total ResultadosETS");
        setCargando(true);

        // *** PASO 1: Obtener todas las inscripciones del alumno ***
        const todasInscripciones = await apiCall(`/inscripcion/alumno/${idAlumno}`, 'GET')
          .catch(() => []);

        if (todasInscripciones.length === 0) {
          console.log("No hay inscripciones");
          setCargando(false);
          return;
        }

        // *** PASO 2: Obtener todas las inscripciones ETS del alumno ***
        const idsInscripciones = todasInscripciones.map(i => i._id || i.id);
        
        // Obtener inscripciones ETS de todas las inscripciones del alumno
        const promesasInscripcionesETS = idsInscripciones.map(idInsc =>
          apiCall(`/inscripcionETS/inscripcion/${idInsc}`, 'GET')
            .catch(() => [])
        );

        const resultadosInscripcionesETS = await Promise.all(promesasInscripcionesETS);
        const todasInscripcionesETS = resultadosInscripcionesETS.flat();

        console.log("Total inscripciones ETS encontradas:", todasInscripcionesETS.length);

        if (todasInscripcionesETS.length === 0) {
          console.log("No hay inscripciones ETS");
          setCargando(false);
          return;
        }

        // *** PASO 3: Obtener detalles de cada ETS y sus calificaciones ***
        const resultadosETS = [];

        for (const inscETS of todasInscripcionesETS) {
          try {
            const idInscripcionETS = inscETS._id || inscETS.id;
            const idETS = inscETS.idETS?._id || inscETS.idETS;

            // Obtener información del ETS
            const ets = await apiCall(`/ets/${idETS}`, 'GET').catch(() => null);

            if (!ets) {
              console.log(`No se encontró ETS con id: ${idETS}`);
              continue;
            }

            // Obtener la materia del ETS
            const idMateria = ets.idMateria?._id || ets.idMateria;
            const materia = await apiCall(`/materia/${idMateria}`, 'GET').catch(() => null);

            // Obtener la calificación del ETS
            const calificacion = await apiCall(
              `/calificacionETS/inscripcionETS/${idInscripcionETS}`, 
              'GET'
            ).catch(() => null);

            // Agregar al resultado
            resultadosETS.push({
              clave: materia?.clave || "N/A",
              nombre: materia?.nombre || "Materia no encontrada",
              calificacion: calificacion?.valor !== undefined ? calificacion.valor : "N/A"
            });

            console.log(`✓ ETS procesado: ${materia?.nombre} - Calificación: ${calificacion?.valor || 'N/A'}`);

          } catch (error) {
            console.error("Error procesando inscripción ETS:", error);
          }
        }

        setResultados(resultadosETS);
        console.log("Total resultados:", resultadosETS.length);
        console.timeEnd("Carga total ResultadosETS");
        console.log("=== CARGA COMPLETADA ===");

      } catch (error) {
        console.error("Error al cargar resultados:", error);
      } finally {
        setCargando(false);
      }
    }

    cargarResultados();
  }, [datosGen, idAlumno]);

  // Preparar datos del alumno para CuadroDatos
  const datosAlumno = datosGen ? {
    Nombre: datosGen.nombre || "N/A",
    Boleta: datosGen.boleta || "N/A",
    Carrera: datosGen.carrera || "N/A",
    Plan: datosGen.plan || "N/A",
  } : {};

  const columnas = [
    { key: "clave", label: "Clave", width: "90px" },
    { key: "nombre", label: "Materia" },
    { key: "calificacion", label: "Calificación", width: "130px" }
  ];

  // Función para renderizar celdas personalizadas
  const renderCell = (item, key) => {
    if (key === "calificacion") {
      const valor = item[key];
      
      // Si es "N/A"
      if (valor === "N/A") {
        return <span style={{ color: "#888", fontStyle: "italic" }}>N/A</span>;
      }
      
      // Si es número, aplicar color según aprobado/reprobado
      const calificacionNum = parseFloat(valor);
      const color = calificacionNum >= 6 ? "#00C49F" : "#FF4444";
      const fontWeight = calificacionNum >= 6 ? "bold" : "normal";
      
      return (
        <span style={{ color, fontWeight }}>
          {calificacionNum.toFixed(1)}
        </span>
      );
    }
    
    return item[key];
  };

  if (!datosGen || !idAlumno || cargando) {
    return <Espera />;
  }

  if (resultados.length === 0) {
    return <NoCalificacion />;
  }

  return (
    <div className="ets-container">
      <Menu />

      <main className="ets-main">
        <div className="ets-left">
          <CuadroDatos datos={datosAlumno} />
        </div>

        <div className="ets-right">
          <h2 className="ets-title">Resultados de ETS</h2>

          <Table
            columns={columnas}
            data={resultados}
            renderCell={renderCell}
            striped={true}
            hover={true}
          />
        </div>
      </main>
    </div>
  );
}