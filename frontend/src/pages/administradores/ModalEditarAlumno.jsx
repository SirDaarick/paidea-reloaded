import React, { useState, useEffect } from 'react';
import Button from 'components/Button';
// Importar Mensaje
import Mensaje from 'components/Mensaje';

const formStyles = {
  formSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    paddingBottom: '20px',
  },
  inputGroup: {
    display: 'flex',
    gap: '15px',
  },
  input: {
    flex: 1,
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
  }
};

const ModalEditarAlumno = ({ alumno, onEditarSubmit }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    boleta: '',
    correo: '',
    carrera: '',
    promedio: '',
    creditos: '',
    status: ''
  });

  // --- ESTADO PARA MENSAJES ---
  const [mensajeData, setMensajeData] = useState({
    visible: false,
    titulo: "",
    mensaje: ""
  });

  const mostrarMensaje = (titulo, mensaje) => {
    setMensajeData({ visible: true, titulo, mensaje });
  };
  // ---------------------------

  useEffect(() => {
    if (alumno) {
      setFormData({
        nombre: alumno.nombre || '',
        boleta: alumno.boleta || '',
        correo: alumno.correo || '',
        carrera: alumno.carrera || alumno.dataAlumno?.idCarrera || '',
        promedio: alumno.dataAlumno?.promedio || '',
        creditos: alumno.dataAlumno?.creditosCursados || '',
        status: alumno.dataAlumno?.situacionEscolar || ''
      });
    }
  }, [alumno]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.nombre || !formData.boleta || !formData.correo) {
      mostrarMensaje("Atención", "Nombre, boleta y correo son obligatorios.");
      return;
    }

    onEditarSubmit(formData);
  };

  return (
    <div>
      <h3 style={{ color: '#243159', textAlign: 'center', marginBottom: '20px' }}>
        Editar Alumno
      </h3>

      <form onSubmit={handleSubmit}>
        <div style={formStyles.formSection}>
          <div style={formStyles.inputGroup}>
            <input
              name="nombre"
              placeholder="Nombre completo"
              style={formStyles.input}
              value={formData.nombre}
              onChange={handleChange}
            />
          </div>

          <div style={formStyles.inputGroup}>
            <input
              name="boleta"
              placeholder="Boleta"
              style={formStyles.input}
              value={formData.boleta}
              onChange={handleChange}
              disabled
            />
            <input
              name="correo"
              placeholder="Correo"
              style={formStyles.input}
              value={formData.correo}
              onChange={handleChange}
            />
          </div>

          <div style={formStyles.inputGroup}>
            <input
              name="carrera"
              placeholder="Carrera"
              style={formStyles.input}
              value={formData.carrera}
              onChange={handleChange}
            />
            <input
              name="status"
              placeholder="Situación escolar"
              style={formStyles.input}
              value={formData.status}
              onChange={handleChange}
            />
          </div>

          <div style={formStyles.inputGroup}>
            <input
              name="creditos"
              placeholder="Créditos"
              type="number"
              style={formStyles.input}
              value={formData.creditos}
              onChange={handleChange}
            />
            <input
              name="promedio"
              placeholder="Promedio"
              type="number"
              step="0.1"
              style={formStyles.input}
              value={formData.promedio}
              onChange={handleChange}
            />
          </div>

          <Button type="submit" variant="primary" style={{ background: "#4c6cb7", color: "#fff" }}>
            Guardar cambios
          </Button>
        </div>
      </form>

      {/* COMPONENTE MENSAJE */}
      <Mensaje 
        visible={mensajeData.visible}
        titulo={mensajeData.titulo}
        mensaje={mensajeData.mensaje}
        onCerrar={() => setMensajeData({ ...mensajeData, visible: false })}
      />
    </div>
  );
};

export default ModalEditarAlumno;