import { useEffect, useState } from "react";
import apiCall from "./APICall.jsx";
import { useIdAlumno } from "./idAlumno.jsx";

export function useDatosGen() {
  const [datosGen, setDatosGen] = useState(null);
  const idAlumno = useIdAlumno();

  useEffect(() => {
    if (!idAlumno) {
      console.log("⏳ Esperando a que idAlumno esté disponible...");
      return;
    }

    async function fetchData() {
      try {
        console.log("🔍 Obteniendo datos del alumno:", idAlumno);
        
        const response = await apiCall(`/usuario/${idAlumno}`, 'GET');
        console.log("✅ Usuario obtenido:", response);
        
        const carrera_alumno = await apiCall(`/carrera/${response.dataAlumno.idCarrera}`, 'GET');
        console.log("✅ Carrera obtenida:", carrera_alumno);
        
        const datosGenerales = {
          boleta: response?.boleta || "2023610258",
          nombre: response?.nombre || "Juan Pérez López",
          carrera: carrera_alumno?.nombre || "Ingeniería en Inteligencia Artificial",
          plan: carrera_alumno?.planAcademico || "20",
          promedio: response?.dataAlumno?.promedio || "8.5",
        };

        console.log("✅ Datos generales procesados:", datosGenerales);
        setDatosGen(datosGenerales);

      } catch (error) {
        console.error("❌ API no disponible, usando datos por defecto:", error.message);

        const datosPorDefecto = {
          boleta: "2023610258",
          nombre: "Juan Pérez López",
          carrera: "Ingeniería en Inteligencia Artificial",
          plan: "20",
          promedio: "8.5",
        };

        setDatosGen(datosPorDefecto);
      }
    }

    fetchData();
  }, [idAlumno]); 

  return datosGen;
}