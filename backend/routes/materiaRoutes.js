import express from 'express';
import { Materia } from '../models/Materia.js'; // Ajusta la ruta si es necesario

const router = express.Router();

// --- Rutas CRUD para Materias --- //


router.get('/', async (req, res) => {
    try {
        const materias = await Materia.find()
            .populate('prerrequisitos', 'clave nombre'); // Traer clave y nombre de las materias prerrequisito
        res.status(200).json(materias);
    } catch (error) {
        console.error("Error al obtener las materias:", error);
        res.status(500).json({ error: 'Error al obtener las materias', detalle: error.message });
    }
});


router.get('/:id', async (req, res) => {
    try {
        const materia = await Materia.findById(req.params.id)
            .populate('prerrequisitos', 'clave nombre');
            
        if (!materia) {
            return res.status(404).json({ error: 'Materia no encontrada' });
        }
        res.status(200).json(materia);
    } catch (error) {
        console.error("Error al obtener la materia:", error);
        res.status(500).json({ error: 'Error al obtener la materia', detalle: error.message });
    }
});


router.post('/', async (req, res) => {
    try {
        const materia = new Materia(req.body);
        const savedMateria = await materia.save();
        res.status(201).json(savedMateria);
    } catch (error) {
        console.error("Error al crear la materia:", error);

        // Mongoose Validation Error (ej. campos requeridos, min en creditos)
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Error de validación al crear la materia', detalle: error.message });
        }
        // Duplicate Key Error (índice único en 'clave')
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Clave duplicada', detalle: 'La clave de materia ya existe.' });
        }
        
        res.status(500).json({ error: 'Error interno al crear la materia', detalle: error.message });
    }
});


router.put('/:id', async (req, res) => {
    try {
        const updatedMateria = await Materia.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true } // Ejecutar validadores para 'min'
        );

        if (!updatedMateria) {
            return res.status(404).json({ error: 'Materia no encontrada' });
        }
        res.status(200).json(updatedMateria);
    } catch (error) {
        console.error("Error al actualizar la materia:", error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Error de validación al actualizar la materia', detalle: error.message });
        }
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Clave duplicada', detalle: 'La clave de materia ya existe en otro documento.' });
        }

        res.status(500).json({ error: 'Error al actualizar la materia', detalle: error.message });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const deletedMateria = await Materia.findByIdAndDelete(req.params.id);
        if (!deletedMateria) {
            return res.status(404).json({ error: 'Materia no encontrada' });
        }
        res.status(200).json({ message: 'Materia eliminada correctamente' });
    } catch (error) {
        console.error("Error al eliminar la materia:", error);
        res.status(500).json({ error: 'Error al eliminar la materia', detalle: error.message });
    }
});

export default router;