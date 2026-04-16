import React from 'react';
import styles from 'styles/InputField.module.css';

/**
 * Componente de campo de formulario (label + input).
 * @param {object} props
 * @param {string} props.label - El texto para la etiqueta <label>.
 * @param {boolean} [props.wide=false] - Si 'true', aplica el estilo 'wide'.
 * @param {object} ...rest - Todas las demás props (name, value, onChange, type, etc.)
 * se pasan directamente al elemento <input>.
 */
const InputField = ({ label, wide = false, ...rest }) => {

  // Construimos las clases:
  // 1. Clase base: styles.field
  // 2. Clase global: 'pill' (asumimos que 'pill' es global desde index.css)
  // 3. Modificador: styles.wide (si la prop 'wide' es true)
  const containerClasses = `
    ${styles.field}
    pill
    ${wide ? styles.wide : ''}
  `;

  return (
    // Usamos .trim() para limpiar espacios extra
    <div className={containerClasses.trim()}>
      <label>{label}</label>
      <input {...rest} />
    </div>
  );
};

export default InputField;