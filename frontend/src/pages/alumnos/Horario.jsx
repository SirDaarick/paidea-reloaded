import React, { useState, useEffect } from "react";
import "styles/Horario.css";
import Menu from "components/Menu.jsx";
import Button from "components/Button";
import Table from "components/Table";
import { useNavigate } from "react-router-dom";
import { useDatosGen } from "consultas/datos_alumno_gen.jsx";
import Espera from "./Espera";
import apiCall from "consultas/APICall.jsx";
import { useIdAlumno } from "consultas/idAlumno.jsx";
import { useIdPeriodoActual } from "consultas/idPeriodo_Actual.jsx";

export default function Horario() {
  const navigate = useNavigate();
  
  const datosGen = useDatosGen();
  const idAlumno = useIdAlumno();
  const idPeriodoActual = useIdPeriodoActual();
  const [materias, setMaterias] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      if (!datosGen || !idAlumno || !idPeriodoActual) return;

      try {
        console.log("Iniciando carga de horario...");
        
        // 1. Obtener inscripción del alumno
        const inscripciones = await apiCall(`/inscripcion/alumno/${idAlumno}`, 'GET')
          .catch(err => {
            console.error("Error obteniendo inscripciones:", err);
            throw err; 
          });
        
        if (!inscripciones || inscripciones.length === 0) {
          console.warn("No se encontraron inscripciones");
          setMaterias([]);
          return;
        }

        let inscripcionActual = null;
        for (let i = 0; i < inscripciones.length; i++) {
          const idPeriodoInscripcion = inscripciones[i].idPeriodo?._id || 
                                       String(inscripciones[i].idPeriodo);
          
          if (idPeriodoInscripcion === idPeriodoActual) {
            inscripcionActual = inscripciones[i];
            break;
          }
        }

        if (!inscripcionActual) {
          console.warn("No se encontró inscripción para el periodo actual");
          setMaterias([]);
          return;
        }
        
        // 2. Obtener inscripciones a clases
        const inscripcionesClase = await apiCall(`/inscripcionClase/inscripcion/${inscripcionActual._id}`, 'GET')
          .catch(err => {
            console.error("Error obteniendo clases:", err);
            throw err;
          });
        
        if (!inscripcionesClase || inscripcionesClase.length === 0) {
          console.warn("No se encontraron clases");
          setMaterias([]);
          return;
        }

        // 3. Procesar cada clase
        const materiasPromises = inscripcionesClase.map(async (inscClase, index) => {
          try {
            const clase = inscClase.idClase;
            
            if (!clase || !clase._id) {
              return null;
            }

            const esObjetoGrupo = typeof clase.idGrupo === 'object' && clase.idGrupo !== null;
            const esObjetoMateria = typeof clase.idMateria === 'object' && clase.idMateria !== null;
            const esObjetoProfesor = typeof clase.idProfesor === 'object' && clase.idProfesor !== null;
            
            const grupoPromise = esObjetoGrupo 
              ? Promise.resolve(clase.idGrupo)
              : apiCall(`/grupo/${clase.idGrupo}`, 'GET').catch(() => ({ nombre: "N/A" }));
              
            const materiaPromise = esObjetoMateria
              ? Promise.resolve(clase.idMateria)
              : apiCall(`/materia/${clase.idMateria}`, 'GET').catch(() => ({ nombre: "N/A" }));
              
            const profesorPromise = esObjetoProfesor
              ? Promise.resolve(clase.idProfesor)
              : apiCall(`/usuario/${clase.idProfesor}`, 'GET').catch(() => ({ nombre: "N/A" }));
            
            const [grupo, materia, profesor] = await Promise.all([
              grupoPromise,
              materiaPromise,
              profesorPromise
            ]);

            // Procesar horario
            const horarioProcesado = {};
            
            if (clase?.horario) {
              const horarioPlano = JSON.parse(JSON.stringify(clase.horario));
              
              Object.keys(horarioPlano).forEach(dia => {
                const diaInfo = horarioPlano[dia];
                const horarioInicio = diaInfo?.idDia?.horarioInicio || diaInfo?.horarioInicio;
                const horarioFinal = diaInfo?.idDia?.horarioFinal || diaInfo?.horarioFinal;
                
                if (horarioInicio && horarioFinal) {
                  const diaNormalizado = dia
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "");
                  
                  horarioProcesado[diaNormalizado] = `${horarioInicio} - ${horarioFinal}`;
                }
              });
            }

            return {
              grupo: grupo?.nombre || "N/A",
              salon: clase?.salon || "N/A",
              materia: materia?.nombre || "N/A",
              profesor: profesor?.nombre || "N/A",
              horario: horarioProcesado
            };
          } catch (error) {
            console.error(`Error procesando clase ${index + 1}:`, error);
            return null;
          }
        });

        const materiasResueltas = await Promise.all(materiasPromises);
        const materiasFiltradas = materiasResueltas.filter(m => m !== null);
        
        console.log("Horario cargado correctamente");
        setMaterias(materiasFiltradas);

      } catch (error) {
        console.error("API no disponible o error de carga:", error.message);
        setMaterias([]);
      }
    }

    fetchData();
  }, [datosGen, idAlumno, idPeriodoActual]);
  
  if (!datosGen || !materias || !idAlumno || !idPeriodoActual) {
    if (materias === null && !error) return <Espera />;
  }

  if (error) {
    return (
      <div className="bienvenida-container">
        <Menu />
        <div style={{ padding: '20px', color: 'red' }}>
          <h2>Error al cargar horario</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const columnasHorario = [
    { key: 'grupo', label: 'Grupo', width: '80px' },
    { key: 'salon', label: 'Salón', width: '80px' },
    { key: 'materia', label: 'Materia', width: '250px' },
    { key: 'profesor', label: 'Profesor', width: '200px' },
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' }
  ];

  const datosParaTabla = materias ? materias.map(materia => {
    return {
      ...materia,
      lunes: materia.horario.lunes || "",
      martes: materia.horario.martes || "",
      miercoles: materia.horario.miercoles || materia.horario.miércoles || "",
      jueves: materia.horario.jueves || "",
      viernes: materia.horario.viernes || ""
    };
  }) : [];

  const renderCelda = (item, key) => {
    const value = item[key];
    return value === "" ? "-" : value;
  };

  const irASalones = () => {
    navigate("/salones");
  };

  return (
    <div className="bienvenida-container">
      <Menu />

      <main className="page">
        <div className="horario-container">
          <aside className="horario-side">
            <h3>Datos generales</h3>
            <p><strong>Boleta:</strong> {datosGen.boleta}</p>
            <p><strong>Nombre:</strong> {datosGen.nombre}</p>
            <p><strong>Carrera:</strong> {datosGen.carrera}</p>
            <p><strong>Plan académico:</strong> {datosGen.plan}</p>
            <p><strong>Promedio general:</strong> {datosGen.promedio}</p>
            <Button variant="primary" onClick={irASalones}>
              Localizar mis salones
            </Button>
          </aside>

          <section className="horario-main">
            <h2>Horario</h2>
            <p>Aquí puedes ver tu horario, igual si lo requieres puedes ver el mapa de la ESCOM para localizar tu salón.</p>

            {/* Aquí usamos la nueva clase CSS */}
            <div className="table-scroll-wrapper">
              <Table
                columns={columnasHorario}
                data={datosParaTabla}
                renderCell={renderCelda}
                emptyMessage="No hay materias inscritas en este periodo."
                striped={true}
                hover={true}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}