import React, { useState, useEffect } from "react";
import MenuAdmin from "../../components/MenuAdmin";
import apiCall from "consultas/APICall";

export default function PeriodosAcademicos() {
  // =========================
  // ESTADOS
  // =========================
  const [periodosAcademicos, setPeriodosAcademicos] = useState([]);
  const [periodos, setPeriodos] = useState([]);

  const [periodoEscolar, setPeriodoEscolar] = useState("");
  const [tipoPeriodo, setTipoPeriodo] = useState("");
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");

  const [editandoId, setEditandoId] = useState(null);

  // =========================
  // CARGA INICIAL
  // =========================
  useEffect(() => {
    cargarPeriodosAcademicos();
    cargarPeriodosInscripcion();
  }, []);

  const cargarPeriodosAcademicos = async () => {
    try {
      const data = await apiCall("/periodoAcademico");
      setPeriodosAcademicos(data);
    } catch (error) {
      console.error("Error cargando periodos académicos:", error);
    }
  };

  const cargarPeriodosInscripcion = async () => {
    try {
      const data = await apiCall("/periodoInscripcion");
      setPeriodos(data);
    } catch (error) {
      console.error("Error cargando periodos:", error);
    }
  };

  // =========================
  // UTILIDADES
  // =========================
  // 🔥 FECHA SIN TIMEZONE
  const formatDate = (value) => {
    if (!value) return "";
    return value.split("T")[0].split("-").reverse().join("/");
  };

  const limpiarFormulario = () => {
    setPeriodoEscolar("");
    setTipoPeriodo("");
    setInicio("");
    setFin("");
    setEditandoId(null);
  };

  // =========================
  // GUARDAR / ACTUALIZAR
  // =========================
  const handleGuardar = async () => {
    if (!periodoEscolar || !tipoPeriodo || !inicio || !fin) {
      alert("Completa todos los campos");
      return;
    }

    try {
      if (editandoId) {
        // 🟡 ACTUALIZAR
        await apiCall(`/periodoInscripcion/${editandoId}`, "PUT", {
          tipo: tipoPeriodo,
          fechaInicio: inicio,
          fechaFinal: fin,
        });
      } else {
        // 🟢 CREAR (periodo completo)
        await apiCall("/periodosCompletos", "POST", {
          periodoEscolar,
          tipo: tipoPeriodo,
          fechaInicio: inicio,
          fechaFinal: fin,
        });
      }

      limpiarFormulario();
      cargarPeriodosInscripcion();
    } catch (error) {
      console.error(error);
      alert("Error al guardar el periodo");
    }
  };

  // =========================
  // EDITAR
  // =========================
  const handleEditar = (p) => {
    setPeriodoEscolar(p.idPeriodoAcademico?.nombre || "");
    setTipoPeriodo(p.tipo);
    setInicio(p.fechaInicio.split("T")[0]);
    setFin(p.fechaFinal.split("T")[0]);
    setEditandoId(p._id);
  };

  return (
    <>
      <MenuAdmin />

      <div style={styles.container}>
        <h2 style={styles.titulo}>Gestión de períodos académicos</h2>

        {/* === FORMULARIO === */}
        <div style={styles.formWrapper}>
          <div style={styles.formulario}>
            {/* PERIODO ESCOLAR */}
            <div style={styles.campo}>
              <label>Periodo escolar</label>
              <select
                value={periodoEscolar}
                onChange={(e) => setPeriodoEscolar(e.target.value)}
                style={styles.input}
                disabled={!!editandoId}
              >
                <option value="">Selecciona un periodo</option>
                {periodosAcademicos.map((p) => (
                  <option key={p._id} value={p.nombre}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* TIPO */}
            <div style={styles.campo}>
              <label>Tipo de período</label>
              <select
                value={tipoPeriodo}
                onChange={(e) => setTipoPeriodo(e.target.value)}
                style={styles.input}
              >
                <option value="">Selecciona</option>
                <option value="Reinscripcion">Reinscripción</option>
                <option value="ETS">ETS</option>
                <option value="Calif-P1">Evaluación – 1er Parcial</option>
                <option value="Calif-P2">Evaluación – 2do Parcial</option>
                <option value="Calif-P3">Evaluación – 3er Parcial</option>
              </select>
            </div>

            {/* FECHAS */}
            <div style={styles.campo}>
              <label>Fecha inicio</label>
              <input
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.campo}>
              <label>Fecha fin</label>
              <input
                type="date"
                value={fin}
                onChange={(e) => setFin(e.target.value)}
                style={styles.input}
              />
            </div>

            <button style={styles.boton} onClick={handleGuardar}>
              {editandoId ? "Actualizar período" : "Guardar período"}
            </button>

            {editandoId && (
              <button
                style={styles.botonCancelar}
                onClick={limpiarFormulario}
              >
                Cancelar edición
              </button>
            )}
          </div>
        </div>

        {/* === TABLA === */}
        <div style={styles.lista}>
          <h3>Períodos registrados</h3>

          {periodos.length === 0 ? (
            <p>No hay períodos registrados</p>
          ) : (
            <table style={styles.tabla}>
              <thead>
                <tr>
                  <th style={styles.th}>Periodo</th>
                  <th style={styles.th}>Tipo</th>
                  <th style={styles.th}>Inicio</th>
                  <th style={styles.th}>Fin</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {periodos.map((p) => (
                  <tr key={p._id}>
                    <td style={styles.td}>
                      {p.idPeriodoAcademico?.nombre}
                    </td>
                    <td style={styles.td}>{p.tipo}</td>
                    <td style={styles.td}>{formatDate(p.fechaInicio)}</td>
                    <td style={styles.td}>{formatDate(p.fechaFinal)}</td>
                    <td style={styles.td}>
                      <button
                        style={styles.botonEditar}
                        onClick={() => handleEditar(p)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

/* =========================
   ESTILOS
========================= */
const styles = {
  container: { padding: "20px", fontFamily: "Arial" },
  titulo: { marginBottom: "20px", color: "#1A2378" },
  formWrapper: { display: "flex", justifyContent: "center", marginBottom: "30px" },
  formulario: {
    background: "#F5F6FA",
    padding: "20px",
    borderRadius: "10px",
    width: "100%",
    maxWidth: "600px",
  },
  campo: { display: "flex", flexDirection: "column", marginBottom: "15px" },
  input: { padding: "8px", borderRadius: "6px", border: "1px solid #ccc" },
  boton: {
    background: "#1A2378",
    color: "#fff",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer",
    marginBottom: "10px",
  },
  botonCancelar: {
    background: "#9E9E9E",
    color: "#fff",
    border: "none",
    padding: "8px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  lista: { marginTop: "30px" },
  tabla: { width: "100%", borderCollapse: "collapse" },
  th: { border: "1px solid #ccc", padding: "8px", background: "#E8EAF6" },
  td: { border: "1px solid #ccc", padding: "8px", textAlign: "center" },
  botonEditar: {
    background: "#3949AB",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
