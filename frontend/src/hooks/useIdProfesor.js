import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://paidea.onrender.com";

/**
 * Hook centralizado para obtener el ID del profesor desde la autenticación
 * Obtiene el RFC del localStorage y consulta la BD para obtener el ID
 */
export function useIdProfesor() {
    const [idProfesor, setIdProfesor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchProfesorId() {
            try {
                // 1. Obtener RFC del profesor autenticado desde localStorage
                const rfcProfesor = localStorage.getItem("rfcProfesor");

                if (!rfcProfesor) {
                    throw new Error("No se encontró RFC del profesor en la sesión");
                }

                console.log("🔍 Buscando profesor con RFC:", rfcProfesor);

                // 2. Hacer petición a GET /usuario/rfc/:rfc
                const response = await axios.get(`${API_URL}/usuario/rfc/${rfcProfesor}`);
                const profesorData = response.data;

                if (!profesorData || !profesorData._id) {
                    throw new Error("No se encontró el profesor en la base de datos");
                }

                console.log("✅ Profesor encontrado:", profesorData.nombre);
                console.log("📌 ID del profesor:", profesorData._id);

                setIdProfesor(profesorData._id);
                setError(null);

            } catch (err) {
                console.error("❌ Error obteniendo ID del profesor:", err.message);
                setError(err.message);
                setIdProfesor(null);
            } finally {
                setLoading(false);
            }
        }

        fetchProfesorId();
    }, []);

    return { idProfesor, loading, error };
}
