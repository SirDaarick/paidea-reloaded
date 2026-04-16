// frontend/src/hooks/useSolicitudes.js
import { useState, useEffect, useCallback } from 'react';

const API_URL = 'http://localhost:3001';

// ========== HOOK PRINCIPAL: LISTAR SOLICITUDES ==========
export const useSolicitudes = (filtros = {}) => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarSolicitudes = useCallback(async () => {
    if (!filtros) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.tipoTramite) params.append('tipoTramite', filtros.tipoTramite);
      if (filtros.idAlumno) params.append('idAlumno', filtros.idAlumno);
      if (filtros.desde) params.append('desde', filtros.desde);
      if (filtros.hasta) params.append('hasta', filtros.hasta);

      const url = `${API_URL}/solicitud${params.toString() ? `?${params}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Error al cargar solicitudes');
      }

      const data = await response.json();
      setSolicitudes(data);
    } catch (err) {
      console.error('Error cargando solicitudes:', err);
      setError(err.message);
      setSolicitudes([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filtros)]);

  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes]);

  return {
    solicitudes,
    loading,
    error,
    refetch: cargarSolicitudes
  };
};

// ========== HOOK: SOLICITUDES DE UN ALUMNO ==========
export const useSolicitudesAlumno = (idAlumno) => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      if (!idAlumno) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_URL}/solicitud/alumno/${idAlumno}`);

        if (!response.ok) {
          throw new Error('Error al cargar solicitudes del alumno');
        }

        const data = await response.json();
        setSolicitudes(data);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
        setSolicitudes([]);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [idAlumno]);

  return { solicitudes, loading, error };
};

// ========== HOOK: CREAR SOLICITUD ==========
export const useCrearSolicitud = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const crear = async (solicitudData, archivo = null) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const formData = new FormData();
      formData.append('idAlumno', solicitudData.idAlumno);
      formData.append('tipoTramite', solicitudData.tipoTramite);
      
      if (solicitudData.comentarioAlumno) {
        formData.append('comentarioAlumno', solicitudData.comentarioAlumno);
      }

      if (archivo) {
        formData.append('archivo', archivo);
      }

      const response = await fetch(`${API_URL}/solicitud`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear solicitud');
      }

      const data = await response.json();
      setSuccess(true);
      return data;
    } catch (err) {
      console.error('Error creando solicitud:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { crear, loading, error, success };
};

// ========== HOOK: ACTUALIZAR SOLICITUD (ADMIN) ==========
export const useActualizarSolicitud = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const actualizar = async (solicitudId, updateData, documento = null) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const formData = new FormData();
      
      if (updateData.estado) formData.append('estado', updateData.estado);
      if (updateData.comentarioAdmin !== undefined) {
        formData.append('comentarioAdmin', updateData.comentarioAdmin);
      }
      if (updateData.requierePresencia !== undefined) {
        formData.append('requierePresencia', updateData.requierePresencia);
      }
      if (updateData.fechaCita) formData.append('fechaCita', updateData.fechaCita);
      if (updateData.motivoRechazo) formData.append('motivoRechazo', updateData.motivoRechazo);
      if (updateData.procesadoPor) formData.append('procesadoPor', updateData.procesadoPor);

      if (documento) {
        formData.append('documentoGenerado', documento);
      }

      const response = await fetch(`${API_URL}/solicitud/${solicitudId}`, {
        method: 'PUT',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar solicitud');
      }

      const data = await response.json();
      setSuccess(true);
      return data;
    } catch (err) {
      console.error('Error actualizando solicitud:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { actualizar, loading, error, success };
};

// ========== HOOK: ELIMINAR SOLICITUD ==========
export const useEliminarSolicitud = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const eliminar = async (solicitudId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/solicitud/${solicitudId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar solicitud');
      }

      return true;
    } catch (err) {
      console.error('Error eliminando solicitud:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { eliminar, loading, error };
};

// ========== HOOK: ESTADÍSTICAS (ADMIN) ==========
export const useEstadisticasSolicitudes = () => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_URL}/solicitud/admin/estadisticas`);

        if (!response.ok) {
          throw new Error('Error al cargar estadísticas');
        }

        const data = await response.json();
        setEstadisticas(data);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  return { estadisticas, loading, error };
};