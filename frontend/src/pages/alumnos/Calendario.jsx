import React from "react";
import "styles/index.css";
import Menu from "components/Menu.jsx";
import Button from "components/Button"; // Importamos el componente Button
import calendarioImg from "assets/calendario.jpg";
import calendarioPDF from "assets/calendario.pdf";

export default function Calendario() {
  // función para abrir el PDF
  const abrirPDF = () => {
    // Si el archivo está importado desde /src:
    window.open(calendarioPDF, "_blank");
  };
  
  return (
    <div className="bienvenida-container">
      {/* === Usamos el menú con su encabezado incluido === */}
      <Menu />

      <main className="page">
        <div className="cal-3col">
          {/* === COLUMNA 1: Descripción + botón === */}
          <section className="cal-left">
            <h2>Calendario IPN 2025–2026</h2>
            <p className="cal-text">
              En esta sección podrás visualizar el calendario oficial del
              Instituto Politécnico Nacional. También puedes descargar la imagen
              dando click en el botón inferior. Selecciona el periodo de tu
              interés (2025/2 o 2026/1).
            </p>
            <Button variant="primary" onClick={abrirPDF}>
              Ver calendario PDF
            </Button>
          </section>

          {/* === COLUMNA 2: Fechas importantes === */}
          <aside className="cal-middle">
            <h3 className="cal-fechas-title">Fechas importantes</h3>

            <div className="cal-card">
              <p className="cal-chip">Periodo 2025/2</p>
              <p>
                <strong>Inicio semestre:</strong> 25-agosto-2025
                <br />
                <strong>Fin de semestre:</strong> 16-enero-2026
              </p>
            </div>

            <div className="cal-card">
              <p className="cal-sub">Puentes</p>
              <ul>
                <li>16-septiembre-2025</li>
                <li>17-noviembre-2025</li>
              </ul>
            </div>

            <div className="cal-card">
              <p className="cal-sub">Evaluaciones</p>
              <ul>
                <li>2–6 octubre 2025</li>
                <li>13–18 noviembre 2025</li>
                <li>9–13 enero 2026</li>
              </ul>
            </div>
          </aside>

          {/* === COLUMNA 3: Imagen del calendario === */}
          <section className="cal-right">
            <img
              src={calendarioImg}
              alt="Calendario académico IPN 2025–2026"
              className="cal-img"
            />
          </section>
        </div>
      </main>
    </div>
  );
}