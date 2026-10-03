import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "context/AuthContext";
import poliLogo from "assets/IPN.png";
import escomLogo from "assets/ESCOM.png";

export default function Menu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [activeDropdown, setActiveDropdown] = useState(null); // 'academico' | 'horarios' | 'reinscripciones' | 'ets' | 'perfil' | null
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  const alumnoData = user?.alumno;
  const nombreDisplay = user?.nombre_completo || localStorage.getItem("nombre") || "Estudiante";
  const boletaDisplay = alumnoData?.boleta || localStorage.getItem("boleta") || "2021630001";
  const carreraDisplay = alumnoData?.carrera?.nombre || "Ingeniería en Sistemas Computacionales";
  const correoDisplay = user?.email || "alumno1@paidea.ipn.mx";

  // Manejo de hover con buffer de tiempo (evita parpadeos o cierres accidentales al mover el mouse)
  const handleMouseEnter = (dropdownId) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setActiveDropdown(dropdownId);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 140);
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Cerrar menús al cambiar de ruta
  useEffect(() => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const toggleDropdownClick = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const currentPath = location.pathname.toLowerCase();

  const isGroupActive = (paths) => {
    return paths.some((p) => currentPath.startsWith(p.toLowerCase()));
  };

  const navGroups = [
    {
      id: "inicio",
      label: "Inicio",
      icon: "home",
      directPath: "/alumno/Bienvenida",
    },
    {
      id: "academico",
      label: "Académico",
      icon: "school",
      paths: ["/alumno/kardex", "/alumno/planestudios", "/alumno/plan-estudios", "/alumno/rendimiento"],
      items: [
        { label: "Kárdex Oficial", path: "/alumno/kardex", icon: "school", desc: "Historial de calificaciones y promedio" },
        { label: "Malla Curricular", path: "/alumno/planEstudios", icon: "account_tree", desc: "Mapa curricular y avance de créditos" },
        { label: "Rendimiento Académico", path: "/alumno/rendimientoAcademico", icon: "monitoring", desc: "Gráficas de desempeño por parcial" },
      ],
    },
    {
      id: "horarios",
      label: "Horarios y Salones",
      icon: "calendar_month",
      paths: ["/alumno/horario", "/alumno/salones", "/alumno/ocupabilidad"],
      items: [
        { label: "Horario Semanal", path: "/alumno/horario", icon: "calendar_month", desc: "Horario activo y detalles de salón" },
        { label: "Salones y Croquis", path: "/alumno/salones", icon: "apartment", desc: "Distribución de aulas por edificio" },
        { label: "Ocupabilidad de Cupos", path: "/alumno/ocupabilidad", icon: "group", desc: "Disponibilidad de vacantes por grupo" },
      ],
    },
    {
      id: "reinscripciones",
      label: "Reinscripciones",
      icon: "how_to_reg",
      paths: ["/alumno/reinscripciones", "/alumno/cita-reinscripcion"],
      items: [
        { label: "Proceso de Reinscripción", path: "/alumno/reinscripciones", icon: "how_to_reg", desc: "Selección de grupos y pre-registro" },
        { label: "Cita y Turno Asignado", path: "/alumno/cita-reinscripcion", icon: "schedule", desc: "Horario de cita por prelación" },
      ],
    },
    {
      id: "ets",
      label: "ETS",
      icon: "assignment",
      paths: ["/alumno/inscribirets", "/alumno/inscribir-ets", "/alumno/resultados-ets"],
      items: [
        { label: "Inscribir ETS", path: "/alumno/inscribirets", icon: "edit_calendar", desc: "Registro de exámenes extraordinarios" },
        { label: "Resultados y Calificaciones", path: "/alumno/resultados-ets", icon: "verified", desc: "Historial de calificaciones obtenidas" },
      ],
    },
    {
      id: "tramites",
      label: "Trámites",
      icon: "description",
      directPath: "/alumno/documentos",
    },
  ];

  return (
    <header ref={menuRef} className="sticky top-0 left-0 w-full z-50 bg-surface-ice/90 backdrop-blur-md px-3 sm:px-6 py-2">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-2.5 bg-surface-card rounded-2xl shadow-[0_10px_24px_-4px_rgba(62,81,125,0.08),-4px_-4px_14px_rgba(255,255,255,0.95),inset_1px_1px_2px_rgba(255,255,255,0.95)] flex items-center justify-between gap-4">
        
        {/* Brand & Logos */}
        <Link to="/alumno/Bienvenida" className="flex items-center gap-3.5 shrink-0 group">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-[#173059] to-[#263A64] shadow-[0_4px_14px_rgba(23,48,89,0.28),inset_0_1px_1px_rgba(255,255,255,0.25)] border border-[#2D4D85] group-hover:shadow-[0_6px_18px_rgba(23,48,89,0.38)] transition-all">
            <img src={poliLogo} alt="IPN" className="h-10 sm:h-11 w-auto object-contain drop-shadow-sm brightness-105" />
            <div className="w-[1.5px] h-7 bg-white/25 rounded-full"></div>
            <img src={escomLogo} alt="ESCOM" className="h-10 sm:h-11 w-auto object-contain drop-shadow-sm brightness-105" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold text-primary tracking-tight leading-tight group-hover:text-primary-container transition-colors">
              PAIDEA · ESCOM
            </span>
            <span className="text-[10px] font-semibold text-text-muted">
              Instituto Politécnico Nacional
            </span>
          </div>
        </Link>

        {/* Desktop Grouped Navigation Links with Hover and Click Support */}
        <nav className="hidden lg:flex items-center gap-1 bg-surface-container-low p-1.5 rounded-full shadow-[inset_1px_1px_3px_rgba(62,81,125,0.06),inset_-1px_-1px_3px_#ffffff]">
          {navGroups.map((group) => {
            // Caso 1: Enlace directo sin submenú (Inicio, Trámites)
            if (group.directPath) {
              const active = currentPath === group.directPath.toLowerCase();
              return (
                <Link
                  key={group.id}
                  to={group.directPath}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                    active
                      ? "bg-surface-card text-primary shadow-[4px_4px_10px_rgba(62,81,125,0.12),-3px_-3px_8px_#ffffff,inset_1px_1px_2px_rgba(255,255,255,0.8)]"
                      : "text-text-muted hover:text-text-primary hover:bg-surface-card/50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">{group.icon}</span>
                  <span>{group.label}</span>
                </Link>
              );
            }

            // Caso 2: Grupo con lista desplegable temática activada por hover o click
            const groupActive = isGroupActive(group.paths);
            const isOpen = activeDropdown === group.id;

            return (
              <div
                key={group.id}
                className="relative"
                onMouseEnter={() => handleMouseEnter(group.id)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => toggleDropdownClick(group.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 flex items-center gap-1 cursor-pointer ${
                    groupActive || isOpen
                      ? "bg-surface-card text-primary shadow-[4px_4px_10px_rgba(62,81,125,0.12),-3px_-3px_8px_#ffffff,inset_1px_1px_2px_rgba(255,255,255,0.8)]"
                      : "text-text-muted hover:text-text-primary hover:bg-surface-card/50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">{group.icon}</span>
                  <span>{group.label}</span>
                  <span className={`material-symbols-outlined text-[14px] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                    expand_more
                  </span>
                </button>

                {isOpen && (
                  /* Contenedor con puente de hover transparente (pt-2) */
                  <div
                    className="absolute top-full left-0 pt-2 w-64 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onMouseEnter={() => handleMouseEnter(group.id)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="bg-surface-card rounded-2xl p-2 shadow-[12px_16px_32px_rgba(62,81,125,0.15),-6px_-6px_16px_#ffffff] border border-surface-container-high/60">
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        {group.label}
                      </div>
                      {group.items.map((sub) => {
                        const isSubActive = currentPath === sub.path.toLowerCase();
                        return (
                          <Link
                            key={sub.path}
                            to={sub.path}
                            onClick={() => setActiveDropdown(null)}
                            className={`flex items-start gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${
                              isSubActive
                                ? "bg-surface-container-low text-primary font-bold shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]"
                                : "text-text-primary hover:bg-surface-container-low/70"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[17px] text-accent-blue shrink-0 mt-0.5">
                              {sub.icon}
                            </span>
                            <div className="flex flex-col">
                              <span className="leading-tight">{sub.label}</span>
                              <span className="text-[10px] text-text-muted font-normal mt-0.5 leading-tight">
                                {sub.desc}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile Pill & Dropdown Trigger with Hover + Click Support */}
        <div
          className="relative shrink-0"
          onMouseEnter={() => handleMouseEnter("perfil")}
          onMouseLeave={handleMouseLeave}
        >
          <button
            type="button"
            onClick={() => toggleDropdownClick("perfil")}
            className={`flex items-center gap-3 p-1.5 rounded-2xl transition-all cursor-pointer ${
              activeDropdown === "perfil"
                ? "bg-surface-container-low shadow-[inset_1px_1px_2px_rgba(62,81,125,0.08)] ring-2 ring-primary/20"
                : "hover:bg-surface-container-low/60"
            }`}
            title="Mi Cuenta y Expediente"
          >
            <div className="hidden sm:flex flex-col text-right">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs font-bold text-text-primary">{nombreDisplay}</span>
                <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-primary font-semibold text-[10px] shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)] max-w-[130px] truncate">
                  {carreraDisplay}
                </span>
              </div>
              <span className="text-[10px] text-text-muted font-medium">Boleta: {boletaDisplay}</span>
            </div>

            <div className="w-9 h-9 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs shadow-[3px_4px_10px_rgba(62,81,125,0.25),inset_1px_1px_2px_rgba(255,255,255,0.4)]">
              {nombreDisplay.charAt(0)}
            </div>

            <span className={`material-symbols-outlined text-[16px] text-text-muted transition-transform duration-200 ${activeDropdown === "perfil" ? "rotate-180 text-primary" : ""}`}>
              expand_more
            </span>
          </button>

          {/* User Profile Dropdown Menu con puente transparente de hover */}
          {activeDropdown === "perfil" && (
            <div
              className="absolute top-full right-0 pt-2 w-72 z-50 animate-in fade-in zoom-in-95 duration-150"
              onMouseEnter={() => handleMouseEnter("perfil")}
              onMouseLeave={handleMouseLeave}
            >
              <div className="bg-surface-card rounded-2xl p-3 shadow-[12px_16px_36px_rgba(62,81,125,0.18),-6px_-6px_16px_#ffffff] border border-surface-container-high/60">
                {/* Header con resumen del estudiante */}
                <div className="p-3 bg-surface-container-low rounded-xl mb-2 shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      {nombreDisplay.charAt(0)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-text-primary truncate">{nombreDisplay}</span>
                      <span className="text-[11px] font-mono font-semibold text-secondary">Boleta: {boletaDisplay}</span>
                      <span className="text-[10px] text-text-muted truncate">{correoDisplay}</span>
                    </div>
                  </div>
                </div>

                {/* Opciones del Perfil */}
                <div className="space-y-1">
                  <Link
                    to="/alumno/datos-personales"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-text-primary hover:bg-surface-container-low hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-accent-blue">badge</span>
                    <span>Mi Expediente y Datos</span>
                  </Link>

                  <Link
                    to="/alumno/cambiar-contraseña"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-text-primary hover:bg-surface-container-low hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-secondary">lock_reset</span>
                    <span>Cambiar Contraseña</span>
                  </Link>
                </div>

                <div className="my-2 border-t border-surface-container-high/50"></div>

                {/* Cerrar Sesión */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-error hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-text-primary rounded-xl bg-surface-container-low ml-2"
            aria-label="Abrir menú"
          >
            <span className="material-symbols-outlined text-xl">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 p-4 bg-surface-card rounded-2xl shadow-[12px_16px_32px_rgba(62,81,125,0.14)] space-y-3">
          {navGroups.map((group) => {
            if (group.directPath) {
              return (
                <Link
                  key={group.id}
                  to={group.directPath}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-text-primary hover:bg-surface-container-low"
                >
                  <span className="material-symbols-outlined text-base">{group.icon}</span>
                  <span>{group.label}</span>
                </Link>
              );
            }

            return (
              <div key={group.id} className="space-y-1">
                <div className="text-[10px] font-bold text-text-muted uppercase px-3 pt-1">
                  {group.label}
                </div>
                {group.items.map((sub) => (
                  <Link
                    key={sub.path}
                    to={sub.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-primary hover:bg-surface-container-low"
                  >
                    <span className="material-symbols-outlined text-base text-accent-blue">{sub.icon}</span>
                    <span>{sub.label}</span>
                  </Link>
                ))}
              </div>
            );
          })}

          <div className="pt-2 border-t border-surface-container-high/40">
            <Link
              to="/alumno/datos-personales"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-text-primary hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-base text-accent-blue">badge</span>
              <span>Mi Perfil y Expediente</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-error hover:bg-red-50 text-left"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}