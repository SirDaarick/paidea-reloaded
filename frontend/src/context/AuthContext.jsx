import React, { createContext, useContext, useState, useEffect } from "react";
import apiCall from "consultas/APICall";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("userProfile");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [role, setRole] = useState(() => localStorage.getItem("userRole") || "");
  const [loading, setLoading] = useState(true);

  // Sincronizar y validar sesión activa al cargar la app
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem("token");
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        // Consultar el perfil real validado con el JWT
        const profile = await apiCall("/api/v1/auth/me", "GET");
        setUser(profile);
        const userRole = (profile.rol || "").toLowerCase();
        const normalizedRole = userRole === "administrador" ? "admin" : userRole;
        setRole(normalizedRole);
        localStorage.setItem("userRole", normalizedRole);
        localStorage.setItem("userProfile", JSON.stringify(profile));
      } catch (err) {
        console.warn("[Auth] Token expirado o inválido. Limpiando sesión:", err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (identificador, password) => {
    const authData = await apiCall("/api/v1/auth/login", "POST", {
      identificador: identificador.trim(),
      password,
    });

    const jwtToken = authData.access_token;
    const rawRole = (authData.rol || "").toLowerCase();
    const normalizedRole = rawRole === "administrador" ? "admin" : rawRole;

    setToken(jwtToken);
    setRole(normalizedRole);
    localStorage.setItem("token", jwtToken);
    localStorage.setItem("userRole", normalizedRole);
    localStorage.setItem("nombre", authData.nombre_completo);

    if (authData.boleta_o_rfc) {
      localStorage.setItem("usuarioId", authData.boleta_o_rfc);
      if (normalizedRole === "alumno") {
        localStorage.setItem("boletaAlumno", authData.boleta_o_rfc);
      } else if (normalizedRole === "profesor") {
        localStorage.setItem("rfcProfesor", authData.boleta_o_rfc);
      }
    }

    // Cargar perfil completo
    try {
      const profile = await apiCall("/api/v1/auth/me", "GET");
      setUser(profile);
      localStorage.setItem("userProfile", JSON.stringify(profile));
      return { success: true, role: normalizedRole, user: profile };
    } catch {
      return { success: true, role: normalizedRole, user: authData };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setRole("");
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userProfile");
    localStorage.removeItem("usuarioId");
    localStorage.removeItem("nombre");
    localStorage.removeItem("boletaAlumno");
    localStorage.removeItem("rfcProfesor");
  };

  const value = {
    token,
    user,
    role,
    loading,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser utilizado dentro de un AuthProvider");
  }
  return context;
};
