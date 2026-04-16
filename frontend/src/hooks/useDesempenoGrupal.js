import { useEffect, useState } from "react";
import { fetchCalificacionesGrupoParcial } from "../services/api";

/**
 * Hook para obtener calificaciones de un grupo/materia/parcial para gráficas
 * @param {string} grupoId - ID del grupo
 * @param {string} materiaId - ID de la materia
 * @param {string} parcial - Parcial (P1, P2, P3)
 * @returns {Object} { calificaciones, loading, error, promedio, aprobados, reprobados }
 */
export function useDesempenoGrupal(grupoId, materiaId, parcial) {
    const [calificaciones, setCalificaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadCalificaciones() {
            if (!grupoId || !materiaId || !parcial) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                console.log(`[useDesempenoGrupal] Fetching: grupoId=${grupoId}, materiaId=${materiaId}, parcial=${parcial}`);
                const data = await fetchCalificacionesGrupoParcial(grupoId, materiaId, parcial);
                console.log(`[useDesempenoGrupal] Received ${data.length} calificaciones:`, data);
                setCalificaciones(data);
                setError(null);
            } catch (err) {
                console.error("[useDesempenoGrupal] Error al cargar calificaciones:", err);
                setError("Error al cargar las calificaciones");
                setCalificaciones([]);
            } finally {
                setLoading(false);
            }
        }

        loadCalificaciones();
    }, [grupoId, materiaId, parcial]);

    // Calcular estadísticas
    const calificacionesValidas = calificaciones.filter(c => c.calificacion !== null);

    const promedio = calificacionesValidas.length > 0
        ? (calificacionesValidas.reduce((sum, c) => sum + c.calificacion, 0) / calificacionesValidas.length).toFixed(1)
        : "0.0";

    const aprobados = calificacionesValidas.filter(c => c.calificacion >= 6).length;
    const reprobados = calificacionesValidas.filter(c => c.calificacion < 6).length;

    return {
        calificaciones,
        loading,
        error,
        promedio,
        aprobados,
        reprobados
    };
}
