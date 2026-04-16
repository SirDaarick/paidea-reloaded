// --- components/Emergente.jsx ---

import React from "react";
// Importamos el nuevo CSS
import styles from "styles/Emergente.module.css"; 

/**
 * Componente de Emergente genérico.
 * @param {object} props
 * @param {boolean} props.isOpen - Si el modal está abierto o no.
 * @param {function} props.onClose - Función a llamar para cerrar el modal.
 * @param {React.ReactNode} props.children - El contenido a renderizar dentro del modal.
 */
const Emergente = ({ isOpen, onClose, children }) => {
  if (!isOpen) {
    return null;
  }

  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    // 1. El Fondo Oscuro (Overlay)
    <div className={styles.emergenteOverlay} onClick={onClose}>
      
      {/* 2. El Contenedor del Contenido (Centrado) */}
      <div className={styles.emergenteContent} onClick={handleContentClick}>
        
        {/* 3. El Botón de Cerrar (Arriba a la derecha) */}
        <button className={styles.closeButton} onClick={onClose}>
          &times; {/* Símbolo 'X' */}
        </button>

        {/* 4. El Contenido (tu CuadroDatos irá aquí) */}
        {children}
      </div>
    </div>
  );
};

export default Emergente;