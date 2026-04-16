import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import poliLogo from "assets/IPN.png";
import escomLogo from "assets/ESCOM.png";
import "styles/Menu.css";

export default function MenuAdmin() {
  const navigate = useNavigate();
  const location = useLocation();

  // === Nueva función para permitir rutas globales y rutas de administrador ===
  const irA = (ruta) => {
    const nuevaRuta = ruta.startsWith("/") ? ruta : `/administrador/${ruta}`;

    if (location.pathname !== nuevaRuta) {
      navigate(nuevaRuta, { replace: true });
    }
  };

  // =========================================================
  // 🧹 FUNCIÓN DE LIMPIEZA (Cerrar Sesión Admin)
  // =========================================================
  const handleLogout = () => {
    console.log("👋 Administrador cerrando sesión...");
    
    // 1. Borramos TODA la memoria del navegador
    localStorage.clear();
    sessionStorage.clear(); 

    // 2. Forzamos recarga y vamos al login
    window.location.href = "/login"; 
  };
  // =========================================================

  const isActive = (ruta) =>
    location.pathname === ruta ? "menu-item active" : "menu-item";

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
          
          {/* === Alumnos === */}
          <li
            className={
              isActive("/gestion-alumnos") ||
              isActive("/gestionar-materias-alumno") ||
              isActive("/kardex-boleta")
            }
          >
            Alumnos ▼
            <ul className="submenu">
              <li onClick={() => irA("gestion-alumnos")}>Gestión de Alumnos</li>
              <li onClick={() => irA("gestionar-materias-alumno")}>Gestión de Materias</li>
              <li onClick={() => irA("kardex-boleta")}>Gestión de Kardex</li>
            </ul>
          </li>

          {/* === Profesores === */}
          <li
            className={
              isActive("/gestion-profesores") ||
              isActive("/gestion-horario-profesor") ||
              isActive("/correccion-actas")
            }
          >
            Profesores ▼
            <ul className="submenu">
              <li onClick={() => irA("gestion-profesores")}>Gestión Profesores</li>
              <li onClick={() => irA("gestion-horario-profesor")}>Gestión de Horarios</li>
              <li onClick={() => irA("correcion-actas")}>Correción de Actas</li>
            </ul>
          </li>

          {/* === Periodos Académicos === */}
          <li
            className={
              isActive("/periodos-academicos") ||
              isActive("/plan-sintetico")
            }
          >
            Periodos Académicos ▼
            <ul className="submenu">
              <li onClick={() => irA("periodos-academicos")}>Editar Periodos Académicos</li>
              <li onClick={() => irA("plan-sintetico")}>Plan Sintético</li>
              <li onClick={() => irA("periodos-academicos-2")}>Gestión de Períodos Académicos</li>
            </ul>
          </li>

          {/* === Reinscripciones === */}
          <li className={
            isActive("/Asignar-Cita") ||
            isActive("/gestion-grupos") ||
            isActive("/ETS")
            }
          > 
            Reinscripciones ▼
            <ul className="submenu">
              <li onClick={() => irA("gestion-grupos")}>Gestión de Grupos</li>
              <li onClick={() => irA("Asignar-Cita")}>Asignar citas</li>
              <li onClick={() => irA("ETS")}>ETS</li>
            </ul>
          </li>

          {/* === Trámites === */}
          <li className={isActive("/solicitud-tramites-admin")}>
            Trámites ▼
            <ul className="submenu">
              <li onClick={() => irA("solicitud-tramites-admin")}>
                Solicitud de Trámites
              </li>
            </ul>
          </li>

          {/* === Copia de Seguridad === */}
          <li className={isActive("/")}>
            Copia de Seguridad ▼
            <ul className="submenu">
              <li onClick={() => irA("copia-seguridad")}>Copia de Seguridad</li>
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