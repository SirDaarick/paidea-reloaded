import express from "express";
import { DiaSemana } from "../models/DiaSemana.js";

const router = express.Router();

// --- Rutas CRUD para Días de la Semana --- //

router.get("/", async (req, res) => {
    try {
        const diasSemana = await DiaSemana.find();
        res.status(200).json(diasSemana);
    } catch (error) {
        console.error("Error al obtener los días de la semana:", error);
        res.status(500).json({ error: "Error al obtener los días de la semana", detalle: error.message });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const diaSemana = await DiaSemana.findById(req.params.id);
        if (!diaSemana) {
            return res.status(404).json({ error: "Día de la semana no encontrado" });
        }
        res.status(200).json(diaSemana);
    } catch (error) {
        console.error("Error al obtener el día de la semana:", error);
        res.status(500).json({ error: "Error al obtener el día de la semana", detalle: error.message });
    }
});


router.post("/", async (req, res) => {
    try {
        const diaSemana = new DiaSemana(req.body);
        const savedDiaSemana = await diaSemana.save();
        res.status(201).json(savedDiaSemana);
    } catch (error) {
        console.error("Error al crear el día de la semana:", error);
        res.status(500).json({ error: "Error al crear el día de la semana", detalle: error.message });
    }
});


router.put("/:id", async (req, res) => {
    try {
        const updatedDiaSemana = await DiaSemana.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedDiaSemana) {
            return res.status(404).json({ error: "Día de la semana no encontrado" });
        }
        res.status(200).json(updatedDiaSemana);
    } catch (error) {
        console.error("Error al actualizar el día de la semana:", error);
        res.status(500).json({ error: "Error al actualizar el día de la semana", detalle: error.message });
    }
});


router.delete("/:id", async (req, res) => {
    try {
        const deletedDiaSemana = await DiaSemana.findByIdAndDelete(req.params.id);
        if (!deletedDiaSemana) {
            return res.status(404).json({ error: "Día de la semana no encontrado" });
        }
        res.status(200).json({ message: "Día de la semana eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar el día de la semana:", error);
        res.status(500).json({ error: "Error al eliminar el día de la semana", detalle: error.message });
    }
});

export default router;