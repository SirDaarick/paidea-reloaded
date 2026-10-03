import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "context/AuthContext";
import { isDemoActive } from "demo/isDemoMode";
import logoEscom from "assets/ESCOM.png";
import logoIpn from "assets/IPN.png";
import fondoLogin from "assets/ESCOMFOTO.jpg";

const Login = () => {
  const navigate = useNavigate();
  const { login, role } = useAuth();
  const isDemo = isDemoActive();

  // Estados de rol y credenciales
  const [selectedRole, setSelectedRole] = useState("alumno"); // "alumno" | "profesor" | "admin"
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Estados de Captcha
  const [captcha, setCaptcha] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");

  // Estados de feedback y carga
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Alternar a Recuperación de Contraseña
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoverIdentifier, setRecoverIdentifier] = useState("");

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  useEffect(() => {
    setCaptcha(generateCaptcha());
  }, []);

  // En modo demo, si alguien entra a / o /login, entrar directamente a la app sin mostrar el login
  useEffect(() => {
    if (!isDemo) return;

    const currentRole = (role || localStorage.getItem("userRole") || "").toLowerCase();
    const rutas = {
      alumno: "/alumno/Bienvenida",
      profesor: "/profesor/bienvenida",
      admin: "/administrador/BienvenidaAdministrador",
      administrador: "/administrador/BienvenidaAdministrador"
    };

    if (rutas[currentRole]) {
      navigate(rutas[currentRole], { replace: true });
    } else {
      // Iniciar sesión automáticamente como Alumno (Carlos Mendoza)
      handleDemoQuickLogin("alumno");
    }
  }, [isDemo, role]);

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput("");
  };

  const normalizeInput = (text) =>
    text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9@._-]/g, "").trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    const cleanId = normalizeInput(identifier);

    if (!cleanId || !password.trim()) {
      setError("Por favor ingresa tu identificador y contraseña.");
      setLoading(false);
      return;
    }

    if (captchaInput.trim().toUpperCase() !== captcha) {
      setError("El código captcha no coincide. Intenta de nuevo.");
      setLoading(false);
      refreshCaptcha();
      return;
    }

    try {
      const res = await login(cleanId, password);
      const role = res.role;

      const rutas = {
        alumno: "/alumno/Bienvenida",
        profesor: "/profesor/bienvenida",
        admin: "/administrador/BienvenidaAdministrador",
        administrativo: "/administrador/BienvenidaAdministrador",
      };

      if (rutas[role]) {
        navigate(rutas[role], { state: { user: res.user } });
      } else {
        setError(`Rol no reconocido: ${role}`);
      }
    } catch (err) {
      console.error("[Login]", err);
      const serverMsg = err.response?.data?.detail || err.message;
      setError(typeof serverMsg === "string" ? serverMsg : "Error al iniciar sesión. Verifica tus credenciales.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoQuickLogin = async (targetRole) => {
    setError("");
    setLoading(true);
    try {
      const idMap = {
        alumno: "2021630123",
        profesor: "PEAR750815AB1",
        admin: "admin@escom.ipn.mx"
      };
      const res = await login(idMap[targetRole] || targetRole, "demo_password");
      const rutas = {
        alumno: "/alumno/Bienvenida",
        profesor: "/profesor/bienvenida",
        admin: "/administrador/BienvenidaAdministrador",
        administrativo: "/administrador/BienvenidaAdministrador",
      };
      if (rutas[res.role]) {
        navigate(rutas[res.role], { state: { user: res.user } });
      }
    } catch (err) {
      console.error("[Login Demo]", err);
      setError("Error al iniciar sesión en modo demo.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    const cleanId = normalizeInput(recoverIdentifier);

    if (!cleanId) {
      setError("Por favor ingresa tu Boleta, RFC o Correo Institucional.");
      setLoading(false);
      return;
    }

    try {
      setSuccessMsg("Si tu identificador está registrado, recibirás un correo con las instrucciones de acceso.");
      setRecoverIdentifier("");
    } catch (err) {
      setError("Ocurrió un error al procesar tu solicitud.");
    } finally {
      setLoading(false);
    }
  };

  if (isDemo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#EEF4FB] text-primary">
        <div className="relative flex h-12 w-12 mb-4 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-50"></span>
          <span className="relative inline-flex rounded-full h-8 w-8 bg-blue-600"></span>
        </div>
        <p className="text-sm font-semibold tracking-wide text-text-muted animate-pulse">
          Accediendo a PAIDEA en Modo Demostración...
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-between selection:bg-secondary-container selection:text-on-secondary-container font-sans antialiased overflow-hidden">
      {/* 1. Fondo base de color */}
      <div className="absolute inset-0 bg-[#EEF4FB] z-0" />

      {/* 2. Imagen fotográfica institucional de ESCOM con opacidad visible */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-35 z-0 pointer-events-none"
        style={{ backgroundImage: `url(${fondoLogin})` }}
      />

      {/* 3. Gradiente sutil para suavizar contraste */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#EEF4FB]/40 via-transparent to-[#EEF4FB]/60 z-0 pointer-events-none" />

      {/* 4. Fondos ambientales difusos tipo arcilla / clay */}
      <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-br from-secondary-container/30 to-primary-fixed-dim/20 opacity-60 blur-3xl pointer-events-none z-0" />
      <div className="absolute -bottom-24 -right-16 w-[450px] h-[450px] rounded-full bg-gradient-to-tl from-accent-blue/15 to-surface-container-high/40 opacity-50 blur-3xl pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-surface-container/30 blur-[120px] pointer-events-none z-0" />

      {/* Main Container elevado con z-10 */}
      <main className="w-full flex-grow flex items-center justify-center p-4 sm:p-6 md:p-10 relative z-10">
        <div className="w-full max-w-[540px] bg-surface-card rounded-[32px] p-6 sm:p-10 md:p-12 relative transition-all duration-300 shadow-[16px_20px_40px_rgba(62,81,125,0.12),-10px_-10px_24px_#ffffff,inset_1px_1px_3px_rgba(255,255,255,0.95)]">
          {/* Barra Superior Institucional */}
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-low shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06),1px_1px_2px_#ffffff]">
              <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-semibold text-text-primary tracking-wide">IPN · ESCOM</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06),1px_1px_2px_#ffffff]">
              <span className="material-symbols-outlined text-accent-blue text-sm">verified_user</span>
              <span className="text-xs font-medium text-text-muted">Portal Oficial Seguro</span>
            </div>
          </div>

          {/* Encabezado y Logos */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex items-center justify-center gap-5 mb-4 px-6 py-3.5 rounded-2xl bg-primary-container shadow-[4px_6px_16px_rgba(62,81,125,0.25),inset_1px_1px_2px_rgba(255,255,255,0.25)]">
              <img src={logoIpn} alt="Logo IPN" className="h-10 w-auto object-contain brightness-110 drop-shadow-sm" />
              <div className="w-px h-8 bg-white/30" />
              <img src={logoEscom} alt="Logo ESCOM" className="h-10 w-auto object-contain brightness-110 drop-shadow-sm" />
            </div>

            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-extrabold text-primary tracking-tight">PAIDEA</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-primary font-semibold text-xs">
                2026-1
              </span>
            </div>
            <p className="text-sm text-text-muted max-w-sm">
              Plataforma Académica Integral y Gestión Escolar
            </p>
          </div>

          {/* Acceso Rápido en Modo Demostración (Portafolio) */}
          {isDemo && !isRecovering && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-purple-900/10 border border-blue-400/40 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  ⚡ Acceso Rápido Demo (1-Click)
                </span>
                <span className="text-[10px] text-text-muted bg-surface-card px-2 py-0.5 rounded-md font-medium">
                  Sin contraseñas
                </span>
              </div>
              <p className="text-[11px] text-text-muted mb-3 text-left">
                Ingresa inmediatamente con cualquiera de las cuentas de demostración precargadas de ESCOM:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoQuickLogin("alumno")}
                  className="py-2.5 px-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold flex flex-col items-center justify-center transition-all active:scale-95 shadow-md shadow-blue-600/20"
                  title="Entrar como Carlos Mendoza (Alumno ISC)"
                >
                  <span className="text-base mb-0.5">🎓</span>
                  <span>Alumno</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoQuickLogin("profesor")}
                  className="py-2.5 px-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold flex flex-col items-center justify-center transition-all active:scale-95 shadow-md shadow-indigo-600/20"
                  title="Entrar como Dra. Miriam Pescador (Docente)"
                >
                  <span className="text-base mb-0.5">👨‍🏫</span>
                  <span>Docente</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoQuickLogin("admin")}
                  className="py-2.5 px-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold flex flex-col items-center justify-center transition-all active:scale-95 shadow-md shadow-purple-600/20"
                  title="Entrar como Control Escolar (Administrador)"
                >
                  <span className="text-base mb-0.5">⚙️</span>
                  <span>Admin</span>
                </button>
              </div>
            </div>
          )}

          {/* Selector de Perfil / Rol en Píldoras Clay */}
          {!isRecovering && (
            <div className="mb-6">
              <label className="block text-xs font-semibold text-text-muted mb-2 text-center uppercase tracking-wider">
                Selecciona tu perfil
              </label>
              <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-surface-container-low shadow-[inset_2px_2px_6px_rgba(62,81,125,0.08),inset_-2px_-2px_6px_#ffffff]">
                <button
                  type="button"
                  onClick={() => setSelectedRole("alumno")}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition-all duration-200 text-xs font-semibold ${
                    selectedRole === "alumno"
                      ? "bg-surface-card text-primary shadow-[4px_6px_12px_rgba(62,81,125,0.1),-3px_-3px_8px_#ffffff,inset_1px_1px_2px_rgba(255,255,255,0.95)]"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">school</span>
                  <span>Alumno</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("profesor")}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition-all duration-200 text-xs font-semibold ${
                    selectedRole === "profesor"
                      ? "bg-surface-card text-primary shadow-[4px_6px_12px_rgba(62,81,125,0.1),-3px_-3px_8px_#ffffff,inset_1px_1px_2px_rgba(255,255,255,0.95)]"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">co_present</span>
                  <span>Profesor</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("admin")}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition-all duration-200 text-xs font-semibold ${
                    selectedRole === "admin"
                      ? "bg-surface-card text-primary shadow-[4px_6px_12px_rgba(62,81,125,0.1),-3px_-3px_8px_#ffffff,inset_1px_1px_2px_rgba(255,255,255,0.95)]"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                  <span>Admin</span>
                </button>
              </div>
            </div>
          )}

          {/* Alertas de Error y Éxito */}
          {error && (
            <div className="mb-5 p-3 rounded-2xl bg-error-container/40 border border-error/20 text-error text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-5 p-3 rounded-2xl bg-emerald-50 border border-success/20 text-success text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base shrink-0">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Formulario de Login */}
          {!isRecovering ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <label htmlFor="identifier-input" className="text-xs font-bold text-text-primary">
                    {selectedRole === "alumno"
                      ? "Número de Boleta o Correo"
                      : selectedRole === "profesor"
                      ? "RFC o Correo Institucional"
                      : "Usuario Administrador"}
                  </label>
                  <span className="text-[11px] text-text-muted">
                    {selectedRole === "alumno" ? "Ej. 2022630001" : "@ipn.mx"}
                  </span>
                </div>
                <div className="relative flex items-center rounded-2xl bg-surface-ice transition-all duration-200 focus-within:bg-surface-card focus-within:shadow-[0_0_0_3px_rgba(97,155,245,0.35),inset_1px_1px_2px_rgba(255,255,255,0.9)] shadow-[inset_2px_2px_5px_rgba(62,81,125,0.08),inset_-2px_-2px_5px_#ffffff]">
                  <span className="material-symbols-outlined text-text-muted ml-3.5 select-none text-lg">badge</span>
                  <input
                    id="identifier-input"
                    type="text"
                    required
                    disabled={loading}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      selectedRole === "alumno"
                        ? "Ingresa tu boleta o correo"
                        : "Ingresa tu RFC o correo"
                    }
                    className="w-full py-3 pl-2.5 pr-4 bg-transparent text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none rounded-2xl"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <label htmlFor="password-input" className="text-xs font-bold text-text-primary">
                    Contraseña
                  </label>
                  <span className="text-[11px] text-text-muted">Sensible a mayúsculas</span>
                </div>
                <div className="relative flex items-center rounded-2xl bg-surface-ice transition-all duration-200 focus-within:bg-surface-card focus-within:shadow-[0_0_0_3px_rgba(97,155,245,0.35),inset_1px_1px_2px_rgba(255,255,255,0.9)] shadow-[inset_2px_2px_5px_rgba(62,81,125,0.08),inset_-2px_-2px_5px_#ffffff]">
                  <span className="material-symbols-outlined text-text-muted ml-3.5 select-none text-lg">lock</span>
                  <input
                    id="password-input"
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Introduce tu contraseña"
                    className="w-full py-3 pl-2.5 pr-11 bg-transparent text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none rounded-2xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 p-1 text-text-muted hover:text-text-primary focus:outline-none rounded-full"
                    aria-label="Alternar visibilidad"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Captcha */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-text-primary mb-1 px-1">
                    Código de Seguridad
                  </label>
                  <div className="relative flex items-center rounded-2xl bg-surface-ice shadow-[inset_2px_2px_5px_rgba(62,81,125,0.08),inset_-2px_-2px_5px_#ffffff] focus-within:bg-surface-card focus-within:shadow-[0_0_0_3px_rgba(97,155,245,0.35)]">
                    <input
                      type="text"
                      required
                      disabled={loading}
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      placeholder="Código visual"
                      className="w-full py-2.5 px-3 bg-transparent text-sm text-text-primary uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal placeholder:text-text-muted/60 focus:outline-none rounded-2xl"
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="font-mono text-base font-bold tracking-widest px-3 py-1.5 rounded-xl bg-surface-container-high text-primary shadow-[inset_1px_1px_3px_rgba(62,81,125,0.1),1px_1px_2px_#ffffff] select-none">
                    {captcha}
                  </div>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="text-[11px] text-secondary hover:text-primary font-medium mt-1 underline"
                  >
                    Refrescar
                  </button>
                </div>
              </div>

              {/* Botón Principal Inflable */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-primary-container text-on-primary font-bold text-sm shadow-[4px_6px_14px_rgba(62,81,125,0.25),inset_1px_1px_2px_rgba(255,255,255,0.3)] hover:bg-primary transition-all duration-150 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verificando acceso...</span>
                    </>
                  ) : (
                    <>
                      <span>Ingresar al Portal</span>
                      <span className="material-symbols-outlined text-base">login</span>
                    </>
                  )}
                </button>
              </div>

              {/* Enlace de Olvido de Contraseña */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setSuccessMsg("");
                    setIsRecovering(true);
                  }}
                  className="text-xs font-medium text-secondary hover:text-primary transition-colors underline"
                >
                  ¿Olvidaste tu contraseña o requieres reactivación?
                </button>
              </div>
            </form>
          ) : (
            /* Formulario de Recuperación */
            <form onSubmit={handleRecoverPassword} className="space-y-4">
              <p className="text-xs text-text-muted text-center leading-relaxed">
                Ingresa tu Boleta, RFC o Correo Institucional registrado. Te enviaremos un enlace seguro para restablecer tu contraseña.
              </p>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5 px-1">
                  Identificador a Recuperar
                </label>
                <div className="relative flex items-center rounded-2xl bg-surface-ice shadow-[inset_2px_2px_5px_rgba(62,81,125,0.08),inset_-2px_-2px_5px_#ffffff] focus-within:bg-surface-card focus-within:shadow-[0_0_0_3px_rgba(97,155,245,0.35)]">
                  <span className="material-symbols-outlined text-text-muted ml-3.5 text-lg select-none">mail</span>
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={recoverIdentifier}
                    onChange={(e) => setRecoverIdentifier(e.target.value)}
                    placeholder="Boleta, RFC o correo @ipn.mx"
                    className="w-full py-3 pl-2.5 pr-4 bg-transparent text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none rounded-2xl"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-2xl bg-primary-container text-on-primary font-bold text-sm shadow-[4px_6px_14px_rgba(62,81,125,0.25)] hover:bg-primary transition-all duration-150 active:scale-[0.98]"
                >
                  {loading ? "Enviando solicitud..." : "Enviar Instrucciones de Acceso"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setSuccessMsg("");
                    setIsRecovering(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-surface-container-low text-text-primary font-semibold text-xs hover:bg-surface-container transition-all"
                >
                  Volver al Inicio de Sesión
                </button>
              </div>
            </form>
          )}

          {/* Pie de Tarjeta */}
          <div className="mt-8 pt-4 border-t border-surface-container text-center">
            <span className="text-[11px] font-medium text-text-muted">
              PAIDEA 2.0 · Escuela Superior de Cómputo del Instituto Politécnico Nacional
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;