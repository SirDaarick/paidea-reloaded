import React, { useState, useEffect } from "react";
import "styles/index.css";
import "styles/Ocupabilidad.css"; 

import Menu from "components/Menu.jsx";
import Button from "components/Button";
import Table from "components/Table";
import SelectField from "components/SelectField.jsx";
import Mensaje from "components/Mensaje.jsx";
import Espera from "./Espera";

import { useDatosGen } from "consultas/datos_alumno_gen.jsx";
import apiCall from "consultas/APICall.jsx";
import { useIdPeriodoActual } from "consultas/idPeriodo_Actual.jsx";

export default function Ocupabilidad() {
  const datosGen = useDatosGen();
  const idPeriodoActual = useIdPeriodoActual();
  
  const [carrera, setCarrera] = useState("692265322d970dc69b0fe295"); 
  const [semestre, setSemestre] = useState("");
  const [turno, setTurno] = useState("");
  const [grupo, setGrupo] = useState("");
  const [grupoOptions, setGrupoOptions] = useState([]);
  const [clases, setClases] = useState(null);
  const [loading, setLoading] = useState(false);

  const [mensajeInfo, setMensajeInfo] = useState({
    visible: false,
    titulo: "",
    cuerpo: ""
  });

  // Efecto para cargar opciones de grupo
  useEffect(() => {
    async function fetchGruposOptions() {
      if (!carrera || !semestre || !turno || !idPeriodoActual) {
        setGrupoOptions([]);
        setGrupo("");
        return;
      }
      try {
        const params = new URLSearchParams({
          idCarrera: carrera,
          idPeriodo: idPeriodoActual,
          semestre: semestre,
          turno: turno
        });
        const grupos = await apiCall(`/grupo/filtrar?${params.toString()}`, 'GET');
        if (!grupos || grupos.length === 0) {
          setGrupoOptions([]);
          setGrupo("");
          return;
        }
        const nombresGrupos = [...new Set(grupos.map(g => g.nombre))].sort();
        setGrupoOptions(nombresGrupos);
        if (grupo && !nombresGrupos.includes(grupo)) {
          setGrupo("");
        }
      } catch (error) {
        console.error("Error obteniendo grupos:", error);
        setGrupoOptions([]);
        setGrupo("");
      }
    }
    fetchGruposOptions();
  }, [carrera, semestre, turno, idPeriodoActual]);

  // Efecto para cargar clases
  useEffect(() => {
    async function fetchClases() {
      if (!carrera || !idPeriodoActual) {
        setClases([]);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams({
          idCarrera: carrera,
          idPeriodo: idPeriodoActual
        });
        if (semestre) params.append('semestre', semestre);
        if (turno) params.append('turno', turno);

        const gruposFiltrados = await apiCall(`/grupo/filtrar?${params.toString()}`, 'GET');

        if (gruposFiltrados.length === 0) {
          setClases([]);
          setLoading(false);
          return;
        }

        let gruposFinales = gruposFiltrados;
        if (grupo) {
          gruposFinales = gruposFiltrados.filter(g => g.nombre === grupo);
        }

        const todasLasClases = [];
        for (const grp of gruposFinales) {
          try {
            const clasesGrupo = await apiCall(`/clase/grupo/${grp._id}`, 'GET').catch(() => []);
            if (clasesGrupo && clasesGrupo.length > 0) {
              todasLasClases.push(...clasesGrupo.map(c => ({ ...c, grupoObj: grp })));
            }
          } catch (error) { console.error(error); }
        }

        if (todasLasClases.length === 0) {
          setClases([]);
          setLoading(false);
          return;
        }

        const diasSemanaIds = new Set();
        todasLasClases.forEach(clase => {
          if (clase?.horario) {
            ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].forEach(dia => {
              if (clase.horario[dia]?.idDia) {
                const idDia = typeof clase.horario[dia].idDia === 'object' 
                  ? clase.horario[dia].idDia._id || clase.horario[dia].idDia.id
                  : clase.horario[dia].idDia;
                if (idDia) diasSemanaIds.add(idDia.toString());
              }
            });
          }
        });

        const diasSemanaMap = {};
        if (diasSemanaIds.size > 0) {
          try {
            const todosDiasSemana = await apiCall('/diaSemana', 'GET');
            todosDiasSemana.forEach(dia => {
              const id = dia._id || dia.id;
              if (id) diasSemanaMap[id.toString()] = dia;
            });
          } catch (error) { console.error(error); }
        }

        const conteoPromises = todasLasClases.map(clase => 
          apiCall(`/inscripcionClase/clase/${clase._id}/conteo`, 'GET').catch(() => ({ inscritos: 0 }))
        );
        const conteos = await Promise.all(conteoPromises);
        const conteoMap = {};
        conteos.forEach((conteo, index) => {
          conteoMap[todasLasClases[index]._id] = conteo.inscritos || 0;
        });

        const clasesProcessadas = await Promise.all(
          todasLasClases.map(async (clase) => {
            try {
              const materia = (typeof clase.idMateria === 'object' && clase.idMateria !== null)
                ? clase.idMateria 
                : await apiCall(`/materia/${clase.idMateria}`, 'GET').catch(() => ({ nombre: "N/A", clave: "N/A" }));

              const profesor = (typeof clase.idProfesor === 'object' && clase.idProfesor !== null)
                ? clase.idProfesor
                : await apiCall(`/usuario/${clase.idProfesor}`, 'GET').catch(() => ({ nombre: "N/A" }));

              const inscritos = conteoMap[clase._id] || 0;
              const capacidad = clase.cupoMaximo || 35;
              const ocupacion = capacidad > 0 ? inscritos / capacidad : 0;

              let estado = "verde";
              if (ocupacion >= 0.9) estado = "rojo";
              else if (ocupacion >= 0.7) estado = "amarillo";

              const horarioProcesado = {};
              if (clase?.horario) {
                const horarioObj = clase.horario;
                for (const dia of ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']) {
                  if (horarioObj[dia] && horarioObj[dia].idDia) {
                    const diaInfo = horarioObj[dia];
                    let horarioInicio, horarioFinal;
                    if (typeof diaInfo.idDia === 'object' && diaInfo.idDia !== null) {
                      horarioInicio = diaInfo.idDia.horarioInicio;
                      horarioFinal = diaInfo.idDia.horarioFinal;
                    } else {
                      const diaSemana = diasSemanaMap[diaInfo.idDia.toString()];
                      if (diaSemana) {
                        horarioInicio = diaSemana.horarioInicio;
                        horarioFinal = diaSemana.horarioFinal;
                      }
                    }
                    if (horarioInicio && horarioFinal) {
                      horarioProcesado[dia.charAt(0).toUpperCase() + dia.slice(1)] = `${horarioInicio} - ${horarioFinal}`;
                    }
                  }
                }
              }

              return {
                claseId: clase._id,
                grupo: clase.grupoObj?.nombre || "N/A",
                clave: materia?.clave || "N/A",
                materia: materia?.nombre || "N/A",
                profesor: profesor?.nombre || "N/A",
                salon: clase?.salon || "N/A",
                horario: horarioProcesado,
                inscritos, capacidad, ocupacion, estado,
              };
            } catch (error) { return null; }
          })
        );
        setClases(clasesProcessadas.filter(c => c !== null));
      } catch (error) {
        console.error("Error cargando clases:", error);
        setClases([]);
      } finally {
        setLoading(false);
      }
    }
    fetchClases();
  }, [carrera, semestre, turno, grupo, idPeriodoActual]);

  const handleInscribirse = (claseId) => {
    setMensajeInfo({
      visible: true,
      titulo: "Aviso",
      mensaje: "Funcionalidad de inscripción pendiente"
    });
  };

  const cerrarMensaje = () => {
    setMensajeInfo({ ...mensajeInfo, visible: false });
  };

  if (!datosGen || loading) {
    return <Espera />;
  }

  const columnas = [
    { key: 'grupo', label: 'Grupo', width: '80px' },
    { key: 'clave', label: 'Clave', width: '150px' },
    { key: 'materia', label: 'Materia', width: '250px' },
    { key: 'profesor', label: 'Profesor', width: '200px' },
    { key: 'lunes', label: 'Lunes', width: '120px' },
    { key: 'martes', label: 'Martes', width: '120px' },
    { key: 'miercoles', label: 'Miércoles', width: '120px' },
    { key: 'jueves', label: 'Jueves', width: '120px' },
    { key: 'viernes', label: 'Viernes', width: '120px' },
    { key: 'ocupacion', label: 'Ocupación', width: '150px' },
    { key: 'accion', label: '', width: '120px' }
  ];

  const datosParaTabla = (clases || []).map(clase => ({
    ...clase,
    lunes: clase.horario?.Lunes || "-",
    martes: clase.horario?.Martes || "-",
    miercoles: clase.horario?.Miércoles || clase.horario?.Miercoles || "-",
    jueves: clase.horario?.Jueves || "-",
    viernes: clase.horario?.Viernes || "-",
  }));

  const renderCelda = (item, key) => {
    if (key === "ocupacion") {
      const bg = item.estado === "rojo" ? "#fecaca" : item.estado === "amarillo" ? "#fde68a" : "#d1fae5";
      return (
        <span className="ocupacion-pill" style={{ background: bg }}>
          {item.inscritos}/{item.capacidad} ({Math.round(item.ocupacion * 100)}%)
        </span>
      );
    }
    if (key === "accion") {
      const disabled = item.inscritos >= item.capacidad;
      return (
        <Button
          onClick={() => handleInscribirse(item.claseId)}
          variant={disabled ? "secondary" : "primary"}
          disabled={disabled}
        >
          {disabled ? "Lleno" : "Inscribirme"}
        </Button>
      );
    }
    return item[key] ?? "-";
  };

  const grupoHabilitado = carrera && semestre && turno;

  return (
    <div className="bienvenida-container">
      <Menu />

      <main className="page">
        <div className="contenido-con-margen">
          {/* Se aplicó la nueva clase titulo-pagina */}
          <h2 className="titulo-pagina">Horarios y Ocupabilidad de Clases</h2>
          <p>
            Selecciona los filtros para ver las clases disponibles. 
            El filtro de grupo se habilitará cuando selecciones carrera, semestre y turno.
          </p>

          <div className="filtros-grid">
            <SelectField
              label="Carrera *"
              value={carrera}
              onChange={(e) => { setCarrera(e.target.value); setGrupo(""); }}
              options={[
                { value: "692265322d970dc69b0fe295", label: "Licenciatura en Ciencia de Datos" },
                { value: "690eacdab43948f952b9244f", label: "Ingeniería en Inteligencia Artificial" },
                { value: "692273ce2d970dc69b0fe298", label: "Ingeniería en Sistemas Computacionales" },
              ]}
            />
            <SelectField
              label="Semestre"
              value={semestre}
              onChange={(e) => { setSemestre(e.target.value); setGrupo(""); }}
              options={[
                { value: "", label: "Todos" }, { value: "1", label: "Primero (1º)" },
                { value: "2", label: "Segundo (2º)" }, { value: "3", label: "Tercero (3º)" },
                { value: "4", label: "Cuarto (4º)" }, { value: "5", label: "Quinto (5º)" },
                { value: "6", label: "Sexto (6º)" }, { value: "7", label: "Séptimo (7º)" },
                { value: "8", label: "Octavo (8º)" },
              ]}
            />
            <SelectField
              label="Turno"
              value={turno}
              onChange={(e) => { setTurno(e.target.value); setGrupo(""); }}
              options={[
                { value: "", label: "Todos" }, { value: "Matutino", label: "Matutino" },
                { value: "Vespertino", label: "Vespertino" },
              ]}
            />
            <SelectField
              label="Grupo"
              value={grupo}
              onChange={(e) => setGrupo(e.target.value)}
              disabled={!grupoHabilitado}
              options={[
                { value: "", label: grupoHabilitado ? "Todos" : "Selecciona filtros primero" },
                ...grupoOptions.map(g => ({ value: g, label: g }))
              ]}
            />
          </div>

          {!grupoHabilitado && (
            <div className="tip-box">
              <strong>Tip:</strong> Para ver grupos específicos, selecciona carrera, semestre y turno.
            </div>
          )}

          <div className="leyenda-container">
            <strong>Guía:</strong>
            <Badge color="#d1fae5" text="Disponible (≤ 70%)" />
            <Badge color="#fde68a" text="Casi lleno (70–90%)" />
            <Badge color="#fecaca" text="Lleno (≥ 90%)" />
          </div>

          {clases && clases.length === 0 ? (
            <p>No se encontraron clases con los filtros seleccionados</p>
          ) : (
            <Table
              className="tabla-responsive-directa" 
              columns={columnas}
              data={datosParaTabla}
              renderCell={renderCelda}
              emptyMessage="No hay clases disponibles"
              striped={true}
              hover={true}
            />
          )}
        </div>
      </main>

      <Mensaje 
        titulo={mensajeInfo.titulo}
        mensaje={mensajeInfo.mensaje}
        visible={mensajeInfo.visible}
        onCerrar={cerrarMensaje}
      />
    </div>
  );
}

function Badge({ color, text }) {
  return (
    <span className="badge-item">
      <span className="badge-color" style={{ background: color }} />
      <span>{text}</span>
    </span>
  );
}