import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import poliLogo from "assets/IPN.png";
import escomLogo from "assets/ESCOM.png";
import "styles/Menu.css";

export default function MenuProfesor() {
  const navigate = useNavigate();
  const location = useLocation();

  // === Nueva función: rutas globales y rutas del profesor ===
  const irA = (ruta) => {
    const nuevaRuta = ruta.startsWith("/") ? ruta : `/profesor/${ruta}`;

    if (location.pathname !== nuevaRuta) {
      navigate(nuevaRuta, { replace: true });
    }
  };

  // =========================================================
  // 🧹 FUNCIÓN DE LIMPIEZA (Cerrar Sesión Real)
  // =========================================================
  const handleLogout = () => {
    console.log("👋 Cerrando sesión y limpiando datos...");
    
    // 1. Borramos TODA la memoria del navegador
    localStorage.clear();
    sessionStorage.clear(); // Por si acaso usas sessionStorage también

    // 2. Forzamos una recarga completa hacia el login
    // Usamos window.location.href en lugar de navigate
    // para obligar a que la página se reinicie desde cero y el Chat se resetee.
    window.location.href = "/login"; 
  };
  // =========================================================

  const isActive = (ruta) =>
    location.pathname.startsWith(ruta) ? "menu-item active" : "menu-item";

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

      {/* === Menú principal === */}
      <nav className="menu-container">
        <ul className="menu">

          {/* === Datos Personales === */}
          <li className={isActive("/profesor/datos")}>
            Datos personales ▼
            <ul className="submenu">
              <li onClick={() => irA("datos-personales")}>
                Ver datos personales
              </li>
              <li onClick={() => irA("editar")}>
                Editar datos personales
              </li>
            </ul>
          </li>

          {/* === Grupos === */}
          <li className={isActive("/profesor/grupos")}>
            Grupos asignados ▼
            <ul className="submenu">
              <li onClick={() => irA("grupos")}>Grupos asignados</li>
              <li onClick={() => irA("asistencias")}>Listado de asistencia</li>
              <li onClick={() => irA("calificaciones")}>
                Registrar calificaciones
              </li>
            </ul>
          </li>

          {/* === Desempeño académico === */}
          <li className={isActive("/profesor/desempeno")}>
            Desempeño académico ▼
            <ul className="submenu">
              <li onClick={() => irA("desempeno")}>Desempeño grupal</li>
              <li onClick={() => irA("reportes")}>Reportes generales</li>
            </ul>
          </li>

          {/* === ETS === */}
          <li className={isActive("/profesor/ets")}>
            ETS ▼
            <ul className="submenu">
              <li onClick={() => irA("ets-listados")}>Listados ETS</li>
              <li onClick={() => irA("ets-calificar")}>Calificar ETS</li>
            </ul>
          </li>

          {/* === Gestión académica === */}
          <li className={isActive("/profesor/gestion")}>
            Informativo ▼
            <ul className="submenu">
              <li onClick={() => irA("salones")}>Salones</li>
              <li onClick={() => irA("calendario")}>Calendario escolar</li>
            </ul>
          </li>

          {/* === CERRAR SESIÓN === */}
          <li className={isActive("/cambiar-contraseña")}>
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