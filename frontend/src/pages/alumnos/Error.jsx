import React from "react";
import Menu from "components/Menu.jsx";
import "styles/PantallasErrores.css";
import burroDormido from "assets/BurroDormido.png";

export default function Error() {
  return (
    <div className="bienvenida-container">
      {/* === Menu global con encabezado incluido === */}
      <Menu />

      {/* Contenido principal */}
      <main className="error-main">
        <div className="error-box">
          <h2>Lo sentimos</h2>
          <p>Por el momento la página no está disponible.</p>
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
