import React from 'react';
import styles from 'styles/Button.module.css'; // Importamos nuestros estilos

/**
 * Componente de botón reutilizable.
 * @param {object} props
 * @param {React.ReactNode} props.children - El contenido del botón (ej. texto).
 * @param {function} props.onClick - Función a ejecutar al hacer clic.
 * @param {'primary' | 'secondary'} [props.variant='primary'] - La variante visual.
 * @param {'button' | 'submit' | 'reset'} [props.type='button'] - El tipo de botón HTML.
 * @param {rest} ...rest - Cualquier otra prop (como 'disabled').
 */
const Button = ({
  children,
  onClick,
  variant = 'primary', // 'primary' por defecto
  type = 'button',    // 'button' por defecto
  ...rest // Para props extra como 'disabled'
}) => {
  
  // Construimos las clases:
  // 1. La clase base: styles.button
  // 2. La clase de variante: styles.primary o styles.secondary
  const classNames = `${styles.button} ${styles[variant]}`;

  return (
    <button 
      type={type}
      className={classNames}
      onClick={onClick}
      {...rest} // Pasamos cualquier otra prop
    >
      {children}
    </button>
  );
};

export default Button;