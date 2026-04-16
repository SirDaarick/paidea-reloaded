import React, { useState, useEffect } from "react";
import Button from "components/Button";
import Mensaje from "components/Mensaje";
import "styles/modalForms.css";

// Regex básica para validar el formato de RFC y CURP
const RFC_REGEX = /^[A-Z&Ñ]{3,4}\d{6}[A-Z\d]{3}$/;
const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]{2}$/;

// --- LISTA DE ACADEMIAS (Puedes editarla o cargarla de la BD) ---
const LISTA_ACADEMIAS = [
  "Ingeniería de Software",
  "Inteligencia Artificial",
  "Ciencia de Datos",
  "Sistemas Digitales",
  "Formación Básica",
  "Redes y Conectividad",
  "Metodología de la Investigación",
  "Ciencias Sociales",
  "Trabajo Terminal"
];

const ModalAltaProfesor = ({ onAltaSubmit }) => {
  // Estados del formulario individual
  const [form, setForm] = useState({
    nombre: "",
    rfc: "",
    curp: "",
    correo: "",
    departamento: "", // 🆕 Agregamos el campo para la academia
    passwordAdmin: "",
  });

  // Estados para carga de archivo
  const [passwordAdminArchivo, setPasswordAdminArchivo] = useState('');
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [datosArchivo, setDatosArchivo] = useState([]);
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [xlsxCargado, setXlsxCargado] = useState(false);

  // Estado para manejar los errores
  const [errores, setErrores] = useState({});
  const [erroresArchivo, setErroresArchivo] = useState({});
  
  const [mensajeData, setMensajeData] = useState({
    visible: false,
    titulo: "",
    mensaje: "",
  });

  const mostrarMensaje = (titulo, mensaje) =>
    setMensajeData({ visible: true, titulo, mensaje });

  // Cargar librería XLSX
  useEffect(() => {
    if (!window.XLSX) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.async = true;
      script.onload = () => setXlsxCargado(true);
      script.onerror = () => {
        console.error('Error cargando librería XLSX');
        mostrarMensaje('Error', 'No se pudo cargar el módulo para leer archivos Excel');
      };
      document.body.appendChild(script);
    } else {
      setXlsxCargado(true);
    }
  }, []);

  const handleChange = (campo, valor) => {
    setForm({ ...form, [campo]: valor });
    if (errores[campo]) {
      setErrores({ ...errores, [campo]: false });
    }
  };

  const clearErrorArchivo = (field) => {
    if (erroresArchivo[field]) {
      setErroresArchivo(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    const nuevosErrores = {};

    // ✅ VALIDACIÓN 1: Campos vacíos
    if (!form.nombre.trim()) nuevosErrores.nombre = "Ingrese el nombre";
    if (!form.rfc.trim()) nuevosErrores.rfc = "Ingrese el RFC";
    if (!form.curp.trim()) nuevosErrores.curp = "Ingrese el CURP";
    if (!form.correo.trim()) nuevosErrores.correo = "Ingrese el correo";
    if (!form.departamento.trim()) nuevosErrores.departamento = "Seleccione una academia"; // 🆕 Validación
    if (!form.passwordAdmin.trim()) nuevosErrores.passwordAdmin = "Ingrese la contraseña";

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    // ✅ VALIDACIÓN 2: Contraseña válida
    if (form.passwordAdmin !== "Admin123") {
      setErrores({ passwordAdmin: "Contraseña incorrecta" });
      mostrarMensaje("Acceso denegado", "Contraseña de administrador incorrecta.");
      return;
    }

    // ✅ VALIDACIÓN 3: Formatos
    if (form.rfc.length !== 13) {
      setErrores({ rfc: "El RFC debe tener 13 caracteres" });
      return;
    }
    if (!RFC_REGEX.test(form.rfc.toUpperCase())) {
      setErrores({ rfc: "Formato de RFC incorrecto" });
      return;
    }
    if (form.curp.length !== 18) {
      setErrores({ curp: "El CURP debe tener 18 caracteres" });
      return;
    }
    if (!CURP_REGEX.test(form.curp.toUpperCase())) {
      setErrores({ curp: "Formato de CURP incorrecto" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.correo)) {
      setErrores({ correo: "Formato de correo incorrecto" });
      return;
    }

    // --- ENVIAR DATOS ---
    try {
      // Preparamos el objeto tal como lo espera Mongo (dataProfesor dentro)
      // Ojo: Depende de cómo esté tu `handleAltaProfesor` en el padre.
      // Aquí enviaremos los datos planos y el padre debe estructurarlos, 
      // o si tu API recibe todo plano, lo mandamos así.
      
      await onAltaSubmit({
        nombre: form.nombre,
        rfc: form.rfc.toUpperCase(),
        curp: form.curp.toUpperCase(),
        correo: form.correo,
        departamento: form.departamento, // 🆕 Enviamos la academia seleccionada
        passwordAdmin: form.passwordAdmin
      });

      // Limpiar campos
      setForm({ nombre: "", rfc: "", curp: "", correo: "", departamento: "", passwordAdmin: "" });
      setErrores({});
      
      mostrarMensaje(
        "Éxito", 
        `Profesor registrado en academia: ${form.departamento}`
      );
    } catch (error) {
      console.error("Error al guardar:", error);
      mostrarMensaje("Error", "No se pudo registrar al profesor. Verifique si ya existe.");
    }
  };

  // ... (Lógica de Archivos se mantiene igual, omitida por brevedad pero NO la borres) ...
  // ... Asegúrate de mantener handleFileSelect, limpiarArchivo y handleSubmitArchivo ...
  const handleFileSelect = (e) => { /* Tu código original */ };
  const limpiarArchivo = () => { /* Tu código original */ };
  const handleSubmitArchivo = async () => { /* Tu código original */ };


  return (
    <div>
      <h3 className="modal-title">Dar de alta profesor</h3>

      <div>
        <div className="modal-form-section">
          
          {/* Fila 1: NOMBRE */}
          <div className="modal-input-group">
            <div className="modal-input-wrapper">
              <input
                className={`modal-input ${errores.nombre ? "modal-input-error" : ""}`}
                type="text"
                placeholder="Nombre completo"
                value={form.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
              />
              {errores.nombre && <p className="modal-error-message">{errores.nombre}</p>}
            </div>
          </div>

          {/* 🆕 Fila 2: ACADEMIA (MENU DESPLEGABLE) */}
          <div className="modal-input-group">
            <div className="modal-input-wrapper">
              <select
                className={`modal-input ${errores.departamento ? "modal-input-error" : ""}`}
                value={form.departamento}
                onChange={(e) => handleChange("departamento", e.target.value)}
                style={{ backgroundColor: "white" }}
              >
                <option value="">Seleccione Academia...</option>
                {LISTA_ACADEMIAS.map((academia, index) => (
                  <option key={index} value={academia}>
                    {academia}
                  </option>
                ))}
              </select>
              {errores.departamento && <p className="modal-error-message">{errores.departamento}</p>}
            </div>
          </div>

          {/* Fila 3: RFC */}
          <div className="modal-input-group">
            <div className="modal-input-wrapper">
              <input
                className={`modal-input ${errores.rfc ? "modal-input-error" : ""}`}
                type="text"
                placeholder="RFC (13 caracteres)"
                maxLength={13}
                value={form.rfc}
                onChange={(e) => handleChange("rfc", e.target.value.toUpperCase())}
              />
              {errores.rfc && <p className="modal-error-message">{errores.rfc}</p>}
            </div>
          </div>

          {/* Fila 4: CURP + CORREO */}
          <div className="modal-input-group">
            <div className="modal-input-wrapper">
              <input
                className={`modal-input ${errores.curp ? "modal-input-error" : ""}`}
                type="text"
                placeholder="CURP (18 caracteres)"
                maxLength={18}
                value={form.curp}
                onChange={(e) => handleChange("curp", e.target.value.toUpperCase())}
              />
              {errores.curp && <p className="modal-error-message">{errores.curp}</p>}
            </div>

            <div className="modal-input-wrapper">
              <input 
                type="email" 
                placeholder="Correo electrónico" 
                className={`modal-input ${errores.correo ? 'modal-input-error' : ''}`}
                value={form.correo} 
                onChange={e => handleChange("correo", e.target.value)}
              />
              {errores.correo && <p className="modal-error-message">{errores.correo}</p>}
            </div>
          </div>

          {/* Fila 5: PASSWORD ADMIN */}
          <div className="modal-input-group">
            <div style={{flex: 0.5}}></div>
            <div className="modal-input-wrapper" style={{flex: 0.5}}>
              <input
                className={`modal-input ${errores.passwordAdmin ? "modal-input-error" : ""}`}
                type="password"
                placeholder="Contraseña administrador"
                value={form.passwordAdmin}
                onChange={(e) => handleChange("passwordAdmin", e.target.value)}
              />
              {errores.passwordAdmin && <p className="modal-error-message">{errores.passwordAdmin}</p>}
            </div>
            <div style={{flex: 0.5}}></div>
          </div>

          <Button onClick={handleSubmit} variant="primary" style={{ width: "100%", backgroundColor: '#4c6cb7' }}>
            Registrar profesor
          </Button>
        </div>
      </div>

      {/* SECCIÓN DE ARCHIVO (UI) */}
      <h4 className="modal-subtitle">
        O ingrese archivo con varios profesores
      </h4>
      
      <div className="modal-form-section" style={{borderBottom: 'none'}}>
        <div className="modal-input-group">
          <div className="modal-input-wrapper" style={{flex: 0.5}}>
            <input 
              type="password" 
              placeholder="Contraseña administrador" 
              className={`modal-input ${erroresArchivo.passwordAdminArchivo ? 'modal-input-error' : ''}`}
              value={passwordAdminArchivo}
              onChange={e => {
                setPasswordAdminArchivo(e.target.value);
                if (e.target.value.trim()) clearErrorArchivo('passwordAdminArchivo');
              }}
            />
            {erroresArchivo.passwordAdminArchivo && <p className="modal-error-message">Ingrese la contraseña</p>}
          </div>
          <div style={{flex: 0.5}} />
        </div>
        
        <div className="modal-buttons-container">
          <input 
            id="file-input-alta-profesor"
            type="file"
            accept=".xlsx"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Button 
            variant="secondary" 
            style={{ backgroundColor: '#4c6cb7', color: '#fff', border: 'none' }}
            onClick={() => document.getElementById('file-input-alta-profesor').click()}
          >
            Seleccionar archivo
          </Button>
          <Button 
            variant="primary" 
            style={{ 
              backgroundColor: datosArchivo.length > 0 ? '#4c6cb7' : '#ccc',
              color: '#fff', 
              border: 'none',
              cursor: datosArchivo.length > 0 ? 'pointer' : 'not-allowed',
              opacity: datosArchivo.length > 0 ? 1 : 0.6
            }}
            onClick={handleSubmitArchivo}
            disabled={datosArchivo.length === 0}
          >
            Registrar datos
          </Button>
        </div>
        
        {/* Visualización de archivo cargado */}
        {archivoSeleccionado && (
          <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#495057' }}>📄 {nombreArchivo}</span>
              <button onClick={limpiarArchivo} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
            <div style={{ fontSize: '13px', color: '#6c757d' }}>
              {datosArchivo.length} profesores detectados
            </div>
          </div>
        )}
        
        <p className="modal-coming-soon">
          {archivoSeleccionado ? "Verifique la estructura" : "Formatos compatibles: .xlsx"}
        </p>
      </div>

      <Mensaje
        visible={mensajeData.visible}
        titulo={mensajeData.titulo}
        mensaje={mensajeData.mensaje}
        onCerrar={() => setMensajeData({ ...mensajeData, visible: false })}
      />
    </div>
  );
};

export default ModalAltaProfesor;