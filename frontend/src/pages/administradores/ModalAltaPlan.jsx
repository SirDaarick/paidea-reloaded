// frontend/src/pages/administradores/ModalAltaPlan.jsx
import React, { useState, useEffect } from "react";
import Button from "components/Button";
import apiCall from "consultas/APICall";

const ModalAltaPlan = ({ isOpen, onClose, onSuccess, planId }) => {
  const [form, setForm] = useState({
    nombre: "",
    clave: "",
    creditos: "",
    semestre: "",
    url: ""
  });

  useEffect(() => {
    if (!isOpen) {
      setForm({ nombre: "", clave: "", creditos: "", semestre: "", url: "" });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validar = () => {
    if (!form.nombre.trim()) return "Ingrese el nombre de la materia";
    if (!form.clave.trim()) return "Ingrese la clave";
    if (!form.creditos.trim() || isNaN(Number(form.creditos))) return "Créditos inválidos";
    if (!form.semestre.toString().trim() || isNaN(Number(form.semestre))) return "Semestre inválido";
    if (!form.url.trim()) return "Ingrese la URL del programa (PDF)";
    return null;
  };

  const handleSubmit = async () => {
    const err = validar();
    if (err) return alert(err);

    const payload = {
      nombre: form.nombre.trim(),
      clave: form.clave.trim(),
      creditos: Number(form.creditos),
      semestre: Number(form.semestre),
      url: form.url.trim(),
      idCarrera: planId,
      optativa: false,
      prerrequisitos: []
    };

    try {
      await apiCall("/materia", "POST", payload);
      if (typeof onSuccess === "function") onSuccess();
    } catch (e) {
      console.error("Error creando materia:", e);
      const msg = e.message || "Error al crear materia";
      alert(msg);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 720 }}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2 className="modal-title" style={{ textAlign: "center" }}>Nueva Materia</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          <input placeholder="Nombre completo" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Clave (ej. B102)" value={form.clave} onChange={e => setForm({ ...form, clave: e.target.value })} style={{ flex: 1 }} />
            <input placeholder="Créditos" value={form.creditos} onChange={e => setForm({ ...form, creditos: e.target.value })} style={{ width: 120 }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Semestre" value={form.semestre} onChange={e => setForm({ ...form, semestre: e.target.value })} style={{ width: 160 }} />
            <input placeholder="URL PDF (programa sintético)" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 8 }}>
            <Button variant="primary" onClick={handleSubmit}>Guardar</Button>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalAltaPlan;
