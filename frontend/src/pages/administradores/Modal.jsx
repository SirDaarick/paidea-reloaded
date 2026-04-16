import React from 'react';

// Estilos básicos para la Modal (se recomienda usar CSS modules o un archivo CSS)
const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  content: {
    backgroundColor: '#fff',
    padding: '20px 30px',
    borderRadius: '12px',
    maxWidth: '550px',
    width: '90%',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '15px',
    fontSize: '24px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    color: '#333',
  }
};

/**
 * Componente de Modal reutilizable.
 */
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  // Evitar cerrar el modal al hacer clic dentro del contenido
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.content} onClick={handleContentClick}>
        <button style={modalStyles.closeButton} onClick={onClose}>&times;</button>
        {children}
      </div>
    </div>
  );
};

export default Modal;