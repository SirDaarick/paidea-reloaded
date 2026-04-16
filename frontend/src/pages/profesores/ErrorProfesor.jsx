import React from "react";
import MenuProfesor from "components/MenuProfesor.jsx"; //cambia el menú
import "styles/index.css";
import burroDormido from "assets/BurroDormido.png";

export default function ErrorProfesor() {
  return (
    <div className="bienvenida-container">
      {/* === Menú global con encabezado de profesor === */}
      <MenuProfesor />

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
