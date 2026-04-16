import { useEffect, useState } from "react";
import { fetchGruposProfesor, fetchClasesGrupo } from "../services/api";

/**
 * Hook para obtener los grupos asignados a un profesor
 * @param {string} profesorId - ID del profesor
 * @returns {Object} { grupos, loading, error }
 */
export function useGruposProfesor(profesorId) {
    const [grupos, setGrupos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadGrupos() {
            if (!profesorId) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const data = await fetchGruposProfesor(profesorId);
                setGrupos(data);
                setError(null);
            } catch (err) {
                console.error("Error al cargar grupos:", err);
                setError("Error al cargar los grupos asignados");
            } finally {
                setLoading(false);
            }
        }
        loadGrupos();
    }, [profesorId]);

    return { grupos, loading, error };
}

/**
 * Hook para obtener las clases/materias de un grupo específico
 * @param {string} grupoId - ID del grupo
 * @returns {Object} { clases, loading, error }
 */
export function useClasesGrupo(grupoId) {
    const [clases, setClases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadClases() {
            if (!grupoId) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const data = await fetchClasesGrupo(grupoId);
                setClases(data);
                setError(null);
            } catch (err) {
                console.error("Error al cargar clases:", err);
                setError("Error al cargar las clases del grupo");
            } finally {
                setLoading(false);
            }
        }
        loadClases();
    }, [grupoId]);

    return { clases, loading, error };
}
