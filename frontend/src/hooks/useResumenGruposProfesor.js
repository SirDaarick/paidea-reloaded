import { useEffect, useState } from "react";
import { fetchResumenGruposProfesor } from "../services/api";

/**
 * Hook para obtener resumen de calificaciones de todos los grupos de un profesor
 * @param {string} profesorId - ID del profesor
 * @returns {Object} { resumenGrupos, loading, error, aprobadosTotales, reprobadosTotales }
 */
export function useResumenGruposProfesor(profesorId) {
    const [resumenGrupos, setResumenGrupos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadResumen() {
            if (!profesorId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const data = await fetchResumenGruposProfesor(profesorId);
                setResumenGrupos(data);
                setError(null);
            } catch (err) {
                console.error("Error al cargar resumen de grupos:", err);
                setError("Error al cargar el resumen");
                setResumenGrupos([]);
            } finally {
                setLoading(false);
            }
        }

        loadResumen();
    }, [profesorId]);

    // Calcular estadísticas totales
    let aprobadosTotales = 0;
    let reprobadosTotales = 0;

    resumenGrupos.forEach(grupo => {
        grupo.alumnos?.forEach(alumno => {
            [alumno.p1, alumno.p2, alumno.p3].forEach(calificacion => {
                if (calificacion !== null && calificacion !== undefined) {
                    if (calificacion >= 6) {
                        aprobadosTotales++;
                    } else {
                        reprobadosTotales++;
                    }
                }
            });
        });
    });

    return {
        resumenGrupos,
        loading,
        error,
        aprobadosTotales,
        reprobadosTotales
    };
}
