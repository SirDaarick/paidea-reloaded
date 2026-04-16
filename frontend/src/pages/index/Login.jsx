import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiCall from "consultas/APICall";
import fondoLogin from "assets/ESCOMFOTO.jpg";

const Login = () => {
  const navigate = useNavigate();

  // Estados de Login
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Estados de Captcha
  const [captcha, setCaptcha] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");

  // Estados Generales
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState(""); // Nuevo: para mensajes de éxito
  const [loading, setLoading] = useState(false);

  // Nuevo: Estado para alternar entre Login y Recuperar Contraseña
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoverIdentifier, setRecoverIdentifier] = useState("");

  // --- CAPTCHA ---
  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  useEffect(() => {
    setCaptcha(generateCaptcha());
  }, []);

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput("");
  };

  // --- NORMALIZAR ---
  const normalizeInput = (text) =>
    text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]/g, "").trim().toUpperCase();

  // --- VALIDADORES ---
  const isBoleta = (text) => /^\d{8,10}$/.test(text);
  const isRFCRegex = (text) => /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(text);
  const startsWith4Letters = (text) => /^[A-ZÑ]{4}/.test(text);

  // --- LOGIN ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    const clean = normalizeInput(identifier);

    if (!clean || !password.trim()) {
      setError("Por favor ingresa usuario y contraseña.");
      setLoading(false);
      return;
    }

    if (captchaInput.trim().toUpperCase() !== captcha) {
      setError("Captcha incorrecto.");
      setLoading(false);
      return;
    }

    try {
      let userData = null;

      // 1. Buscar usuario
      try {
        if (isBoleta(clean)) {
          userData = await apiCall(`/usuario/boleta/${clean}`, "GET");
        } else if (isRFCRegex(clean) || startsWith4Letters(clean)) {
          userData = await apiCall(`/usuario/rfc/${clean}`, "GET");
        } else {
          throw new Error("Formato no válido.");
        }
      } catch (err) {
        setError("Usuario no encontrado.");
        setLoading(false);
        return;
      }

      if (!userData || !userData._id) {
        setError("Error: Usuario sin ID válido.");
        setLoading(false);
        return;
      }

      // 2. Comparar password
      const pwdCheck = await apiCall(`/usuario/compare-password/${userData._id}`, "POST", { password });

      if (!pwdCheck.isMatch) {
        setError("Contraseña incorrecta.");
        setLoading(false);
        return;
      }

      // 3. Guardar sesión
      const rawRole = userData.rol || "";
      const role = rawRole.toString().toLowerCase();

      localStorage.setItem("usuarioId", userData._id);
      localStorage.setItem("userRole", role);
      localStorage.setItem("nombre", userData.nombre);

      if (role === "alumno") localStorage.setItem("boletaAlumno", userData.boleta);
      else if (role === "profesor") localStorage.setItem("rfcProfesor", userData.datosPersonales?.rfc || clean);

      // 4. Primer inicio
      if (userData.primerInicio && role !== "admin" && role !== "administrativo") {
        const rutaCambio = role === "alumno" ? "/alumno/cambiar-contraseña" : "/profesor/cambiar-contraseña";
        navigate(rutaCambio, { state: { primerInicio: true }, replace: true });
        return;
      }

      // 5. Redirección
      const rutas = {
        alumno: "/alumno/Bienvenida",
        profesor: "/profesor/bienvenida",
        admin: "/administrador/BienvenidaAdministrador",
        administrativo: "/administrador/BienvenidaAdministrador"
      };

      if (rutas[role]) {
        navigate(rutas[role], { state: { user: userData } });
      } else {
        setError(`Rol desconocido: ${rawRole}`);
      }

    } catch (err) {
      console.error(err);
      setError("Error de conexión. Intente más tarde.");
    }
    setLoading(false);
  };

  // --- NUEVO: RECUPERAR CONTRASEÑA ---
  const handleRecoverPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    const clean = normalizeInput(recoverIdentifier);

    if (!clean) {
      setError("Ingresa tu Boleta o RFC.");
      setLoading(false);
      return;
    }

    try {
      // NOTA: Necesitas crear esta ruta en tu Backend (Express)
      // El backend debe buscar el usuario, obtener su correo y enviarle la contraseña (o un link de reset).
      await apiCall("/usuario/recuperar-contrasena", "POST", { identifier: clean });

      setSuccessMsg("Si los datos son correctos, se ha enviado un correo con tu contraseña.");
      setRecoverIdentifier(""); // Limpiar campo
    } catch (err) {
      console.error(err);
      // Por seguridad, a veces es mejor decir "Si existe, se envió" aunque falle, para no revelar usuarios.
      // Pero para debug, mostramos el error:
      setError("No se pudo enviar el correo. Verifica que el usuario exista.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundImage: `url(${fondoLogin})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundColor: "#eef2f6",
      display: "flex", justifyContent: "center", alignItems: "center",
      fontFamily: "Arial, sans-serif",
    }}>
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.96)",
        padding: "30px 40px", borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        width: "100%", maxWidth: "400px",
        backdropFilter: "blur(5px)"
      }}>
        <h2 style={{ textAlign: "center", color: "#243159", marginBottom: "20px" }}>
          {isRecovering ? "Recuperar Contraseña" : "Plataforma Académica"}
        </h2>

        {/* --- MENSAJES DE ERROR / EXITO --- */}
        {error && (
          <div style={{ color: "red", textAlign: "center", marginBottom: "15px", fontSize: "14px", backgroundColor: "#ffe6e6", padding: "8px", borderRadius: "4px" }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div style={{ color: "green", textAlign: "center", marginBottom: "15px", fontSize: "14px", backgroundColor: "#e6fffa", padding: "8px", borderRadius: "4px" }}>
            {successMsg}
          </div>
        )}

        {/* --- FORMULARIO DE LOGIN --- */}
        {!isRecovering ? (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ fontWeight: "bold", color: "#243159" }}>Usuario</label>
              <input
                type="text"
                placeholder="Boleta o RFC"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc", marginTop: "5px" }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ fontWeight: "bold", color: "#243159" }}>Contraseña</label>
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc", marginTop: "5px" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: "bold", color: "#243159" }}>Captcha</label>
                <input
                  type="text"
                  placeholder="Texto imagen"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  disabled={loading}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc", marginTop: "5px" }}
                />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: "bold", letterSpacing: "2px", backgroundColor: "#f5f8ff", padding: "6px 10px", borderRadius: "6px", userSelect: "none" }}>
                  {captcha}
                </div>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  style={{ background: "none", border: "none", color: "#4c6cb7", textDecoration: "underline", cursor: "pointer", marginTop: "4px" }}
                >
                  Refrescar
                </button>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: loading ? "#99aadd" : "#4c6cb7", color: "white", border: "none", padding: "10px 20px", borderRadius: "20px", cursor: loading ? "wait" : "pointer", fontWeight: "bold", width: "100%" }}
              >
                {loading ? "Verificando..." : "Iniciar sesión"}
              </button>
            </div>

            <div style={{ textAlign: "center", marginTop: "15px" }}>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setSuccessMsg("");
                  setIsRecovering(true); // CAMBIA A MODO RECUPERAR
                }}
                style={{ background: "none", border: "none", color: "#4c6cb7", fontSize: "13px", textDecoration: "underline", cursor: "pointer" }}
              >
                ¿Has olvidado tu contraseña?
              </button>
            </div>
          </form>
        ) : (
          /* --- FORMULARIO DE RECUPERACIÓN --- */
          <form onSubmit={handleRecoverPassword}>
            <p style={{ fontSize: "14px", color: "#555", marginBottom: "15px", textAlign: "center" }}>
              Ingresa tu Boleta o RFC. Si tus datos están registrados, te enviaremos tu contraseña por correo electrónico.
            </p>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ fontWeight: "bold", color: "#243159" }}>Usuario a recuperar</label>
              <input
                type="text"
                placeholder="Boleta o RFC"
                value={recoverIdentifier}
                onChange={(e) => setRecoverIdentifier(e.target.value)}
                disabled={loading}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc", marginTop: "5px" }}
              />
            </div>

            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: loading ? "#99aadd" : "#e67e22", color: "white", border: "none", padding: "10px 20px", borderRadius: "20px", cursor: loading ? "wait" : "pointer", fontWeight: "bold", width: "100%" }}
              >
                {loading ? "Enviando..." : "Enviar Correo"}
              </button>
            </div>

            <div style={{ textAlign: "center", marginTop: "15px" }}>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setSuccessMsg("");
                  setIsRecovering(false); // REGRESA A LOGIN
                }}
                style={{ background: "none", border: "none", color: "#666", fontSize: "13px", textDecoration: "underline", cursor: "pointer" }}
              >
                ← Volver al inicio de sesión
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default Login;