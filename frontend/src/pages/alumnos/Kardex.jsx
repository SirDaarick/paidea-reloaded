import React, { useState, useEffect } from "react";
import "styles/index.css";
import Menu from "components/Menu";
import CuadroDatos from "components/CuadroDatos";
import Table from "components/Table";
import "styles/kardex.css";
import Espera from "./Espera";
import { useDatosGen } from "consultas/datos_alumno_gen.jsx";
import { useIdAlumno } from "consultas/idAlumno.jsx";
import apiCall from "consultas/APICall.jsx";
import { useIdPeriodoActual } from "consultas/idPeriodo_Actual.jsx";

// *** CONFIGURACIÓN: Cambiar a 'reciente' o 'alta' según preferencia ***
const CRITERIO_RECURSADAS = 'reciente'; // 'reciente' o 'alta'

export default function Kardex() {
  const datosGen = useDatosGen();
  const idAlumno = useIdAlumno();
  const idPeriodoActual = useIdPeriodoActual();
  
  const [datosPorSemestre, setDatosPorSemestre] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchKardex() {
      if (!datosGen || !idAlumno || !idPeriodoActual) return;

      try {
        console.log("=== INICIANDO FETCH KARDEX ===");
        console.time("Carga kardex");

        // *** OPTIMIZACIÓN: Cargar todos los datos en paralelo ***
        const [inscripciones, periodos] = await Promise.all([
          apiCall(`/inscripcion/alumno/${idAlumno}`, 'GET').catch(() => []),
          apiCall('/periodoAcademico', 'GET').catch(() => [])
        ]);

        if (!inscripciones || inscripciones.length === 0) {
          throw new Error("No se encontraron inscripciones");
        }

        console.log("Inscripciones encontradas:", inscripciones.length);

        // Crear mapa de periodos para ordenamiento
        const periodosMap = {};
        if (periodos) {
          periodos.forEach(p => {
            periodosMap[p._id.toString()] = {
              nombre: p.nombre,
              fechaInicio: new Date(p.fechaInicio || '2000-01-01')
            };
          });
        }

        // *** Filtrar inscripciones que NO son del periodo actual ***
        const inscripcionesPasadas = inscripciones.filter(insc => {
          const idPeriodoInscripcion = insc.idPeriodo?._id?.toString() || String(insc.idPeriodo);
          const esActual = idPeriodoInscripcion === idPeriodoActual?.toString();
          if (esActual) {
            console.log(">>> SALTANDO periodo actual:", insc.idPeriodo?.nombre);
          }
          return !esActual;
        });

        console.log("Inscripciones pasadas a procesar:", inscripcionesPasadas.length);

        // *** Obtener todas las inscripciones clase en paralelo ***
        console.time("Carga inscripciones clase");
        const inscripcionesClasePromises = inscripcionesPasadas.map(insc =>
          apiCall(`/inscripcionClase/inscripcion/${insc._id}`, 'GET')
            .catch(() => [])
            .then(inscClases => ({ 
              inscripcion: insc, 
              inscripcionesClase: inscClases 
            }))
        );
        const inscripcionesClaseData = await Promise.all(inscripcionesClasePromises);
        console.timeEnd("Carga inscripciones clase");

        // Aplanar todas las inscripciones clase
        const todasInscripcionesClase = [];
        for (const { inscripcion, inscripcionesClase } of inscripcionesClaseData) {
          for (const inscClase of inscripcionesClase) {
            todasInscripcionesClase.push({
              ...inscClase,
              periodoInfo: inscripcion.idPeriodo
            });
          }
        }

        console.log("Total inscripciones clase:", todasInscripcionesClase.length);

        // *** Obtener todas las calificaciones en paralelo ***
        console.time("Carga calificaciones");
        const calificacionesPromises = todasInscripcionesClase.map(inscClase =>
          apiCall(`/calificacion/inscripcionClase/${inscClase._id}`, 'GET')
            .catch(() => [])
            .then(califs => ({ inscClaseId: inscClase._id, calificaciones: califs }))
        );
        const calificacionesData = await Promise.all(calificacionesPromises);
        
        // Crear mapa de calificaciones
        const calificacionesMap = {};
        calificacionesData.forEach(({ inscClaseId, calificaciones }) => {
          calificacionesMap[inscClaseId] = calificaciones;
        });
        console.timeEnd("Carga calificaciones");

        // *** Agrupar por materia para detectar recursadas ***
        const materiasPorId = {};

        for (const inscClase of todasInscripcionesClase) {
  try {
    const clase = inscClase.idClase;
    if (!clase || !clase._id) continue;

    const esObjetoMateria = typeof clase.idMateria === 'object' && clase.idMateria !== null;
    const materia = esObjetoMateria ? clase.idMateria : null;
    
    if (!materia) continue;

    const idMateria = materia._id.toString();
    const semestre = materia.semestre || 1;
    const nombrePeriodo = inscClase.periodoInfo?.nombre || "N/A";
    const idPeriodo = inscClase.periodoInfo?._id?.toString() || inscClase.periodoInfo?.toString();
    const fechaPeriodo = periodosMap[idPeriodo]?.fechaInicio || new Date('2000-01-01');

    // ✅ BUSCAR CALIFICACIÓN FINAL (priorizar Ext)
    const calificaciones = calificacionesMap[inscClase._id] || [];
    
    // Primero buscar Ext
    let califFinal = calificaciones.find(c => c.tipoEvaluacion === 'Ext');
    
    // Si no hay Ext, buscar Ord
    if (!califFinal) {
      califFinal = calificaciones.find(c => c.tipoEvaluacion === 'Ord');
    }

    if (!califFinal) continue;

    const materiaData = {
      materia: materia.nombre || "N/A",
      creditos: materia.creditos || 0,
      periodo: nombrePeriodo,
      fechaPeriodo: fechaPeriodo,
      evaluacion: califFinal.tipoEvaluacion === 'Ext' ? 'Extraordinaria' : 'Ordinaria',
      calificacion: califFinal.valor,
      semestre: semestre
    };

    // Agrupar por ID de materia
    if (!materiasPorId[idMateria]) {
      materiasPorId[idMateria] = [];
    }
    materiasPorId[idMateria].push(materiaData);

  } catch (error) {
    console.error("Error procesando inscripción clase:", error);
  }
}

        // *** Aplicar criterio para materias recursadas ***
        console.time("Procesamiento recursadas");
        const datosPorSemestreTemp = {};

        for (const idMateria in materiasPorId) {
          const registros = materiasPorId[idMateria];

          if (registros.length === 0) continue;

          let materiaSeleccionada;

          if (registros.length === 1) {
            // Solo un registro, usar ese
            materiaSeleccionada = registros[0];
          } else {
            // Múltiples registros (recursada)
            console.log(`\n📚 Materia recursada: ${registros[0].materia}`);
            console.log(`   Intentos: ${registros.length}`);
            
            if (CRITERIO_RECURSADAS === 'alta') {
              // *** OPCIÓN 1: Tomar la calificación más alta ***
              materiaSeleccionada = registros.reduce((max, curr) => 
                curr.calificacion > max.calificacion ? curr : max
              );
              console.log(`   ✓ Usando calificación más ALTA: ${materiaSeleccionada.calificacion} (${materiaSeleccionada.periodo})`);
            } else {
              // *** OPCIÓN 2: Tomar la más reciente (DEFAULT) ***
              materiaSeleccionada = registros.reduce((reciente, curr) => 
                curr.fechaPeriodo > reciente.fechaPeriodo ? curr : reciente
              );
              console.log(`   ✓ Usando calificación más RECIENTE: ${materiaSeleccionada.calificacion} (${materiaSeleccionada.periodo})`);
            }

            // Mostrar otros intentos
            registros.forEach(r => {
              if (r !== materiaSeleccionada) {
                console.log(`   - Intento anterior: ${r.calificacion} (${r.periodo})`);
              }
            });
          }

          // Agregar al semestre correspondiente
          const semestre = materiaSeleccionada.semestre;
          if (!datosPorSemestreTemp[semestre]) {
            datosPorSemestreTemp[semestre] = [];
          }

          // Remover fechaPeriodo antes de agregar (no es necesaria en la vista)
          const { fechaPeriodo, ...materiaParaVista } = materiaSeleccionada;
          datosPorSemestreTemp[semestre].push(materiaParaVista);
        }
        console.timeEnd("Procesamiento recursadas");

        console.log("\n=== KARDEX CARGADO ===");
        console.log("Criterio usado:", CRITERIO_RECURSADAS === 'alta' ? 'CALIFICACIÓN MÁS ALTA' : 'MÁS RECIENTE');
        console.log("Semestres con materias:", Object.keys(datosPorSemestreTemp));
        console.log("Total materias:", Object.values(datosPorSemestreTemp).flat().length);
        
        setDatosPorSemestre(datosPorSemestreTemp);
        console.timeEnd("Carga kardex");
        setLoading(false);

      } catch (error) {
        console.error("Error cargando kardex:", error.message);
        
        // Datos por defecto
        const datosPorDefecto = {
          1: [
            { materia: "Fundamentos de programación", creditos: "7.5", periodo: "23/2", evaluacion: "Ordinaria", calificacion: "10", semestre: 1 },
            { materia: "Matemáticas Discretas", creditos: "10.5", periodo: "23/3", evaluacion: "Extraordinaria", calificacion: "10", semestre: 1 },
            { materia: "Comunicación oral y escrita", creditos: "7.5", periodo: "23/4", evaluacion: "Ordinaria", calificacion: "10", semestre: 1 },
            { materia: "Cálculo", creditos: "7.5", periodo: "23/5", evaluacion: "Ordinaria", calificacion: "9", semestre: 1 },
            { materia: "Mecánica y electromagnetismo", creditos: "10.5", periodo: "23/6", evaluacion: "Ordinaria", calificacion: "9", semestre: 1 },
            { materia: "Fundamentos económicos", creditos: "7.5", periodo: "23/7", evaluacion: "Extraordinaria", calificacion: "10", semestre: 1 },
          ],
          2: [
            { materia: "Algoritmos y estructura de datos", creditos: "7.5", periodo: "23/2", evaluacion: "Ordinaria", calificacion: "9", semestre: 2 },
            { materia: "Álgebra lineal", creditos: "10.5", periodo: "23/3", evaluacion: "Extraordinaria", calificacion: "8", semestre: 2 },
            { materia: "Fundamentos de diseño digital", creditos: "7.5", periodo: "23/4", evaluacion: "Ordinaria", calificacion: "7", semestre: 2 },
            { materia: "Cálculo multivariable", creditos: "7.5", periodo: "23/5", evaluacion: "Ordinaria", calificacion: "9", semestre: 2 },
            { materia: "Ingeniería ética y sociedad", creditos: "10.5", periodo: "23/6", evaluacion: "Ordinaria", calificacion: "9", semestre: 2 },
            { materia: "Finanzas empresariales", creditos: "7.5", periodo: "23/7", evaluacion: "Extraordinaria", calificacion: "10", semestre: 2 },
          ]
        };
        
        setDatosPorSemestre(datosPorDefecto);
        setLoading(false);
      }
    }

    fetchKardex();
  }, [datosGen, idAlumno, idPeriodoActual]);

  const columnas = [
    { key: "materia", label: "Materia", width: "30%" },
    { key: "creditos", label: "Créditos por materia", width: "15%" },
    { key: "periodo", label: "Periodo", width: "15%" },
    { key: "evaluacion", label: "Evaluación", width: "20%" },
    { key: "calificacion", label: "Calificación", width: "10%" },
  ];

  if (!datosGen || !idAlumno || !idPeriodoActual || loading) {
    return <Espera />;
  }

  if (error) {
    return (
      <div className="bienvenida-container">
        <Menu />
        <div style={{ padding: '20px', color: 'red' }}>
          <h2>Error al cargar kardex</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Ordenar semestres numéricamente
  const semestresOrdenados = Object.keys(datosPorSemestre).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="bienvenida-container">
      <Menu />
      <main className="kardex-main">
        <CuadroDatos
          datos={datosGen}
          boton={{
            texto: "Rendimiento Académico",
            onClick: () => alert("Ir al rendimiento académico"),
          }}
        />
        
        <section className="kardex-content">
          <h2 className="kardex-title">Kárdex</h2>
          <p className="kardex-subtitle">
            Podrás visualizar las calificaciones de los semestres que has cursado y podrás realizar un análisis de tu rendimiento académico.
            {CRITERIO_RECURSADAS === 'alta' && (
              <span style={{ display: 'block', fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                * Para materias recursadas se muestra la calificación más alta.
              </span>
            )}
            {CRITERIO_RECURSADAS === 'reciente' && (
              <span style={{ display: 'block', fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                * Para materias recursadas se muestra la calificación más reciente.
              </span>
            )}
          </p>
          
          {semestresOrdenados.length === 0 ? (
            <p>No hay materias registradas en el kardex.</p>
          ) : (
            semestresOrdenados.map(semestre => (
              <div key={semestre}>
                <h3 className="kardex-semester-title">
                  {semestre === '1' ? 'Primer' : 
                   semestre === '2' ? 'Segundo' : 
                   semestre === '3' ? 'Tercer' : 
                   semestre === '4' ? 'Cuarto' : 
                   semestre === '5' ? 'Quinto' : 
                   semestre === '6' ? 'Sexto' : 
                   semestre === '7' ? 'Séptimo' : 
                   semestre === '8' ? 'Octavo' : 
                   `Semestre ${semestre}`} semestre
                </h3>
                <Table 
                  columns={columnas} 
                  data={datosPorSemestre[semestre]}
                  emptyMessage="No hay materias en este semestre"
                />
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}