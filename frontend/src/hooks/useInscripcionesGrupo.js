import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:3001";

/**
 * Hook para obtener inscripciones de un grupo específico
 * @param {string} grupoId - ID del grupo
 * @returns {Object} { inscripciones, loading, error }
 */
export function useInscripcionesGrupo(grupoId) {
    const [inscripciones, setInscripciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadInscripciones() {
            if (!grupoId) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const response = await axios.get(`${API_URL}/inscripcion/grupo/${grupoId}`);
                setInscripciones(response.data || []);
                setError(null);
            } catch (err) {
                console.error("Error al cargar inscripciones:", err);
                setError("Error al cargar las inscripciones del grupo");
                setInscripciones([]);
            } finally {
                setLoading(false);
            }
        }
        loadInscripciones();
    }, [grupoId]);

    return { inscripciones, loading, error };
}

/**
 * Hook para obtener estudiantes de un grupo/materia
 * Útil para cargar la tabla de calificaciones/asistencias
 * @param {string} grupoId - ID del grupo
 * @param {string} materiaId - ID de la materia
 * @returns {Object} { estudiantes, loading, error }
 */
export function useEstudiantesGrupo(grupoId, materiaId) {
    const [estudiantes, setEstudiantes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadEstudiantes() {
            if (!grupoId || !materiaId) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                // Buscar inscripciones clase para esa combinación grupo/materia
                const response = await axios.get(`${API_URL}/inscripcionClase`, {
                    params: { grupoId, materiaId }
                });

                const estudiantesData = response.data.map(ic => ({
                    inscripcionClaseId: ic._id,
                    boleta: ic.idInscripcion?.idAlumno?.boleta || "N/A",
                    nombre: ic.idInscripcion?.idAlumno?.nombre || "Estudiante",
                    correo: ic.idInscripcion?.idAlumno?.correo || "N/A",
                }));

                setEstudiantes(estudiantesData);
                setError(null);
            } catch (err) {
                console.error("Error al cargar estudiantes:", err);
                setError("Error al cargar los estudiantes del grupo");
                setEstudiantes([]);
            } finally {
                setLoading(false);
            }
        }
        loadEstudiantes();
    }, [grupoId, materiaId]);

    return { estudiantes, loading, error };
}
