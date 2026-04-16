import { useEffect } from "react";
const API_URL = "https://paidea.onrender.com";

async function apiCall(endpoint, method = "GET", body = null) {
  const options = { method, headers: {} };

  if (body) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, options);
    const data = await res.json();

    if (!res.ok) {
      // Crear error con toda la información del servidor
      const error = new Error(data.message || data.mensaje || "Error en la API");
      error.response = {
        status: res.status,
        data: data // ⬅️ Aquí está el { error: "SIN_CITA", mensaje: "..." }
      };
      throw error;
    }

    return data;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export default apiCall;