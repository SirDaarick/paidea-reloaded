import React, { useState, useEffect } from "react";
import MenuAdmin from "components/MenuAdmin";
import Button from "components/Button";
import Table from "components/Table";
import Mensaje from "components/Mensaje";
import apiCall from "consultas/APICall";
import "styles/index.css";
import "styles/GestionGrupos.css";
import "styles/modalForms.css";

const GestionarGrupos = () => {
  const [planes, setPlanes] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [bloques, setBloques] = useState([]);

  const [plan, setPlan] = useState("");
  const [semestre, setSemestre] = useState("");
  const [grupo, setGrupo] = useState("");

  const [tablaDatos, setTablaDatos] = useState([]);

  const [unidad, setUnidad] = useState("");
  const [profesor, setProfesor] = useState("");
  const [salon, setSalon] = useState("");

  const [editando, setEditando] = useState(null);
  const [cargando, setCargando] = useState(false);

  const [errores, setErrores] = useState({
    unidad: "",
    profesor: "",
    salon: "",
    dias: ""
  });

  const [modal, setModal] = useState({
    visible: false,
    titulo: "",
    mensaje: ""
  });

  const [dias, setDias] = useState({
    lunes: { activo: false, horario: "" },
    martes: { activo: false, horario: "" },
    miercoles: { activo: false, horario: "" },
    jueves: { activo: false, horario: "" },
    viernes: { activo: false, horario: "" }
  });

  useEffect(() => {
    cargarProfesores();
    cargarBloques();
    cargarPlanes();
  }, []);

  const cargarProfesores = async () => {
    const data = await apiCall("/usuario/profesores");
    setProfesores(data);
  };

  const cargarBloques = async () => {
    const data = await apiCall("/diaSemana");
    setBloques(data);
  };

  const cargarPlanes = async () => {
    const data = await apiCall("/carrera");
    setPlanes(data);
  };

  const cargarGrupos = async (idCarrera) => {
    const data = await apiCall("/grupo");
    const filtrados = data.filter((g) => g.idCarrera?._id === idCarrera);
    setGrupos(filtrados);
  };

  const cargarMaterias = async (idCarrera, sem) => {
    const data = await apiCall("/materia");
    const filtradas = data.filter(
      (m) => m.idCarrera === idCarrera && m.semestre === Number(sem)
    );
    setMaterias(filtradas);
  };

  const cargarClasesExistentes = async (grupoId) => {
    try {
      setCargando(true);
      const data = await apiCall(`/clase/grupo/${grupoId}`);
    
      const filas = data.map(clase => {
      // Procesar horarios correctamente
        const horariosProcesados = {};
        const diasSemana = ["lunes", "martes", "miercoles", "jueves", "viernes"];
      
       diasSemana.forEach(dia => {
        // Intentar obtener el ID del día desde el objeto horario
          let idDia = null;
        
          if (clase.horario && clase.horario[dia]) {
            const diaData = clase.horario[dia];
          
          // Si idDia es un objeto con _id
            if (diaData.idDia && typeof diaData.idDia === 'object') {
              idDia = diaData.idDia._id;
           } 
          // Si idDia es solo un string
            else if (diaData.idDia && typeof diaData.idDia === 'string') {
              idDia = diaData.idDia;
            }
          }
        
         horariosProcesados[dia] = idDia;
        });
      
        return {
          _id: clase._id,
          grupo: clase.idGrupo._id,
          grupoNombre: clase.idGrupo.nombre,
          materia: clase.idMateria._id,
          materiaNombre: clase.idMateria.nombre,
          profesor: clase.idProfesor._id,
          profesorNombre: clase.idProfesor.nombre,
          salon: clase.salon || "Sin asignar",
          ...horariosProcesados, // Usar los horarios procesados
          guardada: true
        };
      });
    
      setTablaDatos(filas);
    } catch (err) {
      console.error("Error al cargar clases:", err);
      setTablaDatos([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (plan && semestre) {
      cargarGrupos(plan);
      cargarMaterias(plan, semestre);
    }
  }, [plan, semestre]);

  useEffect(() => {
    if (grupo) {
      cargarClasesExistentes(grupo);
      limpiarFormulario();
    } else {
      setTablaDatos([]);
    }
  }, [grupo]);

  const horariosTraslapan = (inicioA, finA, inicioB, finB) => {
    const a1 = parseInt(inicioA.replace(":", ""));
    const a2 = parseInt(finA.replace(":", ""));
    const b1 = parseInt(inicioB.replace(":", ""));
    const b2 = parseInt(finB.replace(":", ""));
    return a1 < b2 && b1 < a2;
  };

  const getBloque = (id) => bloques.find((b) => b._id === id);

  const handleDiaChange = (dia) => {
    setDias((prev) => ({
      ...prev,
      [dia]: { activo: !prev[dia].activo, horario: "" }
    }));
    
    if (!dias[dia].activo) {
      setErrores(prev => ({ ...prev, dias: "" }));
    }
  };

  const handleHorarioChange = (dia, idBloque) => {
    setDias((prev) => ({
      ...prev,
      [dia]: { ...prev[dia], horario: idBloque }
    }));
  };

  const limpiarFormulario = () => {
    setUnidad("");
    setProfesor("");
    setSalon("");
    setDias({
      lunes: { activo: false, horario: "" },
      martes: { activo: false, horario: "" },
      miercoles: { activo: false, horario: "" },
      jueves: { activo: false, horario: "" },
      viernes: { activo: false, horario: "" }
    });
    setErrores({
      unidad: "",
      profesor: "",
      salon: "",
      dias: ""
    });
    setEditando(null);
  };

  const mostrarModal = (titulo, mensaje) => {
    setModal({ visible: true, titulo, mensaje });
  };

  const cerrarModal = () => {
    setModal({ visible: false, titulo: "", mensaje: "" });
  };

  const validarCamposBasicos = () => {
    const nuevosErrores = {
      unidad: "",
      profesor: "",
      salon: "",
      dias: ""
    };

    if (!unidad) nuevosErrores.unidad = "Selecciona una unidad de aprendizaje";
    if (!profesor) nuevosErrores.profesor = "Selecciona un profesor";
    if (!salon || salon.trim() === "") nuevosErrores.salon = "Ingresa un salón";

    const tieneDias = Object.values(dias).some(d => d.activo && d.horario);
    if (!tieneDias) nuevosErrores.dias = "Debes asignar al menos un día con horario";

    setErrores(nuevosErrores);

    return !Object.values(nuevosErrores).some(e => e !== "");
  };

  const validarClaseDuplicada = () => {
    // Si estamos editando, excluir la fila actual
    const datosAValidar = editando !== null 
      ? tablaDatos.filter((_, idx) => idx !== editando)
      : tablaDatos;

    // Verificar si la misma materia está siendo inscrita (sin importar el grupo)
    const yaExiste = datosAValidar.some(
      fila => fila.materia === unidad
    );

    if (yaExiste) {
      // Verificar si hay traslapes de horario con esa materia
      const materiaExistente = datosAValidar.find(fila => fila.materia === unidad);
      const diasSemana = ["lunes", "martes", "miercoles", "jueves", "viernes"];
    
      let hayTraslape = false;
      for (const dia of diasSemana) {
        if (dias[dia].activo && dias[dia].horario && materiaExistente[dia]) {
          const bloqueNuevo = getBloque(dias[dia].horario);
          const bloqueExistente = getBloque(materiaExistente[dia]);
        
        if (bloqueNuevo && bloqueExistente) {
            if (horariosTraslapan(
              bloqueNuevo.horarioInicio,
              bloqueNuevo.horarioFinal,
              bloqueExistente.horarioInicio,
              bloqueExistente.horarioFinal
            )) {
              hayTraslape = true;
              break;
            }
          }
        }
    }
    
      if (hayTraslape) {
        mostrarModal(
          "Clase Duplicada con Traslape",
          `Esta materia ya está asignada a este grupo con horarios que se traslapan. ` +
          `Si deseas cambiar el horario, primero edita o elimina la clase existente.`
        );
        return false;
      }
    
    // Si no hay traslape, permitir (diferentes horarios de la misma materia)
      return true;
    }

    return true;
  };

  const validarTraslapes = () => {
    for (const dia of ["lunes", "martes", "miercoles", "jueves", "viernes"]) {
      if (dias[dia].activo && dias[dia].horario) {
        const nuevo = getBloque(dias[dia].horario);

        for (let i = 0; i < tablaDatos.length; i++) {
          if (editando !== null && i === editando) continue;

          const fila = tablaDatos[i];
          const ex = getBloque(fila[dia]);
          if (!ex) continue;

          if (
            horariosTraslapan(
              nuevo.horarioInicio,
              nuevo.horarioFinal,
              ex.horarioInicio,
              ex.horarioFinal
            )
          ) {
            mostrarModal(
              "Traslape de Horario",
              `Traslape detectado en ${dia.toUpperCase()}:\n\n` +
              `El horario ${nuevo.horarioInicio}-${nuevo.horarioFinal} se cruza con ` +
              `${ex.horarioInicio}-${ex.horarioFinal} de la materia "${fila.materiaNombre}".`
            );
            return false;
          }
        }
      }
    }

    return true;
  };

  const validarTurno = () => {
    const grupoObj = grupos.find((g) => g._id === grupo);
    const esMatutino = grupoObj?.nombre.includes("M");
    const esVespertino = grupoObj?.nombre.includes("V");

    for (const dia of ["lunes", "martes", "miercoles", "jueves", "viernes"]) {
      if (dias[dia].activo && dias[dia].horario) {
        const bloque = getBloque(dias[dia].horario);
        const hora = parseInt(bloque.horarioInicio.replace(":", ""));

        if (esMatutino && hora >= 1200) {
          mostrarModal(
            "Error de Turno",
            `El grupo "${grupoObj.nombre}" es MATUTINO y no puede tener clases después de las 12:00.\n\n` +
            `Horario conflictivo: ${bloque.horarioInicio}-${bloque.horarioFinal} en ${dia.toUpperCase()}.`
          );
          return false;
        }

        if (esVespertino && hora < 1200) {
          mostrarModal(
            "Error de Turno",
            `El grupo "${grupoObj.nombre}" es VESPERTINO y no puede tener clases antes de las 12:00.\n\n` +
            `Horario conflictivo: ${bloque.horarioInicio}-${bloque.horarioFinal} en ${dia.toUpperCase()}.`
          );
          return false;
        }
      }
    }

    return true;
  };

  const validarDisponibilidadProfesor = async () => {
    try {
      const grupos = await apiCall(`/grupo/profesor/${profesor}`);
      
      for (const dia of ["lunes", "martes", "miercoles", "jueves", "viernes"]) {
        if (dias[dia].activo && dias[dia].horario) {
          const bloqueNuevo = getBloque(dias[dia].horario);

          for (const grupoData of grupos) {
            if (grupoData.grupo._id === grupo) continue;

            for (const materia of grupoData.materias) {
              const claseCompleta = await apiCall(`/clase/${materia._id}`);
              
              if (claseCompleta.horario[dia]?.idDia?._id) {
                const bloqueExistente = getBloque(claseCompleta.horario[dia].idDia._id);
                
                if (bloqueExistente && horariosTraslapan(
                  bloqueNuevo.horarioInicio,
                  bloqueNuevo.horarioFinal,
                  bloqueExistente.horarioInicio,
                  bloqueExistente.horarioFinal
                )) {
                  const profesorObj = profesores.find(p => p._id === profesor);
                  mostrarModal(
                    "Profesor No Disponible",
                    `El profesor ${profesorObj.nombre} ya tiene asignada la clase de "${claseCompleta.idMateria.nombre}" ` +
                    `el ${dia.toUpperCase()} de ${bloqueExistente.horarioInicio} a ${bloqueExistente.horarioFinal} ` +
                    `en el grupo ${grupoData.grupo.nombre}.`
                  );
                  return false;
                }
              }
            }
          }
        }
      }

      return true;
    } catch (err) {
      console.error("Error al validar disponibilidad del profesor:", err);
      return true;
    }
  };

  const validarDisponibilidadSalon = () => {
    for (const dia of ["lunes", "martes", "miercoles", "jueves", "viernes"]) {
      if (dias[dia].activo && dias[dia].horario) {
        const bloqueNuevo = getBloque(dias[dia].horario);

        for (let i = 0; i < tablaDatos.length; i++) {
          if (editando !== null && i === editando) continue;

          const fila = tablaDatos[i];
          
          if (fila.salon === salon && fila[dia]) {
            const bloqueExistente = getBloque(fila[dia]);
            
            if (bloqueExistente && horariosTraslapan(
              bloqueNuevo.horarioInicio,
              bloqueNuevo.horarioFinal,
              bloqueExistente.horarioInicio,
              bloqueExistente.horarioFinal
            )) {
              mostrarModal(
                "Salón Ocupado",
                `El salón ${salon} ya está ocupado el ${dia.toUpperCase()} de ` +
                `${bloqueExistente.horarioInicio} a ${bloqueExistente.horarioFinal} ` +
                `por la materia "${fila.materiaNombre}".`
              );
              return false;
            }
          }
        }
      }
    }

    return true;
  };

  const handleAgregar = async () => {
    if (!validarCamposBasicos()) return;
    if (!validarClaseDuplicada()) return;
    if (!validarTraslapes()) return;
    if (!validarTurno()) return;
    if (!validarDisponibilidadSalon()) return;

    setCargando(true);
    const profesorDisponible = await validarDisponibilidadProfesor();
    setCargando(false);

    if (!profesorDisponible) return;

    const grupoObj = grupos.find((g) => g._id === grupo);
    const materiaObj = materias.find((m) => m._id === unidad);
    const profesorObj = profesores.find((p) => p._id === profesor);

    const nuevo = {
      grupo,
      grupoNombre: grupoObj?.nombre,
      materia: unidad,
      materiaNombre: materiaObj?.nombre,
      profesor,
      profesorNombre: profesorObj?.nombre,
      salon: salon.trim(),

      lunes: dias.lunes.activo ? dias.lunes.horario : null,
      martes: dias.martes.activo ? dias.martes.horario : null,
      miercoles: dias.miercoles.activo ? dias.miercoles.horario : null,
      jueves: dias.jueves.activo ? dias.jueves.horario : null,
      viernes: dias.viernes.activo ? dias.viernes.horario : null,
      
      guardada: false
    };

    if (editando !== null) {
      setTablaDatos((prev) => {
        const actualizada = [...prev];
        actualizada[editando] = { ...actualizada[editando], ...nuevo };
        return actualizada;
      });
      
      mostrarModal(
        "Clase Actualizada",
        "La clase se actualizó correctamente en la tabla. Recuerda hacer clic en 'Guardar grupos' para aplicar los cambios."
      );
    } else {
      setTablaDatos((prev) => [...prev, nuevo]);
      
      mostrarModal(
        "Clase Agregada",
        "La clase se agregó correctamente a la tabla. Recuerda hacer clic en 'Guardar grupos' para guardar los cambios."
      );
    }

    limpiarFormulario();
  };

  const handleEditar = (index) => {
    const fila = tablaDatos[index];
  
    setUnidad(fila.materia);
    setProfesor(fila.profesor);
    setSalon(fila.salon);
    
    setDias({
      lunes: { activo: !!fila.lunes, horario: fila.lunes || "" },
      martes: { activo: !!fila.martes, horario: fila.martes || "" },
      miercoles: { activo: !!fila.miercoles, horario: fila.miercoles || "" },
      jueves: { activo: !!fila.jueves, horario: fila.jueves || "" },
      viernes: { activo: !!fila.viernes, horario: fila.viernes || "" }
    });
    
    setEditando(index);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEliminarFila = async (index) => {
    const fila = tablaDatos[index];
    
    if (fila.guardada && fila._id) {
      const confirmar = window.confirm(
        "⚠️ Esta clase ya está guardada en la base de datos.\n\n" +
        "¿Deseas eliminarla permanentemente? Esta acción NO se puede deshacer."
      );
      
      if (!confirmar) return;
      
      try {
        setCargando(true);
        await apiCall(`/clase/${fila._id}`, "DELETE");
        setTablaDatos(prev => prev.filter((_, i) => i !== index));
        
        mostrarModal(
          "Clase Eliminada",
          "La clase se eliminó correctamente de la base de datos."
        );
      } catch (err) {
        console.error(err);
        mostrarModal(
          "Error al Eliminar",
          "Ocurrió un error al eliminar la clase. Intenta nuevamente."
        );
      } finally {
        setCargando(false);
      }
    } else {
      const confirmar = window.confirm(
        "¿Estás seguro de eliminar esta clase de la tabla?"
      );
      
      if (confirmar) {
        setTablaDatos(prev => prev.filter((_, i) => i !== index));
      }
    }
    
    if (editando === index) {
      limpiarFormulario();
    }
  };

  const handleCancelarEdicion = () => {
    limpiarFormulario();
  };

  const guardarClases = async () => {
    const clasesNuevas = tablaDatos.filter(f => !f.guardada);
    
    if (clasesNuevas.length === 0) {
      mostrarModal(
        "Sin Cambios",
        "No hay clases nuevas para guardar. Todas las clases ya están guardadas en la base de datos."
      );
      return;
    }

    const confirmar = window.confirm(
      `¿Deseas guardar ${clasesNuevas.length} clase(s) nueva(s) en la base de datos?`
    );

    if (!confirmar) return;

    try {
      setCargando(true);
      let guardadas = 0;
      let errores = 0;

      for (const fila of clasesNuevas) {
        try {
          const horario = {
            lunes: { idDia: fila.lunes },
            martes: { idDia: fila.martes },
            miercoles: { idDia: fila.miercoles },
            jueves: { idDia: fila.jueves },
            viernes: { idDia: fila.viernes },
            sabado: { idDia: null }
          };

          const data = {
            idGrupo: fila.grupo,
            idMateria: fila.materia,
            idProfesor: fila.profesor,
            salon: fila.salon,
            cupoMaximo: 30,
            horario
          };

          await apiCall("/clase", "POST", data);
          guardadas++;
        } catch (err) {
          console.error("Error al guardar clase:", err);
          errores++;
        }
      }

      if (errores === 0) {
        mostrarModal(
          "Guardado Exitoso",
          `Se guardaron ${guardadas} clase(s) correctamente en la base de datos.`
        );
        
        if (grupo) {
          await cargarClasesExistentes(grupo);
        }
        
        limpiarFormulario();
      } else {
        mostrarModal(
          "Guardado Parcial",
          `Se guardaron ${guardadas} clase(s) correctamente.\n` +
          `${errores} clase(s) fallaron al guardarse. Revisa los datos e intenta nuevamente.`
        );
      }
    } catch (err) {
      console.error(err);
      mostrarModal(
        "Error al Guardar",
        "Ocurrió un error al guardar las clases. Intenta nuevamente."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="gestionar-grupos-container">
      <MenuAdmin />

      <Mensaje
        visible={modal.visible}
        titulo={modal.titulo}
        mensaje={modal.mensaje}
        onCerrar={cerrarModal}
      />

      <main className="gestionar-grupos-main">
        <h2 style={{ textAlign: "center", marginBottom: 18, color: '#243159' }}>
          Gestionar grupos
        </h2>

        <section className="filtros-superiores">
          <div className="campo">
            <label>Plan de estudio</label>
            <select value={plan} onChange={(e) => setPlan(e.target.value)}>
              <option value="">Selecciona...</option>
              {planes.map((p) => (
                <option key={p._id} value={p._id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label>Semestre</label>
            <select value={semestre} onChange={(e) => setSemestre(e.target.value)}>
              <option value="">Selecciona...</option>
              {[1,2,3,4,5,6,7,8].map((n) => (
                <option key={n} value={n}>
                  {n === 1 ? '1er' : n === 2 ? '2do' : n === 3 ? '3er' : `${n}to`} semestre
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label>Grupo</label>
            <select 
              value={grupo} 
              onChange={(e) => setGrupo(e.target.value)}
              disabled={!plan || !semestre}
            >
              <option value="">Selecciona...</option>
              {grupos
                .filter((g) => g.semestre === Number(semestre))
                .map((g) => (
                  <option key={g._id} value={g._id}>{g.nombre}</option>
                ))}
            </select>
          </div>
        </section>

        {cargando && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#4c6cb7' }}>
            <p>Cargando...</p>
          </div>
        )}

        <>
          <section className="agregar-unidades">
            <h2>
              {editando !== null ? "Editar clase" : "Agregar unidades de aprendizaje"}
            </h2>

            <div className="modal-form-section">
              <div className="modal-input-group">
                <div className="modal-input-wrapper">
                  <label>Unidad de aprendizaje</label>
                  <select 
                    value={unidad} 
                    onChange={(e) => {
                      const materiaId = e.target.value;
                      setUnidad(e.target.value);
                      setErrores(prev => ({ ...prev, unidad: "" }));
                    }}
                    className={errores.unidad ? "modal-select modal-select-error" : "modal-select"}
                    disabled={!plan || !semestre || !grupo}
                  >
                    <option value="">Selecciona...</option>
                    {materias.map((m) => (
                      <option key={m._id} value={m._id}>{m.nombre}</option>
                    ))}
                  </select>
                  {errores.unidad && (
                    <span className="modal-error-message">{errores.unidad}</span>
                  )}
                </div>

                <div className="modal-input-wrapper">
                  <label>Profesor asignado</label>
                  <select 
                    value={profesor} 
                    onChange={(e) => {
                      setProfesor(e.target.value);
                      setErrores(prev => ({ ...prev, profesor: "" }));
                    }}
                    className={errores.profesor ? "modal-select modal-select-error" : "modal-select"}
                    disabled={!plan || !semestre || !grupo}
                  >
                    <option value="">Selecciona...</option>
                    {profesores.map((p) => (
                      <option key={p._id} value={p._id}>{p.nombre}</option>
                    ))}
                  </select>
                  {errores.profesor && (
                    <span className="modal-error-message">{errores.profesor}</span>
                  )}
                </div>

                <div className="modal-input-wrapper">
                  <label>Salón</label>
                  <input
                    type="text"
                    value={salon}
                    onChange={(e) => {
                      setSalon(e.target.value);
                      setErrores(prev => ({ ...prev, salon: "" }));
                    }}
                    placeholder="Ej: 3000, 4014"
                    className={errores.salon ? "modal-input modal-input-error" : "modal-input"}
                    disabled={!plan || !semestre || !grupo}
                  />
                  {errores.salon && (
                    <span className="modal-error-message">{errores.salon}</span>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '10px' }}>
                  Horarios de la semana
                </label>
                {errores.dias && (
                  <span className="modal-error-message" style={{ display: 'block', marginBottom: '10px' }}>
                    {errores.dias}
                  </span>
                )}
              </div>

              <div className="dias-container">
                {Object.keys(dias).map((dia) => {
                  const grupoObj = grupos.find((g) => g._id === grupo);
                  const esM = grupoObj?.nombre?.includes("M");
                  const esV = grupoObj?.nombre?.includes("V");

                  return (
                    <div className="dia" key={dia}>
                      <input
                        type="checkbox"
                        checked={dias[dia].activo}
                        onChange={() => handleDiaChange(dia)}
                        disabled={!plan || !semestre || !grupo}
                      />
                      <label>{dia.toUpperCase()}</label>

                      <select
                        disabled={!dias[dia].activo || !plan || !semestre || !grupo}
                        value={dias[dia].horario}
                        onChange={(e) => handleHorarioChange(dia, e.target.value)}
                      >
                        <option value="">Sin asignar</option>

                        {bloques
                          .filter((b) => {
                            const hora = parseInt(b.horarioInicio.replace(":", ""));
                            if (esM) return hora < 1200;
                            if (esV) return hora >= 1200;
                            return true;
                          })
                          .map((b) => (
                            <option key={b._id} value={b._id}>
                              {b.horarioInicio} - {b.horarioFinal}
                            </option>
                          ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="modal-buttons-container">
              {editando !== null ? (
                <>
                  <Button variant="secondary" onClick={handleAgregar} disabled={cargando || !plan || !semestre || !grupo}>
                    {cargando ? "Validando..." : "Actualizar"}
                  </Button>
                  <Button variant="primary" onClick={handleCancelarEdicion}>
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button variant="secondary" onClick={handleAgregar} disabled={cargando || !plan || !semestre || !grupo}>
                  {cargando ? "Validando..." : "Agregar"}
                </Button>
              )}
            </div>
          </section>

          <section className="tabla-grupos">
            <h2 style={{ textAlign: "center", color: '#243159' }}>Clases del grupo</h2>
              
              {tablaDatos.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                  {!grupo ? 'Selecciona un plan, semestre y grupo para comenzar.' : 'No hay clases asignadas a este grupo. Agrega una clase usando el formulario superior.'}
                </p>
              ) : (
                <Table
                  columns={[
                    { key: "grupoNombre", label: "Grupo" },
                    { key: "materiaNombre", label: "Materia" },
                    { key: "profesorNombre", label: "Profesor" },
                    { key: "salon", label: "Salón" },
                    { key: "lunes", label: "Lunes" },
                    { key: "martes", label: "Martes" },
                    { key: "miercoles", label: "Miércoles" },
                    { key: "jueves", label: "Jueves" },
                    { key: "viernes", label: "Viernes" },
                    { key: "acciones", label: "Acciones" }
                  ]}
                  data={tablaDatos}
                  renderCell={(item, key) => {
                    if (["lunes", "martes", "miercoles", "jueves", "viernes"].includes(key)) {
                      const b = getBloque(item[key]);
                      return b ? `${b.horarioInicio} - ${b.horarioFinal}` : "-";
                    }
                    
                    if (key === "acciones") {
                      const index = tablaDatos.indexOf(item);
                      return (
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEditar(index)}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#4c6cb7',
                              color: 'white',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            title="Editar clase"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleEliminarFila(index)}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#e74c3c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            title="Eliminar clase"
                            disabled={cargando}
                          >
                            Eliminar
                          </button>
                        </div>
                      );
                    }

                    if (key === "materiaNombre" && item.guardada) {
                      return (
                        <span>
                          {item[key]}
                          <span 
                            className="modal-badge modal-badge-success"
                            title="Esta clase ya está guardada en la base de datos"
                          >
                            ✓ Guardada
                          </span>
                        </span>
                      );
                    }

                    if (key === "materiaNombre" && !item.guardada) {
                      return (
                        <span>
                          {item[key]}
                          <span 
                            className="modal-badge modal-badge-warning"
                            title="Esta clase aún no se ha guardado en la base de datos"
                          >
                            ⚠ Pendiente
                          </span>
                        </span>
                      );
                    }
                    
                    return item[key];
                  }}
                />
              )}
            </section>

            <div className="contenedor-boton">
              <Button 
                variant="secondary" 
                onClick={guardarClases}
                disabled={cargando || !grupo || tablaDatos.filter(f => !f.guardada).length === 0}
              >
                {cargando ? "Guardando..." : `Guardar grupos (${tablaDatos.filter(f => !f.guardada).length} pendientes)`}
              </Button>
            </div>
          </>
      </main>
    </div>
  );
};

export default GestionarGrupos;