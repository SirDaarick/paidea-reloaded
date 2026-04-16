import React, { useMemo, useState, useEffect } from "react";
import MenuAdmin from "components/MenuAdmin";
import Table from "components/Table";
import Button from "components/Button";

// Modals
import Modal from "pages/administradores/Modal";
import ModalAltaAlumno from "pages/administradores/ModalAltaAlumno";
import ModalBajaAlumno from "pages/administradores/ModalBajaAlumno";

import Mensaje from "components/Mensaje";

// API
import apiCall from "consultas/APICall";
import { useNavigate } from "react-router-dom";

// Estilos
import "styles/index.css";
import "styles/catalogoAdmin.css";

const ADMIN_PASSWORD = "Admin123";

const GestionAlumnos = () => {
  const navigate = useNavigate();

  // --- ESTADOS ---
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [mensajeData, setMensajeData] = useState({
    visible: false,
    titulo: "",
    mensaje: ""
  });

  const mostrarMensaje = (titulo, mensaje) => {
    setMensajeData({ visible: true, titulo, mensaje });
  };

  const [verPor, setVerPor] = useState("carrera");
  const [search, setSearch] = useState("");

  // Filtros laterales
  const [filtrosLaterales, setFiltrosLaterales] = useState({
    nombre: "",
    boleta: "",
    grupo: "",
    carrera: "",
  });

  // Listas dinámicas desde BD
  const [listaCarreras, setListaCarreras] = useState([]);
  const [listaGrupos, setListaGrupos] = useState([]);

  // Modals
  const [showAltaModal, setShowAltaModal] = useState(false);
  const [showBajaModal, setShowBajaModal] = useState(false);

  const gruposUnicos = useMemo(
    () => [...new Set(listaGrupos)],
    [listaGrupos]
  );

  const carrerasUnicas = useMemo(
    () => [...new Set(listaCarreras)],
    [listaCarreras]
  );

  // --- 1. CARGAR CATÁLOGOS DE GRUPOS Y CARRERAS ---
  useEffect(() => {
    fetchCarrerasYGrupos();
  }, []);

  const fetchCarrerasYGrupos = async () => {
    try {
      const carrerasBD = await apiCall("/carrera");
      const gruposBD = await apiCall("/grupo");

      setListaCarreras(carrerasBD.map(c => c.nombre));
      setListaGrupos(gruposBD.map(g => g.nombre));
    } catch (err) {
      console.error("Error cargando catálogos:", err);
    }
  };

  // --- 2. CARGAR ALUMNOS ---
  useEffect(() => {
    fetchAlumnos();
  }, []);

  const fetchAlumnos = async () => {
    setLoading(true);
    try {
      const data = await apiCall("/usuario");

      const soloAlumnos = data.filter(u => u.rol === "Alumno");

      const alumnosMapeados = soloAlumnos.map(a => {
        const carreraObj = a.dataAlumno?.idCarrera;

        const carreraNombre =
          typeof carreraObj === "object" && carreraObj !== null
            ? carreraObj.nombre || "S/A"
            : "S/A";

        return {
          _id: a._id,
          boleta: a.boleta || "S/A",
          nombre: a.nombre,
          carrera: carreraNombre,
          semestre: a.dataAlumno?.semestre || "1",
          grupo: a.dataAlumno?.grupo || "Sin Grupo",
          status: "Regular",
          creditos: a.dataAlumno?.creditosCursados || 0,
          promedio: a.dataAlumno?.promedio || 0,
          original: a
        };
      });

      setAlumnos(alumnosMapeados);

    } catch (error) {
      console.error("ERROR AL CARGAR ALUMNOS:", error);
      mostrarMensaje("Error", "No se pudieron cargar los alumnos.");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. ALTA CORREGIDA (Estructurando los datos) ---
  const handleAltaAlumno = async (datosAlumno) => {
    // Desestructuramos para sacar lo que no se envía a la BD (passwordAdmin) 
    // y tener las variables listas
    const { nombre, boleta, curp, correo, carrera, passwordAdmin } = datosAlumno;

    // VALIDACIÓN 1: Contraseña de admin
    if (passwordAdmin !== ADMIN_PASSWORD) {
      mostrarMensaje("Error", "Contraseña de administrador incorrecta.");
      throw new Error("Contraseña incorrecta"); 
    }

    try {
      // CORRECCIÓN AQUI: ESTRUCTURAR EL PAYLOAD
      // Debemos armar el objeto tal cual lo pide tu Schema de Mongoose
      const payload = {
        nombre: nombre,
        boleta: boleta,
        correo: correo,
        // Asignamos una contraseña por defecto (usualmente la boleta al inicio)
        contrasena: "Alumno123", 
        rol: "Alumno",
        
        // DATOS PERSONALES (Subdocumento)
        datosPersonales: {
            curp: curp,
            // rfc: si tu formulario lo pide, agrégalo aquí
        },
        
        // DATA ALUMNO (Subdocumento requerido para Alumnos)
        dataAlumno: {
            // Asegúrate de que 'carrera' sea el ID (_id) de la carrera, no el nombre.
            // Si tu modal manda el nombre, esto fallará en el backend.
            idCarrera: carrera 
        }
      };

      // 2. Enviamos a la ruta "/usuario"
      await apiCall("/usuario", "POST", payload);
      
      mostrarMensaje("Éxito", `Alumno ${nombre} agregado correctamente.`);
      setShowAltaModal(false);
      fetchAlumnos(); 
      
      return true;

    } catch (error) {
      console.error(error);
      mostrarMensaje("Error", "Error al crear: " + (error.message || "Error desconocido"));
      throw error; 
    }
  };

  // --- 4. BAJA CORREGIDA ---
  const handleBajaAlumno = async (idAlumno) => {
    
    // CORRECCIÓN 1: Validar que sea un ID y no una boleta vacía
    if (!idAlumno) {
       mostrarMensaje("Error", "ID de alumno no válido.");
       throw new Error("ID inválido");
    }

    try {
      // CORRECCIÓN 2: CAMBIAR LA RUTA
      // Antes tenías: "/alumnos/" + idAlumno
      // El error 404 sugiere que esa ruta no existe. 
      // Como cargaste los alumnos desde "/usuario", lo más probable es que se borren ahí también.
      
      await apiCall(`/usuario/${idAlumno}`, "DELETE"); 
      
      // Si tu backend realmente usa /alumnos, revisa que la ruta esté creada en el servidor.
      // Pero por el 404, apuesto a que es /usuario.

      mostrarMensaje("Éxito", "Alumno eliminado permanentemente.");
      setShowBajaModal(false);
      
      // Actualizamos la lista local filtrando por _id
      setAlumnos(prev => prev.filter(a => a._id !== idAlumno));
      
    } catch (error) {
      console.error(error);
      // El error "Unexpected token '<'" desaparecerá cuando la ruta sea correcta
      mostrarMensaje("Error", "No se pudo eliminar. Verifique la conexión.");
      
      // Importante: Lanzar el error para que el Modal se entere
      throw error;
    }
  };

  // --- 5. FILTRADO TOTAL ---
  const alumnosFiltrados = useMemo(() => {
    return alumnos.filter((a) => {

      if (filtrosLaterales.nombre &&
        !a.nombre.toLowerCase().includes(filtrosLaterales.nombre.toLowerCase()))
        return false;

      if (filtrosLaterales.boleta &&
        !String(a.boleta).includes(filtrosLaterales.boleta))
        return false;

      if (filtrosLaterales.grupo &&
        a.grupo !== filtrosLaterales.grupo)
        return false;

      if (filtrosLaterales.carrera &&
        a.carrera !== filtrosLaterales.carrera)
        return false;

      if (search &&
        !a.nombre.toLowerCase().includes(search.toLowerCase()) &&
        !String(a.boleta).includes(search))
        return false;

      return true;
    });
  }, [alumnos, search, filtrosLaterales]);

  // --- BOTONES ---
  const tablaData = alumnosFiltrados.map((a) => ({
    ...a,
    horario: (
      <Button
        variant="secondary"
        style={{ padding: "5px" }}
        onClick={() => navigate(`/administrador/gestionar-materias-alumno/${a._id}`)}
      >
        Horario
      </Button>
    ),
    kardex: (
      <Button
        variant="secondary"
        style={{ padding: "5px" }}
        onClick={() => navigate(`/administrador/kardex-boleta/${a.boleta}`)}
      >
        Kardex
      </Button>
    ),
  }));

  const columnasPorCriterio = {
    carrera: [
      { key: "boleta", label: "Boleta", width: "15%" },
      { key: "nombre", label: "Nombre", width: "40%" },
      { key: "carrera", label: "Carrera", width: "15%" },
      { key: "horario", label: "Horario", width: "15%" },
      { key: "kardex", label: "Kardex", width: "15%" },
    ],
    semestre: [
      { key: "boleta", label: "Boleta", width: "15%" },
      { key: "nombre", label: "Nombre", width: "40%" },
      { key: "semestre", label: "Semestre", width: "15%" },
      { key: "horario", label: "Horario", width: "15%" },
      { key: "kardex", label: "Kardex", width: "15%" },
    ],
  };

  return (
    <div className="bienvenida-container">
      <MenuAdmin />
      <div className="ra-container" style={{ paddingTop: 18 }}>

        {/* BARRA LATERAL */}
        <aside className="ra-side">
          <h3 className="ra-side-title">Filtrar por:</h3>

          {/* NOMBRE */}
          <div className="ra-row" style={{ marginBottom: 18 }}>
            <label>Nombre</label>
            <input
              type="text"
              placeholder="Nombre"
              value={filtrosLaterales.nombre}
              onChange={(e) =>
                setFiltrosLaterales(prev => ({ ...prev, nombre: e.target.value }))
              }
            />
          </div>

          {/* BOLETA */}
          <div className="ra-row" style={{ marginBottom: 18 }}>
            <label>Boleta</label>
            <input
              type="text"
              placeholder="Boleta"
              value={filtrosLaterales.boleta}
              onChange={(e) =>
                setFiltrosLaterales(prev => ({ ...prev, boleta: e.target.value }))
              }
            />
          </div>

          {/* GRUPO BD */}
          <div className="ra-row" style={{ marginBottom: 18 }}>
            <label>Grupo</label>
            <select
              value={filtrosLaterales.grupo}
              onChange={(e) =>
                setFiltrosLaterales(prev => ({ ...prev, grupo: e.target.value }))
              }
            >
              <option value="">Todos</option>
              {gruposUnicos.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* CARRERA BD */}
          <div className="ra-row" style={{ marginBottom: 18 }}>
            <label>Carrera</label>
            <select
              value={filtrosLaterales.carrera}
              onChange={(e) =>
                setFiltrosLaterales(prev => ({ ...prev, carrera: e.target.value }))
              }
            >
              <option value="">Todas</option>
              {carrerasUnicas.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </aside>

        {/* TABLA */}
        <main style={{ padding: "0 24px", flex: 1 }}>
          <h2 style={{ textAlign: "center" }}>Catálogo de Alumnos</h2>

          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <select value={verPor} onChange={(e) => setVerPor(e.target.value)}>
              <option value="carrera">Ver por Carrera</option>
              <option value="semestre">Ver por Semestre</option>
            </select>

            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />

            <button className="catalogo-btn-success" onClick={() => setShowAltaModal(true)}>Alta</button>
            <button className="catalogo-btn-danger" onClick={() => setShowBajaModal(true)}>Baja</button>
          </div>

          <div className="catalogo-table-wrapper">
            {loading ? <p>Cargando...</p> :
              <Table columns={columnasPorCriterio[verPor]} data={tablaData} />
            }
          </div>

        </main>
      </div>

      {/* MODAL ALTA */}
      <Modal isOpen={showAltaModal} onClose={() => setShowAltaModal(false)}>
        <ModalAltaAlumno onAltaSubmit={handleAltaAlumno} />
      </Modal>

      {/* MODAL BAJA */}
      <Modal isOpen={showBajaModal} onClose={() => setShowBajaModal(false)}>
        <ModalBajaAlumno
          onBajaSubmit={handleBajaAlumno}
          listaAlumnos={alumnos}
        />
      </Modal>

      {/* MENSAJES */}
      <Mensaje
        visible={mensajeData.visible}
        titulo={mensajeData.titulo}
        mensaje={mensajeData.mensaje}
        onCerrar={() => setMensajeData({ ...mensajeData, visible: false })}
      />
    </div>
  );
};

export default GestionAlumnos;
