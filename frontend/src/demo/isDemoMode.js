// src/demo/isDemoMode.js
// Fuente única de verdad para detectar el modo demostración mediante DEMO_MODE o VITE_DEMO_MODE.

export function isDemoActive() {
  // 1. Variable global inyectada en tiempo de compilación por Vite
  if (typeof __DEMO_MODE__ !== "undefined" && Boolean(__DEMO_MODE__)) {
    return true;
  }

  // 2. Variable estándar DEMO_MODE expuesta vía envPrefix
  const demoMode = import.meta.env?.DEMO_MODE;
  if (String(demoMode ?? "").toLowerCase() === "true" || demoMode === "1" || demoMode === 1) {
    return true;
  }

  // 3. Variable VITE_DEMO_MODE con prefijo Vite convencional
  const viteDemoMode = import.meta.env?.VITE_DEMO_MODE;
  if (String(viteDemoMode ?? "").toLowerCase() === "true" || viteDemoMode === "1" || viteDemoMode === 1) {
    return true;
  }

  return false;
}

export default isDemoActive;
