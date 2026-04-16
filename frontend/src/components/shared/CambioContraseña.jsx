import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Menu from "../Menu.jsx";
import MenuProfesor from "../MenuProfesor.jsx";
import MenuAdmin from "../MenuAdmin.jsx";
import Button from "../Button.jsx";
import Mensaje from "../Mensaje.jsx";
import apiCall from "../../consultas/APICall.jsx";
import "../../styles/Contraseña.css";
import "../../styles/modalForms.css";

const CambioContraseña = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const esPrimerInicio = location.state?.primerInicio || false;

  const [usuario, setUsuario] = useState(null);
  const [rol, setRol] = useState("");
  const [formData, setFormData] = useState({
    actual: "",
    nueva: "",
    confirmar: "",
  });
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const rolActual = localStorage.getItem("userRole");
    setRol(rolActual);
    obtenerUsuarioActual(rolActual);
  }, []);

  const obtenerUsuarioActual = async (rolActual) => {
    try {
      let usuarioId = null;

      if (rolActual === "alumno") {
        const boleta = localStorage.getItem("boletaAlumno");
        const response = await apiCall(`/usuario/boleta/${boleta}`, "GET");
        usuarioId = response?.data?._id || response?._id;
      } else if (rolActual === "profesor") {
        const rfc = localStorage.getItem("rfcProfesor");
        const response = await apiCall(`/usuario/rfc/${rfc}`, "GET");
        usuarioId = response?.data?._id || response?._id;
      } else if (rolActual === "admin" || rolActual === "administrativo") {
        usuarioId = localStorage.getItem("usuarioId");
      }

      if (usuarioId) {
        const userData = await apiCall(`/usuario/${usuarioId}`, "GET");
        setUsuario(userData.data || userData);
      }
    } catch (error) {
      console.error("Error obteniendo usuario:", error);
      setMensaje("Error al cargar datos del usuario");
      setTipoMensaje("error");
      setMostrarModal(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (errores[name]) {
      setErrores({ ...errores, [name]: "" });
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!esPrimerInicio && !formData.actual.trim()) {
      nuevosErrores.actual = "La contraseña actual es requerida";
    }

    if (!formData.nueva.trim()) {
      nuevosErrores.nueva = "La nueva contraseña es requerida";
    } else if (formData.nueva.length < 6) {
      nuevosErrores.nueva = "La contraseña debe tener al menos 6 caracteres";
    } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(formData.nueva)) {
      nuevosErrores.nueva = "Debe incluir al menos una letra y un número";
    }

    if (!formData.confirmar.trim()) {
      nuevosErrores.confirmar = "Confirme la nueva contraseña";
    } else if (formData.nueva !== formData.confirmar) {
      nuevosErrores.confirmar = "Las contraseñas no coinciden";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const obtenerRutaBienvenida = () => {
    if (rol === "alumno") return "/alumno/bienvenida";
    if (rol === "profesor") return "/profesor/bienvenida";
    if (rol === "admin" || rol === "administrativo") return "/administrador/BienvenidaAdministrador";
    return "/login";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    if (!usuario?._id) {
      setMensaje("No se pudo identificar al usuario");
      setTipoMensaje("error");
      setMostrarModal(true);
      return;
    }

    setCargando(true);

    try {
      if (!esPrimerInicio) {
        const compareResponse = await apiCall(
          `/usuario/compare-password/${usuario._id}`,
          "POST",
          { password: formData.actual }
        );

        if (!compareResponse.isMatch) {
          setErrores({ actual: "La contraseña actual es incorrecta" });
          setCargando(false);
          return;
        }
      }

      await apiCall(
        `/usuario/users/${usuario._id}/password`,
        "PUT",
        { newPassword: formData.nueva }
      );

      // Si es primer inicio, actualizar el flag
      if (esPrimerInicio) {
        await apiCall(
          `/usuario/${usuario._id}`,
          "PUT",
          { primerInicio: false }
        );
      }

      setMensaje("Contraseña actualizada correctamente");
      setTipoMensaje("success");
      setMostrarModal(true);
      setFormData({ actual: "", nueva: "", confirmar: "" });

      setTimeout(() => {
        navigate(obtenerRutaBienvenida(), { replace: true });
      }, 2000);

    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      setMensaje(error.message || "Error al actualizar la contraseña");
      setTipoMensaje("error");
      setMostrarModal(true);
    } finally {
      setCargando(false);
    }
  };

  const handleCancelar = () => {
    if (esPrimerInicio) {
      // Si es primer inicio, cerrar sesión
      localStorage.clear();
      navigate("/login", { replace: true });
    } else {
      // Si es cambio normal, volver a bienvenida
      navigate(obtenerRutaBienvenida(), { replace: true });
    }
  };

  // Renderizar el menú según el rol
  const renderMenu = () => {
    if (rol === "alumno") return <Menu />;
    if (rol === "profesor") return <MenuProfesor />;
    if (rol === "admin" || rol === "administrativo") return <MenuAdmin />;
    return null;
  };

  return (
    <div className="pagina-contraseña">
      {renderMenu()}

      <div className="contenido-contraseña">
        <div className="contenedor-contraseña">
          <h2 className="modal-title">
            {esPrimerInicio ? "Configurar Nueva Contraseña" : "Cambiar Contraseña"}
          </h2>
          
          {esPrimerInicio && (
            <p className="modal-subtitle" style={{ color: "#666", marginBottom: "20px" }}>
              Por seguridad, debes establecer una nueva contraseña en tu primer inicio de sesión
            </p>
          )}

          <form className="form-contraseña" onSubmit={handleSubmit}>
            <div className="modal-form-section">
              {!esPrimerInicio && (
                <div className="modal-input-wrapper">
                  <label>Contraseña actual</label>
                  <input
                    type="password"
                    name="actual"
                    value={formData.actual}
                    onChange={handleChange}
                    className={`modal-input ${errores.actual ? "modal-input-error" : ""}`}
                    disabled={cargando}
                  />
                  {errores.actual && (
                    <p className="modal-error-message">{errores.actual}</p>
                  )}
                </div>
              )}

              <div className="modal-input-wrapper">
                <label>Nueva contraseña</label>
                <input
                  type="password"
                  name="nueva"
                  value={formData.nueva}
                  onChange={handleChange}
                  className={`modal-input ${errores.nueva ? "modal-input-error" : ""}`}
                  disabled={cargando}
                />
                {errores.nueva && (
                  <p className="modal-error-message">{errores.nueva}</p>
                )}
              </div>

              <div className="modal-input-wrapper">
                <label>Confirmar nueva contraseña</label>
                <input
                  type="password"
                  name="confirmar"
                  value={formData.confirmar}
                  onChange={handleChange}
                  className={`modal-input ${errores.confirmar ? "modal-input-error" : ""}`}
                  disabled={cargando}
                />
                {errores.confirmar && (
                  <p className="modal-error-message">{errores.confirmar}</p>
                )}
              </div>
            </div>

            <div className="modal-buttons-container">
              <Button 
                type="submit" 
                variant="primary"
                disabled={cargando}
              >
                {cargando ? "Guardando..." : "Guardar cambios"}
              </Button>
              
              <Button 
                type="button" 
                variant="secondary"
                onClick={handleCancelar}
                disabled={cargando}
              >
                {esPrimerInicio ? "Cerrar sesión" : "Cancelar"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <Mensaje
        titulo={
          tipoMensaje === "success"
            ? "Éxito"
            : tipoMensaje === "error"
            ? "Error"
            : "Advertencia"
        }
        mensaje={mensaje}
        visible={mostrarModal}
        onCerrar={() => setMostrarModal(false)}
      />
    </div>
  );
};

export default CambioContraseña;