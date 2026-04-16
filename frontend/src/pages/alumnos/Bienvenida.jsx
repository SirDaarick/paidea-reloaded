import React from "react";
import Menu from "components/Menu.jsx";
import "styles/index.css";
import burro from "assets/Burro.png";

function Bienvenida({ nombreUsuario }) {
  const hora = new Date().getHours();
  let saludo = "Hola";

  if (hora >= 6 && hora < 12) saludo = "Buenos días";
  else if (hora >= 12 && hora < 18) saludo = "Buenas tardes";
  else saludo = "Buenas noches";

  return (
    <div className="bienvenida-container">
      {/* === Menú con encabezado incluido === */}
      <Menu />

      <main className="bienvenida-main">
        <img src={burro} alt="Mascota ESCOM" className="bienvenida-img" />
        <div className="bienvenida-text">
          <p className="saludo">
            {saludo} <span className="nombre">{nombreUsuario}</span>
          </p>
          <h2>
            Bienvenido a <span className="paidea">PAIDEA</span>
          </h2>
          <p className="descripcion">
            Podrás consultar tus calificaciones, información académica de la ESCOM e
            igual tienes a disposición a <span className="tecno">TecnoBurro</span>,
            nuestro bot que te ayudará a consultar más fácilmente cualquier duda que
            tengas respecto a tu situación académica. Solo dale click al burrito de la
            esquina inferior.
          </p>
        </div>
      </main>
    </div>
  );
}

export default Bienvenida;
