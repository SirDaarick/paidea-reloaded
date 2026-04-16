import React, { useState } from "react";
import "styles/index.css";
import MenuProfesor from "components/MenuProfesor";
import SelectField from "components/SelectField";
import CuadroDatos from "components/CuadroDatos";
import { useProfesor } from "hooks/useProfesor";
import { useIdProfesor } from "hooks/useIdProfesor";

import escomMap from "assets/escomMap.jpg";
import semestre1_horarios from "assets/salones12.jpg";
import semestre2_horarios from "assets/salones12.jpg";
import semestre3_horarios from "assets/salones34.jpg";
import semestre4_horarios from "assets/salones34.jpg";
import semestre5_horarios from "assets/salones56.jpg";
import semestre6_horarios from "assets/salones56.jpg";
import semestre7_horarios from "assets/salones78.jpg";
import semestre8_horarios from "assets/salones78.jpg";

export default function SalonesProfesor() {
  const { idProfesor } = useIdProfesor();
  const [semestreSeleccionado, setSemestreSeleccionado] = useState("1");

  // Obtener datos del profesor
  const { profesor } = useProfesor(idProfesor);

  const datosGen = profesor ? {
    RFC: profesor.datosPersonales?.rfc || "N/A",
    Nombre: profesor.nombre,
    Departamento: profesor.dataProfesor?.departamento || "N/A",
    Sexo: profesor.datosPersonales?.sexo || "N/A",
    "Estado Civil": profesor.datosPersonales?.estadoCivil || "N/A",
  } : {
    RFC: "N/A",
    Nombre: "Cargando...",
    Departamento: "N/A",
    Sexo: "N/A",
    "Estado Civil": "N/A",
  };

  const onChangeSemestre = (e) => {
    setSemestreSeleccionado(e.target.value);
  };

  const opcionesSemestre = [
    { value: "1", label: "Primero" },
    { value: "2", label: "Segundo" },
    { value: "3", label: "Tercero" },
    { value: "4", label: "Cuarto" },
    { value: "5", label: "Quinto" },
    { value: "6", label: "Sexto" },
    { value: "7", label: "Séptimo" },
    { value: "8", label: "Octavo" },
  ];

  const getHorariosImage = () => {
    switch (semestreSeleccionado) {
      case "1": return semestre1_horarios;
      case "2": return semestre2_horarios;
      case "3": return semestre3_horarios;
      case "4": return semestre4_horarios;
      case "5": return semestre5_horarios;
      case "6": return semestre6_horarios;
      case "7": return semestre7_horarios;
      case "8": return semestre8_horarios;
      default: return semestre1_horarios;
    }
  };

  return (
    <div className="bienvenida-container">
      <MenuProfesor />

      <main className="page" style={{ marginTop: "20px" }}>
        <div className="salones-container">
          {/* Columna 1: Datos generales */}
          <CuadroDatos datos={datosGen} />

          {/* Columna 2: Título, Selector y Mapa */}
          <section className="salones-main">
            <h2 className="salones-subtitle">Salones</h2>
            <p className="salones-description">
              Visualiza el mapa con los salones donde impartes tus clases.
              Selecciona el semestre que corresponda a tus grupos actuales.
            </p>

            <SelectField
              label="Semestre"
              name="semestre"
              value={semestreSeleccionado}
              onChange={onChangeSemestre}
              options={opcionesSemestre}
            />

            <div className="salones-map-frame">
              <img
                src={escomMap}
                alt="Mapa de ESCOM"
                className="salones-map-img"
              />
            </div>
          </section>

          {/* Columna 3: Imagen de Horarios */}
          <div className="salones-horarios-frame">
            <img
              src={getHorariosImage()}
              alt={`Horarios ${semestreSeleccionado} Semestre`}
              className="salones-horarios-img"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
