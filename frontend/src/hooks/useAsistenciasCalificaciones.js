import { useEffect, useState } from "react";
import {
    fetchAsistenciasGrupo,
    guardarAsistencias,
    fetchCalificacionesGrupo,
    guardarCalificaciones
} from "../services/api";

/**
 * Hook para manejar asistencias de una clase
 * @param {string} claseId - ID de la clase
 * @returns {Object} { asistencias, loading, error, guardar }
 */
export function useAsistencias(claseId) {
    const [asistencias, setAsistencias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [savingError, setSavingError] = useState(null);

    useEffect(() => {
        async function loadAsistencias() {
            if (!claseId) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const data = await fetchAsistenciasGrupo(claseId);
                setAsistencias(data);
                setError(null);
            } catch (err) {
                console.error("Error al cargar asistencias:", err);
                setError("Error al cargar las asistencias");
            } finally {
                setLoading(false);
            }
        }
        loadAsistencias();
    }, [claseId]);

    const guardar = async (asistenciasData) => {
        try {
            setSavingError(null);
            await guardarAsistencias(claseId, asistenciasData);
            setAsistencias(asistenciasData);
            return true;
        } catch (err) {
            console.error("Error al guardar asistencias:", err);
            setSavingError("Error al guardar las asistencias");
            return false;
        }
    };

    return { asistencias, loading, error, savingError, guardar, setAsistencias };
}

/**
 * Hook para manejar calificaciones de un grupo/materia
 * @param {string} grupoId - ID del grupo
 * @param {string} materiaId - ID de la materia/UDA
 * @returns {Object} { calificaciones, loading, error, guardar, promedio }
 */
export function useCalificaciones(grupoId, materiaId) {
    const [calificaciones, setCalificaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [savingError, setSavingError] = useState(null);

    useEffect(() => {
        async function loadCalificaciones() {
            if (!grupoId || !materiaId) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const data = await fetchCalificacionesGrupo(grupoId, materiaId);
                setCalificaciones(data);
                setError(null);
            } catch (err) {
                console.error("Error al cargar calificaciones:", err);
                setError("Error al cargar las calificaciones");
            } finally {
                setLoading(false);
            }
        }
        loadCalificaciones();
    }, [grupoId, materiaId]);

    const guardar = async (calificacionesData) => {
        try {
            setSavingError(null);
            await guardarCalificaciones(grupoId, materiaId, calificacionesData);
            setCalificaciones(calificacionesData);
            return true;
        } catch (err) {
            console.error("Error al guardar calificaciones:", err);
            setSavingError("Error al guardar las calificaciones");
            return false;
        }
    };

    // Calcular promedio
    const promedio = calificaciones.length > 0
        ? (calificaciones.reduce((sum, c) => sum + (parseFloat(c.calificacion) || 0), 0) / calificaciones.length).toFixed(2)
        : 0;

    return { calificaciones, loading, error, savingError, guardar, promedio, setCalificaciones };
}
