import React, { useState, useEffect } from "react";
import MenuAdmin from "components/MenuAdmin";
import Button from "components/Button";
import Mensaje from "components/Mensaje"; // <-- Importa tu componente
import "styles/CopiaSeguridad.css";

export default function CopiaSeguridad() {
  const [tipoCopia, setTipoCopia] = useState("Total");
  const [versionSeleccionada, setVersionSeleccionada] = useState("");
  const [versionesDisponibles, setVersionesDisponibles] = useState([]);
  const [modal, setModal] = useState({ show: false, message: "" });

  const mostrarModal = (mensaje) => {
    setModal({ show: true, message: mensaje });
    setTimeout(() => setModal({ show: false, message: "" }), 3000);
  };

  useEffect(() => {
    const versionesFalsas = [
      { id: 1, fecha: "10/11/2025 10:32:14", tipo: "Total" },
      { id: 2, fecha: "09/11/2025 22:10:45", tipo: "Parcial" },
      { id: 3, fecha: "08/11/2025 18:02:33", tipo: "Total" },
    ];
    setVersionesDisponibles(versionesFalsas);
    setVersionSeleccionada(versionesFalsas[0].fecha);
  }, []);

  const generarCopia = async () => {
    try {
      mostrarModal(`Copia ${tipoCopia.toLowerCase()} generada con éxito`);
    } catch (error) {
      mostrarModal("Error al generar la copia de seguridad");
    }
  };

  const descargarCopia = async () => {
    try {
      mostrarModal("Descargando copia más reciente...");
    } catch {
      mostrarModal("Error al descargar la copia");
    }
  };

  const subirCopia = async () => {
    try {
      mostrarModal("Archivo de copia subido correctamente");
    } catch {
      mostrarModal("Error al subir la copia");
    }
  };

  const aplicarCopia = async () => {
    try {
      mostrarModal(`Aplicando copia del ${versionSeleccionada}`);
    } catch {
      mostrarModal("Error al aplicar la copia");
    }
  };

  return (
    <div className="copia-container">
      <MenuAdmin />

      <div className="copia-content">
        <h2 className="copia-title">Copia de seguridad</h2>

        <div className="copia-section">
          <div className="copia-inputs">
            <label htmlFor="tipoCopia">Tipo de copia de seguridad</label>
            <select
              id="tipoCopia"
              value={tipoCopia}
              onChange={(e) => setTipoCopia(e.target.value)}
            >
              <option value="Total">Total</option>
              <option value="Parcial">Parcial</option>
            </select>
          </div>

          <div className="copia-buttons">
            <Button onClick={generarCopia}>
              Generar copia de seguridad
            </Button>
          </div>
        </div>

        <div className="descargar-container">
          <Button variant="secondary" onClick={descargarCopia}>
            Descargar copia
          </Button>
        </div>

        <h3 className="copia-subtitle">Aplicar copia de seguridad</h3>

        <div className="copia-section aplicar">
          <div className="copia-inputs">
            <label htmlFor="version">Versiones disponibles</label>
            <select
              id="version"
              value={versionSeleccionada}
              onChange={(e) => setVersionSeleccionada(e.target.value)}
            >
              {versionesDisponibles.map((v) => (
                <option key={v.id} value={v.fecha}>
                  {v.fecha} — {v.tipo}
                </option>
              ))}
            </select>
          </div>

          <div className="copia-buttons">
            <Button onClick={subirCopia}>
              Subir copia de seguridad
            </Button>
          </div>
        </div>

        <div className="aplicar-container">
          <Button onClick={aplicarCopia}>Aplicar</Button>
        </div>
      </div>

      {/* === Mensaje usando tu componente === */}
      <Mensaje
        titulo=""
        mensaje={modal.message}
        visible={modal.show}
        onCerrar={() => setModal({ show: false, message: "" })}
      />
    </div>
  );
}
