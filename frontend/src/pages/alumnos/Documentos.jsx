import React, { useEffect, useState } from "react";
import Menu from "components/Menu.jsx";
import Table from "components/Table.jsx";
import Mensaje from "components/Mensaje.jsx";
import Espera from "./Espera";
import { useDatosGen } from "consultas/datos_alumno_gen.jsx";
import { useSolicitudesAlumno } from "hooks/useSolicitudes.js";
import "styles/Documentos.css";

const Documentos = () => {
  const datosGen = useDatosGen();
  const { solicitudes, loading, error } = useSolicitudesAlumno(datosGen?.idAlumno);
  
  const [mensaje, setMensaje] = useState({
    visible: false,
    titulo: "",
    mensaje: ""
  });

  // Filtrar solo solicitudes completadas con documento
  const documentosDisponibles = solicitudes.filter(
    (sol) => sol.estado === "Completado" && sol.documentoGenerado?.url
  );

  const columns = [
    { key: "fechaSolicitud", label: "Fecha solicitud", width: "120px" },
    { key: "fechaCompletado", label: "Fecha completado", width: "130px" },
    { key: "tipoTramite", label: "Tipo de trámite", width: "200px" },
    { key: "estado", label: "Estado", width: "100px" },
    { key: "descarga", label: "Descargar", width: "80px" }
  ];

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    const date = new Date(fecha);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const handleDescargar = (url, nombre) => {
    if (!url) {
      setMensaje({
        visible: true,
        titulo: "Error",
        mensaje: "El documento no está disponible"
      });
      return;
    }

    // Abrir en nueva pestaña
    const baseUrl = "http://localhost:3001";
    window.open(`${baseUrl}${url}`, "_blank");
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      "Completado": <span className="badge badge-success">Completado</span>,
      "En proceso": <span className="badge badge-warning">En proceso</span>,
      "Pendiente": <span className="badge badge-info">Pendiente</span>,
      "Rechazado": <span className="badge badge-danger">Rechazado</span>,
      "Requiere presencia": <span className="badge badge-alert">Requiere presencia</span>
    };
    return badges[estado] || estado;
  };

  useEffect(() => {
    if (error) {
      setMensaje({
        visible: true,
        titulo: "Error",
        mensaje: "No se pudieron cargar los documentos. Inténtalo más tarde."
      });
    }
  }, [error]);

  if (!datosGen) {
    return <Espera />;
  }

  return (
    <div className="documentos-container">
      <Menu />

      <div className="documentos-content">
        <h2 className="titulo-seccion">Mis documentos</h2>
        <p className="descripcion-seccion">
          Aquí puedes consultar y descargar los documentos que has solicitado.
        </p>

        {/* Datos del alumno */}
        <div className="datos-alumno-header">
          <div className="dato-item">
            <strong>Boleta:</strong> {datosGen.boleta}
          </div>
          <div className="dato-item">
            <strong>Nombre:</strong> {datosGen.nombre}
          </div>
          <div className="dato-item">
            <strong>Carrera:</strong> {datosGen.carrera}
          </div>
        </div>

        {/* Tabla de documentos */}
        {loading ? (
          <div className="loading-container">
            <p>Cargando documentos...</p>
          </div>
        ) : documentosDisponibles.length === 0 ? (
          <div className="empty-state">
            <p>No tienes documentos disponibles aún.</p>
            <p className="empty-hint">
              Solicita un trámite desde la sección "Gestión académica → Solicitudes"
            </p>
          </div>
        ) : (
          <>
            <div className="info-documentos">
              <p>
                <strong>Total de documentos:</strong> {documentosDisponibles.length}
              </p>
            </div>

            <Table
              columns={columns}
              data={documentosDisponibles}
              renderCell={(item, columnKey) => {
                switch (columnKey) {
                  case "fechaSolicitud":
                    return formatearFecha(item.fechaSolicitud);
                  
                  case "fechaCompletado":
                    return formatearFecha(item.fechaCompletado);
                  
                  case "tipoTramite":
                    return item.tipoTramite;
                  
                  case "estado":
                    return getEstadoBadge(item.estado);
                  
                  case "descarga":
                    return (
                      <button
                        className="btn-descarga"
                        onClick={() => handleDescargar(
                          item.documentoGenerado?.url,
                          item.documentoGenerado?.nombre || "documento.pdf"
                        )}
                        title="Descargar documento"
                      >
                        <img
                          src="https://cdn-icons-png.flaticon.com/512/337/337946.png"
                          alt="Descargar PDF"
                          style={{ width: "24px", cursor: "pointer" }}
                        />
                      </button>
                    );
                  
                  default:
                    return item[columnKey] || "-";
                }
              }}
              striped
              hover
              emptyMessage="No hay documentos disponibles"
            />
          </>
        )}

        {/* Mostrar todas las solicitudes (opcional) */}
        {solicitudes.length > documentosDisponibles.length && (
          <div className="solicitudes-en-proceso">
            <h3>Solicitudes en proceso</h3>
            <Table
              columns={[
                { key: "fechaSolicitud", label: "Fecha", width: "120px" },
                { key: "tipoTramite", label: "Trámite", width: "200px" },
                { key: "estado", label: "Estado", width: "150px" }
              ]}
              data={solicitudes.filter(
                (sol) => sol.estado !== "Completado"
              )}
              renderCell={(item, columnKey) => {
                if (columnKey === "fechaSolicitud") {
                  return formatearFecha(item.fechaSolicitud);
                }
                if (columnKey === "estado") {
                  return getEstadoBadge(item.estado);
                }
                return item[columnKey];
              }}
              striped
              hover
              emptyMessage="No hay solicitudes en proceso"
            />
          </div>
        )}
      </div>

      <Mensaje
        titulo={mensaje.titulo}
        mensaje={mensaje.mensaje}
        visible={mensaje.visible}
        onCerrar={() => setMensaje({ ...mensaje, visible: false })}
      />
    </div>
  );
};

export default Documentos;