import express from 'express';
import { CalificacionETS } from '../models/CalificacionETS.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const calificaciones = await CalificacionETS.find();
        res.status(200).json(calificaciones);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener calificaciones ETS' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const calificacion = await CalificacionETS.findById(req.params.id);
        if (!calificacion) {
            return res.status(404).json({ error: 'Calificación ETS no encontrada' });
        }
        res.status(200).json(calificacion);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener calificación ETS' });
    }
});

/**
 * @ROUTE GET /inscripcionETS/:idInscripcionETS
 * @DESCRIPTION Obtiene la calificación de una inscripción ETS específica
 */
router.get('/inscripcionETS/:idInscripcionETS', async (req, res) => {
    try {
        const calificacion = await CalificacionETS.findOne({ 
            idInscripcionETS: req.params.idInscripcionETS 
        });
        
        if (!calificacion) {
            return res.status(404).json({ error: 'Calificación no encontrada' });
        }
        
        res.status(200).json(calificacion);
    } catch (error) {
        res.status(500).json({ 
            error: 'Error al obtener calificación',
            detalle: error.message 
        });
    }
});

router.post('/', async (req, res) => {
    try {
        const newCalificacion = new CalificacionETS(req.body);
        const savedCalificacion = await newCalificacion.save();
        res.status(201).json(savedCalificacion);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear calificación ETS' });
    }
});

/**
 * @ROUTE POST /guardar-lote
 * @DESCRIPTION Guarda o actualiza múltiples calificaciones de ETS en una sola operación
 * Body: { calificaciones: [{ idInscripcionETS, valor }, ...] }
 */
router.post('/guardar-lote', async (req, res) => {
    try {
        const { calificaciones } = req.body;
        
        if (!calificaciones || !Array.isArray(calificaciones)) {
            return res.status(400).json({ 
                error: 'Se requiere un array de calificaciones' 
            });
        }

        const resultados = {
            exitosos: 0,
            actualizados: 0,
            creados: 0,
            fallidos: 0,
            errores: []
        };

        for (const calif of calificaciones) {
            try {
                const { idInscripcionETS, valor } = calif;

                // Validar datos
                if (!idInscripcionETS || valor === undefined || valor === null) {
                    resultados.fallidos++;
                    resultados.errores.push({
                        idInscripcionETS,
                        error: 'Datos incompletos'
                    });
                    continue;
                }

                // Validar rango de calificación
                if (valor < 0 || valor > 10) {
                    resultados.fallidos++;
                    resultados.errores.push({
                        idInscripcionETS,
                        error: 'Calificación fuera de rango (0-10)'
                    });
                    continue;
                }

                // Buscar si ya existe una calificación
                const calificacionExistente = await CalificacionETS.findOne({ 
                    idInscripcionETS 
                });

                if (calificacionExistente) {
                    // Actualizar calificación existente
                    calificacionExistente.valor = valor;
                    calificacionExistente.fechaRegistro = new Date();
                    await calificacionExistente.save();
                    resultados.actualizados++;
                } else {
                    // Crear nueva calificación
                    const nuevaCalificacion = new CalificacionETS({
                        idInscripcionETS,
                        valor,
                        fechaRegistro: new Date()
                    });
                    await nuevaCalificacion.save();
                    resultados.creados++;
                }

                resultados.exitosos++;

            } catch (error) {
                resultados.fallidos++;
                resultados.errores.push({
                    idInscripcionETS: calif.idInscripcionETS,
                    error: error.message
                });
            }
        }

        res.status(200).json({
            mensaje: 'Proceso completado',
            resultados
        });

    } catch (error) {
        console.error('Error al guardar calificaciones en lote:', error);
        res.status(500).json({ 
            error: 'Error al guardar calificaciones',
            detalle: error.message 
        });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const updatedCalificacion = await CalificacionETS.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );
        
        if (!updatedCalificacion) {
            return res.status(404).json({ error: 'Calificación ETS no encontrada' });
        }
        
        res.status(200).json(updatedCalificacion);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar calificación ETS' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const deletedCalificacion = await CalificacionETS.findByIdAndDelete(req.params.id);
        
        if (!deletedCalificacion) {
            return res.status(404).json({ error: 'Calificación ETS no encontrada' });
        }
        
        res.status(200).json({ message: 'Calificación ETS eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar calificación ETS' });
    }
});

export default router;