import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import poliLogo from "assets/IPN.png";
import escomLogo from "assets/ESCOM.png";
import "styles/Menu.css";

export default function Menu() {
  const navigate = useNavigate();
  const location = useLocation();

  // === Nueva función que permite rutas globales y rutas de alumno ===
  const irA = (ruta) => {
    const nuevaRuta = ruta.startsWith("/") ? ruta : `/alumno/${ruta}`;

    if (location.pathname !== nuevaRuta) {
      navigate(nuevaRuta, { replace: true });
    }
  };

  // =========================================================
  // FUNCIÓN DE LIMPIEZA (IGUAL QUE EN PROFESOR)
  // =========================================================
  const handleLogout = () => {
    console.log("Alumno cerrando sesión...");
    
    // 1. Borramos TODA la memoria del navegador
    localStorage.clear();
    sessionStorage.clear(); 

    // 2. Forzamos una recarga completa hacia el inicio (Login)
    // Asumo que tu login está en la ruta raíz "/"
    window.location.href = "/"; 
  };
  // =========================================================

  return (
    <>
      {/* === Encabezado === */}
      <header className="header-container">
        <img src={poliLogo} alt="Logo IPN" className="header-logo" />
        <h1 className="header-title">
          Plataforma Académica Integral <br /> y de Asistencia Digital
        </h1>
        <img src={escomLogo} alt="Logo ESCOM" className="header-logo" />
      </header>

      {/* === Menú === */}
      <nav className="menu-container">
        <ul className="menu">

          {/* === Datos personales === */}
          <li
            className={
              ["/datos-personales", "/editar-datos"].includes(
                location.pathname
              )
                ? "menu-item active"
                : "menu-item"
            }
          >
            Datos personales ▼
            <ul className="submenu">
              <li onClick={() => irA("datos-personales")}>Datos Personales</li>
              <li onClick={() => irA("editar-datos")}>Editar Personales</li>
            </ul>
          </li>

          {/* === Datos académicos === */}
          <li
            className={
              ["/analisis", "/kardex", "/plan-estudios"].includes(
                location.pathname
              )
                ? "menu-item active"
                : "menu-item"
            }
          >
            Datos académicos ▼
            <ul className="submenu">
              <li onClick={() => irA("analisis")}>Análisis Académico</li>
              <li onClick={() => irA("kardex")}>Kardex</li>
              <li onClick={() => irA("plan-estudios")}>Plan de estudios</li>
              <li onClick={() => irA("optativas")}>Optativas</li>
            </ul>
          </li>

          {/* === Situación Académica Actual === */}
          <li
            className={
              [
                "/rendimiento",
                "/calificaciones",
                "/horario",
                "/seguimiento",
              ].includes(location.pathname)
                ? "menu-item active"
                : "menu-item"
            }
          >
            Situación Académica Actual ▼
            <ul className="submenu">
              <li onClick={() => irA("rendimiento")}>Rendimiento Académico</li>
              <li onClick={() => irA("calificaciones")}>Calificaciones</li>
              <li onClick={() => irA("horario")}>Horario</li>
              <li onClick={() => irA("seguimiento")}>Seguimiento de irregularidades</li>
            </ul>
          </li>

          {/* === Reinscripciones === */}
          <li
            className={
              ["/reinscripciones", "/proceso-reinscripcion", "/estado-reinscripcion"].includes(
                location.pathname
              )
                ? "menu-item active"
                : "menu-item"
            }
          >
            Reinscripciones ▼
            <ul className="submenu">
              <li onClick={() => irA("reinscripciones")}>Reinscripciones</li>
              <li onClick={() => irA("cita-Reinscripcion")}>Cita de Reinscripción</li>
            </ul>
          </li>

          {/* === ETS === */}
          <li
            className={
              ["/inscribir-ETS", "/ETS-examenes", "/ETS-resultados"].includes(
                location.pathname
              )
                ? "menu-item active"
                : "menu-item"
            }
          >
            ETS ▼
            <ul className="submenu">
              <li onClick={() => irA("inscribir-ETS")}>Inscribir ETS</li>
              <li onClick={() => irA("error")}>Comprobantes</li>
              <li onClick={() => irA("Resultados-ETS")}>Resultados</li>
            </ul>
          </li>

          {/* === Gestión académica === */}
          <li
            className={
              [
                "/calendario",
                "/ocupabilidad",
                "/salones",
                "/documentos",
                "/solicitar-documentos",
              ].includes(location.pathname)
                ? "menu-item active"
                : "menu-item"
            }
          >
            Gestión académica ▼
            <ul className="submenu">
              <li onClick={() => irA("solicitar-documentos")}>Solicitudes</li>
              <li onClick={() => irA("documentos")}>Trámites</li>
              <li onClick={() => irA("ocupabilidad")}>Ocupabilidad de Horario</li>
              <li onClick={() => irA("salones")}>Salones</li>
              <li onClick={() => irA("calendario")}>Calendario Académico</li>
            </ul>
          </li>

          {/* === CERRAR SESIÓN === */}
          <li
            className={
              ["/analisis", "/kardex", "/plan-estudios"].includes(
                location.pathname
              )
                ? "menu-item active"
                : "menu-item"
            }
          >
            Cerrar Sesión ▼
            <ul className="submenu">
              <li onClick={() => irA("cambiar-contraseña")}>Cambiar Contraseña</li>
              <li onClick={handleLogout}>Cerrar Sesión</li>
            </ul>
          </li>

        </ul>
      </nav>
    </>
  );
}