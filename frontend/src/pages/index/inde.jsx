
import React from "react";
import { useNavigate } from "react-router-dom";
import "styles/index.css"

const SeleccionRol = () => {
  const navigate = useNavigate();

  const handleRedirect = (rol) => {
    navigate(`/${rol}`);
  };

  return (
    <div className="bienvenida-container">
      <header className="bienvenida-header">
        <h1>Bienvenido a Paidea</h1>
      </header>

      <main className="bienvenida-main">
        <div style={{ textAlign: "center", width: "100%" }}>
          <h2>Selecciona tu rol</h2>
          <p>Elige entre Admin, Alumno o Maestro para continuar:</p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              marginTop: "30px",
              alignItems: "center",
            }}
          >
            <button className="cal-btn" onClick={() => handleRedirect("bienvenidaAD")}>
              Admin
            </button>
            <button className="cal-btn" onClick={() => handleRedirect("Bienvenida")}>
              Alumno
            </button>
            <button className="cal-btn" onClick={() => handleRedirect("maestro")}>
              Maestro
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SeleccionRol;
