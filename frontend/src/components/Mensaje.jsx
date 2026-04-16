import React from "react";
import styles from "styles/Mensaje.module.css";

export default function Mensaje({ titulo, mensaje, visible, onCerrar }) {
  if (!visible) return null;

  return (
    // Agregamos zIndex inline para asegurar que siempre esté "arriba de todo"
    <div className={styles.modalOverlay} style={{ zIndex: 10000 }}>
      <div className={styles.modalContent}>
        <h3>{titulo}</h3>
        <p>{mensaje}</p>
        <button className={styles.cerrarBtn} onClick={onCerrar}>
          Cerrar
        </button>
      </div>
    </div>
  );
}