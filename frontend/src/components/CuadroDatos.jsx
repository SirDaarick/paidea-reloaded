import React from "react";
import "styles/CuadroDatos.css";

export default function CuadroDatos({ datos, boton }) {
  return (
    <aside className="da-card">
      <h2 className="da-title-center">Datos generales</h2>

      {Object.entries(datos).map(([clave, valor]) => (
        <div className="da-row" key={clave}>
          <span className="da-key">{clave.toUpperCase()}:</span>
          <span className="da-val">{valor}</span>
        </div>
      ))}

      {boton && (
        <button className="da-btn" onClick={boton.onClick}>
          {boton.texto}
        </button>
      )}
    </aside>
  );
}
