// frontend/src/pages/administradores/ModalEditarPlan.jsx
import React, { useState, useEffect } from "react";
import Button from "components/Button";
import apiCall from "consultas/APICall";
import Emergente from "components/Emergente";

const ModalEditarPlan = ({ isOpen, onClose, materia, onSuccess, adminPassword, validarMateria }) => {
  const [form, setForm] = useState({
    nombre: '',
    clave: '',
    creditos: '',
    semestre: '',
    url: ''
  });

  const [password, setPassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (materia) {
      setForm({
        nombre: materia.nombre || '',
        clave: materia.clave || '',
        creditos: materia.creditos ?? '',
        semestre: materia.semestre ?? '',
        url: materia.url || ''
      });
    }
  }, [materia]);

  if (!isOpen || !materia) return null;

  const handleGuardar = async () => {
    const error = validarMateria({
      ...form,
      creditos: Number(form.creditos),
      semestre: Number(form.semestre)
    });

    if (error) {
      alert(error);
      return;
    }

    try {
      await apiCall(`/materia/${materia._id}`, 'PUT', {
        nombre: form.nombre.trim(),
        clave: form.clave.trim(),
        creditos: Number(form.creditos),
        semestre: Number(form.semestre),
        url: form.url.trim()
      });
      if (onSuccess) onSuccess();
    } catch (e) {
      console.error(e);
      alert("Error al actualizar materia");
    }
  };

  const confirmarEliminacion = async () => {
    if (password !== adminPassword) {
      alert("Contraseña incorrecta");
      return;
    }

    try {
      await apiCall(`/materia/${materia._id}`, 'DELETE');
      if (onSuccess) onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      alert("Error al eliminar materia");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 720 }}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2 className="modal-title" style={{ textAlign: "center" }}>Editar Materia</h2>

        <input
          type="text"
          placeholder="Nombre completo"
          value={form.nombre}
          onChange={e => setForm({ ...form, nombre: e.target.value })}
        />

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            type="text"
            placeholder="Clave"
            value={form.clave}
            onChange={e => setForm({ ...form, clave: e.target.value })}
            style={{ flex: 1 }}
          />
          <input
            type="number"
            placeholder="Créditos"
            value={form.creditos}
            onChange={e => setForm({ ...form, creditos: e.target.value })}
            style={{ width: 120 }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            type="number"
            placeholder="Semestre"
            value={form.semestre}
            onChange={e => setForm({ ...form, semestre: e.target.value })}
            style={{ width: 120 }}
          />
          <input
            type="text"
            placeholder="URL PDF"
            value={form.url}
            onChange={e => setForm({ ...form, url: e.target.value })}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <input
            type="password"
            placeholder="Contraseña administrador (obligatoria para eliminar)"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 16 }}>
          <Button variant="primary" onClick={handleGuardar}>Guardar</Button>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>Eliminar</Button>
        </div>

        <Emergente isOpen={confirmDelete} onClose={() => setConfirmDelete(false)}>
          <h4>Confirmar eliminación</h4>
          <p>¿Seguro que deseas eliminar esta materia? Esta acción no se puede deshacer.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 10 }}>
            <Button variant="danger" onClick={confirmarEliminacion}>Eliminar</Button>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
          </div>
        </Emergente>
      </div>
    </div>
  );
};

export default ModalEditarPlan;