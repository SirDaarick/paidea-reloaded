import express from "express";
import { PeriodoAcademico } from "../models/PeriodoAcademico.js";
import { PeriodoInscripcion } from "../models/PeriodoInscripcion.js";
//
const router = express.Router();

/**
 * Crear periodo académico + periodo de inscripción
 */
router.post("/", async (req, res) => {
  try {
    const {
      periodoEscolar,
      tipo,
      fechaInicio,
      fechaFinal
    } = req.body;

    if (!periodoEscolar || !tipo || !fechaInicio || !fechaFinal) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    // 1️⃣ Buscar o crear periodo académico
    let periodoAcademico = await PeriodoAcademico.findOne({
      nombre: periodoEscolar
    });

    if (!periodoAcademico) {
      periodoAcademico = await PeriodoAcademico.create({
        nombre: periodoEscolar,
        fechaInicio,
        fechaFinal
      });
    }

    // 2️⃣ Crear periodo de inscripción
    const periodoInscripcion = await PeriodoInscripcion.create({
      tipo,
      fechaInicio,
      fechaFinal,
      idPeriodoAcademico: periodoAcademico._id
    });

    res.status(201).json({
      periodoAcademico,
      periodoInscripcion
    });

  } catch (error) {
    console.error("❌ Error creando periodo completo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
