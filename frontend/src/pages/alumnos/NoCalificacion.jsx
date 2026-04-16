import React from "react";
import Menu from "components/Menu.jsx";
import "styles/PantallasErrores.css";
import burroDormido from "assets/BurroDormido.png";
export default function Espera() {
  return (
    <div className="bienvenida-container">
      {/* === Menu global con encabezado incluido === */}
      <Menu />

      {/* Contenido principal */}
      <main className="error-main">
        <div className="error-box">
          <h2>Aún no tienes resultados de ETS</h2>
        </div>
        <img
          src={burroDormido}
          alt="Burrito dormido"
          className="error-img"
        />
      </main>
    </div>
  );
}
