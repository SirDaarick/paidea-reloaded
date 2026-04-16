import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "styles/index.css";
import Menu from "components/Menu";
import CuadroDatos from "components/CuadroDatos";
import Button from "components/Button";
import "styles/datos.css";
import { useDatosGen } from "consultas/datos_alumno_gen.jsx";
import { useIdAlumno } from "consultas/idAlumno";
import apiCall from "consultas/APICall.jsx";
import Espera from "./Espera";

export default function DatosPersonales() {
  const navigate = useNavigate();
  const datosGen = useDatosGen();
  const idAlumno = useIdAlumno();
  const [datosPersonales, setDatosPersonales] = useState(null);

  useEffect(() => {
    async function fetchDatosPersonales() {
      if (!idAlumno) return;

      try {
        // Obtener usuario por boleta
        const usuario = await apiCall(`/usuario/${idAlumno}`, 'GET');
        
        if (!usuario || !usuario.datosPersonales) {
          throw new Error("No se encontraron datos personales");
        }

        const dp = usuario.datosPersonales;
        const dir = usuario.direcciones?.[0] || {};

        // Formatear fecha de nacimiento
        const fechaNacimiento = dp.nacimiento 
          ? new Date(dp.nacimiento).toLocaleDateString('es-MX', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric' 
            })
          : "No especificada";

        setDatosPersonales({
          CURP: dp.curp || "No especificado",
          RFC: dp.rfc || "No especificado",
          "Fecha de Nacimiento": fechaNacimiento,
          Nacionalidad: dp.nacionalidad || "No especificada",
          "Entidad de Nacimiento": dp.entidadNacimiento || "No especificada",
          Calle: dir.calle || "No especificada",
          "No. Ext": dir.noExt || "0",
          "No. Int": dir.noInt || "0",
          Colonia: dir.colonia || "No especificada",
          "C.P": dir.cp || "No especificado",
          Estado: dir.estado || "No especificado",
          "Del/Mpo": dir.delMpo || "No especificado",
          Teléfono: dp.telefono || "No especificado",
          Móvil: dp.movil || "No especificado",
          "e-mail": usuario.correo || usuario.correo || "No especificado",
          Labora: dp.labora || "No",
          "Tel. Oficina": dp.telOficina || "No especificado",
        });

      } catch (error) {
        console.error("Error al obtener datos personales, usando datos por defecto:", error);
        
        // Datos por defecto en caso de error
        setDatosPersonales({
          CURP: "SOBD040730MDFSCNA5",
          RFC: "SOBD040730",
          "Fecha de Nacimiento": "30 Jul 2004",
          Nacionalidad: "MÉXICO",
          "Entidad de Nacimiento": "CIUDAD DE MÉXICO",
          Calle: "Colina de las Lajas",
          "No. Ext": "28",
          "No. Int": "0",
          Colonia: "Boulevares",
          "C.P": "53140",
          Estado: "MÉXICO",
          "Del/Mpo": "NAUCALPAN",
          Teléfono: "5548298685",
          Móvil: "5693587280",
          "e-mail": "sosa.becerra.daniela.itzel@gmail.com",
          Labora: "Sí",
          "Tel. Oficina": "7785893872",
        });
      }
    }

    fetchDatosPersonales();
  }, [idAlumno]);

  const handleEditar = () => {
    navigate("/alumno/editar-datos");
  };

  if (!datosGen || !datosPersonales) {
    return <Espera />;
  }

  return (
    <div className="bienvenida-container">
      <Menu />

      <main className="kardex-main">
        <CuadroDatos datos={datosGen} />

        <section className="kardex-content">
          <h2 className="kardex-title">Datos Personales</h2>
          <p className="kardex-subtitle">
            En esta sección podrás visualizar tus datos personales de igual forma si quieres editarlos, solo da click en el botón
            <strong> "Editar información"</strong>.
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