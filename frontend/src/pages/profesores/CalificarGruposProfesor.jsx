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

export default function RegistroCalificaciones() {
  const { idProfesor } = useIdProfesor();

  const [profesor, setProfesor] = useState(null);
  const [clasesDisponibles, setClasesDisponibles] = useState([]);
  const [claseSeleccionada, setClaseSeleccionada] = useState("");
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoAlumnos, setCargandoAlumnos] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // ESTADOS DEL MENSAJE
  const [msgVisible, setMsgVisible] = useState(false);
  const [msgTitulo, setMsgTitulo] = useState("");
  const [msgTexto, setMsgTexto] = useState("");

  // *** Función para calcular Ord ***
  const calcularOrd = (p1, p2, p3) => {
    const parciales = [p1, p2, p3].filter(c => c !== null && c !== undefined && c !== '');

    if (parciales.length === 0) return null;

    const suma = parciales.reduce((acc, val) => acc + parseFloat(val), 0);
    const promedio = suma / parciales.length;

    // Si tiene los 3 parciales, redondear
    if (parciales.length === 3) {
      // Regla especial: 5.5 no sube a 6
      if (promedio === 5.5) {
        return 5;
      }
      return Math.round(promedio);
    }

    // Si no tiene los 3, retornar promedio actual (sin redondear)
    return promedio;
  };

  // *** PASO 1: Cargar datos iniciales (profesor y sus clases) ***
  useEffect(() => {
    async function cargarDatos() {
      if (!idProfesor) return;

      try {
        console.log("=== CARGANDO DATOS PARA REGISTRO DE CALIFICACIONES ===");
        setCargando(true);

        // Cargar profesor y clases en paralelo
        const [profesorData, clasesRes, materiasRes, gruposRes] = await Promise.all([
          apiCall(`/usuario/${idProfesor}`, 'GET').catch(() => null),
          apiCall('/clase', 'GET').catch(() => []),
          apiCall('/materia', 'GET').catch(() => []),
          apiCall('/grupo', 'GET').catch(() => [])
        ]);

        console.log("Profesor:", profesorData);
        setProfesor(profesorData);

        // Filtrar clases del profesor
        const clasesProfesor = clasesRes.filter(clase => {
          const idProf = clase.idProfesor?._id?.toString() || clase.idProfesor?.toString();
          return idProf === idProfesor;
        });

        console.log("Clases del profesor:", clasesProfesor.length);

        // Crear mapas para lookup rápido
        const materiasMap = {};
        materiasRes.forEach(m => {
          if (m._id) materiasMap[m._id.toString()] = m;
        });

        const gruposMap = {};
        gruposRes.forEach(g => {
          if (g._id) gruposMap[g._id.toString()] = g;
        });

        // Formatear clases con información completa
        const clasesFormateadas = clasesProfesor.map(clase => {
          const idMateria = clase.idMateria?._id?.toString() || clase.idMateria?.toString();
          const idGrupo = clase.idGrupo?._id?.toString() || clase.idGrupo?.toString();

          const materia = typeof clase.idMateria === 'object' && clase.idMateria.nombre
            ? clase.idMateria
            : materiasMap[idMateria];

          const grupo = typeof clase.idGrupo === 'object' && clase.idGrupo.nombre
            ? clase.idGrupo
            : gruposMap[idGrupo];

          return {
            idClase: clase._id?.toString() || clase.id?.toString(),
            materia: materia?.nombre || 'N/A',
            clave: materia?.clave || 'N/A',
            semestre: materia?.semestre || 0,
            grupo: grupo?.nombre || 'N/A',
            salon: clase.salon || 'N/A'
          };
        });

        // Ordenar por semestre
        clasesFormateadas.sort((a, b) => a.semestre - b.semestre);

        setClasesDisponibles(clasesFormateadas);

        // Auto-seleccionar la primera clase
        if (clasesFormateadas.length > 0) {
          setClaseSeleccionada(clasesFormateadas[0].idClase);
        }

      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, [idProfesor]);

  // *** PASO 2: Cargar alumnos con calificaciones cuando se selecciona una clase ***
  useEffect(() => {
    async function cargarAlumnosConCalificaciones() {
      if (!claseSeleccionada) {
        setAlumnos([]);
        return;
      }

      try {
        console.log(`Cargando alumnos de la clase: ${claseSeleccionada}`);
        setCargandoAlumnos(true);

        const alumnosData = await apiCall(
          `/calificacion/clase/${claseSeleccionada}/alumnos-con-calificaciones`,
          'GET'
        ).catch(() => []);

        console.log("Alumnos cargados:", alumnosData.length);

        // Inicializar valores null con ''
        const alumnosFormateados = alumnosData.map(alumno => ({
          ...alumno,
          P1: alumno.P1 !== null && alumno.P1 !== undefined ? alumno.P1 : '',
          P2: alumno.P2 !== null && alumno.P2 !== undefined ? alumno.P2 : '',
          P3: alumno.P3 !== null && alumno.P3 !== undefined ? alumno.P3 : ''
        }));

        setAlumnos(alumnosFormateados);

        // Log de alumnos con calificaciones
        const conCalificaciones = alumnosFormateados.filter(a =>
          a.P1 !== '' || a.P2 !== '' || a.P3 !== ''
        );
        if (conCalificaciones.length > 0) {
          console.log(`✓ ${conCalificaciones.length} alumnos con calificaciones`);
        }

      } catch (error) {
        console.error("Error al cargar alumnos:", error);
        setAlumnos([]);
      } finally {
        setCargandoAlumnos(false);
      }
    }

    cargarAlumnosConCalificaciones();
  }, [claseSeleccionada]);

  // *** Handlers ***
  const actualizarCalificacion = (index, campo, value) => {
    const nuevaLista = [...alumnos];
    const valorNumerico = value === '' ? '' : parseFloat(value);

    // Validar rango si no está vacío
    if (value !== '' && (valorNumerico < 0 || valorNumerico > 10)) return;

    nuevaLista[index][campo] = valorNumerico;

    // Recalcular Ord
    const p1 = nuevaLista[index].P1;
    const p2 = nuevaLista[index].P2;
    const p3 = nuevaLista[index].P3;
    nuevaLista[index].Ord = calcularOrd(p1, p2, p3);
    nuevaLista[index].promedioActual = nuevaLista[index].Ord;
    nuevaLista[index].tieneTresParciales =
      p1 !== '' && p2 !== '' && p3 !== '' &&
      p1 !== null && p2 !== null && p3 !== null;

    setAlumnos(nuevaLista);
  };

  const guardarActa = async () => {
    try {
      console.log("=== GUARDANDO CALIFICACIONES ===");
      setGuardando(true);

      // Preparar datos para enviar
      const calificaciones = alumnos.map(alumno => ({
        idInscripcionClase: alumno.idInscripcionClase,
        P1: alumno.P1 === '' ? null : alumno.P1,
        P2: alumno.P2 === '' ? null : alumno.P2,
        P3: alumno.P3 === '' ? null : alumno.P3
      }));

      console.log("Calificaciones a guardar:", calificaciones.length);
      console.table(alumnos.map(a => ({
        Boleta: a.boleta,
        Nombre: a.nombre,
        P1: a.P1,
        P2: a.P2,
        P3: a.P3,
        Ord: a.Ord
      })));

      // Enviar al backend
      const resultado = await apiCall('/calificacion/guardar-calificaciones-parciales', 'POST', {
        calificaciones
      });

      console.log("Resultado:", resultado);

      // Mostrar mensaje de éxito
      const { exitosos, creados, actualizados, ordinarios, fallidos, errores } = resultado.resultados;

      let mensajeTexto = `Exitosos: ${exitosos}`;
      if (creados > 0) mensajeTexto += ` | Creados: ${creados}`;
      if (actualizados > 0) mensajeTexto += ` | Actualizados: ${actualizados}`;
      if (ordinarios > 0) mensajeTexto += ` | Ordinarios generados: ${ordinarios}`;

      if (fallidos > 0) {
        mensajeTexto += ` | Fallidos: ${fallidos}`;
        if (errores.length > 0) {
          mensajeTexto += `. Errores: ${errores.slice(0, 2).map(e => e.error).join(', ')}`;
        }
      }

      setMsgTitulo("Calificaciones guardadas");
      setMsgTexto(mensajeTexto);
      setMsgVisible(true);

      // Recargar alumnos
      if (exitosos > 0) {
        const alumnosData = await apiCall(
          `/calificacion/clase/${claseSeleccionada}/alumnos-con-calificaciones`,
          'GET'
        ).catch(() => []);

        const alumnosFormateados = alumnosData.map(alumno => ({
          ...alumno,
          P1: alumno.P1 !== null && alumno.P1 !== undefined ? alumno.P1 : '',
          P2: alumno.P2 !== null && alumno.P2 !== undefined ? alumno.P2 : '',
          P3: alumno.P3 !== null && alumno.P3 !== undefined ? alumno.P3 : ''
        }));

        setAlumnos(alumnosFormateados);
        console.log("✓ Tabla actualizada");
      }

    } catch (error) {
      console.error("Error al guardar calificaciones:", error);
      setMsgTitulo("Error al guardar");
      setMsgTexto("No se pudieron guardar las calificaciones. Por favor, intenta de nuevo.");
      setMsgVisible(true);
    } finally {
      setGuardando(false);
    }
  };

  const cerrarActa = () => {
    // Verificar si estamos en las fechas permitidas (9, 12 o 13 de enero de 2026)
    const ahora = new Date();
    const fechasPermitidas = [
      new Date('2026-01-09T00:00:00'),
      new Date('2026-01-12T00:00:00'),
      new Date('2026-01-13T00:00:00')
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
      setMsgTexto("Solo puedes cerrar actas definitivas los días 9, 12 y 13 de enero de 2026. Puedes guardar cambios en cualquier momento.");
      setMsgVisible(true);
      return;
    }

    if (!window.confirm("¿Estás seguro de cerrar el acta? No podrás hacer cambios después.")) {
      return;
    }

    console.log("=== CERRANDO ACTA ===");
    setMsgTitulo("Acta cerrada");
    setMsgTexto("El acta ha sido cerrada y enviada correctamente.");
    setMsgVisible(true);
  };

  // *** Preparar opciones para el select ***
  const clasesOptions = clasesDisponibles.map(clase => ({
    value: clase.idClase,
    label: `${clase.clave} - ${clase.materia} - Grupo ${clase.grupo}`
  }));

  // Datos del profesor
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

  // Calcular promedios generales
  const promedioP1 = alumnos.length > 0
    ? (alumnos.reduce((acc, a) => acc + (a.P1 || 0), 0) / alumnos.filter(a => a.P1 !== '' && a.P1 !== null).length).toFixed(1)
    : "N/A";
  const promedioP2 = alumnos.length > 0
    ? (alumnos.reduce((acc, a) => acc + (a.P2 || 0), 0) / alumnos.filter(a => a.P2 !== '' && a.P2 !== null).length).toFixed(1)
    : "N/A";
  const promedioP3 = alumnos.length > 0
    ? (alumnos.reduce((acc, a) => acc + (a.P3 || 0), 0) / alumnos.filter(a => a.P3 !== '' && a.P3 !== null).length).toFixed(1)
    : "N/A";
  const promedioOrd = alumnos.length > 0
    ? (alumnos.reduce((acc, a) => acc + (a.Ord || 0), 0) / alumnos.filter(a => a.Ord !== null && a.Ord !== undefined).length).toFixed(1)
    : "N/A";

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
                Registro de Calificaciones
              </h2>

              {/* Select de clase */}
              <div style={{ marginBottom: "20px" }}>
                <SelectField
                  label="Seleccionar clase"
                  value={claseSeleccionada}
                  onChange={(e) => setClaseSeleccionada(e.target.value)}
                  options={clasesOptions}
                />
              </div>

              {/* Información de la clase */}
              {claseSeleccionada && (
                <div style={{
                  background: "#e8f4f8",
                  padding: "15px",
                  borderRadius: "8px",
                  marginBottom: "20px"
                }}>
                  <div>
                    <strong>Clase seleccionada:</strong> {
                      clasesDisponibles.find(c => c.idClase === claseSeleccionada)?.materia
                    } - Grupo {
                      clasesDisponibles.find(c => c.idClase === claseSeleccionada)?.grupo
                    } | <strong>Alumnos:</strong> {alumnos.length}
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "0.9em", color: "#666" }}>
                    💡 El ordinario (Ord) se calcula automáticamente del promedio de P1, P2 y P3
                  </div>
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
                  minHeight: "300px"
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
                    className="tabla-calificaciones"
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#e4e7ec" }}>
                        <th style={{ width: "12%" }}>Boleta</th>
                        <th style={{ width: "30%" }}>Nombre completo</th>
                        <th style={{ width: "12%" }}>P1</th>
                        <th style={{ width: "12%" }}>P2</th>
                        <th style={{ width: "12%" }}>P3</th>
                        <th style={{ width: "12%", background: "#fef3c7" }}>Ord</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alumnos.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "#666" }}>
                            {claseSeleccionada
                              ? "No hay alumnos inscritos a esta clase"
                              : "Selecciona una clase para ver los alumnos"
                            }
                          </td>
                        </tr>
                      ) : (
                        <>
                          {alumnos.map((alumno, index) => (
                            <tr key={alumno.idAlumno || index}>
                              <td>{alumno.boleta}</td>
                              <td style={{ textAlign: "left" }}>{alumno.nombre}</td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.1"
                                  value={alumno.P1}
                                  onChange={(e) =>
                                    actualizarCalificacion(index, 'P1', e.target.value)
                                  }
                                  disabled={guardando}
                                  style={inputStyle(guardando, alumno.P1)}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.1"
                                  value={alumno.P2}
                                  onChange={(e) =>
                                    actualizarCalificacion(index, 'P2', e.target.value)
                                  }
                                  disabled={guardando}
                                  style={inputStyle(guardando, alumno.P2)}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.1"
                                  value={alumno.P3}
                                  onChange={(e) =>
                                    actualizarCalificacion(index, 'P3', e.target.value)
                                  }
                                  disabled={guardando}
                                  style={inputStyle(guardando, alumno.P3)}
                                />
                              </td>
                              <td style={{
                                background: "#fef3c7",
                                fontWeight: "600",
                                fontSize: "1.1em"
                              }}>
                                {alumno.Ord !== null && alumno.Ord !== undefined
                                  ? (alumno.tieneTresParciales
                                    ? Math.round(alumno.Ord) // Entero si tiene 3
                                    : alumno.Ord.toFixed(1)) // Con decimal si falta alguno
                                  : '-'
                                }
                              </td>
                            </tr>
                          ))}
                          {/* Fila de promedios */}
                          <tr style={{
                            backgroundColor: "#f1f5f9",
                            fontWeight: "600",
                            borderTop: "2px solid #cbd5e1"
                          }}>
                            <td colSpan="2" style={{ textAlign: "right", padding: "12px" }}>
                              PROMEDIOS:
                            </td>
                            <td style={{ textAlign: "center" }}>{promedioP1}</td>
                            <td style={{ textAlign: "center" }}>{promedioP2}</td>
                            <td style={{ textAlign: "center" }}>{promedioP3}</td>
                            <td style={{
                              textAlign: "center",
                              background: "#fef3c7"
                            }}>
                              {promedioOrd}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* === Botones === */}
              <div
                className="botones-calificaciones"
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
        .tabla-calificaciones th, .tabla-calificaciones td {
          border: 1px solid #ccc;
          padding: 10px 12px;
          text-align: center;
        }

        .tabla-calificaciones th {
          background-color: #e4e7ec;
          font-weight: 600;
        }

        .tabla-calificaciones tr:nth-child(even):not(:last-child) {
          background-color: #f9fafb;
        }

        .tabla-calificaciones tr:hover:not(:last-child) {
          background-color: #f0f4f8;
        }

        .tabla-calificaciones input[type="number"]:focus {
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

        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

// Función helper para estilos de input
const inputStyle = (guardando, valor) => ({
  width: "70px",
  textAlign: "center",
  borderRadius: "6px",
  border: (valor !== '' && valor !== null) ? "2px solid #48bb78" : "1px solid #ccc",
  backgroundColor: (valor !== '' && valor !== null) ? "#f0fff4" : "white",
  padding: "6px",
  fontSize: "14px",
  opacity: guardando ? 0.6 : 1
});