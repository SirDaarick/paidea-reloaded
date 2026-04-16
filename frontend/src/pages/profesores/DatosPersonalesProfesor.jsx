import React from "react";
import { useNavigate } from "react-router-dom";
import "styles/index.css";
import MenuProfesor from "components/MenuProfesor";
import CuadroDatos from "components/CuadroDatos";
import Button from "components/Button";
import "styles/datos.css";
import { useProfesor } from "hooks/useProfesor";
import { useIdProfesor } from "hooks/useIdProfesor";
import Espera from "./EsperaProfesores.jsx";

export default function DatosPersonalesProfesor() {
  const navigate = useNavigate();
  const { idProfesor } = useIdProfesor();
  const { profesor, loading, error } = useProfesor(idProfesor);

  // Datos generales formateados desde el backend
  const datosGenerales = profesor ? {
    RFC: profesor.datosPersonales?.rfc || "N/A",
    Nombre: profesor.nombre,
    Departamento: profesor.dataProfesor?.departamento || "N/A",
    Sexo: profesor.datosPersonales?.sexo || "N/A",
    "Estado Civil": profesor.datosPersonales?.estadoCivil || "N/A",
  } : {};

  // Datos personales detallados
  const datosPersonales = profesor ? {
    CURP: profesor.datosPersonales?.curp || "N/A",
    RFC: profesor.datosPersonales?.rfc || "N/A",
    "Fecha de Nacimiento": profesor.datosPersonales?.nacimiento
      ? new Date(profesor.datosPersonales.nacimiento).toLocaleDateString('es-MX')
      : "N/A",
    Nacionalidad: profesor.datosPersonales?.nacionalidad || "N/A",
    "Entidad de Nacimiento": profesor.datosPersonales?.entidadNacimiento || "N/A",
    Calle: profesor.direcciones?.[0]?.calle || "N/A",
    "No. Ext": profesor.direcciones?.[0]?.noExt || "N/A",
    "No. Int": profesor.direcciones?.[0]?.noInt || "N/A",
    Colonia: profesor.direcciones?.[0]?.colonia || "N/A",
    "C.P": profesor.direcciones?.[0]?.cp || "N/A",
    Estado: profesor.direcciones?.[0]?.estado || "N/A",
    "Del/Mpo": profesor.direcciones?.[0]?.delegacion || "N/A",
    Teléfono: profesor.datosPersonales?.telefono || "N/A",
    Móvil: profesor.datosPersonales?.movil || "N/A",
    "e-mail": profesor.correo || "N/A",
  } : {};

  const handleEditar = () => {
    navigate("/profesor/editar-datos");
  };

  if (loading) return <Espera />;
  if (error) return <div className="bienvenida-container"><p style={{ color: 'red' }}>{error}</p></div>;

  return (
    <div className="bienvenida-container">
      {/* === Menú superior === */}
      <MenuProfesor />

      <main className="kardex-main">
        {/* === Columna izquierda === */}
        <CuadroDatos datos={datosGenerales} />

        {/* === Columna derecha === */}
        <section className="kardex-content">
          <h2 className="kardex-title">Datos Personales</h2>
          <p className="kardex-subtitle">
            En esta sección podrás visualizar tus datos personales. Si deseas
            actualizarlos, da clic en el botón
            <strong> “Editar información”</strong>.
          </p>

          <div className="personal-grid">
            {Object.entries(datosPersonales).map(([clave, valor]) => (
              <p key={clave}>
                <strong>{clave}:</strong> {valor}
              </p>
            ))}
          </div>

          <div className="btn-container">
            <Button onClick={handleEditar} variant="primary">
              Editar información
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
