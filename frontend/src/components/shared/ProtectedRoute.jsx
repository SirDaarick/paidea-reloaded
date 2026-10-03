import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "context/AuthContext";

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column" }}>
        <div style={{ width: 40, height: 40, border: "4px solid #ccc", borderTopColor: "#003366", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <p style={{ marginTop: 16, color: "#555", fontWeight: 500 }}>Cargando portal PAIDEA...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirigir al inicio correspondiente al rol real del usuario
    const rutasInicio = {
      alumno: "/alumno/bienvenida",
      profesor: "/profesor/bienvenida",
      admin: "/administrador/BienvenidaAdministrador",
    };
    const destino = rutasInicio[role] || "/";
    return <Navigate to={destino} replace />;
  }

  return children;
};

export default ProtectedRoute;
