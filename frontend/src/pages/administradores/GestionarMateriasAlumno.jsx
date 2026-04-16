import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { useParams, useNavigate } from "react-router-dom";

import "styles/index.css";
import styles from "styles/Reinscripciones.module.css";

import MenuAdmin from "components/MenuAdmin";
import Button from "components/Button";
import Table from "components/Table";
import SelectField from "components/SelectField";
import Mensaje from "components/Mensaje";

import apiCall from "consultas/APICall";
import { useIdPeriodoActual } from "consultas/idPeriodo_Actual";

const MAX_CREDITOS = 50;

const obtenerId = (campo) => {
  if (!campo) return null;
  if (typeof campo === "object" && campo._id) return campo._id.toString();
  return campo.toString();
};

export default function GestionarMateriasAlumno() {
  const { idAlumno } = useParams();
  const navigate = useNavigate();
  const idPeriodoActual = useIdPeriodoActual();

  const [alumno, setAlumno] = useState(null);

  const [materiasDisponibles, setMateriasDisponibles] = useState([]);
  const [materiasInscritas, setMateriasInscritas] = useState([]);
  const [creditosRestantes, setCreditosRestantes] = useState(MAX_CREDITOS);

  const [filtroSemestre, setFiltroSemestre] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("");
  const [filtroMateria, setFiltroMateria] = useState("");

  const [mensaje, setMensaje] = useState({
    visible: false,
    titulo: "",
    texto: "",
  });
  const [cargando, setCargando] = useState(true);
  const [idInscripcion, setIdInscripcion] = useState(null);
  const [semestresDisponibles, setSemestresDisponibles] = useState([]);

  const [nuevoSemestre, setNuevoSemestre] = useState("");

  // -------------------------------------------------------------------------
  // 1. CARGA DE DATOS
  // -------------------------------------------------------------------------
  useEffect(() => {
    let montado = true;

    const fetchDatos = async () => {
      try {
        if (!idAlumno || !idPeriodoActual) return;

        setCargando(true);

        const [
          alumnoData,
          inscripcionesAlumno,
          materiasRes,
          clasesRes,
          diasSemanaRes,
          gruposRes,
        ] = await Promise.all([
          apiCall(`/usuario/${idAlumno}`, "GET"),
          apiCall(`/inscripcion/alumno/${idAlumno}`, "GET").catch(() => []),
          apiCall("/materia", "GET"),
          apiCall("/clase", "GET"),
          apiCall("/diaSemana", "GET"),
          apiCall("/grupo", "GET"),
        ]);

        if (!montado) return;

        // ===================== INFO DEL ALUMNO =====================
        const idCarreraAlumno = obtenerId(alumnoData.dataAlumno?.idCarrera);

        let carreraNombre = "Sin carrera";
        if (idCarreraAlumno) {
          try {
            const carrera = await apiCall(`/carrera/${idCarreraAlumno}`, "GET");
            carreraNombre = carrera?.nombre || carreraNombre;
          } catch {}
        }

        setAlumno({
          nombre: alumnoData.nombre,
          boleta: alumnoData.boleta,
          carrera: carreraNombre,
          semestre: alumnoData.dataAlumno?.semestre || 1,
        });

        setNuevoSemestre(alumnoData.dataAlumno?.semestre || 1);

        // ===================== INSCRIPCIÓN ACTUAL =====================
        let inscripcionActual = inscripcionesAlumno.find(
          (insc) => obtenerId(insc.idPeriodo) === idPeriodoActual?.toString()
        );

        if (!inscripcionActual) {
          inscripcionActual = await apiCall("/inscripcion", "POST", {
            idAlumno: idAlumno,
            idPeriodo: idPeriodoActual,
            creditos: 0,
          });
        }

        const idInsc = obtenerId(inscripcionActual);
        setIdInscripcion(idInsc);

        const inscripcionesClaseActual = await apiCall(
          `/inscripcionClase/inscripcion/${idInsc}`,
          "GET"
        ).catch(() => []);

        // MAPAS
        const materiasMap = {};
        materiasRes.forEach((m) => (materiasMap[m._id] = m));

        const diasSemanaMap = {};
        diasSemanaRes.forEach((d) => (diasSemanaMap[d._id] = d));

        const gruposMap = {};
        gruposRes.forEach((g) => (gruposMap[g._id] = g));

        // ===================== FILTRO CLASES DEL PERIODO Y CARRERA =====================
        const clasesRelevantes = clasesRes.filter((clase) => {
          const idGrupo = obtenerId(clase.idGrupo);
          const grupoObj = gruposMap[idGrupo];
          if (!grupoObj) return false;

          return (
            obtenerId(grupoObj.idCarrera) === idCarreraAlumno &&
            obtenerId(grupoObj.idPeriodo) === idPeriodoActual.toString()
          );
        });

        // ===================== OCUPABILIDAD =====================
        const ocupabilidadResponses = await Promise.all(
          clasesRelevantes.map((c) =>
            apiCall(`/inscripcionClase/clase/${c._id}/conteo`, "GET").catch(() => ({
              inscritos: 0,
            }))
          )
        );

        const ocupabilidadMap = {};
        clasesRelevantes.forEach((c, i) => {
          ocupabilidadMap[c._id] = ocupabilidadResponses[i];
        });

        // ===================== PROCESAR CLASES =====================
        const disponibles = [];
        const inscritas = [];
        const semestresSet = new Set();

        for (const clase of clasesRelevantes) {
          const idClase = clase._id;
          const grupoObj = gruposMap[obtenerId(clase.idGrupo)];

          let materiaObj = materiasMap[obtenerId(clase.idMateria)];
          if (!materiaObj) continue;

          const semestreMateria = materiaObj.semestre || 0;
          semestresSet.add(semestreMateria);

          // Procesar horarios
          const horario = {
            lunes: "-",
            martes: "-",
            miercoles: "-",
            jueves: "-",
            viernes: "-",
          };

          const idsDia = {};

          Object.keys(clase.horario || {}).forEach((diaKey) => {
            const diaInfo = clase.horario[diaKey];
            if (!diaInfo) return;

            const diaObj = diasSemanaMap[obtenerId(diaInfo.idDia)];
            if (!diaObj) return;

            horario[diaKey.toLowerCase()] = `${diaObj.horarioInicio} - ${diaObj.horarioFinal}`;
            idsDia[`${diaKey.toLowerCase()}_idDia`] = diaObj._id;
          });

          const ocup = ocupabilidadMap[idClase] || { inscritos: 0 };

          const claseData = {
            idClase,
            grupo: grupoObj.nombre,
            semestre: semestreMateria,
            salon: clase.salon || "-",
            materia: materiaObj.nombre,
            creditos: materiaObj.creditos,
            ...horario,
            ...idsDia,
            ocupabilidad: `${ocup.inscritos}/${clase.cupoMaximo || 30}`,
            inscritos: ocup.inscritos,
            cupoMaximo: clase.cupoMaximo || 30,
          };

          const inscrita = inscripcionesClaseActual.find(
            (ic) => obtenerId(ic.idClase) === idClase
          );

          if (inscrita) {
            inscritas.push({
              ...claseData,
              idInscripcionClase: inscrita._id,
            });
          } else {
            disponibles.push(claseData);
          }
        }

        const usados = inscritas.reduce((s, c) => s + c.creditos, 0);

        setMateriasDisponibles(disponibles);
        setMateriasInscritas(inscritas);
        setCreditosRestantes(MAX_CREDITOS - usados);
        setSemestresDisponibles(Array.from(semestresSet).sort());
      } catch (error) {
        console.error(error);
        setMensaje({
          visible: true,
          titulo: "Error",
          texto: "No se pudo cargar el horario.",
        });
      } finally {
        if (montado) setCargando(false);
      }
    };

    fetchDatos();
    return () => (montado = false);
  }, [idAlumno, idPeriodoActual]);

  // -------------------------------------------------------------------------
  // VALIDAR TRASLAPES
  // -------------------------------------------------------------------------
  const verificarTraslapes = useCallback((materia, inscritas) => {
    const dias = ["lunes", "martes", "miercoles", "jueves", "viernes"];

    for (const dia of dias) {
      if (materia[dia] === "-" || !materia[`${dia}_idDia`]) continue;

      for (const ins of inscritas) {
        if (
          ins[dia] !== "-" &&
          ins[`${dia}_idDia`] &&
          ins[`${dia}_idDia`].toString() === materia[`${dia}_idDia`].toString()
        ) {
          return ins.materia;
        }
      }
    }
    return null;
  }, []);

  // -------------------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------------------
  const handleInscribir = useCallback(
    (materia) => {
      const conflicto = verificarTraslapes(materia, materiasInscritas);
      if (conflicto) {
        setMensaje({
          visible: true,
          titulo: "Traslape",
          texto: `No puedes inscribir esta materia porque se traslapa con ${conflicto}.`,
        });
        return;
      }

      if (creditosRestantes - materia.creditos < 0) {
        setMensaje({
          visible: true,
          titulo: "Créditos insuficientes",
          texto: "No tienes créditos suficientes.",
        });
        return;
      }

      setMateriasInscritas((prev) => [...prev, materia]);
      setMateriasDisponibles((prev) =>
        prev.filter((m) => m.idClase !== materia.idClase)
      );
      setCreditosRestantes((prev) => prev - materia.creditos);
    },
    [materiasInscritas, creditosRestantes, verificarTraslapes]
  );

  const handleDarDeBaja = useCallback((materia) => {
    if (!window.confirm("¿Deseas dar de baja esta materia?")) return;

    setMateriasInscritas((prev) =>
      prev.filter((m) => m.idClase !== materia.idClase)
    );

    setMateriasDisponibles((prev) => [...prev, materia]);

    setCreditosRestantes((prev) => prev + materia.creditos);
  }, []);

  const handleGuardarCambios = async () => {
    try {
      const nuevas = materiasInscritas.filter((m) => !m.idInscripcionClase);

      for (const materia of nuevas) {
        await apiCall("/inscripcionClase", "POST", {
          idInscripcion,
          idClase: materia.idClase,
          estatus: "Inscrito",
        });
      }

      await apiCall(`/inscripcion/${idInscripcion}`, "PUT", {
        creditos: MAX_CREDITOS - creditosRestantes,
      });

      setMensaje({
        visible: true,
        titulo: "Éxito",
        texto: "Cambios guardados.",
      });

      setTimeout(() => window.location.reload(), 1000);
    } catch {
      setMensaje({
        visible: true,
        titulo: "Error",
        texto: "No se pudieron guardar los cambios.",
      });
    }
  };

  const columnasBase = [
    { key: "grupo", label: "Grupo", width: "80px" },
    { key: "salon", label: "Salón", width: "80px" },
    { key: "materia", label: "Materia", width: "260px" },
    { key: "creditos", label: "Créditos", width: "80px" },
    { key: "lunes", label: "Lunes", width: "110px" },
    { key: "martes", label: "Martes", width: "110px" },
    { key: "miercoles", label: "Miércoles", width: "110px" },
    { key: "jueves", label: "Jueves", width: "110px" },
    { key: "viernes", label: "Viernes", width: "110px" },
    { key: "ocupabilidad", label: "Cupo", width: "100px" },
  ];

  const columnasDisponibles = [
    ...columnasBase,
    { key: "accion", label: "", width: "80px" },
  ];

  const columnasInscritas = [
    ...columnasBase,
    { key: "accion", label: "", width: "100px" },
  ];

  const renderCellDisponibles = (item, key) => {
    if (key === "accion") {
      return (
        <Button
          variant="primary"
          onClick={() => handleInscribir(item)}
          style={{ padding: "4px 10px" }}
        >
          +
        </Button>
      );
    }
    return item[key] || "-";
  };

  const renderCellInscritas = (item, key) => {
    if (key === "accion") {
      return (
        <Button
          variant="danger"
          onClick={() => handleDarDeBaja(item)}
          style={{ padding: "4px 10px" }}
        >
          ELIMINAR
        </Button>
      );
    }
    return item[key] || "-";
  };

  const materiasFiltradas = useMemo(() => {
    let resultado = materiasDisponibles;

    if (filtroSemestre)
      resultado = resultado.filter(
        (m) => m.semestre === parseInt(filtroSemestre)
      );

    if (filtroGrupo)
      resultado = resultado.filter((m) => m.grupo === filtroGrupo);

    if (filtroMateria.trim()) {
      const search = filtroMateria.toLowerCase().trim();
      resultado = resultado.filter((m) =>
        m.materia.toLowerCase().includes(search)
      );
    }

    return resultado;
  }, [materiasDisponibles, filtroSemestre, filtroGrupo, filtroMateria]);

  if (cargando || !alumno) {
    return (
      <div className="bienvenida-container">
        <MenuAdmin />
        <main className="page" style={{ padding: 40 }}>
          <p>Cargando horario del alumno...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="bienvenida-container">
      <MenuAdmin />

      <main className="page">
        <div
          className="horario-container"
          style={{
            display: "flex",
            gap: "30px",
            margin: "30px auto",
            maxWidth: "1400px",
            padding: "0 20px",
          }}
        >
          {/*  ASIDE  */}
          <aside
            className="horario-side"
            style={{
              flex: "0 0 320px",
              padding: "20px",
              borderRadius: "10px",
              background: "#f8f8fb",
              height: "fit-content",
            }}
          >
            <h3 style={{ color: "#243159", fontSize: "1.4em" }}>
              Gestión de horario (ADMIN)
            </h3>

            <div style={{ marginTop: 15 }}>
              <p><strong>Boleta:</strong> {alumno.boleta}</p>
              <p><strong>Nombre:</strong> {alumno.nombre}</p>
              <p><strong>Carrera:</strong> {alumno.carrera}</p>
              <p><strong>Semestre actual:</strong> {alumno.semestre}</p>
            </div>

            {/* CAMBIAR SEMESTRE */}
            <div style={{ marginTop: 15 }}>
              <label><strong>Cambiar semestre:</strong></label>
              <select
                value={nuevoSemestre}
                onChange={(e) => setNuevoSemestre(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: 5,
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                }}
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}° semestre
                  </option>
                ))}
              </select>

              <Button
                variant="primary"
                onClick={async () => {
                  try {
                    await apiCall(`/usuario/${idAlumno}`, "PUT", {
                      dataAlumno: { semestre: Number(nuevoSemestre) },
                    });

                    setMensaje({
                      visible: true,
                      titulo: "Éxito",
                      texto: "Semestre actualizado correctamente.",
                    });

                    setAlumno((prev) => ({
                      ...prev,
                      semestre: Number(nuevoSemestre),
                    }));
                  } catch {
                    setMensaje({
                      visible: true,
                      titulo: "Error",
                      texto: "No se pudo actualizar el semestre.",
                    });
                  }
                }}
                style={{ marginTop: 8, width: "100%" }}
              >
                Guardar semestre
              </Button>
            </div>

            {/* CRÉDITOS */}
            <div className={styles.creditosWidget} style={{ marginTop: 20 }}>
              <h4>Créditos del horario</h4>
              <span>
                {MAX_CREDITOS - creditosRestantes} / {MAX_CREDITOS}
              </span>
            </div>

            {/* FILTROS */}
            <div className={styles.filtrosContainer} style={{ marginTop: 20 }}>
              <h4>Filtros de materias</h4>

              <SelectField
                label="Semestre"
                value={filtroSemestre}
                onChange={(e) => {
                  setFiltroSemestre(e.target.value);
                  setFiltroGrupo("");
                }}
                options={[
                  { value: "", label: "Todos" },
                  ...semestresDisponibles.map((s) => ({
                    value: s.toString(),
                    label: `${s}º semestre`,
                  })),
                ]}
              />

              <SelectField
                label="Grupo"
                value={filtroGrupo}
                onChange={(e) => setFiltroGrupo(e.target.value)}
                options={[
                  { value: "", label: "Todos" },
                  ...Array.from(
                    new Set(
                      materiasDisponibles.map((m) => m.grupo)
                    )
                  ).map((g) => ({ value: g, label: g })),
                ]}
              />

              <label style={{ marginTop: 10, display: "block" }}>
                <strong>Buscar materia:</strong>
              </label>
              <input
                type="text"
                placeholder="Nombre de la materia..."
                value={filtroMateria}
                onChange={(e) => setFiltroMateria(e.target.value)}
                className={styles.inputFiltro}
              />
            </div>

            <Button
              variant="primary"
              onClick={handleGuardarCambios}
              disabled={materiasInscritas.filter((m) => !m.idInscripcionClase).length === 0}
              style={{ marginTop: 20, width: "100%" }}
            >
              Guardar inscripción
            </Button>

            <Button
              variant="secondary"
              onClick={() => navigate(-1)}
              style={{ marginTop: 10, width: "100%" }}
            >
              Regresar
            </Button>
          </aside>

          {/*  TABLAS MAIN */}
          <section className="horario-main" style={{ flex: 1 }}>
            <h2 style={{ color: "#243159", marginBottom: 10 }}>
              Materias disponibles
            </h2>
            <div className={styles.tablaWrapper}>
              <Table
                columns={columnasDisponibles}
                data={materiasFiltradas}
                renderCell={renderCellDisponibles}
                emptyMessage="No hay materias disponibles con los filtros seleccionados."
                striped
                hover
              />
            </div>

            <h2 className={styles.tituloMateriasInscritas} style={{ marginTop: 25 }}>
              Materias inscritas
            </h2>
            <div className={styles.tablaWrapper}>
              <Table
                columns={columnasInscritas}
                data={materiasInscritas}
                renderCell={renderCellInscritas}
                emptyMessage="El alumno no tiene materias inscritas."
                striped
                hover
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
