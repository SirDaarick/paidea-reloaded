import React, { useState, useEffect } from 'react';
import Button from 'components/Button'; 
import Mensaje from 'components/Mensaje';
import 'styles/modalForms.css';

const ADMIN_PASSWORD = "Admin123";

const ModalBajaAlumno = ({ onBajaSubmit, listaAlumnos = [] }) => {
  // Estados del formulario individual
  const [nombre, setNombre] = useState('');
  const [boleta, setBoleta] = useState('');
  const [carrera, setCarrera] = useState('');
  const [confirmaBoleta, setConfirmaBoleta] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados para carga de archivo
  const [passwordAdminArchivo, setPasswordAdminArchivo] = useState('');
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [datosArchivo, setDatosArchivo] = useState([]);
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [xlsxCargado, setXlsxCargado] = useState(false);
  
  // Estado del alumno encontrado
  const [alumnoEncontrado, setAlumnoEncontrado] = useState(null);
  
  // Estados de errores para validación inline
  const [errors, setErrors] = useState({});
  const [errorsArchivo, setErrorsArchivo] = useState({});
  
  // Estado para mensajes
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

  // Limpiar error de un campo cuando se modifica
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

  // Buscar alumno por boleta (búsqueda exacta)
  useEffect(() => {
    if (boleta.trim().length > 0) {
      const boletaBusqueda = boleta.trim();
      // Aseguramos que listaAlumnos exista antes de buscar
      const encontrado = listaAlumnos && listaAlumnos.length > 0 
        ? listaAlumnos.find(a => String(a.boleta) === boletaBusqueda)
        : null;
      
      if (encontrado) {
        setAlumnoEncontrado(encontrado);
        setNombre(encontrado.nombre);
        setCarrera(encontrado.carrera || 'S/A');
      } else {
        if (alumnoEncontrado && nombre === alumnoEncontrado.nombre) {
          setAlumnoEncontrado(null);
          setNombre('');
          setCarrera('');
        }
      }
    } else if (boleta.trim().length === 0) {
      setAlumnoEncontrado(null);
      setNombre('');
      setCarrera('');
    }
  }, [boleta, listaAlumnos, alumnoEncontrado, nombre]);

  const limpiarFormulario = () => {
    setNombre('');
    setBoleta('');
    setCarrera('');
    setConfirmaBoleta('');
    setPassword('');
    setAlumnoEncontrado(null);
    setErrors({});
  };

  const handleSubmit = async () => {
    // Validación 1: Campos vacíos (validación inline)
    const newErrors = {};
    
    if (!boleta.trim()) newErrors.boleta = true;
    if (!confirmaBoleta.trim()) newErrors.confirmaBoleta = true;
    if (!password.trim()) newErrors.password = true;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Validación 2: Contraseña admin
    if (password !== ADMIN_PASSWORD) {
      mostrarMensaje("Acceso denegado", "Contraseña de administrador incorrecta.");
      setPassword('');
      return;
    }

    // Validación 3: Alumno encontrado
    if (!alumnoEncontrado) {
      mostrarMensaje("Alumno no encontrado", "No se encontró ningún alumno con la boleta proporcionada.");
      return;
    }

    // Validación 4: Boleta coincide
    if (String(boleta) !== String(confirmaBoleta)) {
      mostrarMensaje("Error de confirmación", "La boleta y la confirmación no coinciden.");
      return;
    }

    // Validación 5: Confirmar eliminación
    const confirmar = window.confirm(
      `ADVERTENCIA\n\n` +
      `Está a punto de ELIMINAR permanentemente al alumno:\n\n` +
      `Nombre: ${alumnoEncontrado.nombre}\n` +
      `Boleta: ${alumnoEncontrado.boleta}\n` +
      `Carrera: ${alumnoEncontrado.carrera}\n\n` +
      `Esta acción NO SE PUEDE DESHACER.\n\n` +
      `¿Está seguro de continuar?`
    );

    if (!confirmar) {
      mostrarMensaje("Operación cancelada", "No se eliminó ningún alumno.");
      return;
    }

    // Todo OK - Ejecutar eliminación
    try {
      // --- CORRECCIÓN CLAVE 1: Enviamos _id, NO boleta ---
      if (!alumnoEncontrado._id) {
        throw new Error("El alumno seleccionado no tiene un ID válido en el sistema.");
      }
      
      await onBajaSubmit(alumnoEncontrado._id);

      limpiarFormulario();
      mostrarMensaje(
        "Alumno eliminado", 
        `El alumno ${alumnoEncontrado.nombre} ha sido eliminado correctamente del sistema.`
      );
    } catch (error) {
      console.error("Error en eliminación:", error);
      mostrarMensaje("Error", "Ocurrió un error al eliminar el alumno. Intente nuevamente.");
    }
  };

  // Manejar selección de archivo
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    
    if (!file) return;

    if (!xlsxCargado) {
      mostrarMensaje("Error", "El módulo de Excel aún no está cargado.");
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

        // Validar estructura del archivo
        const primeraFila = jsonData[0];
        if (!('boleta' in primeraFila)) {
          mostrarMensaje(
            "Estructura incorrecta", 
            "El archivo debe contener al menos la columna 'boleta'"
          );
          limpiarArchivo();
          return;
        }

        setDatosArchivo(jsonData);
      } catch (error) {
        console.error("Error leyendo archivo:", error);
        mostrarMensaje("Error", "No se pudo procesar el archivo.");
        limpiarArchivo();
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const limpiarArchivo = () => {
    setArchivoSeleccionado(null);
    setDatosArchivo([]);
    setNombreArchivo('');
    const fileInput = document.getElementById('file-input-baja');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmitArchivo = async () => {
    const newErrors = {};
    if (!archivoSeleccionado) newErrors.archivo = true;
    if (!passwordAdminArchivo.trim()) newErrors.passwordAdminArchivo = true;
    
    if (Object.keys(newErrors).length > 0) {
      setErrorsArchivo(newErrors);
      return;
    }

    if (passwordAdminArchivo !== "Admin123") {
      mostrarMensaje("Acceso denegado", "Contraseña de administrador incorrecta.");
      return;
    }

    if (datosArchivo.length === 0) {
      mostrarMensaje("Error", "No hay datos válidos para procesar.");
      return;
    }

    const confirmar = window.confirm(
      `ADVERTENCIA DE ELIMINACIÓN MASIVA\n\n` +
      `Está a punto de eliminar ${datosArchivo.length} alumnos.\n` +
      `¿Está COMPLETAMENTE seguro?`
    );

    if (!confirmar) {
      mostrarMensaje("Operación cancelada", "No se eliminó ningún alumno.");
      return;
    }

    try {
      let exitosos = 0;
      let fallidos = 0;
      const errores = [];

      for (let i = 0; i < datosArchivo.length; i++) {
        const registro = datosArchivo[i];
        
        if (!registro.boleta) {
          errores.push(`Fila ${i + 2}: Boleta vacía`);
          fallidos++;
          continue;
        }

        const boletaBuscar = String(registro.boleta).trim();
        const alumno = listaAlumnos.find(a => String(a.boleta) === boletaBuscar);

        if (!alumno) {
          errores.push(`Fila ${i + 2}: Boleta ${boletaBuscar} no encontrada`);
          fallidos++;
          continue;
        }

        try {
          // --- CORRECCIÓN CLAVE 2: Enviamos _id, NO boleta ---
          if (!alumno._id) throw new Error("ID no encontrado");
          
          await onBajaSubmit(alumno._id);
          exitosos++;
        } catch (error) {
          errores.push(`Fila ${i + 2} (${boletaBuscar}): ${error.message || 'Error al eliminar'}`);
          fallidos++;
        }
      }

      let mensaje = `Procesados: ${datosArchivo.length}\nEliminados: ${exitosos}\nFallidos: ${fallidos}`;
      
      if (errores.length > 0 && errores.length <= 5) {
        mensaje += `\n\nErrores:\n${errores.join('\n')}`;
      } else if (errores.length > 5) {
        mensaje += `\n\nPrimeros 5 errores:\n${errores.slice(0, 5).join('\n')}\n... y ${errores.length - 5} más`;
      }

      mostrarMensaje(exitosos > 0 ? "Proceso completado" : "Error", mensaje);

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

  const getInputClasses = (isFound, hasError) => {
    let classes = 'modal-input';
    if (hasError) classes += ' modal-input-error';
    else if (isFound) classes += ' modal-input-found';
    return classes;
  };

  const getDisabledInputClasses = () => 'modal-input modal-input-disabled';

  return (
    <div>
      <h3 className="modal-title">
        Dar de baja alumno
        {alumnoEncontrado && <span className="modal-badge modal-badge-success">Encontrado</span>}
        {boleta.length > 0 && !alumnoEncontrado && <span className="modal-badge modal-badge-warning">No encontrado</span>}
      </h3>
      
      <div>
        <div className="modal-form-section">
          {/* Fila 1 */}
          <div className="modal-input-group">
            <div className="modal-input-wrapper">
              <input 
                type="text" 
                placeholder="Nombre del alumno (se llenará solo)" 
                className={`modal-input modal-input-disabled ${alumnoEncontrado ? 'modal-input-found' : ''}`}
                value={nombre}
                disabled
                readOnly
              />
            </div>
          </div>
          
          {/* Fila 2 */}
          <div className="modal-input-group">
            <div className="modal-input-wrapper">
              <input 
                type="text" 
                placeholder="Ingresa Boleta" 
                className={getInputClasses(alumnoEncontrado, errors.boleta)}
                value={boleta}
                onChange={e => {
                  const valor = e.target.value.replace(/\D/g, '');
                  setBoleta(valor);
                  if (valor.trim()) clearError('boleta');
                }}
                maxLength={10}
              />
              {errors.boleta && <p className="modal-error-message">Ingrese una boleta válida</p>}
            </div>
            
            <input 
              type="text" 
              placeholder="Carrera (Automático)" 
              className={getDisabledInputClasses()}
              value={carrera}
              disabled
              readOnly
            />
          </div>
          
          {/* Fila 3 */}
          <div className="modal-input-group">
            <div className="modal-input-wrapper">
              <input 
                type="text" 
                placeholder="Confirmar boleta" 
                className={`modal-input ${errors.confirmaBoleta ? 'modal-input-error' : ''}`}
                value={confirmaBoleta}
                onChange={e => {
                  const valor = e.target.value.replace(/\D/g, '');
                  setConfirmaBoleta(valor);
                  if (valor.trim()) clearError('confirmaBoleta');
                }}
                maxLength={10}
                disabled={!alumnoEncontrado}
              />
              {errors.confirmaBoleta && <p className="modal-error-message">Confirme la boleta</p>}
            </div>
            
            <div className="modal-input-wrapper">
              <input 
                type="password" 
                placeholder="Contraseña Admin"
                className={`modal-input ${errors.password ? 'modal-input-error' : ''}`}
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (e.target.value.trim()) clearError('password');
                }}
                disabled={!alumnoEncontrado}
              />
              {errors.password && <p className="modal-error-message">Ingrese la contraseña</p>}
            </div>
          </div>
          
          <Button 
            onClick={handleSubmit}
            variant="primary" 
            style={{ 
              backgroundColor: alumnoEncontrado ? '#e74c3c' : '#ccc',
              color: '#fff', border: 'none',
              cursor: alumnoEncontrado ? 'pointer' : 'not-allowed',
              opacity: alumnoEncontrado ? 1 : 0.6
            }}
            disabled={!alumnoEncontrado}
          >
            {alumnoEncontrado ? 'CONFIRMAR BAJA' : 'Busque un alumno primero'}
          </Button>
        </div>
      </div>

      {/* Sección Archivo */}
      <h4 className="modal-subtitle">O ingrese archivo con varios alumnos</h4>
      
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
          <input id="file-input-baja" type="file" accept=".xlsx" onChange={handleFileSelect} style={{ display: 'none' }} />
          <Button variant="secondary" style={{ backgroundColor: '#4c6cb7', color: '#fff', border: 'none' }} onClick={() => document.getElementById('file-input-baja').click()}>
            Seleccionar archivo
          </Button>
          <Button 
            variant="primary" 
            style={{ 
              backgroundColor: datosArchivo.length > 0 ? '#e74c3c' : '#ccc',
              color: '#fff', border: 'none',
              cursor: datosArchivo.length > 0 ? 'pointer' : 'not-allowed',
              opacity: datosArchivo.length > 0 ? 1 : 0.6
            }}
            onClick={handleSubmitArchivo}
            disabled={datosArchivo.length === 0}
          >
            Eliminar datos
          </Button>
        </div>
        
        {archivoSeleccionado && (
          <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#fff5f5', borderRadius: '8px', border: '1px solid #ffcdd2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#c62828' }}>📄 {nombreArchivo}</span>
              <button onClick={limpiarArchivo} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '18px', padding: '0 5px' }} title="Eliminar archivo">✕</button>
            </div>
            <div style={{ fontSize: '13px', color: '#d32f2f' }}>⚠️ {datosArchivo.length} alumnos serán eliminados</div>
          </div>
        )}
        
        <p className="modal-coming-soon">{archivoSeleccionado ? "Asegúrate de que la estructura sea compatible" : "Formatos compatibles: .xlsx"}</p>
      </div>

      <Mensaje visible={mensajeData.visible} titulo={mensajeData.titulo} mensaje={mensajeData.mensaje} onCerrar={() => setMensajeData({ ...mensajeData, visible: false })} />
    </div>
  );
};

export default ModalBajaAlumno;