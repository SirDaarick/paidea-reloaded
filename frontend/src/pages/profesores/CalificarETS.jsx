import React, { useState, useEffect } from "react";
import "styles/index.css";
import MenuProfesor from "components/MenuProfesor";
import CuadroDatos from "components/CuadroDatos";
import SelectField from "components/SelectField";
import Button from "components/Button";
import Mensaje from "components/Mensaje.jsx";
import { useIdProfesor } from "hooks/useIdProfesor";
import apiCall from "consultas/APICall.jsx";
import Espera from "./EsperaProfesores.jsx";

export default function CalificarETS() {
  const { idProfesor } = useIdProfesor();

  const [profesor, setProfesor] = useState(null);
  const [etsDisponibles, setEtsDisponibles] = useState([]);
  const [semestreSeleccionado, setSemestreSeleccionado] = useState("");
  const [etsSeleccionado, setEtsSeleccionado] = useState("");
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoAlumnos, setCargandoAlumnos] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // ESTADOS DEL MENSAJE
  const [msgVisible, setMsgVisible] = useState(false);
  const [msgTitulo, setMsgTitulo] = useState("");
  const [msgTexto, setMsgTexto] = useState("");

  // *** PASO 1: Cargar datos iniciales (profesor y sus ETS) ***
  useEffect(() => {
    async function cargarDatos() {
      if (!idProfesor) return;

      try {
        console.log("=== CARGANDO DATOS PARA CALIFICAR ETS ===");
        setCargando(true);

        // Cargar profesor y ETS en paralelo
        const [profesorData, etsData] = await Promise.all([
          apiCall(`/usuario/${idProfesor}`, 'GET').catch(() => null),
          apiCall(`/ets/profesor/${idProfesor}`, 'GET').catch(() => [])
        ]);

        console.log("Profesor:", profesorData);
        console.log("ETS asignados:", etsData.length);

        setProfesor(profesorData);
        setEtsDisponibles(etsData);

        // Seleccionar automáticamente el primer semestre si hay ETS
        if (etsData.length > 0) {
          const semestres = [...new Set(etsData.map(ets => ets.materia.semestre))].sort((a, b) => a - b);
          if (semestres.length > 0) {
            setSemestreSeleccionado(semestres[0].toString());
          }
        }

      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, [idProfesor]);

  // *** PASO 2: Cuando cambia el semestre, auto-seleccionar la primera materia ***
  useEffect(() => {
    if (semestreSeleccionado && etsDisponibles.length > 0) {
      const etsDelSemestre = etsDisponibles.filter(
        ets => ets.materia.semestre.toString() === semestreSeleccionado
      );

      // Verificar si el ETS actual pertenece al semestre seleccionado
      const etsActualValido = etsDelSemestre.find(ets => ets.idETS === etsSeleccionado);
      
      // Si no hay ETS seleccionado o el actual no pertenece al semestre, auto-seleccionar el primero
      if (etsDelSemestre.length > 0 && !etsActualValido) {
        setEtsSeleccionado(etsDelSemestre[0].idETS);
      }
    }
  }, [semestreSeleccionado, etsDisponibles, etsSeleccionado]);

  // *** PASO 3: Cargar alumnos inscritos cuando se selecciona un ETS ***
  useEffect(() => {
    async function cargarAlumnosInscritos() {
      if (!etsSeleccionado) {
        setAlumnos([]);
        return;
      }

      try {
        console.log(`Cargando alumnos inscritos al ETS: ${etsSeleccionado}`);
        setCargandoAlumnos(true);

        const alumnosData = await apiCall(
          `/ets/${etsSeleccionado}/alumnos-inscritos`,
          'GET'
        ).catch(() => []);

        console.log("Alumnos inscritos:", alumnosData.length);

        // *** Si la calificación es null (no existe), usar 0 por defecto ***
        const alumnosConCalif = alumnosData.map(alumno => ({
          ...alumno,
          calificacion: alumno.calificacion !== null && alumno.calificacion !== undefined
            ? alumno.calificacion
            : 0
        }));

        setAlumnos(alumnosConCalif);

        // Log de alumnos con calificaciones guardadas
        const conCalificacion = alumnosConCalif.filter(a => a.tieneCalificacion);
        if (conCalificacion.length > 0) {
          console.log(`✓ ${conCalificacion.length} alumnos con calificación guardada`);
        }

      } catch (error) {
        console.error("Error al cargar alumnos:", error);
        setAlumnos([]);
      } finally {
        setCargandoAlumnos(false);
      }
    }

    cargarAlumnosInscritos();
  }, [etsSeleccionado]);

  // *** Handlers ***
  const actualizarCalificacion = (index, value) => {
    const valorNumerico = parseFloat(value) || 0;

    // Validar rango 0-10
    if (valorNumerico < 0 || valorNumerico > 10) return;

    const nuevaLista = [...alumnos];
    nuevaLista[index].calificacion = valorNumerico;
    setAlumnos(nuevaLista);
  };

  const guardarActa = async () => {
    try {
      console.log("=== GUARDANDO ACTA ===");
      setGuardando(true);

      // Validar que todos los alumnos tengan calificación
      const alumnosSinCalificacion = alumnos.filter(a =>
        a.calificacion === null || a.calificacion === undefined || a.calificacion === ""
      );

      if (alumnosSinCalificacion.length > 0) {
        const confirmar = window.confirm(
          `Hay ${alumnosSinCalificacion.length} alumno(s) sin calificación. ¿Deseas continuar de todos modos?`
        );
        if (!confirmar) {
          setGuardando(false);
          return;
        }
      }

      // Preparar datos para enviar
      const calificaciones = alumnos
        .filter(a => a.calificacion !== null && a.calificacion !== undefined && a.calificacion !== "")
        .map(alumno => ({
          idInscripcionETS: alumno.idInscripcionETS,
          valor: parseFloat(alumno.calificacion)
        }));

      console.log("Calificaciones a guardar:", calificaciones.length);
      console.table(alumnos.map(a => ({
        Boleta: a.boleta,
        Nombre: a.nombre,
        Calificación: a.calificacion
      })));

      // Enviar al backend
      const resultado = await apiCall('/calificacionETS/guardar-lote', 'POST', {
        calificaciones
      });

      console.log("Resultado:", resultado);

      // Mostrar mensaje de éxito
      const { exitosos, actualizados, creados, fallidos, errores } = resultado.resultados;

      let mensajeTexto = `Exitosos: ${exitosos}`;
      if (creados > 0) mensajeTexto += ` | Creados: ${creados}`;
      if (actualizados > 0) mensajeTexto += ` | Actualizados: ${actualizados}`;

      if (fallidos > 0) {
        mensajeTexto += ` | Fallidos: ${fallidos}`;
        if (errores.length > 0) {
          mensajeTexto += `. Errores: ${errores.slice(0, 2).map(e => e.error).join(', ')}`;
        }
      }

      setMsgTitulo("Acta guardada");
      setMsgTexto(mensajeTexto);
      setMsgVisible(true);

      // Recargar alumnos para mostrar datos actualizados
      if (exitosos > 0) {
        const alumnosData = await apiCall(
          `/ets/${etsSeleccionado}/alumnos-inscritos`,
          'GET'
        ).catch(() => []);

        const alumnosConCalif = alumnosData.map(alumno => ({
          ...alumno,
          calificacion: alumno.calificacion !== null && alumno.calificacion !== undefined
            ? alumno.calificacion
            : 0
        }));

        setAlumnos(alumnosConCalif);

        console.log("✓ Tabla actualizada con calificaciones guardadas");
      }

    } catch (error) {
      console.error("Error al guardar acta:", error);
      setMsgTitulo("Error al guardar");
      setMsgTexto("No se pudo guardar el acta. Por favor, intenta de nuevo.");
      setMsgVisible(true);
    } finally {
      setGuardando(false);
    }
  };

  const cerrarActa = () => {
    // Verificar si estamos en las fechas permitidas (19 o 20 de enero de 2026)
    const ahora = new Date();
    const fechasPermitidas = [
      new Date('2026-01-19T00:00:00'),
      new Date('2026-01-20T00:00:00')
    ];

    // Verificar si la fecha actual está en alguno de los días permitidos
    const esFechaPermitida = fechasPermitidas.some(fecha => {
      const inicioDia = new Date(fecha);
      inicioDia.setHours(0, 0, 0, 0);
      
      const finDia = new Date(fecha);
      finDia.setHours(23, 59, 59, 999);
      
      return ahora >= inicioDia && ahora <= finDia;
    });

    if (!esFechaPermitida) {
      setMsgTitulo("Fuera de periodo");
      setMsgTexto("Solo puedes cerrar actas de ETS los días 19 y 20 de enero de 2026. Puedes guardar cambios en cualquier momento.");
      setMsgVisible(true);
      return;
    }

    if (!window.confirm("¿Estás seguro de cerrar el acta? No podrás hacer cambios después.")) {
      return;
    }

    console.log("=== CERRANDO ACTA ===");
    setMsgTitulo("Acta de ETS cerrada");
    setMsgTexto("El acta de ETS ha sido cerrada y enviada correctamente.");
    setMsgVisible(true);
  };

  // *** Preparar opciones para los selects ***

  // Obtener semestres únicos de los ETS
  const semestresOptions = [...new Set(etsDisponibles.map(ets => ets.materia.semestre))]
    .sort((a, b) => a - b)
    .map(sem => ({
      value: sem.toString(),
      label: `${sem}° Semestre`
    }));

  // Obtener materias del semestre seleccionado
  const materiasOptions = etsDisponibles
    .filter(ets => ets.materia.semestre.toString() === semestreSeleccionado)
    .map(ets => ({
      value: ets.idETS,
      label: ets.materia.nombre
    }));

  // Datos del profesor para el cuadro
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
      <MenuProfesor />

      {/* === MODAL DE MENSAJE === */}
      <Mensaje
        titulo={msgTitulo}
        mensaje={msgTexto}
        visible={msgVisible}
        onCerrar={() => setMsgVisible(false)}
      />

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
              <h2 className="content-title" style={{ marginBottom: "16px" }}>
                Calificar ETS
              </h2>

              {/* Selects de filtros */}
              <div
                className="selects-container"
                style={{
                  display: "flex",
                  gap: "20px",
                  marginBottom: "20px",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1 }}>
                  <SelectField
                    label="Elegir semestre"
                    value={semestreSeleccionado}
                    onChange={(e) => {
                      setSemestreSeleccionado(e.target.value);
                      setEtsSeleccionado(""); // Reset materia al cambiar semestre
                    }}
                    options={semestresOptions}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <SelectField
                    label="Elegir unidad de aprendizaje"
                    value={etsSeleccionado}
                    onChange={(e) => setEtsSeleccionado(e.target.value)}
                    options={materiasOptions}
                  />
                </div>
              </div>

              {/* Información del ETS seleccionado */}
              {etsSeleccionado && (
                <div style={{
                  background: "#e8f4f8",
                  padding: "15px",
                  borderRadius: "8px",
                  marginBottom: "20px"
                }}>
                  <div>
                    <strong>ETS seleccionado:</strong> {
                      etsDisponibles.find(ets => ets.idETS === etsSeleccionado)?.materia.nombre
                    } | <strong>Alumnos inscritos:</strong> {alumnos.length}
                  </div>
                  {alumnos.length > 0 && (
                    <div style={{ marginTop: "8px", fontSize: "0.9em" }}>
                      <span style={{ color: "#48bb78" }}>✓</span> Calificaciones con fondo verde ya están guardadas
                    </div>
                  )}
                </div>
              )}

              {/* === Tabla de calificaciones === */}
              <div
                className="tabla-container"
                style={{
                  overflowX: "auto",
                  background: "#fff",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  marginBottom: "24px",
                  minHeight: "200px"
                }}
              >
                {cargandoAlumnos ? (
                  <div style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#666"
                  }}>
                    Cargando alumnos...
                  </div>
                ) : (
                  <table
                    className="tabla-ets"
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#e4e7ec" }}>
                        <th style={{ width: "15%" }}>Boleta</th>
                        <th style={{ width: "35%" }}>Nombre completo</th>
                        <th style={{ width: "30%" }}>Correo</th>
                        <th style={{ width: "20%" }}>Calificación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alumnos.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: "center", padding: "30px", color: "#666" }}>
                            {etsSeleccionado
                              ? "No hay alumnos inscritos a este ETS"
                              : "Selecciona un ETS para ver los alumnos inscritos"
                            }
                          </td>
                        </tr>
                      ) : (
                        alumnos.map((alumno, index) => (
                          <tr key={alumno.idAlumno || index}>
                            <td>{alumno.boleta}</td>
                            <td style={{ textAlign: "left" }}>{alumno.nombre}</td>
                            <td style={{ textAlign: "left" }}>{alumno.correo}</td>
                            <td style={{ position: "relative" }}>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                value={alumno.calificacion}
                                onChange={(e) =>
                                  actualizarCalificacion(index, e.target.value)
                                }
                                disabled={guardando}
                                style={{
                                  width: "70px",
                                  textAlign: "center",
                                  borderRadius: "6px",
                                  border: alumno.tieneCalificacion
                                    ? "2px solid #48bb78"
                                    : "1px solid #ccc",
                                  padding: "6px",
                                  fontSize: "14px",
                                  opacity: guardando ? 0.6 : 1,
                                  backgroundColor: alumno.tieneCalificacion
                                    ? "#f0fff4"
                                    : "white"
                                }}
                                title={alumno.tieneCalificacion
                                  ? "Calificación guardada previamente"
                                  : "Sin calificación guardada"
                                }
                              />
                              {alumno.tieneCalificacion && (
                                <span style={{
                                  position: "absolute",
                                  right: "5px",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  fontSize: "12px",
                                  color: "#48bb78"
                                }}>
                                  ✓
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* === Botones === */}
              <div
                className="botones-ets"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "10px",
                }}
              >
                <Button
                  variant="primary"
                  onClick={guardarActa}
                  disabled={alumnos.length === 0 || guardando}
                >
                  {guardando ? "Guardando..." : "Guardar acta"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={cerrarActa}
                  disabled={alumnos.length === 0 || guardando}
                >
                  Cerrar acta
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
        }

        .tabla-ets th {
          background-color: #e4e7ec;
          font-weight: 600;
        }

        .tabla-ets tr:nth-child(even) {
          background-color: #f9fafb;
        }

        .tabla-ets tr:hover {
          background-color: #f0f4f8;
        }

        .tabla-ets input[type="number"]:focus {
          outline: none;
          border-color: #4299e1;
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
        }

        .datos-personales-main-content {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 20px;
          padding: 20px 40px;
        }

        /* Ocultar flechas del input number en Chrome/Safari */
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}