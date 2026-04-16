import express from 'express';
import { PeriodoInscripcion } from '../models/PeriodoInscripcion.js';

const router = express.Router();

// ===============================
// DEBUG
// ===============================
router.get("/debug", (req, res) => {
  res.json({ ok: true, mensaje: "Ruta periodoInscripcion viva" });
});

// ==========================================
// PERIODO ACTIVO DE REINSCRIPCIÓN (POR FECHA)
// ==========================================
router.get("/activo/reinscripcion", async (req, res) => {
  try {
    const ahora = new Date();

    const periodo = await PeriodoInscripcion.findOne({
      tipo: { $regex: /^reinscripcion$/i },
      fechaInicio: { $lte: ahora },
      fechaFinal: { $gte: ahora }
    })
      .populate("idPeriodoAcademico")
      .lean();

    if (!periodo) {
      return res.status(200).json(null);
    }

    res.status(200).json(periodo);

  } catch (error) {
    console.error("❌ Error validando periodo:", error);
    res.status(500).json({
      error: "Error al obtener periodo de inscripción",
      detalle: error.message
    });
  }
});

// ===========================
// CRUD
// ===========================
router.get('/', async (req, res) => {
  const periodos = await PeriodoInscripcion.find()
    .populate("idPeriodoAcademico");
  res.json(periodos);
});

router.get('/:id', async (req, res) => {
  const periodo = await PeriodoInscripcion.findById(req.params.id)
    .populate("idPeriodoAcademico");
  res.json(periodo);
});

router.post("/", async (req, res) => {
  try {
    const { idPeriodoAcademico, tipo, fechaInicio, fechaFinal } = req.body;

    if (!idPeriodoAcademico || !tipo || !fechaInicio || !fechaFinal) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const nuevo = await PeriodoInscripcion.create({
      idPeriodoAcademico,
      tipo,
      fechaInicio,
      fechaFinal
    });

    res.status(201).json(nuevo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear periodo" });
  }
});

router.put('/:id', async (req, res) => {
  const actualizado = await PeriodoInscripcion.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(actualizado);
});

router.delete('/:id', async (req, res) => {
  await PeriodoInscripcion.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
