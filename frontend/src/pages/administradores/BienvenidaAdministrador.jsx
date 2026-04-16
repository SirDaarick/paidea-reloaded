import React from "react";
import MenuProfesor from "components/MenuAdmin.jsx";
import "styles/index.css";
import burro from "assets/Burro.png";

export default function BienvenidaAdministrador() {
  const hora = new Date().getHours();
  let saludo = "Hola";

  if (hora >= 6 && hora < 12) saludo = "Buenos días";
  else if (hora >= 12 && hora < 18) saludo = "Buenas tardes";
  else saludo = "Buenas noches";

  // Datos simulados del profesor
  const nombreProfesor = "Juanita Flores Pérez";

  return (
    <div className="bienvenida-container">
      {/* === Menú global con encabezado incluido === */}
      <MenuProfesor />


      <main className="bienvenida-main">
        {/* Mascota TecnoBurro */}
        <img src={burro} alt="Mascota ESCOM" className="bienvenida-img" />

        {/* Texto de bienvenida */}
        <div className="bienvenida-text">
          <p className="saludo">
            {saludo} <span className="nombre">{nombreProfesor}</span>
          </p>
          <h2>
            Bienvenido a <span className="paidea">PAIDEA</span>
          </h2>
          <p className="descripcion">
            Podrá registrar calificaciones, revisar avisos académicos de la ESCOM y
            disponer a <span className="tecno">TecnoBurro</span>, nuestro bot que
            ayudará a consultar más fácilmente cualquier duda respecto a los grupos
            asignados este semestre, al igual que información general de la institución,
            incluyendo el reglamento del IPN. Solo da click al burrito de la esquina
            inferior derecha.
          </p>
        </div>
      </main>
    </div>
  );
}
