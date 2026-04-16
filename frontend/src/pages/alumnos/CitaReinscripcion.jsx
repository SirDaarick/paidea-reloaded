import React, { useEffect, useState } from "react";
import Menu from "components/Menu.jsx";
import CuadroDatos from "components/CuadroDatos.jsx";
import Table from "components/Table.jsx";
import Espera from "./Espera.jsx";
import { useIdAlumno } from "consultas/idAlumno.jsx";
import { useDatosGen } from "consultas/datos_alumno_gen.jsx";
import apiCall from "consultas/APICall.jsx";
import "styles/CitaReinscripcion.css";

const columnas = [
  { key: "dia", label: "Día", width: "30%" },
  { key: "horaInicio", label: "Hora Inicio", width: "20%" },
  { key: "horaFin", label: "Hora Fin", width: "20%" },
];

export default function CitaReinscripcion() {
  const [loading, setLoading] = useState(true);
  const [datosCita, setDatosCita] = useState(null);
  const [sinCita, setSinCita] = useState(false);
  
  const idAlumno = useIdAlumno();
  const datosGen = useDatosGen();

  useEffect(() => {
    const fetchCita = async () => {
      if (!idAlumno) return;

      try {
        console.log("Obteniendo cita para alumno:", idAlumno);
        
        const citaData = await apiCall(`/cita/alumno/${idAlumno}`, 'GET');
        
        console.log("Cita obtenida:", citaData);

        // Formatear los datos para mostrar
        const fechaInicio = new Date(citaData.fechaInicio);
        const fechaFinal = new Date(citaData.fechaFinal);

        // Formatear fecha: "15 de Enero 2026"
        const opciones = { day: 'numeric', month: 'long', year: 'numeric' };
        const diaFormateado = fechaInicio.toLocaleDateString('es-MX', opciones);

        // Formatear horas: "08:30 AM"
        const opcionesHora = { hour: '2-digit', minute: '2-digit', hour12: true };
        const horaInicioFormateada = fechaInicio.toLocaleTimeString('es-MX', opcionesHora);
        const horaFinFormateada = fechaFinal.toLocaleTimeString('es-MX', opcionesHora);

        setDatosCita({
          dia: diaFormateado,
          horaInicio: horaInicioFormateada,
          horaFin: horaFinFormateada,
        });

        setLoading(false);

      } catch (error) {
        console.error("Error al obtener cita:", error);
        
        // Si el error es 404, significa que no hay cita
        if (error.response && error.response.status === 404) {
          console.log("No hay cita asignada para este alumno");
          setSinCita(true);
        }
        
        setLoading(false);
      }
    };

    fetchCita();
  }, [idAlumno]);

  // Pantalla de carga inicial
  if (loading || !idAlumno || !datosGen) {
    return <Espera />;
  }

  // No hay cita asignada
  if (sinCita) {
    return (
      <Espera 
        mensaje1="Cita no asignada"
        mensaje2="Sé paciente, pronto se asignará tu cita."
      />
    );
  }

  // Preparar datos del alumno para el cuadro
  const datosAlumno = {
    Boleta: datosGen.boleta || "N/A",
    Nombre: datosGen.nombre || "N/A",
    Carrera: datosGen.carrera || "N/A",
    Plan: datosGen.plan || "N/A",
    Promedio: datosGen.promedio !== undefined ? datosGen.promedio.toFixed(2) : "N/A"
  };

  // Sí hay cita asignada
  return (
    <div className="cita-page">
      <Menu />
      <div className="cita-layout">
        <div className="cita-left">
          <CuadroDatos datos={datosAlumno} />
        </div>
        <div className="cita-right">
          <h1 className="cita-title">Cita de Reinscripción</h1>
          <h2 className="cita-subtitle">Información de la Cita</h2>
          <Table
            columns={columnas}
            data={[datosCita]}
            striped
            hover
            emptyMessage="No hay datos disponibles"
          />
          
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            background: '#e8f4f8', 
            borderRadius: '8px' 
          }}>
            <p style={{ margin: 0, fontSize: '0.95em' }}>
              ℹ️ <strong>Importante:</strong> Recuerda realizar tu reinscripción en la fecha y hora establecida.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}