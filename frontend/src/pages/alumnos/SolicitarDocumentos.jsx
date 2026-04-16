import React, { useState } from "react";
import Menu from "components/Menu.jsx";
import Button from "components/Button.jsx";
import SelectField from "components/SelectField.jsx";
import Mensaje from "components/Mensaje.jsx";
import Espera from "./Espera";
import { useDatosGen } from "consultas/datos_alumno_gen.jsx";
import { useCrearSolicitud } from "hooks/useSolicitudes.js";
import "styles/SolicitarDocumentos.css";
import "styles/modalForms.css";

const SolicitarDocumentos = () => {
  const datosGen = useDatosGen();
  const { crear, loading: enviando, error: errorEnvio } = useCrearSolicitud();

  const [tipoTramite, setTipoTramite] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [comentario, setComentario] = useState("");
  
  const [mensaje, setMensaje] = useState({
    visible: false,
    titulo: "",
    mensaje: ""
  });

  const tiposTramite = [
    { value: "", label: "Selecciona el trámite a solicitar" },
    { value: "Constancia de estudios", label: "Constancia de estudios" },
    { value: "Boleta global", label: "Boleta global" },
    { value: "Baja temporal", label: "Baja temporal" },
    { value: "Baja definitiva", label: "Baja definitiva" },
    { value: "Constancia de servicio social", label: "Constancia de servicio social" },
    { value: "Carta de buena conducta", label: "Carta de buena conducta" },
    { value: "Constancia de créditos", label: "Constancia de créditos" },
    { value: "Constancia de horario", label: "Constancia de horario" }
  ];

  const handleArchivo = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (5MB máx)
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
      const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!tiposPermitidos.includes(file.type)) {
        setMensaje({
          visible: true,
          titulo: "Error",
          mensaje: "Solo se permiten archivos PDF, JPG, JPEG o PNG"
        });
        e.target.value = "";
        return;
      }
      
      setArchivo(file);
    }
  };

  const handleSolicitud = async () => {
    // Validación: campo vacío
    if (!tipoTramite) {
      setMensaje({
        visible: true,
        titulo: "Campo requerido",
        mensaje: "Debes seleccionar un tipo de trámite"
      });
      return;
    }

    // Validación: Baja temporal requiere carta
    if (tipoTramite === "Baja temporal" && !archivo) {
      setMensaje({
        visible: true,
        titulo: "Documento requerido",
        mensaje: "Debes subir una carta explicando los motivos para la baja temporal"
      });
      return;
    }

    // Validación: Plan 2009 solo para ISC
    if (datosGen.plan === "2009" && datosGen.carrera !== "Ingeniería en Sistemas Computacionales") {
      setMensaje({
        visible: true,
        titulo: "Plan no válido",
        mensaje: "El plan 2009 solo aplica para Ingeniería en Sistemas Computacionales"
      });
      return;
    }

    // Enviar solicitud
    const resultado = await crear(
      {
        idAlumno: datosGen.idAlumno,
        tipoTramite,
        comentarioAlumno: comentario
      },
      archivo
    );

    if (resultado) {
      setMensaje({
        visible: true,
        titulo: "Solicitud enviada",
        mensaje: `Tu solicitud de "${tipoTramite}" ha sido enviada correctamente. Recibirás una notificación cuando esté lista.`
      });

      // Limpiar formulario
      setTipoTramite("");
      setArchivo(null);
      setComentario("");
      
      // Limpiar input file
      const fileInput = document.getElementById("archivo");
      if (fileInput) fileInput.value = "";
    } else {
      setMensaje({
        visible: true,
        titulo: "Error",
        mensaje: errorEnvio || "Ocurrió un error al enviar la solicitud. Inténtalo más tarde."
      });
    }
  };

  const cerrarMensaje = () => {
    setMensaje({ ...mensaje, visible: false });
  };

  if (!datosGen) {
    return <Espera />;
  }

  return (
    <div className="solicitar-documentos-page">
      <Menu />

      <div className="solicitar-documentos-container">
        <h2 className="titulo-seccion">Solicitar trámite</h2>
        <p className="descripcion-seccion">
          Solicita constancias, bajas temporales o definitivas, o cualquier documento académico que necesites.
        </p>

        {/* Datos del alumno */}
        <div className="datos-alumno-card">
          <div className="dato-row">
            <span className="dato-label">Boleta:</span>
            <span className="dato-valor">{datosGen.boleta}</span>
          </div>
          <div className="dato-row">
            <span className="dato-label">Nombre:</span>
            <span className="dato-valor">{datosGen.nombre}</span>
          </div>
          <div className="dato-row">
            <span className="dato-label">Carrera:</span>
            <span className="dato-valor">{datosGen.carrera}</span>
          </div>
          <div className="dato-row">
            <span className="dato-label">Plan:</span>
            <span className="dato-valor">{datosGen.plan}</span>
          </div>
        </div>

        {/* Formulario */}
        <div className="form-solicitud-tramite">
          <SelectField
            label="Tipo de trámite"
            options={tiposTramite}
            value={tipoTramite}
            onChange={(e) => setTipoTramite(e.target.value)}
            wide
            required
          />

          {tipoTramite === "Baja temporal" && (
            <div className="archivo-upload-container">
              <label htmlFor="archivo" className="archivo-label">
                Carta explicativa (obligatorio) *
              </label>
              <input
                type="file"
                id="archivo"
                className="archivo-input"
                onChange={handleArchivo}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              {archivo && (
                <p className="archivo-seleccionado">
                  ✓ Archivo seleccionado: {archivo.name}
                </p>
              )}
              <small className="archivo-hint">
                Formatos aceptados: PDF, JPG, PNG (máx. 5MB)
              </small>
            </div>
          )}

          <div className="comentario-container">
            <label htmlFor="comentario" className="comentario-label">
              Comentarios adicionales (opcional)
            </label>
            <textarea
              id="comentario"
              className="comentario-textarea"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Agrega cualquier información adicional que consideres importante..."
              rows="5"
              maxLength="500"
            />
            <small className="char-counter">{comentario.length}/500 caracteres</small>
          </div>

          <div className="botones-acciones">
            <Button
              onClick={handleSolicitud}
              variant="primary"
              disabled={enviando}
            >
              {enviando ? "Enviando..." : "Enviar solicitud"}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de mensajes */}
      <Mensaje
        titulo={mensaje.titulo}
        mensaje={mensaje.mensaje}
        visible={mensaje.visible}
        onCerrar={cerrarMensaje}
      />
    </div>
  );
};

export default SolicitarDocumentos;