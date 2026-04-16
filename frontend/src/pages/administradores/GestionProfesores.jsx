import React, { useMemo, useState, useEffect } from "react";
import MenuAdmin from "components/MenuAdmin";
import Button from "components/Button";
import Table from "components/Table";

// Modales
import Modal from "pages/administradores/Modal";
import ModalAltaProfesor from "pages/administradores/ModalAltaProfesor";
import ModalBajaProfesor from "pages/administradores/ModalBajaProfesor";

import Mensaje from "components/Mensaje";
import apiCall from "consultas/APICall";
import { useNavigate } from "react-router-dom";

// Estilos
import "styles/index.css";
import "styles/catalogoAdmin.css";

const ADMIN_PASSWORD = "Admin123";

const GestionProfesores = () => {
  const navigate = useNavigate();

  // ==============================
  // ESTADOS
  // ==============================
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filtros, setFiltros] = useState({ academia: "" });

  const [showAltaModal, setShowAltaModal] = useState(false);
  const [showBajaModal, setShowBajaModal] = useState(false);

  const [mensajeData, setMensajeData] = useState({
    visible: false,
    titulo: "",
    mensaje: "",
  });

  const mostrarMensaje = (titulo, mensaje) =>
    setMensajeData({ visible: true, titulo, mensaje });

  const cerrarMensaje = () =>
    setMensajeData((prev) => ({ ...prev, visible: false }));

  // ==============================
  // CARGA INICIAL
  // ==============================
  useEffect(() => {
    fetchProfesores();
  }, []);

  const fetchProfesores = async () => {
    setLoading(true);
    try {
      const data = await apiCall("/profesores/listar");

      const adaptados = data.map((p) => ({
        _id: p._id,
        rfc: p.datosPersonales?.rfc || "S/RFC",
        nombre: p.nombre,
        academia: p.dataProfesor?.departamento || "Sin academia",
      }));

      setProfesores(adaptados);
    } catch (error) {
      mostrarMensaje("Error", "Error al cargar profesores");
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // ALTA PROFESOR
  // ==============================
// ==============================
  // ALTA PROFESOR CORREGIDA
  // ==============================
  const handleAltaProfesor = async (datosProfesor) => {
    // Desestructuramos los datos que vienen del modal
    const { nombre, rfc, curp, correo, departamento, passwordAdmin } = datosProfesor;

    if (passwordAdmin !== ADMIN_PASSWORD) {
      mostrarMensaje("Error", "Contraseña incorrecta.");
      throw new Error("Contraseña incorrecta");
    }

    try {
      // Construimos el objeto final para la API
      const payload = {
        nombre,
        correo,
        contrasena: "Profesor123", // Contraseña por defecto
        rol: "Profesor",
        datosPersonales: {
            rfc: rfc,
            curp: curp
        },
        dataProfesor: {
            departamento: departamento // 👈 AQUÍ SE GUARDA LA ACADEMIA EN MONGO
        }
      };

      await apiCall("/usuario", "POST", payload); // Usamos /usuario para crear
      
      mostrarMensaje("Éxito", `Profesor ${nombre} agregado.`);
      setShowAltaModal(false);
      fetchProfesores();
    } catch (error) {
      // ... manejo de error
      throw error;
    }
};

  // ==============================
  // BAJA PROFESOR
  // ==============================
  // ==============================
  // BAJA PROFESOR CORREGIDA
  // ==============================
  const handleBajaProfesor = async (rfc) => {
    const profesor = profesores.find((p) => p.rfc === rfc);

    if (!profesor) {
      mostrarMensaje("Error", "Profesor no encontrado.");
      // Lanzar error si no existe
      throw new Error("Profesor no encontrado");
    }

    try {
      await apiCall(`/profesores/${profesor._id}`, "DELETE");
      mostrarMensaje("Éxito", "Profesor eliminado correctamente.");
      setShowBajaModal(false);
      
      // Actualizar estado local
      setProfesores((prev) =>
        prev.filter((p) => p._id !== profesor._id)
      );
    } catch (error) {
      console.error(error);
      mostrarMensaje("Error", "Error al eliminar profesor.");
      
      // IMPORTANTE: Re-lanzar el error
      throw error;
    }
  };

  // ==============================
  // FILTROS
  // ==============================
  const profesoresFiltrados = useMemo(() => {
    return profesores.filter((p) => {
      const s = search.toLowerCase();

      if (
        s &&
        !p.nombre.toLowerCase().includes(s) &&
        !p.rfc.toLowerCase().includes(s)
      ) {
        return false;
      }

      if (filtros.academia && p.academia !== filtros.academia) return false;

      return true;
    });
  }, [search, filtros, profesores]);

  // ==============================
  // TABLA
  // ==============================
  const columnas = [
    { key: "rfc", label: "RFC", width: "20%" },
    { key: "academia", label: "Academia", width: "30%" },
    { key: "nombre", label: "Nombre completo", width: "30%" },
    { key: "horario", label: "Horario", width: "20%" },
  ];

  const tablaData = profesoresFiltrados.map((p) => ({
    ...p,
    horario: (
      <Button
        variant="secondary"
        style={{ padding: "6px 10px" }}
        onClick={() =>
          navigate(`/administrador/gestion-horario-profesor/${p._id}`)
        }
      >
        Horario
      </Button>
    ),
  }));

  return (
    <div className="bienvenida-container">
      <MenuAdmin />

      <div className="ra-container" style={{ paddingTop: 18 }}>
        {/* SIDEBAR */}
        <aside className="ra-side">
          <h3>Filtrar por academia</h3>

          <select
            value={filtros.academia}
            onChange={(e) =>
              setFiltros({ ...filtros, academia: e.target.value })
            }
          >
            <option value="">Todas</option>
            {[...new Set(profesores.map((p) => p.academia))].map((ac) => (
              <option key={ac}>{ac}</option>
            ))}
          </select>

          
        </aside>

        {/* TABLA */}
        <main style={{ flex: 1, padding: "0 24px" }}>
          <h2 style={{ textAlign: "center", marginBottom: 18 }}>
            Catálogo de Profesores
          </h2>

          {/* 🔥 BUSCADOR + BOTONES */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <input
              type="text"
              placeholder="Buscar por RFC o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, padding: 10 }}
            />

            <button
              className="catalogo-btn-success"
              onClick={() => setShowAltaModal(true)}
            >
              Alta
            </button>

            <button
              className="catalogo-btn-danger"
              onClick={() => setShowBajaModal(true)}
            >
              Baja
            </button>
          </div>

          {loading ? (
            <p>Cargando...</p>
          ) : (
            <Table columns={columnas} data={tablaData} />
          )}
        </main>
      </div>

      {/* MODALES */}
      <Modal isOpen={showAltaModal} onClose={() => setShowAltaModal(false)}>
        <ModalAltaProfesor onAltaSubmit={handleAltaProfesor} />
      </Modal>

      <Modal isOpen={showBajaModal} onClose={() => setShowBajaModal(false)}>
        <ModalBajaProfesor
          onBajaSubmit={handleBajaProfesor}
          listaProfesores={profesores}
        />
      </Modal>

      <Mensaje
        visible={mensajeData.visible}
        titulo={mensajeData.titulo}
        mensaje={mensajeData.mensaje}
        onCerrar={cerrarMensaje}
      />
    </div>
  );
};

export default GestionProfesores;
