import { useEffect, useState, useCallback } from "react";
import { fetchClases } from "../services/api";
import { getInscritos, inscribirme } from "../services/occupancyStore";

function colorDeOcupacion(p, thresholds = { warn: 0.7, danger: 0.9 }) {
  if (p >= thresholds.danger) return "rojo";
  if (p >= thresholds.warn) return "amarillo";
  return "verde";
}

export function useScheduleData(filtros) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchClases(filtros || {});
    const withOcc = data.map((c) => {
      const inscritos = getInscritos(c.claseId, c.capacidad);
      const ocup = Math.min(1, inscritos / c.capacidad);
      return { ...c, inscritos, ocup, estado: colorDeOcupacion(ocup) };
    });
    setRows(withOcc);
    setLoading(false);
  }, [JSON.stringify(filtros)]); // dependemos de filtros

  function onInscribirme(claseId) {
    const row = rows.find((r) => r.claseId === claseId);
    if (!row) return;
    const nuevos = inscribirme(claseId, row.capacidad);
    const ocup = Math.min(1, nuevos / row.capacidad);
    const estado = ocup >= 0.9 ? "rojo" : ocup >= 0.7 ? "amarillo" : "verde";
    setRows((prev) =>
      prev.map((r) => (r.claseId === claseId ? { ...r, inscritos: nuevos, ocup, estado } : r))
    );
  }

  useEffect(() => { load(); }, [load]);

  return { rows, loading, onInscribirme };
}