import express from 'express';
import { Clase } from '../models/Clase.js'; // Ajusta la ruta si es necesario

const router = express.Router();

// --- Rutas CRUD para Clases --- //

/**
 * @ROUTE GET /
 * @DESCRIPTION Obtiene todas las clases, poblando referencias, incluyendo el detalle de los horarios.
 */
router.get('/', async (req, res) => {
    try {
        const clases = await Clase.find()
            .populate('idGrupo')
            .populate('idMateria')
            .populate('idProfesor', 'nombre correo')
            // Población del Horario Incrustado
            .populate('horario.lunes.idDia')
            .populate('horario.martes.idDia')
            .populate('horario.miercoles.idDia')
            .populate('horario.jueves.idDia')
            .populate('horario.viernes.idDia')
            .populate('horario.sabado.idDia');

        res.status(200).json(clases);
    } catch (error) {
        console.error("Error al obtener las clases:", error);
        res.status(500).json({ error: 'Error al obtener las clases', detalle: error.message });
    }
});


/**
 * @ROUTE GET /:id
 * @DESCRIPTION Obtiene una clase por su ID, poblando referencias, incluyendo el detalle de los horarios.
 */
router.get('/:id', async (req, res) => {
    try {
        const clase = await Clase.findById(req.params.id)
            .populate('idGrupo')
            .populate('idMateria')
            .populate('idProfesor', 'nombre correo')
            // Población del Horario Incrustado
            .populate('horario.lunes.idDia')
            .populate('horario.martes.idDia')
            .populate('horario.miercoles.idDia')
            .populate('horario.jueves.idDia')
            .populate('horario.viernes.idDia')
            .populate('horario.sabado.idDia');

        if (!clase) {
            return res.status(404).json({ error: 'Clase no encontrada' });
        }
        res.status(200).json(clase);
    } catch (error) {
        console.error("Error al obtener la clase:", error);
        res.status(500).json({ error: 'Error al obtener la clase', detalle: error.message });
    }
});


/**
 * @ROUTE POST /
 * @DESCRIPTION Crea una nueva clase.
 * NOTA: El horario se debe incluir en req.body (ej: {..., horario: {lunes: {idDia: '...'}}})
 */
router.post('/', async (req, res) => {
    try {
        const clase = new Clase(req.body);
        const savedClase = await clase.save();
        res.status(201).json(savedClase);
    } catch (error) {
        console.error("Error al crear la clase:", error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Error de validación al crear la clase', detalle: error.message });
        }
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Clase duplicada', detalle: 'Ya existe una clase con esta Materia asignada a este Grupo.' });
        }

        res.status(500).json({ error: 'Error interno al crear la clase', detalle: error.message });
    }
});


/**
 * @ROUTE PUT /:id
 * @DESCRIPTION Actualiza una clase por su ID.
 * NOTA: Se puede actualizar el horario directamente con los campos de horario.
 */
router.put('/:id', async (req, res) => {
    try {
        const updatedClase = await Clase.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true } // Ejecutar validadores para 'min'
        );

        if (!updatedClase) {
            return res.status(404).json({ error: 'Clase no encontrada' });
        }
        res.status(200).json(updatedClase);
    } catch (error) {
        console.error("Error al actualizar la clase:", error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Error de validación al actualizar la clase', detalle: error.message });
        }
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Clase duplicada', detalle: 'Los cambios resultan en una clase duplicada (mismo Grupo y Materia).' });
        }

        res.status(500).json({ error: 'Error al actualizar la clase', detalle: error.message });
    }
});

// ✅ Obtener clases de un grupo específico
router.get('/grupo/:grupoId', async (req, res) => {
    try {
        const clases = await Clase.find({ idGrupo: req.params.grupoId })
            .populate('idGrupo')
            .populate('idMateria')
            .populate('idProfesor', 'nombre correo');
        res.status(200).json(clases);
    } catch (error) {
        console.error("Error al obtener clases del grupo:", error);
        res.status(500).json({ error: 'Error al obtener las clases', detalle: error.message });
    }
});


/**
 * @ROUTE DELETE /:id
 * @DESCRIPTION Elimina una clase por su ID.
 */
router.delete('/:id', async (req, res) => {
    try {
        const deletedClase = await Clase.findByIdAndDelete(req.params.id);
        if (!deletedClase) {
            return res.status(404).json({ error: 'Clase no encontrada' });
        }
        res.status(200).json({ message: 'Clase eliminada correctamente' });
    } catch (error) {
        console.error("Error al eliminar la clase:", error);
        res.status(500).json({ error: 'Error al eliminar la clase', detalle: error.message });
    }
});

export default router;