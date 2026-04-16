import React, { useState, useEffect } from 'react';
import Button from 'components/Button'; 
import Mensaje from 'components/Mensaje';
import 'styles/modalForms.css';

const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || '';

const ModalBajaProfesor = ({ onBajaSubmit, listaProfesores = [] }) => {
  // Estados del formulario individual
  const [rfc, setRfc] = useState('');
  const [confirmaRfc, setConfirmaRfc] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados para carga de archivo
  const [passwordAdminArchivo, setPasswordAdminArchivo] = useState('');
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [datosArchivo, setDatosArchivo] = useState([]);
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [xlsxCargado, setXlsxCargado] = useState(false);
   
  // Estado para manejar los errores de validación inline
  const [errors, setErrors] = useState({});
  const [errorsArchivo, setErrorsArchivo] = useState({});
  
  // Estado visual
  const [nombreDetectado, setNombreDetectado] = useState('');

  // Estado para el componente Mensaje
  const [mensajeData, setMensajeData] = useState({
    visible: false,
    titulo: "",
    mensaje: ""
  });

  const mostrarMensaje = (titulo, mensaje) => {
    setMensajeData({ visible: true, titulo, mensaje });
  };

  // Cargar librería XLSX dinámicamente
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

  // EFECTO MÁGICO: Busca el nombre y academia mientras escribes el RFC
  const profesorEncontrado = listaProfesores.find(p => p.rfc.toUpperCase() === rfc.toUpperCase());

  useEffect(() => {
    if (profesorEncontrado) {
      setNombreDetectado(profesorEncontrado.nombre);
    } else {
      setNombreDetectado('');
    }
  }, [rfc, profesorEncontrado]);
  
  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const clearErrorArchivo = (field) => {
    if (errorsArchivo[field]) {
      setErrorsArchivo(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    const newErrors = {};

    // ✅ VALIDACIÓN 1: Campos vacíos (SIN VENTANA EMERGENTE)
    if (!rfc) { 
      newErrors.rfc = "Ingrese el RFC"; 
    }
    if (!confirmaRfc) { 
      newErrors.confirmaRfc = "Confirme el RFC"; 
    }
    if (!password) { 
      newErrors.password = "Ingrese la contraseña"; 
    }
    
    // Si hay campos vacíos, mostrar errores y detener
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // ✅ VALIDACIÓN 2: Configuración y contraseña válida
    if (!ADMIN_PASSWORD) {
      mostrarMensaje("Error de configuración", "No se configuró REACT_APP_ADMIN_PASSWORD.");
      return;
    }
    if (password !== ADMIN_PASSWORD) {
      setErrors({ password: "Contraseña incorrecta" });
      mostrarMensaje("Acceso denegado", "⛔ CONTRASEÑA INCORRECTA. No tienes permiso.");
      return;
    }

    // ✅ VALIDACIÓN 3: Validaciones particulares

    // Coincidencia de RFC
    if (rfc.toUpperCase() !== confirmaRfc.toUpperCase()) {
      setErrors({ confirmaRfc: "Los RFC no coinciden" });
      mostrarMensaje("Error", "Los RFC no coinciden.");
      return;
    }

    // Validación de existencia
    if (!profesorEncontrado) {
      setErrors({ rfc: "Profesor no encontrado" });
      mostrarMensaje("Error", "Ese RFC no existe en la base de datos.");
      return;
    }

    // Confirmación final
    const confirmar = window.confirm(
      `ADVERTENCIA\n\n` +
      `Está a punto de ELIMINAR permanentemente al profesor:\n\n` +
      `Nombre: ${profesorEncontrado.nombre}\n` +
      `RFC: ${profesorEncontrado.rfc}\n` +
      `Academia: ${profesorEncontrado.academia}\n\n` +
      `Esta acción NO SE PUEDE DESHACER.\n\n` +
      `¿Está seguro de continuar?`
    );

    if (!confirmar) {
      mostrarMensaje("Operación cancelada", "No se eliminó ningún profesor.");
      return;
    }

    // --- CORRECCIÓN AQUÍ: try/catch y await ---
    try {
      // Esperamos a que el Padre confirme
      await onBajaSubmit(rfc.toUpperCase());
      
      // Si llegamos aquí, fue éxito. Limpiamos.
      setRfc(''); 
      setConfirmaRfc(''); 
      setPassword('');
      setNombreDetectado('');
      setErrors({});
      
      mostrarMensaje(
        "Profesor eliminado", 
        `El profesor ${profesorEncontrado.nombre} ha sido eliminado correctamente del sistema.`
      );
    } catch (error) {
      console.error("Error en eliminación:", error);
      // NO limpiamos el formulario en caso de error
      mostrarMensaje("Error", "No se pudo eliminar el profesor. Intente nuevamente.");
    }
  };

  // Manejar selección de archivo
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    
    if (!file) {
      return;
    }

    if (!xlsxCargado) {
      mostrarMensaje("Error", "El módulo de Excel aún no está cargado. Intente nuevamente en unos segundos.");
      event.target.value = '';
      return;
    }

    // Validar extensión
    if (!file.name.endsWith('.xlsx')) {
      mostrarMensaje("Archivo no válido", "Solo se permiten archivos con extensión .xlsx");
      event.target.value = '';
      return;
    }

    setArchivoSeleccionado(file);
    setNombreArchivo(file.name);

    // Leer archivo Excel
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = window.XLSX.read(data, { type: 'array' });
        
        // Leer primera hoja
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir a JSON
        const jsonData = window.XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          mostrarMensaje("Archivo vacío", "El archivo no contiene datos válidos.");
          limpiarArchivo();
          return;
        }

        // Validar estructura del archivo (solo requiere rfc)
        const primeraFila = jsonData[0];
        if (!('rfc' in primeraFila)) {
          mostrarMensaje(
            "Estructura incorrecta", 
            "El archivo debe contener al menos la columna 'rfc'"
          );
          limpiarArchivo();
          return;
        }

        setDatosArchivo(jsonData);
      } catch (error) {
        console.error("Error leyendo archivo:", error);
        mostrarMensaje("Error", "No se pudo procesar el archivo. Verifique que sea un archivo Excel válido.");
        limpiarArchivo();
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const limpiarArchivo = () => {
    setArchivoSeleccionado(null);
    setDatosArchivo([]);
    setNombreArchivo('');
    const fileInput = document.getElementById('file-input-baja-profesor');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmitArchivo = async () => {
    // Validación 1: Campos vacíos
    const newErrors = {};
    
    if (!archivoSeleccionado) {
      newErrors.archivo = true;
    }
    if (!passwordAdminArchivo.trim()) {
      newErrors.passwordAdminArchivo = true;
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrorsArchivo(newErrors);
      return;
    }

    // Validación 2: Contraseña admin
    if (passwordAdminArchivo !== "Admin123") {
      mostrarMensaje(
        "Acceso denegado", 
        "Contraseña de administrador incorrecta."
      );
      return;
    }

    // Validación 3: Datos del archivo
    if (datosArchivo.length === 0) {
      mostrarMensaje("Error", "No hay datos válidos para procesar en el archivo.");
      return;
    }

    // Confirmación masiva
    const confirmar = window.confirm(
      `ADVERTENCIA DE ELIMINACIÓN MASIVA\n\n` +
      `Está a punto de eliminar ${datosArchivo.length} ${datosArchivo.length === 1 ? 'profesor' : 'profesores'} del sistema.\n\n` +
      `Esta acción NO SE PUEDE DESHACER.\n\n` +
      `¿Está COMPLETAMENTE seguro de continuar?`
    );

    if (!confirmar) {
      mostrarMensaje("Operación cancelada", "No se eliminó ningún profesor.");
      return;
    }

    // Procesar cada RFC del archivo
    try {
      let exitosos = 0;
      let fallidos = 0;
      const errores = [];

      for (let i = 0; i < datosArchivo.length; i++) {
        const registro = datosArchivo[i];
        
        // Validar que tenga RFC
        if (!registro.rfc) {
          errores.push(`Fila ${i + 2}: RFC vacío`);
          fallidos++;
          continue;
        }

        const rfcBuscar = String(registro.rfc).toUpperCase().trim();

        // Buscar profesor en la lista
        const profesor = listaProfesores.find(p => p.rfc.toUpperCase() === rfcBuscar);

        if (!profesor) {
          errores.push(`Fila ${i + 2}: Profesor con RFC ${rfcBuscar} no encontrado`);
          fallidos++;
          continue;
        }

        // Intentar eliminar profesor
        try {
          await onBajaSubmit(profesor.rfc);
          exitosos++;
        } catch (error) {
          errores.push(`Fila ${i + 2}: Error al eliminar RFC ${rfcBuscar} - ${error.message || 'Error desconocido'}`);
          fallidos++;
        }
      }

      // Mostrar resultado
      let mensaje = `Procesados: ${datosArchivo.length}\nEliminados: ${exitosos}\nFallidos: ${fallidos}`;
      
      if (errores.length > 0 && errores.length <= 5) {
        mensaje += `\n\nErrores:\n${errores.join('\n')}`;
      } else if (errores.length > 5) {
        mensaje += `\n\nPrimeros 5 errores:\n${errores.slice(0, 5).join('\n')}\n... y ${errores.length - 5} más`;
      }

      mostrarMensaje(
        exitosos > 0 ? "Proceso completado" : "Error en el proceso",
        mensaje
      );

      if (exitosos > 0) {
        limpiarArchivo();
        setPasswordAdminArchivo('');
        setErrorsArchivo({});
      }

    } catch (error) {
      console.error("Error procesando archivo:", error);
      mostrarMensaje("Error", "Ocurrió un error al procesar el archivo.");
    }
  };

  return (
    <div>
      <h3 className="modal-title">
        Dar de baja profesor
        {profesorEncontrado && (
          <span className="modal-badge modal-badge-success">
            Encontrado
          </span>
        )}
        {rfc.length > 0 && !profesorEncontrado && (
          <span className="modal-badge modal-badge-warning">
            No encontrado
          </span>
        )}
      </h3>
       
      <div>
        <div className="modal-form-section">
          {/* CAMPO INFORMATIVO (Nombre detectado) */}
          <div className="modal-input-group">
            <div className="modal-input-wrapper">
              <input 
                type="text" 
                placeholder="Nombre del profesor (se llenará solo)" 
                className={`modal-input modal-input-disabled ${profesorEncontrado ? 'modal-input-found' : ''}`}
                value={nombreDetectado}
                disabled 
              />
            </div>
          </div>

          {/* RFC + ACADEMIA (DETECTADA) */}
          <div className="modal-input-group">
            {/* RFC */}
            <div className="modal-input-wrapper">
              <input 
                type="text" 
                placeholder="Ingresa RFC" 
                className={`modal-input ${errors.rfc ? 'modal-input-error' : ''} ${profesorEncontrado ? 'modal-input-found' : ''}`}
                value={rfc} 
                onChange={e => {
                  setRfc(e.target.value.toUpperCase()); 
                  clearError('rfc');
                }} 
                maxLength={13}
              />
              {errors.rfc && <p className="modal-error-message">{errors.rfc}</p>}
            </div>
            {/* Academia detectada (Visual) */}
            <div className="modal-input-wrapper">
              <input 
                type="text" 
                placeholder="Academia (Automático)" 
                className="modal-input modal-input-disabled"
                value={profesorEncontrado?.academia || ''}
                disabled 
              />
            </div>
          </div>

          {/* CONFIRMA RFC + CONTRASEÑA ADMIN */}
          <div className="modal-input-group">
            {/* CONFIRMA RFC */}
            <div className="modal-input-wrapper">
              <input 
                type="text" 
                placeholder="Confirma RFC" 
                className={`modal-input ${errors.confirmaRfc ? 'modal-input-error' : ''}`}
                value={confirmaRfc} 
                onChange={e => {
                  setConfirmaRfc(e.target.value.toUpperCase()); 
                  clearError('confirmaRfc');
                }} 
                maxLength={13}
                disabled={!profesorEncontrado}
              />
              {errors.confirmaRfc && <p className="modal-error-message">{errors.confirmaRfc}</p>}
            </div>
            {/* CONTRASEÑA */}
            <div className="modal-input-wrapper">
              <input 
                type="password" 
                placeholder="Contraseña Admin" 
                className={`modal-input ${errors.password ? 'modal-input-error' : ''}`} 
                value={password} 
                onChange={e => {
                  setPassword(e.target.value); 
                  clearError('password');
                }}
                disabled={!profesorEncontrado}
              />
              {errors.password && <p className="modal-error-message">{errors.password}</p>}
            </div>
          </div>
           
          <Button 
            onClick={handleSubmit}
            variant="danger" 
            style={{ 
              backgroundColor: profesorEncontrado ? '#e74c3c' : '#ccc',
              color: '#fff', 
              border: 'none', 
              width: '100%',
              cursor: profesorEncontrado ? 'pointer' : 'not-allowed',
              opacity: profesorEncontrado ? 1 : 0.6
            }}
            disabled={!profesorEncontrado}
          >
            {profesorEncontrado ? 'CONFIRMAR BAJA' : 'Busque un profesor primero'}
          </Button>
        </div>
      </div>

      {/* Sección de carga por archivo */}
      <h4 className="modal-subtitle">
        O ingrese archivo con varios profesores
      </h4>
      
      <div className="modal-form-section" style={{borderBottom: 'none'}}>
        <div className="modal-input-group">
          <div className="modal-input-wrapper" style={{flex: 0.5}}>
            <input 
              type="password" 
              placeholder="Contraseña administrador" 
              className={`modal-input ${errorsArchivo.passwordAdminArchivo ? 'modal-input-error' : ''}`}
              value={passwordAdminArchivo}
              onChange={e => {
                setPasswordAdminArchivo(e.target.value);
                if (e.target.value.trim()) clearErrorArchivo('passwordAdminArchivo');
              }}
            />
            {errorsArchivo.passwordAdminArchivo && <p className="modal-error-message">Ingrese la contraseña</p>}
          </div>
          <div style={{flex: 0.5}} />
        </div>
        
        <div className="modal-buttons-container">
          <input 
            id="file-input-baja-profesor"
            type="file"
            accept=".xlsx"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Button 
            variant="secondary" 
            style={{ backgroundColor: '#4c6cb7', color: '#fff', border: 'none' }}
            onClick={() => document.getElementById('file-input-baja-profesor').click()}
          >
            Seleccionar archivo
          </Button>
          <Button 
            variant="primary" 
            style={{ 
              backgroundColor: datosArchivo.length > 0 ? '#e74c3c' : '#ccc',
              color: '#fff', 
              border: 'none',
              cursor: datosArchivo.length > 0 ? 'pointer' : 'not-allowed',
              opacity: datosArchivo.length > 0 ? 1 : 0.6
            }}
            onClick={handleSubmitArchivo}
            disabled={datosArchivo.length === 0}
          >
            Eliminar datos
          </Button>
        </div>
        
        {/* Mostrar archivo seleccionado */}
        {archivoSeleccionado && (
          <div style={{
            marginTop: '15px',
            padding: '12px',
            backgroundColor: '#fff5f5',
            borderRadius: '8px',
            border: '1px solid #ffcdd2'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#c62828'
              }}>
                📄 {nombreArchivo}
              </span>
              <button
                onClick={limpiarArchivo}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc3545',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '0 5px'
                }}
                title="Eliminar archivo"
              >
                ✕
              </button>
            </div>
            <div style={{
              fontSize: '13px',
              color: '#d32f2f'
            }}>
              ⚠️ {datosArchivo.length} {datosArchivo.length === 1 ? 'profesor' : 'profesores'} serán eliminados
            </div>
          </div>
        )}
        
        <p className="modal-coming-soon">
          {archivoSeleccionado 
            ? "Asegúrate de que la estructura sea compatible" 
            : "Formatos compatibles: .xlsx"
          }
        </p>
      </div>

      {/* MENSAJE INTERNO DEL MODAL */}
      <Mensaje 
        visible={mensajeData.visible}
        titulo={mensajeData.titulo}
        mensaje={mensajeData.mensaje}
        onCerrar={() => setMensajeData({ ...mensajeData, visible: false })}
      />
    </div>
  );
};

export default ModalBajaProfesor;