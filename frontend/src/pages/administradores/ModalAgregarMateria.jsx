import React, { useState, useEffect } from "react";
import apiCall from "consultas/APICall";

export default function ModalAgregarMateria({ idAlumno, idPeriodo, onClose, onAdded }) {
  const [clases, setClases] = useState([]);
  const [idClaseSel, setIdClaseSel] = useState("");

  useEffect(() => {
    const cargar = async () => {
      const res = await apiCall("/clase", "GET");
      setClases(res);
    };
    cargar();
  }, []);

  const agregar = async () => {
    if (!idClaseSel) return;
    await apiCall("/inscripcionClase", "POST", {
      idInscripcion: idPeriodo,
      idClase: idClaseSel,
      estatus: "Inscrito"
    });
    onAdded();
    onClose();
  };

  return (
    <div className="modal">
      <h3>Agregar materia</h3>

      <select 
        value={idClaseSel} 
        onChange={(e) => setIdClaseSel(e.target.value)}
      >
        <option value="">Selecciona una clase</option>
        {clases.map(c => (
          <option key={c._id} value={c._id}>
            {c.idMateria?.nombre} — Grupo {c.idGrupo?.nombre}
          </option>
        ))}
      </select>

      <div style={{ marginTop: "20px" }}>
        <button onClick={agregar} className="catalogo-btn-success">Agregar</button>
        <button onClick={onClose} className="catalogo-btn-danger">Cancelar</button>
      </div>
    </div>
  );
}
