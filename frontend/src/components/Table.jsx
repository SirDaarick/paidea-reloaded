import React from 'react';
import styles from 'styles/Table.module.css';

/**
 * Componente de tabla reutilizable
 * @param {object} props
 * @param {array} props.columns - Array de objetos con {key: string, label: string, width?: string}
 * @param {array} props.data - Array de objetos con los datos para cada fila
 * @param {function} props.getRowClass - Función opcional para obtener clase CSS de fila (recibe item, index)
 * @param {function} props.renderCell - Función opcional para renderizado personalizado de celdas (recibe item, columnKey, index)
 * @param {string} props.emptyMessage - Mensaje cuando no hay datos
 * @param {boolean} props.striped - Si muestra filas alternas
 * @param {boolean} props.hover - Si muestra efecto hover
 */
const Table = ({
  columns = [],
  data = [],
  getRowClass = () => '',
  renderCell = null,
  emptyMessage = "No hay datos disponibles",
  striped = true,
  hover = true,
  ...rest
}) => {
  return (
    <div className={styles.tableWrapper} {...rest}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th 
                key={column.key}
                style={column.width ? { width: column.width } : {}}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.emptyCell}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => {
              const rowClass = getRowClass(item, index);
              return (
                <tr 
                  key={index} 
                  className={`
                    ${rowClass}
                    ${striped && index % 2 === 0 ? styles.evenRow : ''}
                    ${hover ? styles.hoverRow : ''}
                  `.trim()}
                >
                  {columns.map((column) => (
                    <td key={column.key}>
                      {renderCell 
                        ? renderCell(item, column.key, index)
                        : item[column.key] ?? '-'
                      }
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;