import { useEffect, useState } from "react";
import { fetchProfesorById, updateProfesor } from "../services/api";

/**
 * Hook para obtener los datos de un profesor específico
 * @param {string} profesorId - ID del profesor
 * @returns {Object} { profesor, loading, error, refetch }
 */
export function useProfesor(profesorId) {
    const [profesor, setProfesor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        if (!profesorId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const data = await fetchProfesorById(profesorId);
            setProfesor(data);
            setError(null);
        } catch (err) {
            console.error("Error al cargar profesor:", err);
            setError(err.message || "Error al cargar los datos del profesor");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [profesorId]);

    const refetch = () => fetchData();

    return { profesor, loading, error, refetch };
}

/**
 * Hook para actualizar datos del profesor
 * @returns {Object} { updateData, loading, error, success }
 */
export function useUpdateProfesor() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const updateData = async (profesorId, data) => {
        try {
            setLoading(true);
            setError(null);
            const result = await updateProfesor(profesorId, data);
            setSuccess(true);
            return result;
        } catch (err) {
            console.error("Error al actualizar profesor:", err);
            setError(err.message || "Error al actualizar los datos");
            setSuccess(false);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { updateData, loading, error, success };
}
