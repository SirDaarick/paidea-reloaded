import { useEffect, useState } from "react";
import apiCall from "./APICall.jsx";

export function useIdAdmin() {
  const [idAdmin, setIdAdmin] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await apiCall('/usuario/boleta/2023000001', 'GET');
        const id = response?.data?._id || response?._id;
        
        if (!id) {
          throw new Error("No se encontró el ID del Admin en la respuesta");
        }
        
        console.log("ID Admin obtenido:", id);
        setIdAdmin(id);

      } catch (error) {
        console.error("Error obteniendo ID Admin:", error.message);

        const idPorDefecto = "69097bafbe0be862d5b321ec";
        console.log("Usando ID por defecto:", idPorDefecto);
        
        setIdAdmin(idPorDefecto);
      }
    }

    fetchData();
  }, []);

  return idAdmin;
}