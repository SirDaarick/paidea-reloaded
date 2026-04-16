import React, { useState, useEffect } from "react";
import MenuAdmin from "components/MenuAdmin";
import Button from "components/Button";
import Mensaje from "components/Mensaje";
import "styles/AsignarCita.css";
import apiCall from "consultas/APICall";

export default function AsignarCitas() {
  const [loading, setLoading] = useState(false);
  const [loadingEliminar, setLoadingEliminar] = useState(false);
  const [mensaje, setMensaje] = useState({
    visible: false,
    titulo: "",
    mensaje: "",
  });

  const [estadisticas, setEstadisticas] = useState(null);
  const [periodoActual, setPeriodoActual] = useState(null);

  // Estados para asignación manual
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [boletaManual, setBoletaManual] = useState("");
  const [fechaManual, setFechaManual] = useState("");
  const [horaInicioManual, setHoraInicioManual] = useState("");
  const [errorManual, setErrorManual] = useState("");
  const [loadingManual, setLoadingManual] = useState(false);
  const [successManual, setSuccessManual] = useState("");

  // Cargar información inicial
  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      // Obtener todas las citas
      const citas = await apiCall("/cita", "GET");
      
      // Obtener periodo de reinscripción
      const periodos = await apiCall("/periodoInscripcion", "GET");
      const periodoReinscripcion = periodos
        .filter((p) => p.tipo === "Reinscripcion")
        .sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio))[0];

      setPeriodoActual(periodoReinscripcion);
      
      setEstadisticas({
        totalCitas: citas.length,
        periodo: periodoReinscripcion
      });

    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  };

  const handleAsignarAutomaticamente = async () => {
    if (!window.confirm(
      "¿Estás seguro de asignar automáticamente TODAS las citas?\n\n" +
      "Esta acción:\n" +
      "• Asignará citas a todos los alumnos\n" +
      "• Los alumnos con mejor promedio tendrán prioridad\n" +
      "• Las citas se distribuirán de 9:00 AM a 6:00 PM\n" +
      "• Duración: 1 hora cada cita\n" +
      "• Diferencia: 5 minutos entre citas"
    )) {
      return;
    }

    try {
      setLoading(true);
      console.log("Iniciando asignación automática...");

      const resultado = await apiCall("/cita/asignar-automaticamente", "POST");

      console.log("Resultado:", resultado);

      setMensaje({
        visible: true,
        titulo: "✅ Citas Asignadas",
        mensaje: `
          Se asignaron exitosamente ${resultado.citasCreadas} citas.
          
          • Total de alumnos: ${resultado.totalAlumnos}
          • Rangos de horario: ${resultado.totalRangos}
          • Alumnos por rango: ${resultado.alumnosPorRango}
          
          Las citas se asignaron por orden de promedio (mayor a menor).
        `,
      });

      // Recargar estadísticas
      await cargarEstadisticas();

    } catch (error) {
      console.error("Error:", error);
      setMensaje({
        visible: true,
        titulo: "❌ Error",
        mensaje: error.response?.data?.error || "No se pudieron asignar las citas automáticamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarTodasCitas = async () => {
    if (!window.confirm(
      "⚠️ ADVERTENCIA: ¿Estás seguro de ELIMINAR TODAS las citas?\n\n" +
      "Esta acción NO se puede deshacer."
    )) {
      return;
    }

    try {
      setLoadingEliminar(true);
      console.log("Eliminando todas las citas...");

      const resultado = await apiCall("/cita/todas/eliminar", "DELETE");

      console.log("Resultado:", resultado);

      setMensaje({
        visible: true,
        titulo: "✅ Citas Eliminadas",
        mensaje: `Se eliminaron ${resultado.eliminadas} citas correctamente.`,
      });

      // Recargar estadísticas
      await cargarEstadisticas();

    } catch (error) {
      console.error("Error:", error);
      setMensaje({
        visible: true,
        titulo: "❌ Error",
        mensaje: "No se pudieron eliminar las citas.",
      });
    } finally {
      setLoadingEliminar(false);
    }
  };

  // Función para calcular hora final (1 hora después)
  const calcularHoraFinal = (horaInicio) => {
    if (!horaInicio) return "";
    
    const [horas, minutos] = horaInicio.split(':');
    const fecha = new Date();
    fecha.setHours(parseInt(horas), parseInt(minutos), 0, 0);
    fecha.setHours(fecha.getHours() + 1);
    
    return `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
  };

  // Función para asignar cita manual
  const handleAsignarCitaManual = async (e) => {
    e.preventDefault();
    setErrorManual("");
    setSuccessManual("");
    setLoadingManual(true);

    try {
      // Validar campos
      if (!boletaManual || !fechaManual || !horaInicioManual) {
        setErrorManual("Todos los campos son obligatorios");
        setLoadingManual(false);
        return;
      }

      // Obtener alumno por boleta
      console.log("Buscando alumno con boleta:", boletaManual);
      const alumno = await apiCall(`/usuario/boleta/${boletaManual}`, 'GET');
      
      if (!alumno || alumno.rol !== 'Alumno') {
        setErrorManual("No se encontró un alumno con esa boleta");
        setLoadingManual(false);
        return;
      }

      const idAlumnoManual = alumno._id || alumno.id;
      console.log("Alumno encontrado:", alumno.nombre, idAlumnoManual);

      // Calcular fechas de inicio y fin
      const horaFinal = calcularHoraFinal(horaInicioManual);
      
      const fechaInicio = new Date(`${fechaManual}T${horaInicioManual}:00`);
      const fechaFinal = new Date(`${fechaManual}T${horaFinal}:00`);

      console.log("Fecha inicio:", fechaInicio);
      console.log("Fecha final:", fechaFinal);

      // Verificar si ya existe una cita para este alumno
      let citaExistente = null;
      try {
        citaExistente = await apiCall(`/cita/alumno/${idAlumnoManual}`, 'GET');
      } catch (error) {
        // Si es 404, no existe cita (es esperado)
        if (error.response && error.response.status === 404) {
          console.log("No existe cita previa, se creará una nueva");
        } else {
          throw error;
        }
      }

      const citaData = {
        idAlumno: idAlumnoManual,
        idPeriodoInscripcion: periodoActual._id || periodoActual.id,
        fechaInicio: fechaInicio.toISOString(),
        fechaFinal: fechaFinal.toISOString()
      };

      if (citaExistente) {
        // Actualizar cita existente
        const idCita = citaExistente._id || citaExistente.id;
        console.log("Actualizando cita existente:", idCita);
        await apiCall(`/cita/${idCita}`, 'PUT', citaData);
        setSuccessManual(`✅ Cita actualizada para ${alumno.nombre}`);
      } else {
        // Crear nueva cita
        console.log("Creando nueva cita");
        await apiCall('/cita', 'POST', citaData);
        setSuccessManual(`✅ Cita creada para ${alumno.nombre}`);
      }

      // Limpiar formulario
      setBoletaManual("");
      setFechaManual("");
      setHoraInicioManual("");
      
      // Recargar estadísticas
      await cargarEstadisticas();
      
      setTimeout(() => {
        setSuccessManual("");
      }, 5000);

    } catch (error) {
      console.error("Error al asignar cita manual:", error);
      setErrorManual("Error al asignar la cita. Intenta nuevamente.");
    } finally {
      setLoadingManual(false);
    }
  };

  const cerrarMensaje = () => {
    setMensaje({ visible: false, titulo: "", mensaje: "" });
  };

  return (
    <div className="reinscripciones-container">
      <MenuAdmin />

      <div className="reinscripciones-content">
        <h2>Asignación de Citas de Reinscripción</h2>

        <Mensaje
          visible={mensaje.visible}
          titulo={mensaje.titulo}
          mensaje={mensaje.mensaje}
          onCerrar={cerrarMensaje}
        />

        {/* Card de Información */}
        <div className="info-card" style={{
          background: '#f8f9fc',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>Información del Sistema</h3>
          
          {periodoActual ? (
            <div>
              <p><strong>Periodo de Reinscripción:</strong></p>
              <p>Inicio: {new Date(periodoActual.fechaInicio).toLocaleString('es-MX')}</p>
              <p>Fin: {new Date(periodoActual.fechaFinal).toLocaleString('es-MX')}</p>
            </div>
          ) : (
            <p style={{ color: '#666' }}>No hay periodo de reinscripción configurado</p>
          )}

          {estadisticas && (
            <div style={{ marginTop: '15px' }}>
              <p><strong>Citas asignadas:</strong> {estadisticas.totalCitas}</p>
            </div>
          )}
        </div>

        {/* Card de Asignación Automática */}
        <div className="grupo" style={{
          background: '#e8f4f8',
          padding: '25px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>🤖 Asignación Automática</h3>
          <p style={{ marginBottom: '15px', color: '#555' }}>
            El sistema asignará automáticamente citas a todos los alumnos basándose en su promedio académico.
          </p>
          
          <div style={{ 
            background: 'white', 
            padding: '15px', 
            borderRadius: '6px',
            marginBottom: '15px'
          }}>
            <h4>Parámetros de asignación:</h4>
            <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
              <li>⏰ <strong>Horario:</strong> 9:00 AM a 6:00 PM</li>
              <li>⏱️ <strong>Duración por cita:</strong> 1 hora</li>
              <li>📅 <strong>Diferencia entre citas:</strong> 5 minutos</li>
              <li>📊 <strong>Prioridad:</strong> Mayor promedio = Cita más temprana</li>
              <li>👥 <strong>Alumnos por rango:</strong> Se calcula automáticamente</li>
            </ul>
          </div>

          <Button
            variant="primary"
            onClick={handleAsignarAutomaticamente}
            disabled={loading || !periodoActual}
            style={{ width: '100%', marginBottom: '10px' }}
          >
            {loading ? "Asignando citas..." : "Asignar Automáticamente Todas las Citas"}
          </Button>

          {!periodoActual && (
            <p style={{ color: '#e74c3c', fontSize: '0.9em', marginTop: '5px' }}>
              ⚠️ Debes configurar un periodo de reinscripción primero
            </p>
          )}
        </div>

        {/* Card de Gestión de Citas */}
        <div className="grupo" style={{
          background: '#fff5f5',
          padding: '25px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>🗑️ Gestión de Citas</h3>
          <p style={{ marginBottom: '15px', color: '#555' }}>
            Elimina todas las citas existentes. Esta acción no se puede deshacer.
          </p>

          <Button
            variant="secondary"
            onClick={handleEliminarTodasCitas}
            disabled={loadingEliminar || (estadisticas && estadisticas.totalCitas === 0)}
            style={{ width: '100%' }}
          >
            {loadingEliminar ? "Eliminando..." : "Eliminar Todas las Citas"}
          </Button>

          {estadisticas && estadisticas.totalCitas === 0 && (
            <p style={{ color: '#666', fontSize: '0.9em', marginTop: '5px' }}>
              No hay citas para eliminar
            </p>
          )}
        </div>

        {/* ✅ NUEVA SECCIÓN: Asignación Manual */}
        <div className="grupo" style={{
          background: '#f0f9ff',
          padding: '25px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>✏️ Asignación Manual de Cita</h3>
          <p style={{ marginBottom: '15px', color: '#555' }}>
            Asigna o modifica manualmente la cita de un alumno específico.
          </p>

          <Button
            variant="primary"
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            style={{ width: '100%', marginBottom: '15px' }}
          >
            {mostrarFormulario ? '✖ Cancelar' : '➕ Asignar Cita Manual'}
          </Button>

          {/* Formulario de asignación manual */}
          {mostrarFormulario && (
            <div className="formulario-manual">
              <form onSubmit={handleAsignarCitaManual}>
                {/* Campo de Boleta */}
                <div className="form-field">
                  <label>Boleta del Alumno:</label>
                  <input
                    type="text"
                    value={boletaManual}
                    onChange={(e) => setBoletaManual(e.target.value)}
                    placeholder="Ej: 2023630401"
                    disabled={loadingManual}
                  />
                </div>

                {/* Campo de Fecha */}
                <div className="form-field">
                  <label>Fecha:</label>
                  <input
                    type="date"
                    value={fechaManual}
                    onChange={(e) => setFechaManual(e.target.value)}
                    disabled={loadingManual}
                  />
                </div>

                {/* Campo de Hora Inicio */}
                <div className="form-field">
                  <label>Hora de Inicio:</label>
                  <input
                    type="time"
                    value={horaInicioManual}
                    onChange={(e) => setHoraInicioManual(e.target.value)}
                    disabled={loadingManual}
                  />
                </div>

                {/* Campo de Hora Fin (calculado automáticamente) */}
                <div className="form-field">
                  <label>
                    Hora de Fin: 
                    <span className="label-hint">(automático - 1 hora después)</span>
                  </label>
                  <input
                    type="time"
                    value={calcularHoraFinal(horaInicioManual)}
                    readOnly
                    disabled
                  />
                </div>

                {/* Mensajes de error y éxito */}
                {errorManual && (
                  <div className="mensaje-error">
                    ⚠️ {errorManual}
                  </div>
                )}

                {successManual && (
                  <div className="mensaje-exito">
                    {successManual}
                  </div>
                )}

                {/* Botón de envío */}
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loadingManual}
                  style={{ width: '100%' }}
                >
                  {loadingManual ? 'Asignando...' : 'Asignar Cita'}
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Nota informativa */}
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fbbf24',
          padding: '15px',
          borderRadius: '6px',
          marginTop: '20px'
        }}>
          <p style={{ margin: 0, fontSize: '0.95em' }}>
            ℹ️ <strong>Nota:</strong> La asignación automática distribuye las citas equitativamente 
            considerando el promedio académico de cada alumno. Los alumnos con mejor rendimiento 
            académico tendrán acceso a horarios más tempranos.
          </p>
        </div>
      </div>
    </div>
  );
}