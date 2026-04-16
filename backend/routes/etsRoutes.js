import express from 'express';
import {ETS} from '../models/ETS.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const ets = await ETS.find();
        res.status(200).json(ets);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener ETS' });
    }
});


router.get('/materia/:idMateria', async (req, res) => {
    try {
        const ets = await ETS.find({ idMateria: req.params.idMateria });
        res.status(200).json(ets);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener ETS' });
    }
});

/**
 * @ROUTE GET /profesor/:idProfesor
 * @DESCRIPTION Obtiene todos los ETS asignados a un profesor con información completa
 */
router.get('/profesor/:idProfesor', async (req, res) => {
    try {
        const { idProfesor } = req.params;
        
        // Buscar todos los ETS del profesor con populate
        const etsProfesor = await ETS.find({ idProfesor: idProfesor })
            .populate({
                path: 'idMateria',
                model: 'Materia',
                select: 'nombre clave creditos semestre'
            })
            .populate({
                path: 'idDiaSemana',
                model: 'DiaSemana',
                select: 'dia horarioInicio horarioFinal'
            })
            .lean();

        // Formatear respuesta
        const etsFormateados = etsProfesor.map(ets => ({
            idETS: ets._id,
            materia: {
                id: ets.idMateria?._id,
                nombre: ets.idMateria?.nombre || 'N/A',
                clave: ets.idMateria?.clave || 'N/A',
                creditos: ets.idMateria?.creditos || 0,
                semestre: ets.idMateria?.semestre || 0
            },
            horario: {
                dia: ets.idDiaSemana?.dia || 'N/A',
                inicio: ets.idDiaSemana?.horarioInicio || 'N/A',
                fin: ets.idDiaSemana?.horarioFinal || 'N/A'
            },
            salon: ets.salon || 'N/A'
        }));

        res.status(200).json(etsFormateados);
    } catch (error) {
        console.error('Error al obtener ETS del profesor:', error);
        res.status(500).json({ 
            error: 'Error al obtener ETS del profesor',
            detalle: error.message 
        });
    }
});

/**
 * @ROUTE GET /:idETS/alumnos-inscritos
 * @DESCRIPTION Obtiene todos los alumnos inscritos a un ETS específico con sus calificaciones
 */
router.get('/:idETS/alumnos-inscritos', async (req, res) => {
    try {
        const { idETS } = req.params;
        
        console.log(`🔍 Buscando inscripciones para ETS: ${idETS}`);
        
        // Importar modelos necesarios
        const { InscripcionETS } = await import('../models/InscripcionETS.js');
        const { CalificacionETS } = await import('../models/CalificacionETS.js');
        const { Inscripcion } = await import('../models/Inscripcion.js');
        const { Usuario } = await import('../models/Usuario.js');
        
        // Buscar todas las inscripciones a este ETS
        const inscripciones = await InscripcionETS.find({ idETS: idETS }).lean();
        
        console.log(`📋 Total de inscripciones encontradas: ${inscripciones.length}`);
        
        if (inscripciones.length === 0) {
            console.log('✅ No hay inscripciones para este ETS');
            return res.status(200).json([]);
        }

        // Procesar cada inscripción individualmente con manejo de errores
        const alumnosInscritos = await Promise.all(
            inscripciones.map(async (inscETS) => {
                try {
                    console.log(`🔍 Procesando InscripcionETS: ${inscETS._id}`);
                    
                    // Buscar la inscripción completa
                    const inscripcion = await Inscripcion.findById(inscETS.idInscripcion)
                        .populate('idAlumno')
                        .lean();
                    
                    if (!inscripcion) {
                        console.warn(`⚠️ No se encontró Inscripcion para ID: ${inscETS.idInscripcion}`);
                        return null;
                    }
                    
                    if (!inscripcion.idAlumno) {
                        console.warn(`⚠️ La Inscripcion ${inscETS.idInscripcion} no tiene alumno asociado`);
                        return null;
                    }
                    
                    const alumno = inscripcion.idAlumno;
                    console.log(`✅ Alumno encontrado: ${alumno.nombre}`);
                    
                    // Extraer boleta correctamente
                    let boleta = 'N/A';
                    if (alumno.dataAlumno) {
                        boleta = alumno.boleta || 'N/A';
                    }
                    
                    // Buscar calificación existente
                    const calificacionExistente = await CalificacionETS.findOne({
                        idInscripcionETS: inscETS._id
                    }).lean();
                    
                    return {
                        idInscripcionETS: inscETS._id,
                        idAlumno: alumno._id,
                        boleta: boleta,
                        nombre: alumno.nombre || 'N/A',
                        correo: alumno.correo || 'N/A',
                        calificacion: calificacionExistente ? calificacionExistente.valor : null,
                        tieneCalificacion: !!calificacionExistente
                    };
                } catch (err) {
                    console.error(`❌ Error procesando inscripción ${inscETS._id}:`, err.message);
                    return null;
                }
            })
        );

        // Filtrar los null (inscripciones con errores)
        const alumnosFiltrados = alumnosInscritos.filter(a => a !== null);
        
        console.log(`✅ Total de alumnos válidos: ${alumnosFiltrados.length}`);

        // Ordenar por boleta - convertir a string para evitar errores
        alumnosFiltrados.sort((a, b) => {
            const boletaA = String(a.boleta || 'N/A');
            const boletaB = String(b.boleta || 'N/A');
            
            if (boletaA === 'N/A') return 1;
            if (boletaB === 'N/A') return -1;
            return boletaA.localeCompare(boletaB);
        });

        res.status(200).json(alumnosFiltrados);
    } catch (error) {
        console.error('❌ Error al obtener alumnos inscritos al ETS:', error);
        res.status(500).json({ 
            error: 'Error al obtener alumnos inscritos',
            detalle: error.message 
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const ets = await ETS.findById(req.params.id);
        if (!ets) {
            return res.status(404).json({ error: 'ETS no encontrado' });
        }
        res.status(200).json(ets);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener ETS' });
    }
});

router.post('/', async (req, res) => {
    try {
        const newETS = new ETS(req.body);
        const savedETS = await newETS.save();
        res.status(201).json(savedETS);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear ETS' });
    }
});


router.put('/:id', async (req, res) => {
    try {
        const updatedETS = await ETS.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedETS) {
            return res.status(404).json({ error: 'ETS no encontrado' });
        }
        res.status(200).json(updatedETS);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar ETS' });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const deletedETS = await ETS.findByIdAndDelete(req.params.id);
        if (!deletedETS) {
            return res.status(404).json({ error: 'ETS no encontrado' });
        }
        res.status(200).json({ message: 'ETS eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar ETS' });
    }
});


export default router;