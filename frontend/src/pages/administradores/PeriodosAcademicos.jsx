import React, { useState } from "react";
import MenuAdmin from "../../components/MenuAdmin";
import { useNavigate } from "react-router-dom";

export default function PeriodosAcademicos() {
  const navigate = useNavigate();
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [vistaPrevia, setVistaPrevia] = useState(null);

  // Función para formatear la fecha a dd/mm/yyyy
  const formatDate = (value) => {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  };

  const handleUpload = (e, tipo) => {
    const file = e.target.files[0];
    if (!file) return;
    setVistaPrevia(URL.createObjectURL(file));
    console.log(`Archivo subido (${tipo}):`, file.name);
  };

  return (
    <>
      <MenuAdmin />
      <div className="periodos-container">
        {/* === Título alineado a la izquierda === */}
        <div className="encabezado">
          <h2 className="titulo-izquierda">Periodos académicos</h2>
        </div>

        <div className="contenido">
          {/* === Columna izquierda === */}
          <div className="columna-izquierda">
            <div className="fechas">
              <div className="bloque-fecha">
                <label>Inicio de semestre</label>
                <input
                  type="date"
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                />
                <p className="fecha-formateada">{formatDate(inicio)}</p>
              </div>
              <div className="bloque-fecha">
                <label>Fin de semestre</label>
                <input
                  type="date"
                  value={fin}
                  onChange={(e) => setFin(e.target.value)}
                />
                <p className="fecha-formateada">{formatDate(fin)}</p>
              </div>
            </div>

            <div className="botones-grid">
              <div className="tarjeta">
                <p>Calendario académico</p>
                <input
                  type="file"
                  id="calendario"
                  className="oculto"
                  accept="image/*"
                  onChange={(e) => handleUpload(e, "calendario")}
                />
                <label htmlFor="calendario" className="boton">
                  Subir
                </label>
              </div>

              <div className="tarjeta">
                <p>Salones</p>
                <input
                  type="file"
                  id="salones"
                  className="oculto"
                  accept="image/*"
                  onChange={(e) => handleUpload(e, "salones")}
                />
                <label htmlFor="salones" className="boton">
                  Subir
                </label>
              </div>

              <div
                className="tarjeta"
                onClick={() => navigate("/administrador/asignar-cita")}
              >
                <p>Reinscripciones</p>
                <button className="boton">Gestionar</button>
              </div>

              <div
                className="tarjeta"
                onClick={() => navigate("/administrador/ets")}
              >
                <p>ETS</p>
                <button className="boton">Gestionar</button>
              </div>
            </div>
          </div>

          {/* === Columna derecha (vista previa) === */}
          <div className="columna-derecha">
            <h3 className="subtitulo">Vista previa</h3>
            {vistaPrevia ? (
              <img
                src={vistaPrevia}
                alt="Vista previa del archivo"
                className="imagen-calendario"
              />
            ) : (
              <img
                src="https://www.ipn.mx/assets/files/escom/img/calendario-escolar.png"
                alt="Calendario por defecto"
                className="imagen-calendario"
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}