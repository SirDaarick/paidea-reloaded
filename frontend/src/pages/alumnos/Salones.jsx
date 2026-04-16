import React, { useState } from "react";
import "styles/index.css";
import Menu from "components/Menu.jsx";
import SelectField from "components/SelectField";
import CuadroDatos from "components/CuadroDatos"; // Importamos tu componente
import Espera from "./Espera";
import { useDatosGen } from "consultas/datos_alumno_gen.jsx";

import escomMap from "assets/escomMap.jpg";
import semestre1_horarios from "assets/salones12.jpg";
import semestre2_horarios from "assets/salones12.jpg";
import semestre3_horarios from "assets/salones34.jpg";
import semestre4_horarios from "assets/salones34.jpg";
import semestre5_horarios from "assets/salones56.jpg";    
import semestre6_horarios from "assets/salones56.jpg";
import semestre7_horarios from "assets/salones78.jpg";
import semestre8_horarios from "assets/salones78.jpg";

export default function Salones() {
  const datosGen = useDatosGen();

  const [semestreSeleccionado, setSemestreSeleccionado] = useState("1");

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
    { value: "8", label: "Octavo" }
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
  if (!datosGen)
      return <Espera />;
  return (
    <div className="bienvenida-container">
      <Menu />

      <main className="page" style={{ marginTop: "20px" }}>
        <div className="salones-container">

          {/* Columna 1: Datos generales usando tu componente */}
          <CuadroDatos datos={datosGen} />

          {/* Columna 2: Título, Selector y Mapa */}
          <section className="salones-main">
            <h2 className="salones-subtitle">Salones</h2>
            <p className="salones-description">
              Aquí puedes ver un mapa con donde se encuentra tus materias impartidas. Solo,
              selecciona el semestre que estés cursando.
            </p>

            <SelectField
              label="Semestre"
              name="semestre"
              value={semestreSeleccionado}
              onChange={onChangeSemestre}
              options={opcionesSemestre}
            />

            <div className="salones-map-frame">
              <img src={escomMap} alt="Mapa de ESCOM" className="salones-map-img" />
            </div>
          </section>

          {/* Columna 3: Imagen de Horarios */}
          <div className="salones-horarios-frame">
            <img src={getHorariosImage()} alt={`Horarios ${semestreSeleccionado} Semestre`} className="salones-horarios-img" />
          </div>

        </div>
      </main>
    </div>
  );
}
