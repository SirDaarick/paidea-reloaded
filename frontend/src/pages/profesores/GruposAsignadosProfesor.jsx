import React from "react";
import MenuProfesor from "components/MenuProfesor.jsx";
import CuadroDatos from "components/CuadroDatos";
import Button from "components/Button";
import Table from "components/Table.jsx"; // <- importamos Table
import "styles/GruposAsignadosProfesor.css";
import { useGruposProfesor } from "hooks/useGruposProfesor";
import { useProfesor } from "hooks/useProfesor";
import { useIdProfesor } from "hooks/useIdProfesor";

export default function GruposAsignadosProfesor() {
  const { idProfesor } = useIdProfesor();

  const { profesor } = useProfesor(idProfesor);
  const { grupos } = useGruposProfesor(idProfesor);

  const datosResumen = profesor
    ? {
        rfc: profesor.datosPersonales?.rfc || "N/A",
        nombre: profesor.nombre,
        departamento: profesor.dataProfesor?.departamento || "N/A",
        sexo: profesor.datosPersonales?.sexo || "N/A",
        estadoCivil: profesor.datosPersonales?.estadoCivil || "N/A",
      }
    : {};

  // Preparar columnas y datos para Table.jsx
  const columns = [
    { key: "grupo", label: "Grupo" },
    { key: "salon", label: "Salón" },
    { key: "materia", label: "Materia" },
    { key: "lunes", label: "Lunes" },
    { key: "martes", label: "Martes" },
    { key: "miercoles", label: "Miércoles" },
    { key: "jueves", label: "Jueves" },
    { key: "viernes", label: "Viernes" },
  ];

  const data = grupos && grupos.length > 0
    ? grupos.flatMap(grupo =>
        grupo.materias && grupo.materias.length > 0
          ? grupo.materias.map(materia => ({
              grupo: grupo.nombre || "N/A",
              salon: materia.salon || "N/A",
              materia: materia.nombre,
              lunes: materia.horarios?.lunes || "-",
              martes: materia.horarios?.martes || "-",
              miercoles: materia.horarios?.miercoles || "-",
              jueves: materia.horarios?.jueves || "-",
              viernes: materia.horarios?.viernes || "-",
            }))
          : [{
              grupo: grupo.nombre || "N/A",
              salon: "N/A",
              materia: "Sin materias asignadas",
              lunes: "-", martes: "-", miercoles: "-", jueves: "-", viernes: "-"
            }]
      )
    : [];

  // Función para generar HTML de la tabla para impresión
  const generarTablaHTML = () => {
    if (!data || data.length === 0) {
      return `<tr><td colspan="${columns.length}" style="text-align:center;">No hay grupos asignados</td></tr>`;
    }

    const encabezado = `<tr>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr>`;
    const filas = data.map(fila => 
      `<tr>${columns.map(c => `<td>${fila[c.key] ?? '-'}</td>`).join('')}</tr>`
    ).join('');

    return `<table border="1" cellspacing="0" cellpadding="4" style="width:100%; border-collapse: collapse;">${encabezado}${filas}</table>`;
  };

  const imprimirComprobante = () => {
    const tablaHTML = generarTablaHTML();
    const ventana = window.open("", "_blank");

    const estilos = `
      <style>
        @page { size: A4 portrait; margin: 16mm; }
        body { font-family: Arial, sans-serif; }
        h1, h2, h3 { text-align: center; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #000; padding: 8px 10px; font-size: 11pt; text-align: center; }
        th { background: #e5e7eb; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9fafb; }
      </style>
    `;

    const encabezado = `
      <h2>Comprobante de Grupos Asignados</h2>
      <p><strong>Profesor(a):</strong> ${datosResumen.nombre}</p>
      <p><strong>Departamento:</strong> ${datosResumen.departamento}</p>
    `;

    ventana.document.write(`
      <html>
        <head><meta charset="UTF-8">${estilos}</head>
        <body>${encabezado}${tablaHTML}</body>
      </html>
    `);

    ventana.document.close();
    ventana.focus();

    setTimeout(() => {
      ventana.print();
      ventana.close();
    }, 200);
  };

  return (
    <div className="grupos-container">
      <MenuProfesor />

      <main className="grupos-page">
        <div className="grupos-content">
          {/* === COLUMNA IZQUIERDA: Datos generales === */}
          <CuadroDatos datos={datosResumen} />

          {/* === COLUMNA DERECHA: Tabla de grupos === */}
          <section className="grupos-card">
            <h2 className="grupos-title">Grupos asignados</h2>
            <p className="grupos-text">
              Visualice los grupos y materias que tiene asignados este semestre.
            </p>

            <div className="grupos-table-wrapper">
              <Table
                columns={columns}
                data={data}
                emptyMessage="No hay grupos asignados"
                striped
                hover
              />
            </div>

            <div className="grupos-btns">
              <Button variant="primary" onClick={imprimirComprobante}>
                Imprimir comprobante
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
