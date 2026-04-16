import React from 'react';
import styles from 'styles/SelectField.module.css';

/**
 * Componente de campo de formulario para select (label + select).
 * @param {object} props
 * @param {string} props.label - El texto para la etiqueta <label>.
 * @param {boolean} [props.wide=false] - Si 'true', aplica el estilo 'wide'.
 * @param {array} props.options - Array de opciones [{value: '', label: ''}, ...]
 * @param {object} ...rest - Todas las demás props (name, value, onChange, etc.)
 * se pasan directamente al elemento <select>.
 */
const SelectField = ({ label, wide = false, options = [], ...rest }) => {

  const containerClasses = `
    ${styles.field}
    pill
    ${wide ? styles.wide : ''}
  `;

  return (
    <div className={containerClasses.trim()}>
      <label>{label}</label>
      <select {...rest}>
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectField;