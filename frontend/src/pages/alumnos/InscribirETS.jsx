import React, { useState, useMemo, useEffect } from "react";
import "styles/index.css";
import styles from "styles/InscripcionETS.module.css";
import { useNavigate } from "react-router-dom";
import { useDatosGen } from "consultas/datos_alumno_gen.jsx";
import { useIdAlumno } from "consultas/idAlumno.jsx";
import { useIdPeriodoActual } from "consultas/idPeriodo_Actual.jsx";
import apiCall from "consultas/APICall.jsx";
import Espera from "./Espera";
import Emergente from "components/Emergente";
import emergenteStyles from "styles/Emergente.module.css";
import Menu from "components/Menu.jsx";
import Button from "components/Button";
import Table from "components/Table";
import Mensaje from "components/Mensaje.jsx";

// --- Componente principal ---
export default function InscripcionETS() {
  const navigate = useNavigate();
  const datosGen = useDatosGen();
  const idAlumno = useIdAlumno();
  const idPeriodoActual = useIdPeriodoActual();
  
  const [etsDisponiblesData, setEtsDisponiblesData] = useState([]);
  const [etsInscritos, setEtsInscritos] = useState([]);
  const [inscripcionesETSExistentes, setInscripcionesETSExistentes] = useState([]);
  const [materiasReprobadasData, setMateriasReprobadasData] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [estadoAlumno, setEstadoAlumno] = useState("Regular");
  const [idInscripcion, setIdInscripcion] = useState(null);

  // --- Estados para mensajes ---
  const [mensajeVisible, setMensajeVisible] = useState(false);
  const [mensajeTitulo, setMensajeTitulo] = useState("");
  const [mensajeTexto, setMensajeTexto] = useState("");

  const mostrarMensaje = (titulo, texto) => {
    setMensajeTitulo(titulo);
    setMensajeTexto(texto);
    setMensajeVisible(true);
  };

  const cerrarMensaje = () => {
    setMensajeVisible(false);
    setMensajeTitulo("");
    setMensajeTexto("");
  };

  // --- Estados para el emergente ---
  const [isEmergenteOpen, setIsEmergenteOpen] = useState(false);
  const [etsSeleccionado, setEtsSeleccionado] = useState(null);
  const [archivo, setArchivo] = useState(null);

  // --- useEffect para cargar datos iniciales ---
  useEffect(() => {
    async function cargarDatos() {
      if (!datosGen || !idAlumno || !idPeriodoActual) return;

      try {
        console.log("=== CARGANDO DATOS INSCRIPCIÓN ETS ===");
        console.time("Carga total ETS");
        setCargando(true);

        // *** PASO 1: Cargar datos en paralelo ***
        console.time("Carga paralela inicial");
        const [todasInscripciones, materiasRes, profesoresRes, diasSemanaRes] = await Promise.all([
          apiCall(`/inscripcion/alumno/${idAlumno}`, 'GET').catch(() => []),
          apiCall('/materia', 'GET').catch(() => []),
          apiCall('/usuario', 'GET').catch(() => []),
          apiCall('/diaSemana', 'GET').catch(() => [])
        ]);
        console.timeEnd("Carga paralela inicial");

        // Buscar inscripción del periodo actual
        const inscripcionActual = todasInscripciones.find(insc => {
          const idPeriodo = insc.idPeriodo?._id || insc.idPeriodo;
          return idPeriodo?.toString() === idPeriodoActual?.toString();
        });

        if (!inscripcionActual) {
          mostrarMensaje("Error", "No tienes una inscripción activa en este periodo.");
          setCargando(false);
          return;
        }

        const idInsc = inscripcionActual._id || inscripcionActual.id;
        setIdInscripcion(idInsc);
        console.log("ID Inscripción:", idInsc);

        // *** PASO 2: Obtener inscripciones ETS existentes ***
        const inscripcionesETS = await apiCall(`/inscripcionETS/inscripcion/${idInsc}`, 'GET')
          .catch(() => []);
        
        setInscripcionesETSExistentes(inscripcionesETS);
        console.log("Inscripciones ETS existentes:", inscripcionesETS.length);

        // *** PASO 3: Usar la nueva ruta optimizada para obtener materias reprobadas ***
        console.time("Obtención materias reprobadas");
        const materiasReprobadas = await apiCall(
          `/inscripcionClase/alumno/${idAlumno}/materias-reprobadas`, 
          'GET'
        ).catch(() => []);
        console.timeEnd("Obtención materias reprobadas");

        console.log("Materias reprobadas encontradas:", materiasReprobadas.length);
        console.log("Materias:", materiasReprobadas);

        // *** PASO 4: Crear mapas de búsqueda rápida ***
        const materiasMap = {};
        materiasRes.forEach(m => {
          if (m._id) materiasMap[m._id.toString()] = m;
        });

        const profesoresMap = {};
        // No filtrar por rol, todos los usuarios pueden ser profesores
        profesoresRes.forEach(p => {
          if (p._id) profesoresMap[p._id.toString()] = p;
        });

        const diasSemanaMap = {};
        diasSemanaRes.forEach(d => {
          if (d._id) diasSemanaMap[d._id.toString()] = d;
        });

        // *** PASO 5: Obtener IDs de materias reprobadas ***
        const idsMateriasReprobadas = [];
        const materiasReprobadasInfo = [];

        for (const materiaRep of materiasReprobadas) {
          // Buscar la materia en el mapa por nombre (ya que la ruta devuelve nombre)
          const materiaEncontrada = Object.values(materiasMap).find(m => 
            m.nombre === materiaRep.materia
          );

          if (materiaEncontrada) {
            const idMateria = materiaEncontrada._id.toString();
            idsMateriasReprobadas.push(idMateria);
            materiasReprobadasInfo.push({
              idMateria: idMateria,
              codigo: materiaEncontrada.clave || "-",
              materia: materiaEncontrada.nombre,
              periodo: materiaRep.periodo,
              status: materiaRep.status
            });
          }
        }

        setMateriasReprobadasData(materiasReprobadasInfo);
        console.log("IDs de materias reprobadas:", idsMateriasReprobadas);

        // *** PASO 6: Obtener todos los ETS de las materias reprobadas en paralelo ***
        console.time("Carga ETS disponibles");
        const etsPromises = idsMateriasReprobadas.map(idMateria =>
          apiCall(`/ets/materia/${idMateria}`, 'GET')
            .catch(() => [])
            .then(etsArray => ({ idMateria, etsArray }))
        );

        const etsResults = await Promise.all(etsPromises);
        console.timeEnd("Carga ETS disponibles");

        // *** PASO 7: Procesar todos los ETS ***
        const etsDisponibles = [];

        for (const { idMateria, etsArray } of etsResults) {
          const materiaInfo = materiasReprobadasInfo.find(m => m.idMateria === idMateria);
          
          for (const ets of etsArray) {
            try {
              // *** Obtener datos del profesor ***
              let profesor = { nombre: "N/A", correo: "N/A" };
              
              // Primero intentar obtener del mapa
              const idProfesor = ets.idProfesor?._id?.toString() || ets.idProfesor?.toString();
              
              if (idProfesor) {
                // Si el profesor viene como objeto en el ETS, usarlo directamente
                if (typeof ets.idProfesor === 'object' && ets.idProfesor !== null && ets.idProfesor.nombre) {
                  profesor = {
                    nombre: ets.idProfesor.nombre || "N/A",
                    correo: ets.idProfesor.correo || "N/A"
                  };
                } 
                // Si no, buscar en el mapa
                else if (profesoresMap[idProfesor]) {
                  profesor = {
                    nombre: profesoresMap[idProfesor].nombre || "N/A",
                    correo: profesoresMap[idProfesor].correo || "N/A"
                  };
                }
                // Si no está en el mapa, hacer llamada individual (fallback)
                else {
                  console.log(`Profesor ${idProfesor} no encontrado en mapa, obteniendo de API...`);
                  const profesorAPI = await apiCall(`/usuario/${idProfesor}`, 'GET')
                    .catch(() => null);
                  
                  if (profesorAPI) {
                    profesor = {
                      nombre: profesorAPI.nombre || "N/A",
                      correo: profesorAPI.correo || "N/A"
                    };
                  }
                }
              }

              // *** Obtener datos del horario del mapa ***
              let horario = "- / -";
              const idDiaSemana = ets.idDiaSemana?._id?.toString() || ets.idDiaSemana?.toString();
              
              if (idDiaSemana) {
                // Si el día viene como objeto en el ETS, usarlo directamente
                if (typeof ets.idDiaSemana === 'object' && ets.idDiaSemana !== null) {
                  const inicio = ets.idDiaSemana.horarioInicio || "-";
                  const fin = ets.idDiaSemana.horarioFinal || "-";
                  horario = `${inicio} - ${fin}`;
                }
                // Si no, buscar en el mapa
                else if (diasSemanaMap[idDiaSemana]) {
                  const inicio = diasSemanaMap[idDiaSemana].horarioInicio || "-";
                  const fin = diasSemanaMap[idDiaSemana].horarioFinal || "-";
                  horario = `${inicio} - ${fin}`;
                }
              }

              etsDisponibles.push({
                idETS: ets._id?.toString() || ets.id?.toString(),
                idMateria: idMateria,
                codigo: materiaInfo?.codigo || "-",
                materia: materiaInfo?.materia || "N/A",
                profesor: profesor.nombre,
                correo: profesor.correo,
                horario: horario,
                salon: ets.salon || "N/A"
              });

              console.log(`✓ ETS procesado: ${materiaInfo?.materia} - Profesor: ${profesor.nombre}`);
            } catch (error) {
              console.error("Error procesando ETS:", error);
            }
          }
        }

        console.log("Total ETS encontrados:", etsDisponibles.length);

        // *** PASO 8: Filtrar ETS ya inscritos ***
        const idsETSInscritos = new Set(inscripcionesETS.map(ins => {
          const idETS = ins.idETS?._id || ins.idETS;
          return idETS?.toString();
        }));

        const etsNoInscritos = etsDisponibles.filter(ets => 
          !idsETSInscritos.has(ets.idETS.toString())
        );

        // *** PASO 9: Cargar ETS ya inscritos con sus datos ***
        const etsYaInscritos = [];
        for (const inscETS of inscripcionesETS) {
          const idETSBuscado = (inscETS.idETS?._id || inscETS.idETS)?.toString();
          const etsEncontrado = etsDisponibles.find(ets => 
            ets.idETS.toString() === idETSBuscado
          );
          
          if (etsEncontrado) {
            etsYaInscritos.push({
              ...etsEncontrado,
              idInscripcionETS: inscETS._id || inscETS.id
            });
          }
        }

        // *** PASO 10: Configurar estados finales ***
        setEtsDisponiblesData(etsNoInscritos);
        setEtsInscritos(etsYaInscritos);

        if (materiasReprobadas.length === 0) {
          setEstadoAlumno("Regular");
        } else {
          setEstadoAlumno("Irregular");
        }

        console.log("ETS disponibles (no inscritos):", etsNoInscritos.length);
        console.log("ETS ya inscritos:", etsYaInscritos.length);
        console.timeEnd("Carga total ETS");
        console.log("=== CARGA COMPLETADA ===");

      } catch (error) {
        console.error("Error al cargar datos:", error);
        mostrarMensaje("Error", "Ocurrió un error al cargar los datos.");
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, [datosGen, idAlumno, idPeriodoActual]);

  // --- Handlers ---
  const handleInscribirETS = (etsAInscribir) => {
    // Agregar a la lista temporal
    setEtsInscritos(prev => [...prev, etsAInscribir]);
    
    // Quitar de disponibles
    setEtsDisponiblesData(prev => 
      prev.filter(ets => ets.idETS !== etsAInscribir.idETS)
    );
  };

  const handleDarDeBajaETS = async (etsADarDeBaja) => {
    try {
      // Si ya está guardado en BD, eliminarlo
      if (etsADarDeBaja.idInscripcionETS) {
        await apiCall(`/inscripcionETS/${etsADarDeBaja.idInscripcionETS}`, 'DELETE');
        mostrarMensaje("Baja exitosa", `ETS de ${etsADarDeBaja.materia} eliminado correctamente.`);
      }

      // Quitar de inscritos
      setEtsInscritos(prev => 
        prev.filter(ets => ets.idETS !== etsADarDeBaja.idETS)
      );

      // Agregar de vuelta a disponibles
      const etsSinIdInscripcion = { ...etsADarDeBaja };
      delete etsSinIdInscripcion.idInscripcionETS;
      
      setEtsDisponiblesData(prev => [...prev, etsSinIdInscripcion]);

    } catch (error) {
      console.error("Error al dar de baja ETS:", error);
      mostrarMensaje("Error", "No se pudo dar de baja el ETS.");
    }
  };

  // --- Validación final ---
  const handleConfirmarInscripcion = async () => {
    // Filtrar solo los que no tienen idInscripcionETS (los nuevos)
    const etsNuevos = etsInscritos.filter(ets => !ets.idInscripcionETS);

    if (etsNuevos.length === 0) {
      mostrarMensaje("Inscripción", "No hay nuevos ETS para inscribir.");
      return;
    }

    if (!idInscripcion) {
      mostrarMensaje("Error", "No se encontró tu inscripción activa.");
      return;
    }

    try {
      console.log("Confirmando inscripción de ETS...");

      let exitosos = 0;
      let fallidos = 0;

      for (const ets of etsNuevos) {
        try {
          const inscripcionETSData = {
            idETS: ets.idETS,
            idInscripcion: idInscripcion
          };

          await apiCall('/inscripcionETS', 'POST', inscripcionETSData);
          exitosos++;
          console.log(`✓ ETS inscrito: ${ets.materia}`);
        } catch (error) {
          fallidos++;
          console.error(`✗ Error al inscribir ETS ${ets.materia}:`, error);
        }
      }

      if (exitosos > 0) {
        mostrarMensaje(
          "Inscripción Exitosa", 
          `Se inscribieron ${exitosos} ETS correctamente.${fallidos > 0 ? ` ${fallidos} fallaron.` : ''}`
        );

        // Recargar datos después de 2 segundos
        setTimeout(() => window.location.reload(), 2000);
      } else {
        mostrarMensaje("Error", "No se pudo inscribir ningún ETS.");
      }

    } catch (error) {
      console.error("Error al confirmar inscripción:", error);
      mostrarMensaje("Error", "Ocurrió un error al confirmar la inscripción.");
    }
  };

  // --- Navegación ---
  const irASeguimiento = () => {
    navigate("/alumno/seguimiento");
  };

  // --- Handlers para el Emergente ---
  const handleAbrirEmergente = (ets) => {
    setEtsSeleccionado(ets);
    setIsEmergenteOpen(true);
  };

  const handleCerrarEmergente = () => {
    setIsEmergenteOpen(false);
    setEtsSeleccionado(null);
    setArchivo(null);
  };

  const handleSubirArchivo = () => {
    if (!archivo) {
      mostrarMensaje("Subida de Comprobante", "Por favor, selecciona un archivo primero.");
      return;
    }
    mostrarMensaje("Subida de Comprobante", `Archivo ${archivo.name} seleccionado. Funcionalidad pendiente de implementar.`);
    handleCerrarEmergente();
  };

  // --- Columnas ---
  const columnasDisponibles = [
    { key: 'codigo', label: 'Código', width: '100px' },
    { key: 'materia', label: 'Materia', width: '200px' },
    { key: 'profesor', label: 'Profesor', width: '180px' },
    { key: 'correo', label: 'Correo', width: '180px' },
    { key: 'horario', label: 'Horario', width: '130px' },
    { key: 'salon', label: 'Salón', width: '80px' },
    { key: 'accion', label: 'Inscribir', width: '80px' }
  ];

  const columnasInscritas = [
    { key: 'codigo', label: 'Código', width: '100px' },
    { key: 'materia', label: 'Materia', width: '200px' },
    { key: 'profesor', label: 'Profesor', width: '180px' },
    { key: 'horario', label: 'Horario', width: '130px' },
    { key: 'salon', label: 'Salón', width: '80px' },
    { key: 'comprobante', label: 'Comprobante de Pago', width: '150px' },
    { key: 'accion', label: 'Dar de Baja', width: '100px' }
  ];

  const renderCellDisponibles = (item, key) => {
    if (key === 'accion') {
      return (
        <button
          className={`${styles.actionButton} ${styles.inscribir}`}
          onClick={() => handleInscribirETS(item)}
          title="Inscribir ETS"
        >
          +
        </button>
      );
    }
    const value = item[key];
    return value === "" || value === undefined ? "-" : value;
  };

  const renderCellInscritas = (item, key) => {
    if (key === 'accion') {
      return (
        <button
          className={`${styles.actionButton} ${styles.darDeBaja}`}
          onClick={() => handleDarDeBajaETS(item)}
          title="Dar de baja ETS"
        >
          —
        </button>
      );
    }
    
    if (key === 'comprobante') {
      return (
        <Button 
          variant="secondary" 
          size="small"
          onClick={() => handleAbrirEmergente(item)}
        >
          Subir
        </Button>
      );
    }

    const value = item[key];
    return value === "" || value === undefined ? "-" : value;
  };

  if (!datosGen || !idAlumno || !idPeriodoActual || cargando) {
    return <Espera />;
  }

  return (
    <div className="bienvenida-container">
      <Menu />
      <main className="page">
        <div className="horario-container">

          <aside className="horario-side">
            <h3>Datos del Alumno</h3>
            <p><strong>Boleta:</strong> {datosGen.boleta}</p>
            <p><strong>Nombre:</strong> {datosGen.nombre}</p>
            <p><strong>Carrera:</strong> {datosGen.carrera}</p>
            <p><strong>Estado:</strong> 
              <span className={estadoAlumno === "Irregular" ? styles.estadoIrregular : ""}>
                {estadoAlumno}
              </span>
            </p>
            <Button variant="primary" onClick={irASeguimiento} style={{marginTop: '20px'}}>
              Seguimiento de irregularidades
            </Button>
          </aside>

          <section className="horario-main">
            <h2>Inscribir ETS</h2>

            <h3 className={styles.tituloSeccion}>ETS Disponibles</h3>
            <Table
              columns={columnasDisponibles}
              data={etsDisponiblesData}
              renderCell={renderCellDisponibles}
              emptyMessage="No hay ETS disponibles. Estás en situación regular."
              striped={true}
              hover={true}
            />

            <h3 className={styles.tituloSeccion}>ETS Inscritos</h3>
            <Table
              columns={columnasInscritas}
              data={etsInscritos}
              renderCell={renderCellInscritas}
              emptyMessage="No has inscrito ningún ETS"
              striped={true}
              hover={true}
            />

            <Button 
              variant="primary" 
              onClick={handleConfirmarInscripcion} 
              disabled={etsInscritos.filter(e => !e.idInscripcionETS).length === 0}
              style={{marginTop: '30px', float: 'right'}}
            >
              Confirmar inscripción
            </Button>
          </section>
        </div>
      </main>

      <Emergente isOpen={isEmergenteOpen} onClose={handleCerrarEmergente}>
        <div className={emergenteStyles.subirCard}>
          <h3 className={emergenteStyles.subirTitle}>
            Subir Comprobante para:
          </h3>
          <p className={emergenteStyles.subirMateria}>
            {etsSeleccionado?.materia}
          </p>
          
          <input 
            type="file"
            className={emergenteStyles.subirInput}
            onChange={(e) => setArchivo(e.target.files[0])}
          />

          <Button variant="primary" onClick={handleSubirArchivo}>
            Confirmar Subida
          </Button>
        </div>
      </Emergente>

      {/* Componente Mensaje */}
      <Mensaje 
        titulo={mensajeTitulo} 
        mensaje={mensajeTexto} 
        visible={mensajeVisible} 
        onCerrar={cerrarMensaje} 
      />
    </div>
  );
}