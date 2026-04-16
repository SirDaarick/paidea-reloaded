import express from "express";
import { getAlumnoOverview } from "../tools/alumnoTools.js";

const router = express.Router();

/*
  Petición desde FastAPI:
  {
    "user_id": "6900eacdb43948f952b92459",
    "query": "¿Cuál es mi promedio?"
  }
*/

router.post("/query", async (req, res) => {
  try {
    const { user_id, query } = req.body;

    if (!user_id || !query) {
      return res.status(400).json({ message: "user_id y query son obligatorios" });
    }

    // Aquí no respondemos — solo enviamos la info a FastAPI
    // FastAPI hace la parte del LLM, LangChain y embeddings
    const alumnoData = await getAlumnoOverview(user_id);

    return res.json({
      ok: true,
      message: "Datos enviados correctamente al agente",
      data: alumnoData
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error en agentRoutes", error });
  }
});

export default router;