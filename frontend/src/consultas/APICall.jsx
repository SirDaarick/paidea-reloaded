// src/consultas/APICall.jsx
const API_URL = import.meta.env?.VITE_API_URL ?? "";

async function apiCall(endpoint, method = "GET", body = null) {
  const headers = {};

  // Inyectar JWT automáticamente si existe en localStorage
  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = { method, headers };

  if (body) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  try {
    const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;
    const res = await fetch(url, options);
    
    // Si la respuesta es vacía (204 No Content)
    if (res.status === 204) {
      return null;
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.detail || data.message || data.mensaje || `Error en la API (${res.status})`;
      const error = new Error(typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg));
      error.response = {
        status: res.status,
        data: data,
      };
      throw error;
    }

    return data;
  } catch (err) {
    console.error(`[APICall] Error en ${method} ${endpoint}:`, err);
    throw err;
  }
}

export default apiCall;