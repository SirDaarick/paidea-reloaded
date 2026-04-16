import express from 'express';
import { PeriodoAcademico } from '../models/PeriodoAcademico.js';

const router = express.Router();
// Obtener todos los períodos académicos
router.get('/', async (req, res) => {
    try {
        const periodosAcademicos = await PeriodoAcademico.find();
        res.status(200).json(periodosAcademicos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener periódos académicos' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const periodoAcademico = await PeriodoAcademico.findById(req.params.id);
        if (!periodoAcademico) {
            return res.status(404).json({ error: 'Período académico no encontrado' });
        }
        res.status(200).json(periodoAcademico);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener periódos académicos' });
    }
});


// Crear un nuevo período académico
router.post('/', async (req, res) => {
    try {
        const periodoAcademico = new PeriodoAcademico(req.body);
        const savedPeriodoAcademico = await periodoAcademico.save();
        res.status(201).json(savedPeriodoAcademico);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear periódos académicos' });
    }
});

// Actualizar un período académico por ID
router.put('/:id', async (req, res) => {
    try {
        const updatedPeriodoAcademico = await PeriodoAcademico.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedPeriodoAcademico) {
            return res.status(404).json({ error: 'Período académico no encontrado' });
        }
        res.status(200).json(updatedPeriodoAcademico);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar periódos académicos' });
    }
});

// Eliminar un período académico por ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedPeriodoAcademico = await PeriodoAcademico.findByIdAndDelete(req.params.id);
        if (!deletedPeriodoAcademico) {
            return res.status(404).json({ error: 'Período académico no encontrado' });
        }
        res.status(200).json({ message: 'Período académico eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar periódos académicos' });
    }
});

export default router;