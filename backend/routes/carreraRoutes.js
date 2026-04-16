import express from 'express';
import { Carrera } from '../models/Carrera.js';

const router = express.Router();

// Obtener todas las carreras
router.get('/', async (req, res) => {
    try {
        const carreras = await Carrera.find();
        res.status(200).json(carreras);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener carreras' });
    }
});

// Obtener una carrera por ID
router.get('/:id', async (req, res) => {
    try {
        const carrera = await Carrera.findById(req.params.id);
        if (!carrera) {
            return res.status(404).json({ error: 'Carrera no encontrada' });
        }
        res.status(200).json(carrera);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener carrera' });
    }
});

// Crear una nueva carrera
router.post('/', async (req, res) => {
    try {
        const carrera = new Carrera(req.body);
        const savedCarrera = await carrera.save();
        res.status(201).json(savedCarrera);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear carrera' });
    }
});

// Actualizar una carrera por ID
router.put('/:id', async (req, res) => {
    try {
        const updatedCarrera = await Carrera.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedCarrera) {
            return res.status(404).json({ error: 'Carrera no encontrada' });
        }
        res.status(200).json(updatedCarrera);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar carrera' });
    }
});

// Eliminar una carrera por ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedCarrera = await Carrera.findByIdAndDelete(req.params.id);
        if (!deletedCarrera) {
            return res.status(404).json({ error: 'Carrera no encontrada' });
        }
        res.status(200).json({ message: 'Carrera eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar carrera' });
    }
});

export default router;