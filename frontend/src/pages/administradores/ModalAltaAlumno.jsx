import React, { useState, useEffect } from 'react';
import Button from 'components/Button'; 
import apiCall from 'consultas/APICall'; 
import Mensaje from 'components/Mensaje';
import 'styles/modalForms.css';

// Mapeo de carreras a códigos
const CARRERA_CODIGO = {
  "Ingeniería en Inteligencia Artificial": 6,
  "Licenciatura en Ciencia de Datos": 9,
  "Ingeniería en Sistemas Computacionales": 3,
};

// Validación estricta de CURP (México)
const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;

const ModalAltaAlumno = ({ onAltaSubmit }) => {
  // Estados del formulario individual
  const [nombre, setNombre] = useState('');
  const [curp, setCurp] = useState('');
  const [carrera, setCarrera] = useState('');
  const [correo, setCorreo] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [boleta, setBoleta] = useState('Boleta');
  const [passwordAdmin, setPasswordAdmin] = useState('');
  
  // Estados para carga de archivo
  const [passwordAdminArchivo, setPasswordAdminArchivo] = useState('');
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [datosArchivo, setDatosArchivo] = useState([]);
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [xlsxCargado, setXlsxCargado] = useState(false);
  
  // Estados de errores para validación inline
  const [errors, setErrors] = useState({});
  const [errorsArchivo, setErrorsArchivo] = useState({});
  
  // Listas de datos
  const [listaCarreras, setListaCarreras] = useState([]);
  const [listaPeriodos, setListaPeriodos] = useState([]);
  
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

  // Cargar carreras al montar
  useEffect(() => {
    const cargarCarreras = async () => {
      try {
        const data = await apiCall('/carrera', 'GET'); 
        setListaCarreras(data);
      } catch (error) {
        console.error("Error cargando carreras:", error);
        mostrarMensaje("Error", "No se pudieron cargar las carreras");
      }
    };
    cargarCarreras();
  }, []);

  // Cargar periodos (actual + futuros)
  useEffect(() => {
    const cargarPeriodos = async () => {
      try {
        const data = await apiCall('/periodoAcademico', 'GET');
        
        const fechaActual = new Date();
        const periodosFiltrados = data
          .filter(p => new Date(p.fechaFinal) >= fechaActual)
          .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio));
        
        setListaPeriodos(periodosFiltrados);
        
        const periodoActual = periodosFiltrados.find(p => {
          const inicio = new Date(p.fechaInicio);
          const fin = new Date(p.fechaFinal);
          return fechaActual >= inicio && fechaActual <= fin;
        });
        
        if (periodoActual) {
          setPeriodo(periodoActual._id);
        }
      } catch (error) {
        console.error("Error cargando periodos:", error);
        mostrarMensaje("Error", "No se pudieron cargar los periodos académicos");
      }
    };
    cargarPeriodos();
  }, []);

  // Función para generar boleta automáticamente
  const generarBoleta = (periodoId, carreraId, curpValue) => {
    try {
      if (!CURP_REGEX.test(curpValue)) {
        return "Boleta";
      }

      const periodoObj = listaPeriodos.find(p => p._id === periodoId);
      if (!periodoObj) return "Boleta";
      
      const anio = periodoObj.nombre.match(/\d{4}/)?.[0] || '0000';
      
      const carreraObj = listaCarreras.find(c => c._id === carreraId);
      if (!carreraObj) return "Boleta";
      
      const codigoCarrera = CARRERA_CODIGO[carreraObj.nombre];
      if (!codigoCarrera) return "Boleta";
      
      const random = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
      
      const boletaGenerada = `${anio}${codigoCarrera}${random}`;
      
      return boletaGenerada;
    } catch (error) {
      console.error("Error generando boleta:", error);
      return "Boleta";
    }
  };

  // Generar boleta cuando se completan los campos necesarios
  useEffect(() => {
    if (periodo && carrera && curp.length === 18) {
      const boletaGenerada = generarBoleta(periodo, carrera, curp);
      setBoleta(boletaGenerada);
    } else {
      setBoleta("Boleta");
    }
  }, [periodo, carrera, curp, listaPeriodos, listaCarreras]);

  const handleSubmit = () => {
    // Validación 1: Campos vacíos (validación inline)
    const newErrors = {};
    
    if (!nombre.trim()) {
      newErrors.nombre = true;
    }
    if (!carrera) {
      newErrors.carrera = true;
    }
    if (!periodo) {
      newErrors.periodo = true;
    }
    if (!curp.trim()) {
      newErrors.curp = true;
    }
    if (!correo.trim()) {
      newErrors.correo = true;
    }
    if (!passwordAdmin.trim()) {
      newErrors.passwordAdmin = true;
    }
    
    // Si hay errores de campos vacíos, mostrarlos y detener
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Validación 2: Contraseña admin
    if (passwordAdmin !== "Admin123") {
      mostrarMensaje(
        "Acceso denegado", 
        "Contraseña de administrador incorrecta."
      );
      return;
    }
    
    // Validación 3: CURP completo y formato válido
    if (curp.length !== 18 || !CURP_REGEX.test(curp)) {
      mostrarMensaje(
        "CURP Inválido", 
        "El CURP debe tener 18 caracteres con el formato válido mexicano (Ej: GOPM770324HDFNRD08)."
      );
      return;
    }
    
    // Validación 4: Correo válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      mostrarMensaje("Correo Inválido", "El formato del correo electrónico no es válido.");
      return;
    }
    
    // Validación 5: Boleta generada
    if (boleta === "Boleta" || boleta.length !== 10) {
      mostrarMensaje("Error", "No se pudo generar la boleta. Verifique los datos ingresados.");
      return;
    }

    // Ejecutar alta
    ejecutarAlta();
  };

  const ejecutarAlta = async () => {
    try {
      const datosAlumno = {
        nombre,
        boleta,
        carrera,
        correo,
        curp,
        periodo,
        passwordAdmin
      };
      
      await onAltaSubmit(datosAlumno);
      
      // Limpiar formulario después de éxito
      setNombre('');
      setCurp('');
      setCarrera('');
      setCorreo('');
      setBoleta('Boleta');
      setPasswordAdmin('');
      setErrors({});
      
      mostrarMensaje(
        "Éxito", 
        `Alumno registrado correctamente.\nBoleta: ${boleta}\nContraseña temporal: nuevoPass2025`
      );
    } catch (error) {
      console.error("Error en el registro:", error);
      
      if (error.message && error.message.includes("duplicad")) {
        mostrarMensaje(
          "Duplicado Detectado", 
          "La boleta o CURP ya existen en el sistema. Intente con datos diferentes."
        );
      } else {
        mostrarMensaje("Error", error.message || "No se pudo registrar el alumno");
      }
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

        // Validar estructura del archivo
        const primeraFila = jsonData[0];
        const camposRequeridos = ['nombre', 'curp', 'carrera', 'correo', 'periodo'];
        const camposFaltantes = camposRequeridos.filter(campo => !(campo in primeraFila));

        if (camposFaltantes.length > 0) {
          mostrarMensaje(
            "Estructura incorrecta", 
            `El archivo debe contener las columnas: ${camposRequeridos.join(', ')}\n\nFaltan: ${camposFaltantes.join(', ')}`
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
    const fileInput = document.getElementById('file-input-alta');
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
    if (passwordAdminArchivo !== "admin123") {
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

    // Procesar cada alumno del archivo
    try {
      let exitosos = 0;
      let fallidos = 0;
      const errores = [];

      for (let i = 0; i < datosArchivo.length; i++) {
        const alumno = datosArchivo[i];
        
        // Validar campos requeridos
        if (!alumno.nombre || !alumno.curp || !alumno.carrera || !alumno.correo || !alumno.periodo) {
          errores.push(`Fila ${i + 2}: Campos incompletos`);
          fallidos++;
          continue;
        }

        // Validar CURP
        const curpUpper = String(alumno.curp).toUpperCase();
        if (!CURP_REGEX.test(curpUpper)) {
          errores.push(`Fila ${i + 2}: CURP inválido (${alumno.curp})`);
          fallidos++;
          continue;
        }

        // Validar correo
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(alumno.correo)) {
          errores.push(`Fila ${i + 2}: Correo inválido (${alumno.correo})`);
          fallidos++;
          continue;
        }

        // Buscar IDs de carrera y periodo
        const carreraObj = listaCarreras.find(c => 
          c.nombre.toLowerCase() === String(alumno.carrera).toLowerCase() ||
          c.clave === String(alumno.carrera)
        );
        
        const periodoObj = listaPeriodos.find(p => 
          p.nombre === String(alumno.periodo)
        );

        if (!carreraObj) {
          errores.push(`Fila ${i + 2}: Carrera no encontrada (${alumno.carrera})`);
          fallidos++;
          continue;
        }

        if (!periodoObj) {
          errores.push(`Fila ${i + 2}: Periodo no encontrado (${alumno.periodo})`);
          fallidos++;
          continue;
        }

        // Generar boleta
        const boletaGenerada = generarBoleta(periodoObj._id, carreraObj._id, curpUpper);
        
        if (boletaGenerada === "Boleta" || boletaGenerada.length !== 10) {
          errores.push(`Fila ${i + 2}: No se pudo generar boleta`);
          fallidos++;
          continue;
        }

        // Intentar crear alumno
        try {
          await onAltaSubmit({
            nombre: alumno.nombre,
            boleta: boletaGenerada,
            carrera: carreraObj._id,
            correo: alumno.correo,
            curp: curpUpper,
            periodo: periodoObj._id,
            passwordAdmin: passwordAdminArchivo
          });
          exitosos++;
        } catch (error) {
          errores.push(`Fila ${i + 2}: ${error.message || 'Error al crear'}`);
          fallidos++;
        }
      }

      // Mostrar resultado
      let mensaje = `Procesados: ${datosArchivo.length}\nExitosos: ${exitosos}\nFallidos: ${fallidos}`;
      
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
      <h3 className="modal-title">Alta de Alumno</h3>
      
      <div>
        <div className="modal-form-section">
          {/* Fila 1: Solo Nombre */}
          <div className="modal-input-group">
            <div className="modal-input-wrapper">
              <input 
                type="text" 
                placeholder="Nombre completo" 
                className={`modal-input ${errors.nombre ? 'modal-input-error' : ''}`}
                value={nombre} 
                onChange={e => {
                  setNombre(e.target.value);
                  if (e.target.value.trim()) clearError('nombre');
                }} 
              />
              {errors.nombre && <p className="modal-error-message">Ingrese un nombre válido</p>}
            </div>
          </div>
          
          {/* Fila 2: Carrera + Periodo */}
          <div className="modal-input-group">
            <div className="modal-input-wrapper">
              <select 
                className={`modal-select ${errors.carrera ? 'modal-select-error' : ''}`}
                value={carrera} 
                onChange={e => {
                  setCarrera(e.target.value);
                  if (e.target.value) clearError('carrera');
                }}
              >
                <option value="">Selecciona Carrera...</option>
                {listaCarreras.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.clave}
                  </option>
                ))}
              </select>
              {errors.carrera && <p className="modal-error-message">Seleccione una carrera</p>}
            </div>
            
            <div className="modal-input-wrapper">
              <select 
                className={`modal-select ${errors.periodo ? 'modal-select-error' : ''}`}
                value={periodo} 
                onChange={e => {
                  setPeriodo(e.target.value);
                  if (e.target.value) clearError('periodo');
                }}
              >
                <option value="">Selecciona Periodo...</option>
                {listaPeriodos.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.nombre} ({new Date(p.fechaInicio).toLocaleDateString()} - {new Date(p.fechaFinal).toLocaleDateString()})
                  </option>
                ))}
              </select>
              {errors.periodo && <p className="modal-error-message">Seleccione un periodo</p>}
            </div>
          </div>

          {/* Fila 3: CURP + Correo */}
          <div className="modal-input-group">
            <div className="modal-input-wrapper">
              <input 
                type="text" 
                placeholder="CURP (18 caracteres)" 
                className={`modal-input ${errors.curp ? 'modal-input-error' : ''}`}
                value={curp} 
                onChange={e => {
                  const valor = e.target.value.toUpperCase();
                  setCurp(valor);
                  if (valor.trim()) clearError('curp');
                }}
                maxLength={18}
              />
              {errors.curp && <p className="modal-error-message">Ingrese un CURP válido</p>}
            </div>
            
            <div className="modal-input-wrapper">
              <input 
                type="email" 
                placeholder="Correo electrónico" 
                className={`modal-input ${errors.correo ? 'modal-input-error' : ''}`}
                value={correo} 
                onChange={e => {
                  setCorreo(e.target.value);
                  if (e.target.value.trim()) clearError('correo');
                }}
              />
              {errors.correo && <p className="modal-error-message">Ingrese un correo válido</p>}
            </div>
          </div>

          {/* Fila 4: Boleta (centrada, readonly, generada automáticamente) */}
          <div className="modal-input-group">
            <div style={{ flex: 0.5 }} />
            <div className="modal-boleta-display">
              {boleta}
            </div>
            <div style={{ flex: 0.5 }} />
          </div>

          {/* Fila 5: Contraseña administrador (centrada) */}
          <div className="modal-input-group">
            <div style={{flex: 0.5}} />
            <div className="modal-input-wrapper" style={{flex: 0.5}}>
              <input 
                type="password" 
                placeholder="Contraseña administrador" 
                className={`modal-input ${errors.passwordAdmin ? 'modal-input-error' : ''}`}
                value={passwordAdmin} 
                onChange={e => {
                  setPasswordAdmin(e.target.value);
                  if (e.target.value.trim()) clearError('passwordAdmin');
                }}
              />
              {errors.passwordAdmin && <p className="modal-error-message">Ingrese la contraseña</p>}
            </div>
            <div style={{flex: 0.5}} />
          </div>

          <Button 
            onClick={handleSubmit}
            variant="primary" 
            style={{ backgroundColor: '#4c6cb7', color: '#fff', border: 'none' }}
          >
            Registrar alumno
          </Button>
        </div>
      </div>
      
      {/* Sección de archivo */}
      <h4 className="modal-subtitle">
        O ingrese archivo con varios alumnos
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
            id="file-input-alta"
            type="file"
            accept=".xlsx"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Button 
            variant="secondary" 
            style={{ backgroundColor: '#4c6cb7', color: '#fff', border: 'none' }}
            onClick={() => document.getElementById('file-input-alta').click()}
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
        
        {/* Mostrar archivo seleccionado */}
        {archivoSeleccionado && (
          <div style={{
            marginTop: '15px',
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
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
                color: '#495057'
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
              color: '#6c757d'
            }}>
              {datosArchivo.length} {datosArchivo.length === 1 ? 'alumno' : 'alumnos'} detectados
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

      {/* Componente Mensaje */}
      <Mensaje 
        visible={mensajeData.visible}
        titulo={mensajeData.titulo}
        mensaje={mensajeData.mensaje}
        onCerrar={() => setMensajeData({ ...mensajeData, visible: false })}
      />
    </div>
  );
};

export default ModalAltaAlumno;