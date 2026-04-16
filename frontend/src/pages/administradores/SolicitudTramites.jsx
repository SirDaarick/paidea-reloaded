import React, { useState, useEffect } from "react";
import MenuAdmin from "components/MenuAdmin";
import Button from "components/Button";
import Table from "components/Table";
import Emergente from "components/Emergente";
import Mensaje from "components/Mensaje";
import SelectField from "components/SelectField";
import { useSolicitudes, useActualizarSolicitud } from "hooks/useSolicitudes";
import "styles/SolicitudTramites.css";
import "styles/modalForms.css";

const SolicitudTramites = () => {
  const [vistaActual, setVistaActual] = useState("pendientes"); // pendientes | completadas
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  
  // Estados del formulario de procesamiento
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [comentarioAdmin, setComentarioAdmin] = useState("");
  const [requierePresencia, setRequierePresencia] = useState(false);
  const [fechaCita, setFechaCita] = useState("");
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [documentoGenerado, setDocumentoGenerado] = useState(null);

  const [mensaje, setMensaje] = useState({
    visible: false,
    titulo: "",
    mensaje: ""
  });

  // Hooks
  const filtros = vistaActual === "pendientes" 
    ? { estado: "Pendiente" } 
    : { estado: "Completado" };
  
  const { solicitudes, loading, error, refetch } = useSolicitudes(filtros);
  const { actualizar, loading: actualizando } = useActualizarSolicitud();

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    const date = new Date(fecha);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const abrirModal = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setNuevoEstado(solicitud.estado);
    setComentarioAdmin(solicitud.comentarioAdmin || "");
    setRequierePresencia(solicitud.requierePresencia || false);
    setFechaCita(solicitud.fechaCita ? solicitud.fechaCita.split('T')[0] : "");
    setMotivoRechazo(solicitud.motivoRechazo || "");
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setSolicitudSeleccionada(null);
    setDocumentoGenerado(null);
    setNuevoEstado("");
    setComentarioAdmin("");
    setRequierePresencia(false);
    setFechaCita("");
    setMotivoRechazo("");
  };

  const handleDocumento = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMensaje({
          visible: true,
          titulo: "Error",
          mensaje: "El archivo no debe superar 5MB"
        });
        e.target.value = "";
        return;
      }

      // Validar tipo
      const tiposPermitidos = ['application/pdf'];
      if (!tiposPermitidos.includes(file.type)) {
        setMensaje({
          visible: true,
          titulo: "Error",
          mensaje: "Solo se permiten archivos PDF"
        });
        e.target.value = "";
        return;
      }

      setDocumentoGenerado(file);
    }
  };

  const handleProcesar = async () => {
    if (!solicitudSeleccionada) return;

    // Validaciones
    if (!nuevoEstado) {
      setMensaje({
        visible: true,
        titulo: "Campo requerido",
        mensaje: "Debes seleccionar un estado"
      });
      return;
    }

    if (nuevoEstado === "Rechazado" && !motivoRechazo.trim()) {
      setMensaje({
        visible: true,
        titulo: "Campo requerido",
        mensaje: "Debes indicar el motivo del rechazo"
      });
      return;
    }

    if (requierePresencia && !fechaCita) {
      setMensaje({
        visible: true,
        titulo: "Campo requerido",
        mensaje: "Debes asignar una fecha de cita si requiere presencia"
      });
      return;
    }

    // Preparar datos de actualización
    const updateData = {
      estado: nuevoEstado,
      comentarioAdmin,
      requierePresencia,
      motivoRechazo,
      procesadoPor: "ADMIN_ID" // TODO: Obtener del contexto/sesión
    };

    if (fechaCita) {
      updateData.fechaCita = fechaCita;
    }

    // Enviar actualización
    const resultado = await actualizar(
      solicitudSeleccionada._id,
      updateData,
      documentoGenerado
    );

    if (resultado) {
      setMensaje({
        visible: true,
        titulo: "Éxito",
        mensaje: "Solicitud procesada correctamente"
      });
      cerrarModal();
      refetch(); // Recargar lista
    } else {
      setMensaje({
        visible: true,
        titulo: "Error",
        mensaje: "No se pudo procesar la solicitud. Inténtalo de nuevo."
      });
    }
  };

  const handleMarcarListo = async (solicitudId) => {
    const resultado = await actualizar(solicitudId, {
      estado: "Completado",
      procesadoPor: "ADMIN_ID" // TODO: Obtener del contexto
    });

    if (resultado) {
      setMensaje({
        visible: true,
        titulo: "Éxito",
        mensaje: "Solicitud marcada como completada"
      });
      refetch();
    }
  };

  const handleCitar = async (solicitudId) => {
    const resultado = await actualizar(solicitudId, {
      requierePresencia: true,
      procesadoPor: "ADMIN_ID"
    });

    if (resultado) {
      setMensaje({
        visible: true,
        titulo: "Éxito",
        mensaje: "Alumno marcado para citar"
      });
      refetch();
    }
  };

  const estadosDisponibles = {
    "Pendiente": [
      { value: "En proceso", label: "En proceso" },
      { value: "Rechazado", label: "Rechazado" }
    ],
    "En proceso": [
      { value: "Completado", label: "Completado" },
      { value: "Requiere presencia", label: "Requiere presencia" },
      { value: "Rechazado", label: "Rechazado" }
    ],
    "Requiere presencia": [
      { value: "En proceso", label: "En proceso" },
      { value: "Completado", label: "Completado" }
    ]
  };

  // Columnas para tabla de pendientes
  const columnasPendientes = [
    { key: "boleta", label: "Boleta", width: "100px" },
    { key: "nombre", label: "Nombre", width: "180px" },
    { key: "carrera", label: "Carrera", width: "120px" },
    { key: "tipoTramite", label: "Trámite", width: "180px" },
    { key: "fechaSolicitud", label: "Fecha", width: "120px" },
    { key: "acciones", label: "Acciones", width: "150px" }
  ];

  // Columnas para tabla de completadas
  const columnasCompletadas = [
    { key: "boleta", label: "Boleta", width: "100px" },
    { key: "nombre", label: "Nombre", width: "180px" },
    { key: "tipoTramite", label: "Trámite", width: "180px" },
    { key: "fechaSolicitud", label: "Solicitado", width: "120px" },
    { key: "fechaCompletado", label: "Completado", width: "120px" },
    { key: "ver", label: "Ver", width: "60px" }
  ];

  useEffect(() => {
    if (error) {
      setMensaje({
        visible: true,
        titulo: "Error",
        mensaje: "No se pudieron cargar las solicitudes"
      });
    }
  }, [error]);

  return (
    <div className="solicitud-tramites-container">
      <MenuAdmin />

      <main className="solicitud-tramites-main">
        <h1 className="titulo">Gestión de trámites</h1>

        {/* Tabs de navegación */}
        <div className="tabs-navegacion">
          <button
            className={`tab ${vistaActual === "pendientes" ? "active" : ""}`}
            onClick={() => setVistaActual("pendientes")}
          >
            Pendientes ({solicitudes.filter(s => s.estado === "Pendiente").length})
          </button>
          <button
            className={`tab ${vistaActual === "completadas" ? "active" : ""}`}
            onClick={() => setVistaActual("completadas")}
          >
            Completadas
          </button>
        </div>

        {/* Contenido según vista */}
        {loading ? (
          <div className="loading-container">
            <p>Cargando solicitudes...</p>
          </div>
        ) : (
          <div className="tabla-scroll-container">
            {vistaActual === "pendientes" ? (
              <Table
                columns={columnasPendientes}
                data={solicitudes}
                renderCell={(item, columnKey) => {
                  switch (columnKey) {
                    case "boleta":
                      return item.idAlumno?.boleta || "-";
                    
                    case "nombre":
                      return item.idAlumno?.nombre || "-";
                    
                    case "carrera":
                      return item.idAlumno?.dataAlumno?.idCarrera?.clave || "-";
                    
                    case "tipoTramite":
                      return item.tipoTramite;
                    
                    case "fechaSolicitud":
                      return formatearFecha(item.fechaSolicitud);
                    
                    case "acciones":
                      return (
                        <div className="acciones-grupo">
                          <Button
                            variant="primary"
                            onClick={() => abrirModal(item)}
                            style={{ padding: "6px 12px", fontSize: "13px" }}
                          >
                            Procesar
                          </Button>
                        </div>
                      );
                    
                    default:
                      return item[columnKey] || "-";
                  }
                }}
                striped
                hover
                emptyMessage="No hay solicitudes pendientes"
              />
            ) : (
              <Table
                columns={columnasCompletadas}
                data={solicitudes}
                renderCell={(item, columnKey) => {
                  switch (columnKey) {
                    case "boleta":
                      return item.idAlumno?.boleta || "-";
                    
                    case "nombre":
                      return item.idAlumno?.nombre || "-";
                    
                    case "tipoTramite":
                      return item.tipoTramite;
                    
                    case "fechaSolicitud":
                      return formatearFecha(item.fechaSolicitud);
                    
                    case "fechaCompletado":
                      return formatearFecha(item.fechaCompletado);
                    
                    case "ver":
                      return (
                        <button
                          className="btn-ver"
                          onClick={() => abrirModal(item)}
                          title="Ver detalles"
                        >
                          👁️
                        </button>
                      );
                    
                    default:
                      return item[columnKey] || "-";
                  }
                }}
                striped
                hover
                emptyMessage="No hay solicitudes completadas"
              />
            )}
          </div>
        )}
      </main>

      {/* Modal de procesamiento */}
      <Emergente isOpen={modalAbierto} onClose={cerrarModal}>
        <div className="modal-procesar-solicitud">
          <h2>Procesar solicitud</h2>

          {solicitudSeleccionada && (
            <>
              {/* Información del alumno */}
              <div className="info-alumno-modal">
                <div className="info-row">
                  <strong>Boleta:</strong> {solicitudSeleccionada.idAlumno?.boleta}
                </div>
                <div className="info-row">
                  <strong>Nombre:</strong> {solicitudSeleccionada.idAlumno?.nombre}
                </div>
                <div className="info-row">
                  <strong>Carrera:</strong> {solicitudSeleccionada.idAlumno?.dataAlumno?.idCarrera?.nombre}
                </div>
                <div className="info-row">
                  <strong>Trámite:</strong> {solicitudSeleccionada.tipoTramite}
                </div>
                <div className="info-row">
                  <strong>Fecha solicitud:</strong> {formatearFecha(solicitudSeleccionada.fechaSolicitud)}
                </div>
                {solicitudSeleccionada.comentarioAlumno && (
                  <div className="info-row">
                    <strong>Comentario alumno:</strong>
                    <p className="comentario-texto">{solicitudSeleccionada.comentarioAlumno}</p>
                  </div>
                )}
                {solicitudSeleccionada.archivoAdjunto?.url && (
                  <div className="info-row">
                    <strong>Archivo adjunto:</strong>
                    <a
                      href={`http://localhost:3001${solicitudSeleccionada.archivoAdjunto.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-archivo"
                    >
                      📎 {solicitudSeleccionada.archivoAdjunto.nombre}
                    </a>
                  </div>
                )}
              </div>

              {/* Formulario de procesamiento */}
              {solicitudSeleccionada.estado !== "Completado" && (
                <div className="form-procesar">
                  <SelectField
                    label="Nuevo estado"
                    options={[
                      { value: "", label: "Selecciona el estado" },
                      ...(estadosDisponibles[solicitudSeleccionada.estado] || [])
                    ]}
                    value={nuevoEstado}
                    onChange={(e) => setNuevoEstado(e.target.value)}
                    wide
                  />

                  {nuevoEstado === "Rechazado" && (
                    <div className="field pill wide">
                      <label htmlFor="motivoRechazo">Motivo del rechazo *</label>
                      <textarea
                        id="motivoRechazo"
                        value={motivoRechazo}
                        onChange={(e) => setMotivoRechazo(e.target.value)}
                        rows="3"
                        maxLength="300"
                        required
                      />
                    </div>
                  )}

                  <div className="field pill wide">
                    <label htmlFor="comentarioAdmin">Comentarios del administrador</label>
                    <textarea
                      id="comentarioAdmin"
                      value={comentarioAdmin}
                      onChange={(e) => setComentarioAdmin(e.target.value)}
                      rows="3"
                      maxLength="500"
                    />
                  </div>

                  <div className="checkbox-field">
                    <input
                      type="checkbox"
                      id="requierePresencia"
                      checked={requierePresencia}
                      onChange={(e) => setRequierePresencia(e.target.checked)}
                    />
                    <label htmlFor="requierePresencia">Requiere presencia del alumno</label>
                  </div>

                  {requierePresencia && (
                    <div className="field pill wide">
                      <label htmlFor="fechaCita">Fecha de cita *</label>
                      <input
                        type="date"
                        id="fechaCita"
                        value={fechaCita}
                        onChange={(e) => setFechaCita(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  )}

                  {nuevoEstado === "Completado" && (
                    <div className="archivo-upload-container">
                      <label htmlFor="documentoGenerado" className="archivo-label">
                        Subir documento generado (PDF)
                      </label>
                      <input
                        type="file"
                        id="documentoGenerado"
                        className="archivo-input"
                        onChange={handleDocumento}
                        accept=".pdf"
                      />
                      {documentoGenerado && (
                        <p className="archivo-seleccionado">
                          ✓ {documentoGenerado.name}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="botones-modal">
                    <Button
                      onClick={handleProcesar}
                      variant="primary"
                      disabled={actualizando}
                    >
                      {actualizando ? "Procesando..." : "Guardar cambios"}
                    </Button>
                    <Button onClick={cerrarModal} variant="secondary">
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {/* Vista de solicitud completada */}
              {solicitudSeleccionada.estado === "Completado" && (
                <div className="solicitud-completada-info">
                  <p><strong>Estado:</strong> ✅ Completada</p>
                  <p><strong>Fecha completado:</strong> {formatearFecha(solicitudSeleccionada.fechaCompletado)}</p>
                  {solicitudSeleccionada.comentarioAdmin && (
                    <p><strong>Comentarios:</strong> {solicitudSeleccionada.comentarioAdmin}</p>
                  )}
                  {solicitudSeleccionada.documentoGenerado?.url && (
                    <a
                      href={`http://localhost:3001${solicitudSeleccionada.documentoGenerado.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-documento"
                    >
                      📄 Ver documento generado
                    </a>
                  )}
                  <Button onClick={cerrarModal} variant="secondary" style={{ marginTop: "20px" }}>
                    Cerrar
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Emergente>

      {/* Modal de mensajes */}
      <Mensaje
        titulo={mensaje.titulo}
        mensaje={mensaje.mensaje}
        visible={mensaje.visible}
        onCerrar={() => setMensaje({ ...mensaje, visible: false })}
      />
    </div>
  );
};

export default SolicitudTramites;