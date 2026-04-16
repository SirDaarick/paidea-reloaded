import React from "react";
import Menu from "components/Menu.jsx";
import "styles/PantallasErrores.css";
import burroDormido from "assets/BurroDormido.png";
export default function Espera({ 
  mensaje1 = "Cargando...",
  mensaje2 = "Espere un momento.",
  imagen = burroDormido,
  altImagen = "Burrito dormido"
}) {
  return (
    <div className="bienvenida-container">
      {/* === Menu global con encabezado incluido === */}
      <Menu />

      {/* Contenido principal */}
      <main className="error-main">
        <div className="error-box">
          <h2>{mensaje1}</h2>
          <p>{mensaje2}</p>
        </div>
        <img
          src={imagen}
          alt={altImagen}
          className="error-img"
        />
      </main>
    </div>
  );
}
