import { useEffect, useState } from "react";
import apiCall from "./APICall.jsx";

export function useIdAlumno() {
  const [idAlumno, setIdAlumno] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Obtener boleta de sesión
        let boletaAlumno = localStorage.getItem("boletaAlumno");

        // Para desarrollo: permitir boleta por defecto
        if (!boletaAlumno) {
          console.warn("⚠ No hay boleta en localStorage, usando boleta de desarrollo.");
          boletaAlumno = "20230000";
        }

        console.log("🔍 Consultando alumno con boleta:", boletaAlumno);

        // 2. Buscar alumno real en la BD
        const response = await apiCall(`/usuario/boleta/${boletaAlumno}`, "GET");

        const id = response?.data?._id || response?._id;

        if (!id) {
          throw new Error("La respuesta no contiene un _id válido.");
        }

        console.log("✅ Alumno encontrado, ID:", id);
        setIdAlumno(id);
      } catch (error) {
        console.error("❌ Error obteniendo ID del alumno:", error.message);

        // ✔ ID real y válido de Aketzaly para pruebas
        const idPorDefecto = "690eacdab43948f952b92459";

        console.log("⚠ Usando ID por defecto:", idPorDefecto);
        setIdAlumno(idPorDefecto);
      }
    }

    fetchData();
  }, []);

  return idAlumno;
}