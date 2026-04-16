import React, { useState, useMemo, useEffect, useCallback } from "react"; 
import "styles/index.css";
import styles from "styles/Reinscripciones.module.css";
import Espera from "./Espera";
import Menu from "components/Menu.jsx";
import Button from "components/Button";
import Table from "components/Table";
import SelectField from "components/SelectField.jsx";
import Mensaje from "components/Mensaje.jsx";
import apiCall from "consultas/APICall.jsx";
import { useIdAlumno } from "consultas/idAlumno.jsx";
import { useIdPeriodoActual } from "consultas/idPeriodo_Actual.jsx";
import { useDatosGen } from "consultas/datos_alumno_gen.jsx";

const MAX_CREDITOS = 50;
const MAX_OPTATIVAS_SEXTO = 2;
const MAX_OPTATIVAS_SEPTIMO = 2;

// Función auxiliar para obtener ID limpio
const obtenerId = (campo) => {
  if (!campo) return null;
  if (typeof campo === 'object' && campo._id) return campo._id.toString();
  return campo.toString();
};

export default function Reinscripciones() {
  const [materiasDisponibles, setMateriasDisponibles] = useState([]);
  const [materiasInscritas, setMateriasInscritas] = useState([]);
  const [creditosRestantes, setCreditosRestantes] = useState(MAX_CREDITOS);
  
  // Filtros
  const [filtroSemestre, setFiltroSemestre] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("");
  const [filtroMateria, setFiltroMateria] = useState("");
  
  const [mensaje, setMensaje] = useState({ visible: false, titulo: "", texto: "" });
  const [cargando, setCargando] = useState(true);
  const [idInscripcion, setIdInscripcion] = useState(null);
  const [semestresDisponibles, setSemestresDisponibles] = useState([]);
  
  // ✅ Estado para rastrear optativas cursadas y en inscripción actual
  const [optativasCursadasSexto, setOptativasCursadasSexto] = useState(0);
  const [optativasCursadasSeptimo, setOptativasCursadasSeptimo] = useState(0);
  const [errorValidacion, setErrorValidacion] = useState(null);
  
  const idAlumno = useIdAlumno();
  const idPeriodoActual = useIdPeriodoActual();
  const datosGen = useDatosGen();

  // ----------------------------- 1. CARGA DE DATOS -----------------------------
  useEffect(() => {
    let montado = true;

    const fetchDatos = async () => {
      try {
        if (!idAlumno || !idPeriodoActual || !datosGen) {
          return;
        }

        setCargando(true);
        console.log("Iniciando carga de datos...");
        console.time("Carga total");

        console.time("Carga paralela inicial");
        const [
          todasInscripciones,
          usuarioData,
          materiasRes,
          clasesRes,
          diasSemanaRes,
          gruposRes
        ] = await Promise.all([
          apiCall(`/inscripcion/alumno/${idAlumno}`, 'GET').catch(() => []),
          apiCall(`/usuario/${idAlumno}`, 'GET'),
          apiCall("/materia", "GET"),
          apiCall("/clase", "GET"),
          apiCall("/diaSemana", "GET"),
          apiCall("/grupo", "GET")
        ]);
        console.timeEnd("Carga paralela inicial");

        if (!montado) return;

        // Obtener o crear inscripción para el periodo actual
        let inscripcionActual = todasInscripciones.find(insc => {
          const idPeriodo = obtenerId(insc.idPeriodo);
          return idPeriodo === idPeriodoActual?.toString();
        });

if (!inscripcionActual) {
  console.log("Creando nueva inscripción para el periodo actual...");
  
  try {
    inscripcionActual = await apiCall('/inscripcion/validacion', 'POST', {
      idAlumno: idAlumno,
      idPeriodo: idPeriodoActual,
      creditos: 0
    });
  } catch (error) {
    console.error("Error en validación:", error);
    
    // Extraer código de error
    let errorCode = 'ERROR_DESCONOCIDO';
    
    if (error.response?.data?.error) {
      errorCode = error.response.data.error;
    }
    
    // Guardar error en el estado
    if (montado) {
      setErrorValidacion(errorCode);
      setCargando(false);
    }
    return; // ✅ Este return SÍ funciona (sale del useEffect)
  }
} else {
  // SÍ EXISTE -> Verificar si ya tiene materias inscritas
  console.log("Inscripción encontrada, verificando materias inscritas...");
  
  const idInsc = obtenerId(inscripcionActual);
  
  const inscripcionesClaseEstePeriodo = await apiCall(
    `/inscripcionClase/inscripcion/${idInsc}`, 
    'GET'
  ).catch(() => []);
  
  const tieneMateriasInscritas = inscripcionesClaseEstePeriodo.some(
    inscClase => inscClase.estatus === 'Inscrito'
  );
  
  if (tieneMateriasInscritas) {
    console.log("⚠️ El alumno ya completó su reinscripción");
    if (montado) {
      setErrorValidacion('YA_INSCRITO');
      setCargando(false);
    }
    return; // ✅ Este return SÍ funciona (sale del useEffect)
  }
  
  console.log("✓ Inscripción existe pero sin materias, puede continuar");
}

        const idInsc = obtenerId(inscripcionActual);
        setIdInscripcion(idInsc);

        console.time("Carga inscripciones clases");
        const inscripcionesClasePromises = todasInscripciones.map(inscripcion => 
          apiCall(`/inscripcionClase/inscripcion/${obtenerId(inscripcion)}`, 'GET').catch(() => [])
        );
        const inscripcionesClaseArrays = await Promise.all(inscripcionesClasePromises);
        const todasInscripcionesClase = inscripcionesClaseArrays.flat();
        console.timeEnd("Carga inscripciones clases");

        // Crear mapas de búsqueda rápida
        const materiasMap = {};
        if (materiasRes) {
          materiasRes.forEach(m => {
            if (m._id) materiasMap[m._id.toString()] = m;
          });
        }

        const clasesMap = {};
        if (clasesRes) {
          clasesRes.forEach(c => {
            if (c._id) clasesMap[c._id.toString()] = c;
          });
        }

        const diasSemanaMap = {};
        if (diasSemanaRes) {
          diasSemanaRes.forEach(d => {
            if (d._id) diasSemanaMap[d._id.toString()] = d;
          });
        }

        const gruposMap = {};
        if (gruposRes) {
          gruposRes.forEach(g => {
            if (g._id) gruposMap[g._id.toString()] = g;
          });
        }

        const idCarreraAlumno = obtenerId(usuarioData.dataAlumno?.idCarrera);

        console.time("Procesamiento inscripciones");
        const materiasYaCursadas = new Set();
        const materiasYaInscritasEstePeriodo = [];
        const materiasConIntentos = {};
        const semestresAprobadosPorMateria = {};
        
        // ✅ Contar optativas ya cursadas (Aprobadas o Inscritas)
        let optativasSextoYaCursadas = 0;
        let optativasSeptimoYaCursadas = 0;

        for (const inscClase of todasInscripcionesClase) {
          const idClase = obtenerId(inscClase.idClase);
          
          const clase = typeof inscClase.idClase === 'object' ? inscClase.idClase : clasesMap[idClase];
          if (!clase) continue;

          const idMateria = obtenerId(clase.idMateria);
          
          // Contar intentos
          if (!materiasConIntentos[idMateria]) {
            materiasConIntentos[idMateria] = 0;
          }
          materiasConIntentos[idMateria]++;

          // Materias cursadas
          if (inscClase.estatus === 'Aprobado' || inscClase.estatus === 'Inscrito') {
            materiasYaCursadas.add(idMateria);
            
            // ✅ Contar optativas cursadas
            let materiaObj = typeof clase.idMateria === 'object' ? clase.idMateria : materiasMap[idMateria];
            
            if (materiaObj && materiaObj.optativa) {
              const semestre = materiaObj.semestre;
              if (semestre === 6) {
                optativasSextoYaCursadas++;
              } else if (semestre === 7) {
                optativasSeptimoYaCursadas++;
              }
            }
          }

          // Semestres aprobados
          if (inscClase.estatus === 'Aprobado') {
            let materiaObj = typeof clase.idMateria === 'object' ? clase.idMateria : materiasMap[idMateria];
            
            if (materiaObj && materiaObj.semestre) {
              if (!semestresAprobadosPorMateria[materiaObj.semestre]) {
                semestresAprobadosPorMateria[materiaObj.semestre] = new Set();
              }
              semestresAprobadosPorMateria[materiaObj.semestre].add(idMateria);
            }
          }

          // Materias inscritas este periodo
          if (inscClase.estatus === 'Inscrito' && obtenerId(inscClase.idInscripcion) === idInsc) {
            materiasYaInscritasEstePeriodo.push({
              idInscripcionClase: obtenerId(inscClase),
              idClase: idClase
            });
          }
        }
        console.timeEnd("Procesamiento inscripciones");

        console.log("Optativas de 6° ya cursadas:", optativasSextoYaCursadas);
        console.log("Optativas de 7° ya cursadas:", optativasSeptimoYaCursadas);
        
        setOptativasCursadasSexto(optativasSextoYaCursadas);
        setOptativasCursadasSeptimo(optativasSeptimoYaCursadas);

        console.log("Materias ya cursadas:", materiasYaCursadas.size);
        console.log("Materias inscritas este periodo:", materiasYaInscritasEstePeriodo.length);
        console.log("Materias con intentos:", Object.keys(materiasConIntentos).length);

        // Calcular último semestre completado
        const materiasCarrera = materiasRes.filter(m => 
          obtenerId(m.idCarrera) === idCarreraAlumno
        );

        const materiasPorSemestre = {};
        for (const materia of materiasCarrera) {
          const sem = materia.semestre;
          if (!materiasPorSemestre[sem]) {
            materiasPorSemestre[sem] = [];
          }
          materiasPorSemestre[sem].push(obtenerId(materia));
        }

        let ultimoSemestreCompletado = 0;
        const semestresOrdenados = Object.keys(materiasPorSemestre).map(Number).sort((a, b) => a - b);
        
        for (const sem of semestresOrdenados) {
          const materiasDelSemestre = materiasPorSemestre[sem];
          const materiasAprobadas = semestresAprobadosPorMateria[sem] || new Set();
          const todasAprobadas = materiasDelSemestre.every(idMat => materiasAprobadas.has(idMat));
          
          if (todasAprobadas) {
            ultimoSemestreCompletado = sem;
          } else {
            break;
          }
        }

        console.log("Último semestre completado:", ultimoSemestreCompletado);
        const maxSemestrePermitido = ultimoSemestreCompletado + 3;

        // Identificar semestres disponibles
        const semestresConMateriasPendientes = new Set();
        for (const materia of materiasCarrera) {
          const idMat = obtenerId(materia);
          const semestreMateria = materia.semestre;
          
          if (!materiasYaCursadas.has(idMat) && 
              (materiasConIntentos[idMat] || 0) < 2 &&
              semestreMateria <= maxSemestrePermitido) {
            semestresConMateriasPendientes.add(semestreMateria);
          }
        }

        const semestresArray = Array.from(semestresConMateriasPendientes).sort((a, b) => a - b);
        setSemestresDisponibles(semestresArray);

        console.time("Carga ocupabilidad");
        const clasesRelevantes = clasesRes.filter(clase => {
          const idGrupo = obtenerId(clase.idGrupo);
          const grupoObj = typeof clase.idGrupo === 'object' ? clase.idGrupo : gruposMap[idGrupo];
          
          if (!grupoObj) return false;
          
          const idCarreraGrupo = obtenerId(grupoObj.idCarrera);
          const idPeriodoGrupo = obtenerId(grupoObj.idPeriodo);
          
          return idCarreraGrupo === idCarreraAlumno?.toString() && 
                 idPeriodoGrupo === idPeriodoActual?.toString();
        });

        const ocupabilidadPromises = clasesRelevantes.map(clase => 
          apiCall(`/inscripcionClase/clase/${obtenerId(clase)}/conteo`, 'GET')
            .catch(() => ({ inscritos: 0 }))
        );
        const ocupabilidadResults = await Promise.all(ocupabilidadPromises);
        
        const ocupabilidadMap = {};
        clasesRelevantes.forEach((clase, index) => {
          ocupabilidadMap[obtenerId(clase)] = ocupabilidadResults[index];
        });
        console.timeEnd("Carga ocupabilidad");

        console.time("Procesamiento clases");
        const clasesDisponibles = [];
        const clasesInscritas = [];

        for (const clase of clasesRelevantes) {
          try {
            const idClase = obtenerId(clase);
            const idGrupo = obtenerId(clase.idGrupo);
            const idMat = obtenerId(clase.idMateria);

            const grupoObj = typeof clase.idGrupo === 'object' ? clase.idGrupo : gruposMap[idGrupo];
            if (!grupoObj) continue;

            let materiaObj = materiasMap[idMat];
            if (!materiaObj && typeof clase.idMateria === 'object') {
              materiaObj = clase.idMateria;
            }
            if (!materiaObj) continue;

            // Validaciones
            if (materiasYaCursadas.has(idMat)) continue;
            if ((materiasConIntentos[idMat] || 0) >= 2) continue;
            
            const semestreMateria = materiaObj.semestre || 0;
            if (semestreMateria > maxSemestrePermitido) continue;

            const nombreMateria = materiaObj.nombre || "Desconocida";
            const creditosMateria = materiaObj.creditos || 0;
            const nombreGrupo = grupoObj.nombre || "Sin Grupo";
            const esOptativa = materiaObj.optativa || false;

            // Procesar horarios
            const horarioProcesado = { 
              lunes: "-", 
              martes: "-", 
              miercoles: "-", 
              jueves: "-", 
              viernes: "-" 
            };

            const idsDia = {};

            if (clase.horario) {
              const diasKeys = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
              
              diasKeys.forEach(diaKey => {
                let diaInfo = clase.horario[diaKey] || 
                  clase.horario[diaKey.charAt(0).toUpperCase() + diaKey.slice(1)];
                
                if (diaKey === 'miercoles' && !diaInfo) {
                  diaInfo = clase.horario['Miércoles'] || clase.horario['Miercoles'];
                }

                if (diaInfo && diaInfo.idDia) {
                  let inicio, fin, idDia;
                  
                  if (typeof diaInfo.idDia === 'object' && diaInfo.idDia !== null) {
                    inicio = diaInfo.idDia.horarioInicio;
                    fin = diaInfo.idDia.horarioFinal;
                    idDia = diaInfo.idDia._id || diaInfo.idDia.id;
                  } else {
                    const diaIdStr = diaInfo.idDia.toString();
                    const diaObj = diasSemanaMap[diaIdStr];
                    if (diaObj) {
                      inicio = diaObj.horarioInicio;
                      fin = diaObj.horarioFinal;
                      idDia = diaIdStr;
                    }
                  }

                  if (inicio && fin && idDia) {
                    horarioProcesado[diaKey] = `${inicio} - ${fin}`;
                    idsDia[`${diaKey}_idDia`] = idDia.toString();
                  }
                }
              });
            }

            const conteoInscripciones = ocupabilidadMap[idClase] || { inscritos: 0 };
            const inscritos = conteoInscripciones.inscritos || 0;
            const cupoMaximo = clase.cupoMaximo || 30;
            const ocupabilidad = `${inscritos}/${cupoMaximo}`;

            const claseData = {
              idClase: idClase,
              grupo: nombreGrupo,
              semestre: semestreMateria,
              salon: clase.salon || "-",
              materia: nombreMateria,
              creditos: creditosMateria,
              esOptativa: esOptativa, // ✅ Agregar flag de optativa
              ...horarioProcesado,
              ...idsDia,
              ocupabilidad,
              inscritos,
              cupoMaximo
            };

            const yaInscrita = materiasYaInscritasEstePeriodo.find(m => m.idClase === idClase);
            
            if (yaInscrita) {
              clasesInscritas.push({
                ...claseData,
                idInscripcionClase: yaInscrita.idInscripcionClase
              });
            } else {
              clasesDisponibles.push(claseData);
            }

          } catch (error) {
            console.error("Error procesando clase:", error);
          }
        }
        console.timeEnd("Procesamiento clases");

        const creditosUsados = clasesInscritas.reduce((sum, clase) => sum + (clase.creditos || 0), 0);
        const creditosRestantes = MAX_CREDITOS - creditosUsados;

        console.log("Clases disponibles:", clasesDisponibles.length);
        console.log("Clases inscritas:", clasesInscritas.length);

        setMateriasDisponibles(clasesDisponibles);
        setMateriasInscritas(clasesInscritas);
        setCreditosRestantes(creditosRestantes);

        console.timeEnd("Carga total");

      } catch (error) {
        console.error("Error cargando datos:", error);
        if (montado) {
          setMensaje({ 
            visible: true, 
            titulo: "Error", 
            texto: "Error al cargar datos de reinscripción." 
          });
        }
      } finally {
        if (montado) setCargando(false);
      }
    };

    fetchDatos();

    return () => { montado = false; };
  }, [idAlumno, idPeriodoActual, datosGen]);

  // *** FUNCIÓN DE VALIDACIÓN DE TRASLAPES DE HORARIO ***
  const verificarTraslapesHorario = useCallback((materiaAInscribir, materiasYaInscritas) => {
    const conflictos = [];
    const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    
    for (const dia of diasSemana) {
      const horarioNuevo = materiaAInscribir[dia];
      
      if (!horarioNuevo || horarioNuevo === "-") continue;
      
      const idDiaNuevo = materiaAInscribir[`${dia}_idDia`];
      if (!idDiaNuevo) continue;

      for (const materiaInscrita of materiasYaInscritas) {
        const horarioInscrito = materiaInscrita[dia];
        
        if (!horarioInscrito || horarioInscrito === "-") continue;
        
        const idDiaInscrito = materiaInscrita[`${dia}_idDia`];
        if (!idDiaInscrito) continue;

        if (idDiaNuevo.toString() === idDiaInscrito.toString()) {
          const diaCapitalizado = dia.charAt(0).toUpperCase() + dia.slice(1);
          conflictos.push({
            dia: diaCapitalizado,
            materiaConflicto: materiaInscrita.materia,
            horario: horarioInscrito
          });
        }
      }
    }

    return conflictos;
  }, []);

  // ✅ Calcular optativas inscritas en período actual
  const optativasInscritasActual = useMemo(() => {
    let sexto = 0;
    let septimo = 0;
    
    for (const materia of materiasInscritas) {
      if (materia.esOptativa) {
        if (materia.semestre === 6) sexto++;
        if (materia.semestre === 7) septimo++;
      }
    }
    
    return { sexto, septimo };
  }, [materiasInscritas]);

  // ----------------------------- 2. HANDLERS -----------------------------
  const handleInscribir = useCallback((materia) => {
    // VALIDACIÓN 1: Verificar créditos disponibles
    if (creditosRestantes - materia.creditos < 0) {
      setMensaje({ 
        visible: true, 
        titulo: "Créditos Insuficientes", 
        texto: `No puedes inscribir esta materia. Te faltan ${materia.creditos - creditosRestantes} créditos.` 
      });
      return;
    }

    // VALIDACIÓN 2: Verificar si ya está inscrita esta clase específica
    if (materiasInscritas.some(m => m.idClase === materia.idClase)) {
      return;
    }

    // VALIDACIÓN 3: No permitir inscribir dos clases de la misma materia
    const materiaYaInscrita = materiasInscritas.find(m => m.materia === materia.materia);
    if (materiaYaInscrita) {
      setMensaje({ 
        visible: true, 
        titulo: "Materia Duplicada", 
        texto: `Ya tienes inscrita la materia "${materia.materia}" en el grupo ${materiaYaInscrita.grupo}. No puedes inscribir la misma materia en dos grupos diferentes.` 
      });
      return;
    }

    // ✅ VALIDACIÓN 4: Verificar límite de optativas
    if (materia.esOptativa) {
      if (materia.semestre === 6) {
        const totalSexto = optativasCursadasSexto + optativasInscritasActual.sexto;
        if (totalSexto >= MAX_OPTATIVAS_SEXTO) {
          setMensaje({ 
            visible: true, 
            titulo: "Límite de Optativas", 
            texto: `Ya has cursado o inscrito el máximo de optativas permitidas para 6° semestre (${MAX_OPTATIVAS_SEXTO}). No puedes inscribir más optativas de este semestre.` 
          });
          return;
        }
      } else if (materia.semestre === 7) {
        const totalSeptimo = optativasCursadasSeptimo + optativasInscritasActual.septimo;
        if (totalSeptimo >= MAX_OPTATIVAS_SEPTIMO) {
          setMensaje({ 
            visible: true, 
            titulo: "Límite de Optativas", 
            texto: `Ya has cursado o inscrito el máximo de optativas permitidas para 7° semestre (${MAX_OPTATIVAS_SEPTIMO}). No puedes inscribir más optativas de este semestre.` 
          });
          return;
        }
      }
    }

    // VALIDACIÓN 5: Verificar traslapes de horarios
    if (materiasInscritas.length > 0) {
      const conflictos = verificarTraslapesHorario(materia, materiasInscritas);
      
      if (conflictos.length > 0) {
        const mensajeConflictos = `"${conflictos[0].materiaConflicto}"`;
        
        setMensaje({ 
          visible: true, 
          titulo: "Traslape de Horarios", 
          texto: `No puedes inscribir "${materia.materia}" debido a que se traslapa con \n\n${mensajeConflictos}` 
        });
        return;
      }
    }

    // Si pasa todas las validaciones, inscribir la materia
    setMateriasInscritas(prev => [...prev, materia]);
    setCreditosRestantes(prev => prev - materia.creditos);
    setMateriasDisponibles(prev => prev.filter(m => m.idClase !== materia.idClase));
  }, [
    creditosRestantes, 
    materiasInscritas, 
    verificarTraslapesHorario, 
    optativasCursadasSexto, 
    optativasCursadasSeptimo,
    optativasInscritasActual
  ]);

  const handleDarDeBaja = useCallback(async (materia) => {
    try {
      if (materia.idInscripcionClase) {
        await apiCall(`/inscripcionClase/${materia.idInscripcionClase}`, 'DELETE');
      }

      setMateriasInscritas(prev => prev.filter(m => m.idClase !== materia.idClase));
      setCreditosRestantes(prev => prev + materia.creditos);
      
      const materiaSinId = { ...materia };
      delete materiaSinId.idInscripcionClase;
      setMateriasDisponibles(prev => [...prev, materiaSinId]);

    } catch (error) {
      console.error("Error al dar de baja:", error);
      setMensaje({ 
        visible: true, 
        titulo: "Error", 
        texto: "No se pudo dar de baja la materia." 
      });
    }
  }, []);

  const handleFinalizarInscripcion = useCallback(async () => {
    if (creditosRestantes < 0) {
      setMensaje({ 
        visible: true, 
        titulo: "Error", 
        texto: "Has excedido el límite de créditos." 
      });
      return;
    }

    const materiasNuevas = materiasInscritas.filter(m => !m.idInscripcionClase);

    if (materiasNuevas.length === 0) {
      setMensaje({ 
        visible: true, 
        titulo: "Información", 
        texto: "No hay nuevas materias para inscribir." 
      });
      return;
    }

    if (!idInscripcion) {
      setMensaje({ 
        visible: true, 
        titulo: "Error", 
        texto: "No se encontró la inscripción activa." 
      });
      return;
    }

    try {
      console.log("Guardando inscripciones...");
      let exitosas = 0;
      let fallidas = 0;

      for (const materia of materiasNuevas) {
        try {
          await apiCall("/inscripcionClase", "POST", {
            idInscripcion: idInscripcion,
            idClase: materia.idClase,
            estatus: "Inscrito"
          });
          exitosas++;
          console.log(`✓ Inscrita: ${materia.materia}`);
        } catch (error) {
          fallidas++;
          console.error(`✗ Error: ${materia.materia}`, error);
        }
      }

      if (exitosas > 0) {
        const creditosUsados = MAX_CREDITOS - creditosRestantes;
        await apiCall(`/inscripcion/${idInscripcion}`, 'PUT', {
          creditos: creditosUsados
        });

        setMensaje({ 
          visible: true, 
          titulo: "Éxito", 
          texto: `Se inscribieron ${exitosas} materia(s) correctamente.${fallidas > 0 ? ` ${fallidas} fallaron.` : ''}` 
        });

        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMensaje({ 
          visible: true, 
          titulo: "Error", 
          texto: "No se pudo inscribir ninguna materia." 
        });
      }

    } catch (error) {
      console.error("Error al guardar inscripción:", error);
      setMensaje({ 
        visible: true, 
        titulo: "Error", 
        texto: "Error al guardar la inscripción." 
      });
    }
  }, [creditosRestantes, materiasInscritas, idInscripcion]);

  // ----------------------------- 3. CONFIGURACIÓN TABLA -----------------------------
  const columnasBase = useMemo(() => [
    { key: "grupo", label: "Grupo", width: "80px" },
    { key: "salon", label: "Salón", width: "80px" },
    { key: "materia", label: "Materia", width: "250px" },
    { key: "creditos", label: "Créditos", width: "80px" },
    { key: "lunes", label: "Lunes", width: "110px" },
    { key: "martes", label: "Martes", width: "110px" },
    { key: "miercoles", label: "Miércoles", width: "110px" },
    { key: "jueves", label: "Jueves", width: "110px" },
    { key: "viernes", label: "Viernes", width: "110px" },
    { key: "ocupabilidad", label: "Ocupabilidad", width: "100px" },
  ], []);

  const columnasDisponibles = useMemo(() => 
    [...columnasBase, { key: "accion", label: "", width: "80px" }], 
  [columnasBase]);
  
  const columnasInscritas = useMemo(() => 
    [...columnasBase, { key: "accion", label: "", width: "100px" }], 
  [columnasBase]);

  const renderCellDisponibles = useCallback((item, key) => {
    if (key === "accion") {
      const lleno = item.inscritos >= item.cupoMaximo;
      const sinCreditos = creditosRestantes - item.creditos < 0;

      return (
        <button
          className={`${styles.actionButton} ${styles.inscribir}`}
          onClick={() => handleInscribir(item)}
          disabled={lleno || sinCreditos}
          style={(lleno || sinCreditos) ? { backgroundColor: '#ccc', cursor: 'not-allowed' } : {}}
          title={lleno ? "Grupo lleno" : sinCreditos ? "Créditos insuficientes" : "Inscribir"}
        >
          {lleno ? "Lleno" : "+"}
        </button>
      );
    }
    
    // ✅ Marcar optativas visualmente
    if (key === "materia" && item.esOptativa) {
      return (
        <span>
          {item[key]} <span style={{ color: '#0066cc', fontWeight: 'bold' }}>[Optativa]</span>
        </span>
      );
    }
    
    return item[key] || "-";
  }, [handleInscribir, creditosRestantes]);

  const renderCellInscritas = useCallback((item, key) => {
    if (key === "accion") {
      return (
        <button
          className={`${styles.actionButton} ${styles.darDeBaja}`}
          onClick={() => handleDarDeBaja(item)}
          title="Dar de baja"
        >
          —
        </button>
      );
    }
    
    // ✅ Marcar optativas visualmente
    if (key === "materia" && item.esOptativa) {
      return (
        <span>
          {item[key]} <span style={{ color: '#0066cc', fontWeight: 'bold' }}>[Optativa]</span>
        </span>
      );
    }
    
    return item[key] || "-";
  }, [handleDarDeBaja]);

  // ----------------------------- 4. FILTRADO -----------------------------
  
  const gruposDisponibles = useMemo(() => {
    let materias = materiasDisponibles;
    
    if (filtroSemestre) {
      materias = materias.filter(m => m.semestre === parseInt(filtroSemestre));
    }
    
    const grupos = new Set(materias.map(m => m.grupo));
    return Array.from(grupos).sort();
  }, [materiasDisponibles, filtroSemestre]);

  const materiasFiltradas = useMemo(() => {
    let resultado = materiasDisponibles;
    
    if (filtroSemestre) {
      resultado = resultado.filter(m => m.semestre === parseInt(filtroSemestre));
    }
    
    if (filtroGrupo) {
      resultado = resultado.filter(m => m.grupo === filtroGrupo);
    }
    
    if (filtroMateria.trim()) {
      const filtroLower = filtroMateria.toLowerCase().trim();
      resultado = resultado.filter(m => 
        m.materia.toLowerCase().includes(filtroLower)
      );
    }
    
    return resultado;
  }, [materiasDisponibles, filtroSemestre, filtroGrupo, filtroMateria]);



  if (errorValidacion) {
  switch (errorValidacion) {
    case 'YA_INSCRITO':
      return (
        <Espera 
          mensaje1="Reinscripción Realizada"
          mensaje2="Si crees que esto es un error, consulta en Subdirección."
        />
      );
    
    case 'FUERA_DE_PERIODO':
      return (
        <Espera 
          mensaje1="No te encuentras dentro del periodo oficial de reinscripción"
          mensaje2="Consulta el calendario académico."
        />
      );
    
    case 'SIN_CITA':
      return (
        <Espera 
          mensaje1="Cita no asignada"
          mensaje2="Sé paciente, pronto se asignará tu cita."
        />
      );
    
    case 'CITA_FUTURA':
      return (
        <Espera 
          mensaje1="Aún no es momento de tu reinscripción"
          mensaje2="Sé paciente, espera a tu hora indicada en la cita de Reinscripción."
        />
      );
    
    case 'CITA_EXPIRADA':
      return (
        <Espera 
          mensaje1="Reinscripción no realizada"
          mensaje2="Consulta en Subdirección."
        />
      );
    
    default:
      return (
        <Espera 
          mensaje1="Error en la validación"
          mensaje2="Por favor, consulta en Subdirección."
        />
      );
  }
}

  // ----------------------------- UI -----------------------------
  if (cargando || !idAlumno || !idPeriodoActual || !datosGen) {
    return <Espera />;
  }

  return (
    <div className="bienvenida-container">
      <Menu />
      <main className="page">
        <div className="horario-container">
          <aside className="horario-side">
            <h3>Reinscripciones</h3>

            <div className={styles.creditosWidget}>
              <h4>Créditos disponibles</h4>
              <span className={creditosRestantes < 0 ? styles.creditosError : ""}>
                {creditosRestantes} / {MAX_CREDITOS}
              </span>
            </div>

            {/* ✅ Widget de optativas */}
            <div className={styles.creditosWidget} style={{ marginTop: '15px' }}>
              <h4>Optativas</h4>
              <div style={{ fontSize: '0.9em' }}>
                <div>
                  <strong>6° Semestre:</strong> {optativasCursadasSexto + optativasInscritasActual.sexto} / {MAX_OPTATIVAS_SEXTO}
                  {optativasInscritasActual.sexto > 0 && (
                    <span style={{ color: '#666', fontSize: '0.85em' }}>
                      {' '}(+{optativasInscritasActual.sexto} en inscripción)
                    </span>
                  )}
                </div>
                <div style={{ marginTop: '5px' }}>
                  <strong>7° Semestre:</strong> {optativasCursadasSeptimo + optativasInscritasActual.septimo} / {MAX_OPTATIVAS_SEPTIMO}
                  {optativasInscritasActual.septimo > 0 && (
                    <span style={{ color: '#666', fontSize: '0.85em' }}>
                      {' '}(+{optativasInscritasActual.septimo} en inscripción)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.filtrosContainer}>
              <h4>Filtros:</h4>
              
              <SelectField
                label="Semestre"
                value={filtroSemestre}
                onChange={(e) => {
                  setFiltroSemestre(e.target.value);
                  setFiltroGrupo("");
                }}
                options={[
                  { value: "", label: "Todos" },
                  ...semestresDisponibles.map(s => ({
                    value: s.toString(),
                    label: `${s}º Semestre`
                  }))
                ]}
              />

              <SelectField
                label="Grupo"
                value={filtroGrupo}
                onChange={(e) => setFiltroGrupo(e.target.value)}
                options={[
                  { value: "", label: "Todos" },
                  ...gruposDisponibles.map(g => ({
                    value: g,
                    label: g
                  }))
                ]}
              />

              <label style={{ marginTop: '10px', display: 'block' }}>
                <strong>Buscar materia:</strong>
              </label>
              <input
                type="text"
                placeholder="Nombre de la materia..."
                value={filtroMateria}
                onChange={(e) => setFiltroMateria(e.target.value)}
                className={styles.inputFiltro}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  marginTop: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>

            <Button 
              variant="primary" 
              onClick={handleFinalizarInscripcion}
              disabled={materiasInscritas.filter(m => !m.idInscripcionClase).length === 0}
              style={{ marginTop: '20px' }}
            >
              Finalizar inscripción
            </Button>
          </aside>

          <section className="horario-main">
            <h2>Materias Disponibles</h2>
            <div className={styles.tablaWrapper}>
              <Table
                columns={columnasDisponibles}
                data={materiasFiltradas}
                renderCell={renderCellDisponibles}
                emptyMessage="No hay materias disponibles con los filtros seleccionados."
                striped={true}
                hover={true}
              />
            </div>

            <h2 className={styles.tituloMateriasInscritas}>Materias Inscritas</h2>
            <div className={styles.tablaWrapper}>
              <Table
                columns={columnasInscritas}
                data={materiasInscritas}
                renderCell={renderCellInscritas}
                emptyMessage="No has inscrito materias aún."
                striped={true}
                hover={true}
              />
            </div>
          </section>
        </div>
      </main>

      <Mensaje
        visible={mensaje.visible}
        titulo={mensaje.titulo}
        mensaje={mensaje.texto}
        onCerrar={() => setMensaje({ ...mensaje, visible: false })}
      />
    </div>
  );
}