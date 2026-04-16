import React from "react";
import "styles/index.css";
import MenuProfesor from "components/MenuProfesor.jsx";
import Button from "components/Button"; 
import calendarioImg from "assets/calendario.jpg";
import calendarioPDF from "assets/calendario.pdf";

export default function CalendarioProfesor() {
  // Función para abrir el PDF en nueva pestaña
  const abrirPDF = () => {
    window.open(calendarioPDF, "_blank");
  };

  return (
    <div className="bienvenida-container">
      {/* === Menú del profesor === */}
      <MenuProfesor />

      <main className="page">
        <div className="cal-3col">
          {/* === COLUMNA 1: Descripción + botón === */}
          <section className="cal-left">
            <h2>Calendario escolar IPN 2025–2026</h2>
            <p className="cal-text">
              En esta sección podrás consultar el calendario oficial del Instituto 
              Politécnico Nacional. Además, podrás descargar la versión completa en PDF 
              para su impresión o referencia rápida. Incluye las fechas de inicio y fin 
              de semestre, periodos de exámenes y días inhábiles.
            </p>

            <Button variant="primary" onClick={abrirPDF}>
              Ver calendario PDF
            </Button>
          </section>

          {/* === COLUMNA 2: Fechas importantes === */}
          <aside className="cal-middle">
            <h3 className="cal-fechas-title">Fechas relevantes</h3>

            <div className="cal-card">
              <p className="cal-chip">Periodo 2025/2</p>
              <p>
                <strong>Inicio de semestre:</strong> 25-agosto-2025
                <br />
                <strong>Fin de semestre:</strong> 16-enero-2026
              </p>
            </div>

            <div className="cal-card">
              <p className="cal-sub">Días inhábiles</p>
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
