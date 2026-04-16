import React, { useState, useEffect, useMemo } from "react";
import MenuAdmin from "components/MenuAdmin";
import CuadroDatos from "components/CuadroDatos";
import Table from "components/Table";
import Button from "components/Button";
import Mensaje from "components/Mensaje";
import "styles/GestionHorario.css";

import apiCall from "consultas/APICall";
import { useParams } from "react-router-dom";
import { useProfesor } from "hooks/useProfesor";

export default function GestionHorarioProfesor() {
  const { idProfesor } = useParams();
  const { profesor } = useProfesor(idProfesor);

  const [clasesAsignadas, setClasesAsignadas] = useState([]);
  const [clasesDisponibles, setClasesDisponibles] = useState([]);

  const [filtroGrupo, setFiltroGrupo] = useState("");
  const [filtroMateria, setFiltroMateria] = useState("");

  const [mensaje, setMensaje] = useState({
    visible: false,
    titulo: "",
    mensaje: "",
  });

  // --------------------------------------------------------------------
  //        CARGA DE DATOS
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!idProfesor) return;
    cargarDatos();
  }, [idProfesor]);

  const cargarDatos = async () => {
    try {
      const todasClases = await apiCall("/clase", "GET");

      const asignadas = [];
      const disponibles = [];

      todasClases.forEach((clase) => {
        const idProfClase = clase.idProfesor?._id || clase.idProfesor;

        const materiaObj =
          typeof clase.idMateria === "object" ? clase.idMateria : {};
        const grupoObj = typeof clase.idGrupo === "object" ? clase.idGrupo : {};

        const format = (diaObj) =>
          diaObj?.idDia
            ? `${diaObj.idDia.horarioInicio} - ${diaObj.idDia.horarioFinal}`
            : "-";

        const formateada = {
          idClase: clase._id,
          grupo: grupoObj.nombre || "-",
          salon: clase.salon || "-",
          materia: materiaObj.nombre || "-",
          creditos: materiaObj.creditos || 0,
          semestre: materiaObj.semestre || 0,

          lunes: format(clase.horario?.lunes),
          martes: format(clase.horario?.martes),
          miercoles: format(clase.horario?.miercoles),
          jueves: format(clase.horario?.jueves),
          viernes: format(clase.horario?.viernes),
        };

        if (idProfClase === idProfesor) asignadas.push(formateada);
        else disponibles.push(formateada);
      });

      setClasesAsignadas(asignadas);
      setClasesDisponibles(disponibles);
    } catch (err) {
      mostrarMensaje("Error", "No se pudieron cargar las clases.");
    }
  };

  // --------------------------------------------------------------------
  //        MENSAJES
  // --------------------------------------------------------------------
  const mostrarMensaje = (titulo, mensaje) => {
    setMensaje({ visible: true, titulo, mensaje });
  };

  // --------------------------------------------------------------------
  //   VALIDACIÓN DE TRASLAPES Y DUPLICADOS
  // --------------------------------------------------------------------
  const hayTraslape = (nueva, asignadas) => {
    const dias = ["lunes", "martes", "miercoles", "jueves", "viernes"];

    for (const clase of asignadas) {
      // 1. MISMA MATERIA EN MISMO GRUPO
      if (clase.materia === nueva.materia && clase.grupo === nueva.grupo) {
        return `La materia '${nueva.materia}' ya está asignada en el grupo ${nueva.grupo}.`;
      }

      // 2. TRASLAPE DE HORARIO
      for (const dia of dias) {
        const nuevoDia = nueva[dia];
        const asignadoDia = clase[dia];

        if (nuevoDia === "-" || asignadoDia === "-") continue;

        const [iniN, finN] = nuevoDia.split(" - ");
        const [iniA, finA] = asignadoDia.split(" - ");

        const traslape =
          (iniN >= iniA && iniN < finA) ||
          (finN > iniA && finN <= finA) ||
          (iniN <= iniA && finN >= finA);

        if (traslape) {
          return `Se traslapa con '${clase.materia}' del grupo ${clase.grupo} el día ${dia.toUpperCase()}.`;
        }
      }
    }
    return null;
  };

  // --------------------------------------------------------------------
  //        ASIGNAR CLASE
  // --------------------------------------------------------------------
  const asignarClase = async (clase) => {
    const conflicto = hayTraslape(clase, clasesAsignadas);

    if (conflicto) {
      mostrarMensaje("Traslape detectado", conflicto);
      return;
    }

    try {
      await apiCall(`/clase/${clase.idClase}`, "PUT", {
        idProfesor: idProfesor,
      });

      setClasesAsignadas((prev) => [...prev, clase]);
      setClasesDisponibles((prev) =>
        prev.filter((c) => c.idClase !== clase.idClase)
      );

      mostrarMensaje(
        "Asignada",
        `La materia '${clase.materia}' fue asignada correctamente.`
      );
    } catch (err) {
      mostrarMensaje("Error", "No se pudo asignar la clase.");
    }
  };

  // --------------------------------------------------------------------
  //        QUITAR CLASE
  // --------------------------------------------------------------------
  const quitarClase = async (clase) => {
    if (!window.confirm("¿Deseas quitar esta materia del profesor?")) return;

    try {
      await apiCall(`/clase/${clase.idClase}`, "PUT", {
        idProfesor: null,
      });

      setClasesDisponibles((prev) => [...prev, clase]);
      setClasesAsignadas((prev) =>
        prev.filter((c) => c.idClase !== clase.idClase)
      );

      mostrarMensaje("Eliminada", `Se quitó '${clase.materia}'.`);
    } catch (err) {
      mostrarMensaje("Error", "No se pudo quitar la clase.");
    }
  };

  // --------------------------------------------------------------------
  //        FILTROS
  // --------------------------------------------------------------------
  const clasesFiltradas = useMemo(() => {
    let r = clasesDisponibles;

    if (filtroGrupo) r = r.filter((c) => c.grupo === filtroGrupo);

    if (filtroMateria.trim()) {
      const search = filtroMateria.toLowerCase();
      r = r.filter((c) => c.materia.toLowerCase().includes(search));
    }

    return r;
  }, [clasesDisponibles, filtroGrupo, filtroMateria]);

  // --------------------------------------------------------------------
  //        COLUMNAS TABLAS
  // --------------------------------------------------------------------
  const columnas = [
    { key: "grupo", label: "Grupo" },
    { key: "salon", label: "Salón" },
    { key: "materia", label: "Materia" },
    { key: "lunes", label: "Lunes" },
    { key: "martes", label: "Martes" },
    { key: "miercoles", label: "Miércoles" },
    { key: "jueves", label: "Jueves" },
    { key: "viernes", label: "Viernes" },
    { key: "accion", label: "Acción", width: "90px" },
  ];

  const renderCellDisponible = (item, key) => {
    if (key === "accion") {
      return (
        <Button variant="primary" onClick={() => asignarClase(item)}>
          Asignar
        </Button>
      );
    }
    return item[key] || "-";
  };

  const renderCellAsignadas = (item, key) => {
    if (key === "accion") {
      return (
        <Button variant="danger" onClick={() => quitarClase(item)}>
          Quitar
        </Button>
      );
    }
    return item[key] || "-";
  };

  // --------------------------------------------------------------------
  //                          UI
  // --------------------------------------------------------------------
  return (
    <div className="grupos-container">
      <MenuAdmin />

      <main className="grupos-page">
        <div className="grupos-content">
          <CuadroDatos
            datos={{
              Nombre: profesor?.nombre || "",
              RFC: profesor?.datosPersonales?.rfc || "",
              Academia: profesor?.dataProfesor?.departamento || "",
            }}
          />

          {/* ASIGNADAS */}
          <section className="grupos-card">
            <h2>Materias Asignadas</h2>

            <Table
              columns={columnas}
              data={clasesAsignadas}
              renderCell={renderCellAsignadas}
              emptyMessage="No tiene materias asignadas"
              striped
              hover
            />

            {/* DISPONIBLES */}
            <h2 style={{ marginTop: 40 }}>Materias Disponibles</h2>

            <div className="filtros">
              <input
                placeholder="Buscar materia"
                value={filtroMateria}
                onChange={(e) => setFiltroMateria(e.target.value)}
              />

              <select
                value={filtroGrupo}
                onChange={(e) => setFiltroGrupo(e.target.value)}
              >
                <option value="">Todos los grupos</option>
                {[...new Set(clasesDisponibles.map((c) => c.grupo))].map(
                  (g) => (
                    <option key={g}>{g}</option>
                  )
                )}
              </select>
            </div>

            <Table
              columns={columnas}
              data={clasesFiltradas}
              renderCell={renderCellDisponible}
              emptyMessage="No hay clases disponibles"
              striped
              hover
            />
          </section>
        </div>
      </main>

      <Mensaje
        visible={mensaje.visible}
        titulo={mensaje.titulo}
        mensaje={mensaje.mensaje}
        onCerrar={() => setMensaje({ ...mensaje, visible: false })}
      />
    </div>
  );
}
