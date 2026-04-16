import React, { useMemo, useRef, useState, useEffect } from "react";
import SelectField from "components/SelectField";
import MenuProfesor from "components/MenuProfesor";
import CuadroDatos from "components/CuadroDatos";
import Table from "components/Table";
import Button from "components/Button";
import Mensaje from "components/Mensaje.jsx";
import { useGruposProfesor } from "hooks/useGruposProfesor";
import { useAsistencias } from "hooks/useAsistenciasCalificaciones";
import { useProfesor } from "hooks/useProfesor";
import { useIdProfesor } from "hooks/useIdProfesor";
import "styles/Asistencias.css";

export default function Asistencias() {
  const { idProfesor } = useIdProfesor();
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [udaSeleccionada, setUdaSeleccionada] = useState(null);
  const [asistenciasLocales, setAsistenciasLocales] = useState([]);

  // ESTADOS DEL MENSAJE
  const [msgVisible, setMsgVisible] = useState(false);
  const [msgTitulo, setMsgTitulo] = useState("");
  const [msgTexto, setMsgTexto] = useState("");

  const { profesor } = useProfesor(idProfesor);
  const { grupos } = useGruposProfesor(idProfesor);
  
  // Obtener claseId de la materia seleccionada
  const claseId = useMemo(() => {
    if (!grupoSeleccionado || !udaSeleccionada) return null;
    const grupo = grupos.find(g => g._id === grupoSeleccionado);
    const materia = grupo?.materias?.find(m => m.id === udaSeleccionada);
    return materia?.claseId || null;
  }, [grupoSeleccionado, udaSeleccionada, grupos]);
  
  const { asistencias } = useAsistencias(claseId);

  useEffect(() => {
    if (asistencias && asistencias.length > 0) {
      setAsistenciasLocales(asistencias.map(a => ({ ...a, presente: false })));
    } else {
      setAsistenciasLocales([]);
    }
  }, [asistencias]);

  useEffect(() => {
    setUdaSeleccionada(null);
    setAsistenciasLocales([]);
  }, [grupoSeleccionado]);
  
  useEffect(() => {
    setAsistenciasLocales([]);
  }, [claseId]);

  const opcionesGrupos = useMemo(() => grupos.map(g => ({ value: g._id, label: g.nombre || 'Sin nombre' })), [grupos]);

  const opcionesUdas = useMemo(() => {
    if (!grupoSeleccionado) return [];
    const grupo = grupos.find(g => g._id === grupoSeleccionado);
    return grupo?.materias?.map(m => ({ value: m.id, label: m.nombre })) || [];
  }, [grupoSeleccionado, grupos]);

  const materiaInfo = useMemo(() => {
    if (!grupoSeleccionado || !udaSeleccionada) return null;
    const grupo = grupos.find(g => g._id === grupoSeleccionado);
    return grupo?.materias?.find(m => m.id === udaSeleccionada) || null;
  }, [grupoSeleccionado, udaSeleccionada, grupos]);

  useEffect(() => { if (opcionesGrupos.length > 0 && !grupoSeleccionado) setGrupoSeleccionado(opcionesGrupos[0].value); }, [opcionesGrupos]);
  useEffect(() => {
    if (opcionesUdas.length > 0 && !udaSeleccionada) setUdaSeleccionada(opcionesUdas[0].value);
    else if (opcionesUdas.length === 0) setUdaSeleccionada(null);
  }, [opcionesUdas]);

  const toggleAsistencia = index => {
    setAsistenciasLocales(prev => {
      const nuevas = [...prev];
      nuevas[index] = { ...nuevas[index], presente: !nuevas[index].presente };
      return nuevas;
    });
  };

  const datosResumen = profesor ? {
    rfc: profesor.datosPersonales?.rfc || "N/A",
    nombre: profesor.nombre,
    departamento: profesor.dataProfesor?.departamento || "N/A",
    sexo: profesor.datosPersonales?.sexo || "N/A",
    estadoCivil: profesor.datosPersonales?.estadoCivil || "N/A",
  } : {};

  const tableRef = useRef(null);

  const descargarCSV = () => {
    if (!grupoSeleccionado || !udaSeleccionada) {
      setMsgTitulo("Selección incompleta");
      setMsgTexto("Por favor, selecciona un grupo y una unidad de aprendizaje.");
      setMsgVisible(true);
      return;
    }

    const header = ["Boleta", "Nombre", "Correo", "Asistencia"];
    const data = asistenciasLocales.map(a => [
      a.idInscripcion?.idAlumno?.boleta || "N/A",
      a.idInscripcion?.idAlumno?.nombre || "N/A",
      a.idInscripcion?.idAlumno?.correo || "N/A",
      a.presente ? "Presente" : "Ausente"
    ]);
    const csv = [header, ...data].map(line => line.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asistencia_${grupoSeleccionado}_${udaSeleccionada}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setMsgTitulo("Descarga exitosa");
    setMsgTexto("El archivo CSV se ha descargado correctamente.");
    setMsgVisible(true);
  };

  const imprimirSoloTabla = () => {
    if (!grupoSeleccionado || !udaSeleccionada) {
      setMsgTitulo("Selección incompleta");
      setMsgTexto("Por favor, selecciona un grupo y una unidad de aprendizaje.");
      setMsgVisible(true);
      return;
    }

    const win = window.open("", "_blank");
    if (!win) {
      setMsgTitulo("Error al imprimir");
      setMsgTexto("No se pudo abrir la ventana de impresión. Verifica que los pop-ups no estén bloqueados.");
      setMsgVisible(true);
      return;
    }
    const grupoLabel = opcionesGrupos.find(g => g.value === grupoSeleccionado)?.label || grupoSeleccionado;
    const udaLabel = opcionesUdas.find(u => u.value === udaSeleccionada)?.label || udaSeleccionada;

    const styles = `
      <style>
        @page { size: A4 portrait; margin: 16mm; }
        body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 8px 10px; font-size: 12pt; }
        th { background: #e5e7eb; text-align: left; }
        tbody tr { height: 28px; }
        input[type="checkbox"] { width: 18px; height: 18px; }
      </style>
    `;

    const meta = `
      <div class="title">Lista de asistencia</div>
      <div class="meta"><b>Grupo:</b> ${grupoLabel} &nbsp;&nbsp; <b>UDA:</b> ${udaLabel}</div>
    `;

    const tableHTML = `
      <table>
        <thead><tr><th>Boleta</th><th>Nombre</th><th>Correo</th><th>Asistencia</th></tr></thead>
        <tbody>
          ${asistenciasLocales.map(a => `
            <tr>
              <td>${a.idInscripcion?.idAlumno?.boleta || "N/A"}</td>
              <td>${a.idInscripcion?.idAlumno?.nombre || "N/A"}</td>
              <td>${a.idInscripcion?.idAlumno?.correo || "N/A"}</td>
              <td style="text-align:center;">
                <input type="checkbox" ${a.presente ? 'checked' : ''}/>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    win.document.write(`<!doctype html><html><head><meta charset="utf-8"/>${styles}</head><body>${meta}${tableHTML}</body></html>`);
    win.document.close(); win.focus();
    setTimeout(() => { win.print(); win.close(); }, 200);
  };

  const columns = [
    { key: "boleta", label: "Boleta" },
    { key: "nombre", label: "Nombre" },
    { key: "correo", label: "Correo" },
    { key: "asistencia", label: "Asistencia" }
  ];

  const tableData = asistenciasLocales.map(a => ({
    boleta: a.idInscripcion?.idAlumno?.boleta || "N/A",
    nombre: a.idInscripcion?.idAlumno?.nombre || "N/A",
    correo: a.idInscripcion?.idAlumno?.correo || "N/A",
    asistencia: <input type="checkbox" checked={a.presente} onChange={() => toggleAsistencia(asistenciasLocales.indexOf(a))} />
  }));

  return (
    <>
      <MenuProfesor />

      {/* === MODAL DE MENSAJE === */}
      <Mensaje
        titulo={msgTitulo}
        mensaje={msgTexto}
        visible={msgVisible}
        onCerrar={() => setMsgVisible(false)}
      />

      <div className="asistencias-container">
        <h1>Listas de asistencia</h1>

        <div className="filtros-asistencias">
          <SelectField label="Elegir grupo" value={grupoSeleccionado || ""} onChange={e => setGrupoSeleccionado(e.target.value)} options={opcionesGrupos} />
          <SelectField label="Elegir unidad de aprendizaje" value={udaSeleccionada || ""} onChange={e => setUdaSeleccionada(e.target.value)} options={opcionesUdas} />
          <div className="acciones-asistencias">
            <Button onClick={imprimirSoloTabla} variant="secondary">Imprimir PDF</Button>
            <Button onClick={descargarCSV} variant="primary">Descargar CSV</Button>
          </div>
        </div>

        {materiaInfo && (
          <div className="info-materia">
            <div className="grid">
              <div>
                <strong>Salón:</strong>
                <div>{materiaInfo.salon || 'No asignado'}</div>
              </div>
              <div>
                <strong>Horarios:</strong>
                <div>
                  {Object.entries(materiaInfo.horarios || {}).map(([dia, hora]) => (
                    <span key={dia} className="horario-tag">{dia.slice(0, 3)}: {hora}</span>
                  ))}
                  {Object.keys(materiaInfo.horarios || {}).length === 0 && <span>Sin horarios asignados</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="layout-asistencias">
          <div className="datos-personales-aside-left">
            <CuadroDatos datos={datosResumen} />
          </div>

          <div className="asistencia-table">
            <Table columns={columns} data={tableData} striped hover emptyMessage={!grupoSeleccionado || !udaSeleccionada ? "Seleccione un grupo y una unidad de aprendizaje" : "No hay alumnos inscritos"} />
          </div>
        </div>
      </div>
    </>
  );
}
