const KEY = "ocupabilidad_inscritos_v1";

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
function getAll() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { return {}; }
}
function saveAll(map) { localStorage.setItem(KEY, JSON.stringify(map)); }

export function getInscritos(claseId, capacidad = 35) {
  const map = getAll();
  if (map[claseId] == null) {
    const seed = Array.from(String(claseId)).reduce((a, c) => a + c.charCodeAt(0), 0);
    const base = 0.4 + seededRandom(seed) * 0.45; // 40%–85%
    const inicial = Math.min(capacidad - 1, Math.max(0, Math.round(capacidad * base)));
    map[claseId] = inicial;
    saveAll(map);
  }
  return map[claseId];
}
export function setInscritos(claseId, value) {
  const map = getAll();
  map[claseId] = Math.max(0, value);
  saveAll(map);
}
export function inscribirme(claseId, capacidad = 35) {
  const actual = getInscritos(claseId, capacidad);
  const nuevo = Math.min(capacidad, actual + 1);
  setInscritos(claseId, nuevo);
  return nuevo;
}