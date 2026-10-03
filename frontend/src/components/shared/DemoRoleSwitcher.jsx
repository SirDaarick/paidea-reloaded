// src/components/shared/DemoRoleSwitcher.jsx
// Barra flotante interactiva para alternar instantáneamente entre Alumno, Docente y Administrador en el modo demostración.

import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { isDemoActive } from "../../demo/isDemoMode";

export default function DemoRoleSwitcher() {
  const isDemo = isDemoActive();
  const { role, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [switching, setSwitching] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (!isDemo) return null;

  const currentRole = (role || "").toLowerCase();

  const handleSwitch = async (targetRole) => {
    if (switching) return;
    setSwitching(true);

    try {
      const idMap = {
        alumno: "2021630123",
        profesor: "PEAR750815AB1",
        admin: "admin@escom.ipn.mx"
      };

      const res = await login(idMap[targetRole] || targetRole, "demo_password");
      
      const routeMap = {
        alumno: "/alumno/Bienvenida",
        profesor: "/profesor/bienvenida",
        admin: "/administrador/BienvenidaAdministrador"
      };

      const targetRoute = routeMap[targetRole] || "/alumno/Bienvenida";
      navigate(targetRoute);
    } catch (err) {
      console.error("Error al conmutar rol en modo demo:", err);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <aside 
      aria-label="Panel de demostración"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 pointer-events-auto"
      style={{ maxWidth: "95vw" }}
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl px-4 py-2.5 flex items-center gap-3">
        {/* Indicador de Portafolio / Modo Demo */}
        <div className="flex items-center gap-2 border-r border-slate-700/70 pr-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="flex flex-col text-left leading-tight">
            <span className="text-[11px] font-bold tracking-wider text-slate-200 uppercase flex items-center gap-1">
              🎭 Demo Portafolio
            </span>
            <span className="text-[9px] text-slate-400">Datos ESCOM precargados</span>
          </div>
        </div>

        {/* Botones de Conmutación de Rol */}
        <div className="flex items-center gap-1.5">
          {/* Botón Alumno */}
          <button
            type="button"
            onClick={() => handleSwitch("alumno")}
            disabled={switching}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
              currentRole === "alumno"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
            title="Ver sistema como Alumno (Carlos Mendoza)"
          >
            <span>🎓</span>
            <span className="hidden sm:inline">Alumno</span>
            <span className="text-[10px] opacity-75 font-normal hidden md:inline">(Carlos)</span>
          </button>

          {/* Botón Profesor */}
          <button
            type="button"
            onClick={() => handleSwitch("profesor")}
            disabled={switching}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
              currentRole === "profesor"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
            title="Ver sistema como Docente (Dra. Miriam Pescador)"
          >
            <span>👨‍🏫</span>
            <span className="hidden sm:inline">Docente</span>
            <span className="text-[10px] opacity-75 font-normal hidden md:inline">(Dra. Miriam)</span>
          </button>

          {/* Botón Administrador */}
          <button
            type="button"
            onClick={() => handleSwitch("admin")}
            disabled={switching}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
              currentRole === "admin" || currentRole === "administrador"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-105"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
            title="Ver sistema como Administrador (Control Escolar)"
          >
            <span>⚙️</span>
            <span className="hidden sm:inline">Admin</span>
            <span className="text-[10px] opacity-75 font-normal hidden md:inline">(Control Escolar)</span>
          </button>
        </div>

        {/* Badge de Seguridad de Datos */}
        <div className="hidden lg:flex items-center gap-1 text-[10px] text-amber-400/90 bg-amber-950/40 border border-amber-600/30 rounded-lg px-2 py-1 ml-1">
          <span>🔒</span>
          <span>Solo Lectura</span>
        </div>
      </div>
    </aside>
  );
}
