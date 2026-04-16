import React, { useState, useEffect, useMemo } from "react";
import "styles/Calificaciones.css";
import "styles/index.css";

import Menu from "components/Menu.jsx";
import Table from "components/Table";
import CuadroDatos from "components/CuadroDatos";
import { useNavigate } from "react-router-dom";
import { useDatosGen } from "consultas/datos_alumno_gen.jsx";
import Espera from "./Espera";
import apiCall from "consultas/APICall.jsx";
import { useIdAlumno } from "consultas/idAlumno";
import { useIdPeriodoActual } from "consultas/idPeriodo_Actual.jsx";

const calcularPromedioParciales = (materia) => {
  const parciales = [materia.p1, materia.p2, materia.p3]
    .filter(p => p !== null && typeof p === 'number'); 
  if (parciales.length === 0) return null;
  return parciales.reduce((a, b) => a + b, 0) / parciales.length;
};

const getRowClass = (materia) => {
  const promedio = calcularPromedioParciales(materia);
  if (promedio === null) return "";
  if (promedio < 6) return "calif-rojo";
  if (promedio < 8) return "calif-naranja";
  return "";
};

export default function Calificaciones() {
  const navigate = useNavigate();
  const datosGen = useDatosGen();
  const idAlumno = useIdAlumno();
  const idPeriodoActual = useIdPeriodoActual();
  
  const [datosMaterias, setDatosMaterias] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCalificaciones() {
      if (!datosGen || !idAlumno) return;

      try {
        const inscripciones = await apiCall(`/inscripcion/alumno/${idAlumno}`, 'GET')
          .catch(err => {
            console.error("Error obteniendo inscripciones:", err);
            throw err;
          });
        
        if (!inscripciones || inscripciones.length === 0) {
          throw new Error("No se encontraron inscripciones");
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
          throw new Error("No se encontró inscripción para el periodo actual");
        }
        
        const inscripcionesClase = await apiCall(`/inscripcionClase/inscripcion/${inscripcionActual._id}`, 'GET')
          .catch(err => {
            console.error("Error obteniendo clases:", err);
            throw err;
          });
        
        if (!inscripcionesClase || inscripcionesClase.length === 0) {
          throw new Error("No se encontraron clases");
        }

        const materiasPromises = inscripcionesClase.map(async (inscClase, index) => {
          try {
            const clase = inscClase.idClase;
            if (!clase || !clase._id) return null;

            const esObjetoMateria = typeof clase.idMateria === 'object' && clase.idMateria !== null;
            const esObjetoGrupo = typeof clase.idGrupo === 'object' && clase.idGrupo !== null;
            
            const materia = esObjetoMateria 
              ? clase.idMateria 
              : await apiCall(`/materia/${clase.idMateria}`, 'GET').catch(() => ({ nombre: "N/A" }));
              
            const grupo = esObjetoGrupo
              ? clase.idGrupo
              : await apiCall(`/grupo/${clase.idGrupo}`, 'GET').catch(() => ({ nombre: "N/A" }));

            const calificaciones = await apiCall(`/calificacion/inscripcionClase/${inscClase._id}`, 'GET')
              .catch(err => {
                console.warn(`No se encontraron calificaciones para ${materia?.nombre}`);
                return [];
              });

            let p1 = null, p2 = null, p3 = null, extra = null, final = null;

            if (calificaciones && calificaciones.length > 0) {
              calificaciones.forEach(calif => {
                if (calif.tipoEvaluacion === 'Ext') {
                  extra = calif.valor;
                  if (final == null || final < calif.valor) {
                    final = calif.valor;
                  }
                } else if (calif.tipoEvaluacion === 'Ord') {
                  if (final == null) {
                    final = calif.valor;
                    extra = "NP";
                  } else if (final < calif.valor){
                    final = calif.valor;
                  }
                } else if (calif.tipoEvaluacion === 'P1') {
                  p1 = calif.valor;
                } else if (calif.tipoEvaluacion === 'P2') {
                  p2 = calif.valor;
                } else if (calif.tipoEvaluacion === 'P3') {
                  p3 = calif.valor;
                }
              });
            }

            return {
              grupo: grupo?.nombre || "N/A",
              materia: materia?.nombre || "N/A",
              p1, p2, p3, extra, final
            };

          } catch (error) {
            console.error(`Error procesando clase ${index + 1}:`, error);
            return null;
          }
        });

        const materiasResueltas = await Promise.all(materiasPromises);
        const materiasFiltradas = materiasResueltas.filter(m => m !== null);
        
        if (materiasFiltradas.length === 0) {
          throw new Error("No se pudieron procesar las calificaciones");
        }
        
        setDatosMaterias(materiasFiltradas);

      } catch (error) {
        console.error("API no disponible, usando datos por defecto:", error.message);
        const datosPorDefecto = [
          { grupo: '6BM1', materia: 'METODOLOGÍA DE LA INVESTIGACIÓN Y DIVULGACIÓN CIENTÍFICA', p1: null, p2: null, p3: null, extra: null, final: 9 },
          { grupo: '6BM2', materia: 'CÓMPUTO PARALELO', p1: null, p2: null, p3: null, extra: null, final: 10 },
          { grupo: '6BM1', materia: 'MINERÍA DE DATOS', p1: null, p2: null, p3: null, extra: 8, final: null },
          { grupo: '6BM1', materia: 'INGENIERÍA DE SOFTWARE PARA SISTEMAS INTELIGENTES', p1: null, p2: null, p3: null, extra: null, final: 7 },
          { grupo: '6BM1', materia: 'REDES NEURONALES Y APRENDIZAJE PROFUNDO', p1: null, p2: null, p3: null, extra: null, final: 10 },
        ];
        setDatosMaterias(datosPorDefecto);
      }
    }

    fetchCalificaciones();
  }, [datosGen, idAlumno, idPeriodoActual]);

  // ✅ Análisis inteligente de recomendaciones
  const analisisRecomendaciones = useMemo(() => {
    if (!datosMaterias) return null;

    // Clasificar materias según su estado
    const sinCalificaciones = [];
    const enCurso = [];
    const enRiesgo = [];
    const paraExtra = [];
    const finalizadas = [];

    for (const materia of datosMaterias) {
      const { p1, p2, p3, final, extra } = materia;
      
      // 1. Sin ninguna calificación
      if (p1 === null && p2 === null && p3 === null && final === null) {
        sinCalificaciones.push(materia);
        continue;
      }

      // 2. Tiene calificación final (Ord o Ext)
      if (final !== null) {
        finalizadas.push({ ...materia, calificacionFinal: final });
        continue;
      }

      // 3. Reprobó ordinario y NO ha presentado extra
      if (p3 !== null && p3 < 6 && (extra === null || extra === "NP")) {
        paraExtra.push(materia);
        continue;
      }

      // 4. Tiene parciales pero aún no termina
      if (p1 !== null || p2 !== null || p3 !== null) {
        const promedio = calcularPromedioParciales(materia);
        
        if (promedio !== null && promedio < 8) {
          enRiesgo.push({ ...materia, promedio });
        } else {
          enCurso.push({ ...materia, promedio });
        }
      }
    }

    return {
      sinCalificaciones,
      enCurso,
      enRiesgo,
      paraExtra,
      finalizadas
    };
  }, [datosMaterias]);

  if (!datosGen || !datosMaterias || !idAlumno) {
    return <Espera />;
  }

  if (error) {
    return (
      <div className="bienvenida-container">
        <Menu />
        <div style={{ padding: '20px', color: 'red' }}>
          <h2>Error al cargar calificaciones</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const columnasCalificaciones = [
    { key: 'grupo', label: 'Grupo', width: '80px' },
    { key: 'materia', label: 'Materia', width: '300px' },
    { key: 'p1', label: '1er Parcial' },
    { key: 'p2', label: '2do Parcial' },
    { key: 'p3', label: '3er Parcial' },
    { key: 'extra', label: 'Extraordinario' },
    { key: 'final', label: 'Final' }
  ];

  const renderCelda = (item, key) => item[key] ?? '-';

  // ✅ Renderizar recomendaciones inteligentes
  const renderRecomendaciones = () => {
    if (!analisisRecomendaciones) return null;

    const { sinCalificaciones, enCurso, enRiesgo, paraExtra, finalizadas } = analisisRecomendaciones;

    // CASO 1: No hay ninguna calificación registrada
    if (sinCalificaciones.length === datosMaterias.length) {
      return (
        <p>Aún no tienes calificaciones registradas. Mantente al pendiente de tus evaluaciones.</p>
      );
    }

    // CASO 2: Todas las materias están finalizadas
    if (finalizadas.length === datosMaterias.length) {
      const promedioGeneral = finalizadas.reduce((sum, m) => sum + m.calificacionFinal, 0) / finalizadas.length;
      
      if (promedioGeneral >= 9) {
        return (
          <p>¡Excelente trabajo! Has completado todas tus materias con un promedio de {promedioGeneral.toFixed(1)}. ¡Sigue así!</p>
        );
      } else if (promedioGeneral >= 8) {
        return (
          <p>¡Buen trabajo! Has completado todas tus materias con un promedio de {promedioGeneral.toFixed(1)}.</p>
        );
      } else {
        return (
          <p>Has completado todas tus materias. Tu promedio es de {promedioGeneral.toFixed(1)}. Para el próximo semestre, considera poner más empeño.</p>
        );
      }
    }

    // CASO 3: Recomendaciones combinadas
    return (
      <>
        {/* Materias que necesitan presentar Extra */}
        {paraExtra.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <p><strong>⚠️ Materias que requieren examen extraordinario:</strong></p>
            <ul className="calif-recom-lista">
              {paraExtra.map(m => (
                <li key={m.materia}>
                  <strong>{m.materia}</strong> - No olvides presentar tu extraordinario
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Materias en riesgo */}
        {enRiesgo.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <p><strong>📊 Materias con calificaciones bajas:</strong></p>
            <ul className="calif-recom-lista">
              {enRiesgo.map(m => (
                <li key={m.materia}>
                  <strong>{m.materia}</strong> (Promedio actual: {m.promedio.toFixed(1)})
                </li>
              ))}
            </ul>
            <p style={{ marginTop: '10px' }}>
              Te recomendamos que en el siguiente parcial lo des todo. ¡Venga, sí se puede!
            </p>
          </div>
        )}

        {/* Materias en curso con buen desempeño */}
        {enCurso.length > 0 && enRiesgo.length === 0 && paraExtra.length === 0 && (
          <div style={{ marginBottom: '15px' }}>
            <p>✅ Vas por buen camino. Continúa con ese desempeño y da siempre lo mejor de ti.</p>
          </div>
        )}

        {/* Si solo tiene materias sin calificaciones y en curso */}
        {enRiesgo.length === 0 && paraExtra.length === 0 && finalizadas.length === 0 && (
          <p>Sigue esforzándote en tus estudios. ¡Tú puedes!</p>
        )}
      </>
    );
  };

  return (
    <div className="bienvenida-container">
      <Menu />

      <main className="page">
        <div className="ra-container">

          <div className="sidebar-fija">
            <CuadroDatos
              datos={datosGen}
              boton={{
                texto: "Rendimiento Académico",
                onClick: () => navigate("/alumno/rendimiento")
              }}
            />
          </div>

          <section className="calif-main">
            <h2 className="page-subtitle">Calificaciones</h2>
            <p className="muted" style={{ marginTop: -6, marginBottom: 12 }}>
              En esta sección puedes consultar tus calificaciones, puedes ver tu rendimiento del semestre, 
              puedes usar nuestro TecnoBurro para consultar tu situación académica.
            </p>

            <Table
              columns={columnasCalificaciones}
              data={datosMaterias}
              getRowClass={getRowClass}
              renderCell={renderCelda}
              emptyMessage="No hay calificaciones disponibles"
              striped={true}
              hover={true}
              className="calif-table-responsive"
            />

            <h3 className="calif-recom-title">Recomendaciones</h3>
            <div className="calif-recomendaciones">
              <div>
                {renderRecomendaciones()}
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
