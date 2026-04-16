import { useEffect, useState } from "react";
import apiCall from "./APICall.jsx";

export function useIdPeriodoActual() {
  const [idPeriodo, setIdPeriodo] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // apiCall retorna directamente el array de periodos
        const periodos = await apiCall('/periodoAcademico', 'GET');
        
        console.log("Periodos obtenidos:", periodos);
        
        if (!Array.isArray(periodos) || periodos.length === 0) {
          throw new Error("No se obtuvieron periodos de la API");
        }
        
        let id = null;
        const fechaActual = new Date();
        
        // Iterar sobre los periodos para encontrar el activo
        for (let i = 0; i < periodos.length; i++) {
          const periodo = periodos[i];
          const fechaInicio = new Date(periodo.fechaInicio);
          const fechaFinal = new Date(periodo.fechaFinal);
          
          console.log(`Revisando periodo ${periodo.nombre}:`, {
            fechaInicio: fechaInicio.toLocaleDateString(),
            fechaFinal: fechaFinal.toLocaleDateString(),
            fechaActual: fechaActual.toLocaleDateString(),
            dentroDelRango: fechaActual >= fechaInicio && fechaActual <= fechaFinal
          });
          
          // Verificar si la fecha actual está dentro del rango
          if (fechaActual >= fechaInicio && fechaActual <= fechaFinal) {
            id = periodo._id;
            console.log("Periodo encontrado:", {
              id: id,
              nombre: periodo.nombre,
              fechaInicio: fechaInicio.toLocaleDateString(),
              fechaFinal: fechaFinal.toLocaleDateString()
            });
            break;
          }
        }
        
        if (!id) {
          throw new Error("No se encontró un periodo activo para la fecha actual");
        }
        
        console.log("ID Periodo obtenido:", id);
        setIdPeriodo(id);

      } catch (error) {
        console.error("Error obteniendo ID periodo:", error.message);

        const idPorDefecto = "69097bafbe0be862d5b321ec";
        console.log("Usando ID por defecto:", idPorDefecto);
        
        setIdPeriodo(idPorDefecto);
      }
    }

    fetchData();
  }, []);

  return idPeriodo;
}