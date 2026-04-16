import express from 'express';
import { InscripcionETS } from '../models/InscripcionETS.js';


const router = express.Router();

// --- Rutas CRUD para Inscripciones ETS --- //

// Obtener todas las inscripciones ETS
router.get('/', async (req, res) => {
    try {
        const inscripcionesETS = await InscripcionETS.find();
        res.status(200).json(inscripcionesETS);
    } catch (error) {
        console.error("Error al obtener las inscripciones ETS:", error);
        res.status(500).json({ error: 'Error al obtener las inscripciones ETS', detalle: error.message });
    }
});


// Obtener por inscripción
router.get('/inscripcion/:idInscripcion', async (req, res) => {
    try {
        const inscripciones = await InscripcionETS.find({ idInscripcion: req.params.idInscripcion })
            .populate('idETS');
        res.status(200).json(inscripciones);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener inscripciones ETS', detalle: error.message });
    }
});

// Obtener una inscripcion ETS por ID
router.get('/:id', async (req, res) => {
    try {
        const inscripcionETS = await InscripcionETS.findById(req.params.id);
        if (!inscripcionETS) {
            return res.status(404).json({ error: 'Inscripción ETS no encontrada' });
        }
        res.status(200).json(inscripcionETS);
    } catch (error) {
        console.error("Error al obtener la inscripción ETS:", error);
        res.status(500).json({ error: 'Error al obtener la inscripción ETS', detalle: error.message });
    }
});

// Crear una nueva inscripcion ETS
router.post('/', async (req, res) => {
    try {
        const inscripcionETS = new InscripcionETS(req.body);
        const savedInscripcionETS = await inscripcionETS.save();
        res.status(201).json(savedInscripcionETS);
    } catch (error) {
        console.error("Error al crear la inscripción ETS:", error);
        res.status(500).json({ error: 'Error al crear la inscripción ETS', detalle: error.message });
    }
});


// Eliminar una inscripcion ETS por ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedInscripcionETS = await InscripcionETS.findByIdAndDelete(req.params.id);
        if (!deletedInscripcionETS) {
            return res.status(404).json({ error: 'Inscripción ETS no encontrada' });
        }
        res.status(200).json({ message: 'Inscripción ETS eliminada correctamente' });
    } catch (error) {
        console.error("Error al eliminar la inscripción ETS:", error);
        res.status(500).json({ error: 'Error al eliminar la inscripción ETS', detalle: error.message });
    }
});
export default router;