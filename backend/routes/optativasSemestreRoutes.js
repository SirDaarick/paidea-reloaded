import express from 'express';
import { OptativasSemestre } from '../models/OptativasSemestre.js';

const router = express.Router();

// --- Rutas CRUD para Optativas por Semestre --- //

router.get('/', async (req, res) => {
    try {
        const optativasSemestre = await OptativasSemestre.find();
        res.status(200).json(optativasSemestre);
    } catch (error) {
        console.error("Error al obtener las optativas por semestre:", error);
        res.status(500).json({ error: 'Error al obtener las optativas por semestre', detalle: error.message });
    }
})

router.get('/:id', async (req, res) => {
    try {
        const optativaSemestre = await OptativasSemestre.findById(req.params.id);
        if (!optativaSemestre) {
            return res.status(404).json({ error: 'Optativa por semestre no encontrada' });
        }
        res.status(200).json(optativaSemestre);
    } catch (error) {
        console.error("Error al obtener la optativa por semestre:", error);
        res.status(500).json({ error: 'Error al obtener la optativa por semestre', detalle: error.message });
    }
})

router.post('/', async (req, res) => {
    try {
        const optativaSemestre = new OptativasSemestre(req.body);
        const savedOptativaSemestre = await optativaSemestre.save();
        res.status(201).json(savedOptativaSemestre);
    } catch (error) {
        console.error("Error al crear la optativa por semestre:", error);

        // Mongoose Validation Error (ej. campos requeridos)
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Error de validación al crear la optativa por semestre', detalle: error.message });
        }
        
        res.status(500).json({ error: 'Error interno al crear la optativa por semestre', detalle: error.message });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const updatedOptativaSemestre = await OptativasSemestre.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true } // Ejecutar validadores para 'min'
        );

        if (!updatedOptativaSemestre) {
            return res.status(404).json({ error: 'Optativa por semestre no encontrada' });
        }
        res.status(200).json(updatedOptativaSemestre);
    } catch (error) {
        console.error("Error al actualizar la optativa por semestre:", error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Error de validación al actualizar la optativa por semestre', detalle: error.message });
        }
        
        res.status(500).json({ error: 'Error al actualizar la optativa por semestre', detalle: error.message });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const deletedOptativaSemestre = await OptativasSemestre.findByIdAndDelete(req.params.id);
        if (!deletedOptativaSemestre) {
            return res.status(404).json({ error: 'Optativa por semestre no encontrada' });
        }
        res.status(200).json({ message: 'Optativa por semestre eliminada correctamente' });
    } catch (error) {
        console.error("Error al eliminar la optativa por semestre:", error);
        res.status(500).json({ error: 'Error al eliminar la optativa por semestre', detalle: error.message });
    }
});

export default router;