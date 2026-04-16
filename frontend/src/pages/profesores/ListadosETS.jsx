import React, { useState, useEffect } from "react";
import "styles/index.css";
import MenuProfesor from "components/MenuProfesor";
import CuadroDatos from "components/CuadroDatos";
import Button from "components/Button";
import { useIdProfesor } from "hooks/useIdProfesor";
import apiCall from "consultas/APICall.jsx";
import Espera from "./EsperaProfesores.jsx";

export default function ListadosETS() {
  const { idProfesor } = useIdProfesor();

  const [profesor, setProfesor] = useState(null);
  const [etsAsignados, setEtsAsignados] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      if (!idProfesor) return;

      try {
        console.log("=== CARGANDO ETS DEL PROFESOR ===");
        console.time("Carga ETS profesor");
        setCargando(true);

        // *** Cargar datos en paralelo ***
        const [profesorData, etsData] = await Promise.all([
          apiCall(`/usuario/${idProfesor}`, 'GET').catch(() => null),
          apiCall(`/ets/profesor/${idProfesor}`, 'GET').catch(() => [])
        ]);

        console.log("Profesor:", profesorData);
        console.log("ETS encontrados:", etsData.length);

        setProfesor(profesorData);

        // *** Agrupar ETS por materia y organizar horarios por día ***
        const etsPorMateria = {};

        for (const ets of etsData) {
          const idMateria = ets.materia.id;
          const nombreMateria = ets.materia.nombre;
          const dia = ets.horario.dia.toLowerCase();
          const horario = `${ets.horario.inicio} - ${ets.horario.fin}`;
          const salon = ets.salon;

          // Si la materia no existe en el objeto, crearla
          if (!etsPorMateria[idMateria]) {
            etsPorMateria[idMateria] = {
              materia: nombreMateria,
              clave: ets.materia.clave,
              semestre: ets.materia.semestre,
              salon: salon,
              lunes: horario,
              martes: horario,
              miercoles: horario,
              jueves: horario,
              viernes: horario
            };
          }

          // Asignar horario al día correspondiente
          if (etsPorMateria[idMateria][dia] === "-") {
            etsPorMateria[idMateria][dia] = horario;
          } else {
            // Si ya hay un horario, concatenar
            etsPorMateria[idMateria][dia] += `, ${horario}`;
          }
        }

        // Convertir objeto a array
        const etsArray = Object.values(etsPorMateria);

        // Ordenar por semestre
        etsArray.sort((a, b) => a.semestre - b.semestre);

        console.log("ETS agrupados por materia:", etsArray.length);
        setEtsAsignados(etsArray);

        console.timeEnd("Carga ETS profesor");
        console.log("=== CARGA COMPLETADA ===");

      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, [idProfesor]);

  const handleImprimir = () => {
    window.print();
  };

  // --- Datos del profesor para el cuadro ---
  const datosResumen = profesor ? {
    RFC: profesor.datosPersonales?.rfc || "N/A",
    Nombre: profesor.nombre || "N/A",
    Departamento: profesor.dataProfesor?.departamento || "N/A",
    Sexo: profesor.datosPersonales?.sexo || "N/A",
    "Estado Civil": profesor.datosPersonales?.estadoCivil || "N/A",
  } : {
    RFC: "N/A",
    Nombre: "Cargando...",
    Departamento: "N/A",
    Sexo: "N/A",
    "Estado Civil": "N/A",
  };

  if (cargando || !idProfesor) {
    return <Espera />;
  }

  return (
    <div className="bienvenida-container">
      {/* === Barra de menú superior === */}
      <MenuProfesor />

      {/* === Contenido principal === */}
      <main className="page">
        <div className="datos-personales-main-content">
          {/* === Columna izquierda === */}
          <div className="datos-personales-aside-left">
            <CuadroDatos datos={datosResumen} />
          </div>

          {/* === Columna derecha === */}
          <div className="datos-personales-content-right">
            <div
              className="card"
              style={{
                background: "#f8f9fc",
                padding: "30px 40px",
                borderRadius: "12px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
              }}
            >
              <h2
                className="content-title"
                style={{ fontSize: "1.8rem", marginBottom: "8px" }}
              >
                ETS Asignados
              </h2>
              <p
                className="content-subtitle"
                style={{
                  marginBottom: "20px",
                  fontSize: "1rem",
                }}
              >
                Visualice las materias y horarios de ETS que tiene asignados este
                semestre.
              </p>

              {/* === Tabla === */}
              <div className="tabla-container" style={{ overflowX: "auto" }}>
                <table
                  className="tabla-ets"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    background: "white",
                    borderRadius: "10px",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#e4e7ec" }}>
                      <th>Clave</th>
                      <th>Materia</th>
                      <th>Salón</th>
                      <th>Lunes</th>
                      <th>Martes</th>
                      <th>Miércoles</th>
                      <th>Jueves</th>
                      <th>Viernes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {etsAsignados.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                          No tienes ETS asignados en este momento
                        </td>
                      </tr>
                    ) : (
                      etsAsignados.map((fila, i) => (
                        <tr key={i}>
                          <td>{fila.clave}</td>
                          <td style={{ textAlign: "left" }}>{fila.materia}</td>
                          <td>{fila.salon}</td>
                          <td>{fila.lunes}</td>
                          <td>{fila.martes}</td>
                          <td>{fila.miercoles}</td>
                          <td>{fila.jueves}</td>
                          <td>{fila.viernes}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* === Resumen === */}
              {etsAsignados.length > 0 && (
                <div style={{
                  marginTop: "20px",
                  padding: "15px",
                  background: "#e8f4f8",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between"
                }}>
                  <div>
                    <strong>Total de materias con ETS:</strong> {etsAsignados.length}
                  </div>
                </div>
              )}

              {/* === Botón inferior === */}
              <div style={{ textAlign: "center", marginTop: "24px" }}>
                <Button
                  variant="primary"
                  onClick={handleImprimir}
                  disabled={etsAsignados.length === 0}
                >
                  Imprimir comprobante
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* === Estilos internos === */}
      <style>{`
        .tabla-ets th, .tabla-ets td {
          border: 1px solid #ccc;
          padding: 10px 12px;
          text-align: center;
          font-size: 0.9rem;
        }

        .tabla-ets th {
          background-color: #e4e7ec;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .tabla-ets tr:nth-child(even) {
          background-color: #f9fafb;
        }

        .tabla-ets tr:hover {
          background-color: #f0f4f8;
        }

        .datos-personales-main-content {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 20px;
          padding: 20px 40px;
        }

        @media print {
          .tabla-ets {
            font-size: 10pt;
          }
          
          .tabla-ets th, .tabla-ets td {
            padding: 8px;
          }

          button {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}