import React, { useState } from "react";
import MenuAdmin from "components/MenuAdmin";
import CuadroDatos from "components/CuadroDatos";
import Table from "components/Table";
import Button from "components/Button";
import Mensaje from "components/Mensaje"; // <-- Importa tu componente
import "styles/CorrecionActa.css";

export default function CorrecionActas() {
  const [modo, setModo] = useState("grupo");
  const [filtros, setFiltros] = useState({ carrera: "", grupo: "", materia: "", busqueda: "" });
  const [modalActivo, setModalActivo] = useState(false);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [adminPass, setAdminPass] = useState("");
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });

  // Datos simulados
  const [data, setData] = useState([
    { boleta: "2023630001", nombre: "Ana García López", extraordinario: "NP", final: "6", grupo: "6CM2", carrera: "ISC", materia: "Ingeniería de Software" },
    { boleta: "2023630002", nombre: "Luis Pérez Soto", extraordinario: "NP", final: "10", grupo: "6CM2", carrera: "ISC", materia: "Bases de Datos" },
    { boleta: "2023630003", nombre: "Carlos Díaz Torres", extraordinario: "NP", final: "8", grupo: "6CM1", carrera: "ISC", materia: "Programación Avanzada" },
    { boleta: "2023630004", nombre: "María Hernández Cruz", extraordinario: "7", final: "7", grupo: "6BI1", carrera: "IIA", materia: "Inteligencia Artificial" },
    { boleta: "2023630005", nombre: "Sofía Torres Jiménez", extraordinario: "NP", final: "6", grupo: "6BI1", carrera: "IIA", materia: "Aprendizaje Automático" },
    { boleta: "2023630006", nombre: "Raúl Medina Pérez", extraordinario: "NP", final: "9", grupo: "6BI2", carrera: "IIA", materia: "Procesamiento de Lenguaje Natural" },
    { boleta: "2023630007", nombre: "Laura González Vega", extraordinario: "NP", final: "8", grupo: "6AD1", carrera: "LCD", materia: "Ciencia de Datos" },
    { boleta: "2023630008", nombre: "Miguel Torres Díaz", extraordinario: "6", final: "6", grupo: "6AD2", carrera: "LCD", materia: "Minería de Datos" },
    { boleta: "2023630009", nombre: "Diana Ramírez Luna", extraordinario: "NP", final: "10", grupo: "6AD2", carrera: "LCD", materia: "Estadística Aplicada" },
  ]);

  const relaciones = {
    LCD: { grupos: ["6AD1", "6AD2"], materias: { "6AD1": ["Ciencia de Datos"], "6AD2": ["Minería de Datos", "Estadística Aplicada"] } },
    IIA: { grupos: ["6BI1", "6BI2"], materias: { "6BI1": ["Inteligencia Artificial", "Aprendizaje Automático"], "6BI2": ["Procesamiento de Lenguaje Natural"] } },
    ISC: { grupos: ["6CM1", "6CM2"], materias: { "6CM1": ["Programación Avanzada"], "6CM2": ["Ingeniería de Software", "Bases de Datos"] } },
  };

  const datosGenerales = { RFC: "PEXJ900315XXX", NOMBRE: "Juanita Perez", Academia: "Desarrollo de software" };
  const columns = [
    { key: "boleta", label: "Boleta" },
    { key: "nombre", label: "Nombre completo" },
    { key: "extraordinario", label: "Extraordinario" },
    { key: "final", label: "Final" },
    { key: "acciones", label: "Acciones" },
  ];

  const filteredData = data
    .filter((item) => {
      const matchCarrera = filtros.carrera ? item.carrera === filtros.carrera : true;
      const matchGrupo = filtros.grupo ? item.grupo === filtros.grupo : true;
      const matchMateria = filtros.materia ? item.materia === filtros.materia : true;
      const matchBusqueda =
        modo === "alumno" && filtros.busqueda.trim() !== ""
          ? item.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase()) || item.boleta.includes(filtros.busqueda)
          : true;
      return matchCarrera && matchGrupo && matchMateria && matchBusqueda;
    })
    .map((item) => ({
      ...item,
      acciones: (
        <Button
          variant="secondary"
          onClick={() => {
            setAlumnoSeleccionado(item);
            setModalActivo(true);
          }}
        >
          Cambiar
        </Button>
      ),
    }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "carrera") setFiltros({ carrera: value, grupo: "", materia: "", busqueda: filtros.busqueda });
    else if (name === "grupo") setFiltros({ ...filtros, grupo: value, materia: "" });
    else setFiltros({ ...filtros, [name]: value });
  };

  const handleArchivo = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.click();
  };

  // === Cambio principal: cerrar modal si contraseña incorrecta ===
  const handleGuardarCambios = () => {
    if (adminPass !== "admin123") {
      setMensaje({ texto: "Contraseña incorrecta", tipo: "error" });
      setModalActivo(false); // Cierra el modal
      setAdminPass("");      // Limpia la contraseña ingresada
      return;
    }
    setData((prevData) =>
      prevData.map((alumno) =>
        alumno.boleta === alumnoSeleccionado.boleta ? alumnoSeleccionado : alumno
      )
    );
    setModalActivo(false);
    setAdminPass("");
    setMensaje({ texto: "Cambios guardados correctamente", tipo: "exito" });
  };

  const gruposDisponibles =
    filtros.carrera && relaciones[filtros.carrera] ? relaciones[filtros.carrera].grupos : [];
  const materiasDisponibles =
    filtros.carrera && filtros.grupo && relaciones[filtros.carrera].materias[filtros.grupo]
      ? relaciones[filtros.carrera].materias[filtros.grupo]
      : [];

  return (
    <>
      <MenuAdmin />
      <div className="correcion-container">
        <div className="sidebar">
          <CuadroDatos datos={datosGenerales} />
          {modo === "grupo" && <Button variant="primary" onClick={handleArchivo}>Subir archivo CSV</Button>}
        </div>

        <div className="main-content">
          <h2 className="titulo">Corregir actas de profesor</h2>

          {/* Mensaje siempre al frente */}
          <Mensaje
            titulo={mensaje.tipo === "error" ? "Error" : "Éxito"}
            mensaje={mensaje.texto}
            visible={!!mensaje.texto}
            onCerrar={() => setMensaje({ texto: "", tipo: "" })}
          />

          <div className="filtros-container">
            <div className="modo-selector">
              <label>Filtrar por:</label>
              <select value={modo} onChange={(e) => setModo(e.target.value)}>
                <option value="grupo">Grupo</option>
                <option value="alumno">Alumno</option>
              </select>
            </div>

            {modo === "grupo" ? (
              <>
                <div className="filtro">
                  <label>Carrera</label>
                  <select name="carrera" value={filtros.carrera} onChange={handleChange}>
                    <option value="">Seleccionar carrera</option>
                    <option value="LCD">Licenciatura en Ciencia de Datos</option>
                    <option value="IIA">Ingeniería en Inteligencia Artificial</option>
                    <option value="ISC">Ingeniería en Sistemas Computacionales</option>
                  </select>
                </div>

                <div className="filtro">
                  <label>Grupo</label>
                  <select name="grupo" value={filtros.grupo} onChange={handleChange} disabled={!filtros.carrera}>
                    <option value="">Seleccionar grupo</option>
                    {gruposDisponibles.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div className="filtro">
                  <label>Materia</label>
                  <select name="materia" value={filtros.materia} onChange={handleChange} disabled={!filtros.grupo}>
                    <option value="">Seleccionar materia</option>
                    {materiasDisponibles.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <div className="filtro-busqueda">
                <label>Buscar alumno</label>
                <input type="text" name="busqueda" value={filtros.busqueda} onChange={handleChange} placeholder="Buscar por nombre o boleta..." />
              </div>
            )}
          </div>

          <Table columns={columns} data={filteredData} />
        </div>
      </div>

      {/* Modal para cambiar calificaciones */}
      {modalActivo && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Cambiar calificaciones</h3>
            <p className="modal-subtitulo">{alumnoSeleccionado.nombre}</p>

            <div className="inputs-modal">
              <label>Extraordinario</label>
              <input type="text" value={alumnoSeleccionado.extraordinario} onChange={(e) => setAlumnoSeleccionado({ ...alumnoSeleccionado, extraordinario: e.target.value })} />
              <label>Final</label>
              <input type="text" value={alumnoSeleccionado.final} onChange={(e) => setAlumnoSeleccionado({ ...alumnoSeleccionado, final: e.target.value })} />
              <label>Contraseña del administrador</label>
              <input type="password" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} placeholder="Ingresa la contraseña..." />
            </div>

            <div className="modal-buttons">
              <Button variant="primary" onClick={handleGuardarCambios}>Guardar</Button>
              <Button variant="secondary" onClick={() => setModalActivo(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
