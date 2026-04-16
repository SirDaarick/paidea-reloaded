import express from 'express';
import mongoose from "mongoose";
import { Calificacion } from '../models/Calificacion.js';

mongoose.set('strictPopulate', false);

const router = express.Router();

// --- Rutas CRUD para Calificaciones --- //

// GET: Obtener todas las calificaciones
router.get('/', async (req, res) => {
    try {
        const calificaciones = await Calificacion.find()
            .populate({
                path: "idInscripcionClase",
                populate: [
                    {
                        path: "idInscripcion",
                        populate: { path: "idAlumno", select: "nombre correo dataAlumno" }
                    },
                    {
                        path: "idClase",
                        populate: [
                            { path: "idProfesor", select: "nombre correo" },
                            { path: "idMateria", select: "nombre clave" },
                            { path: "idDiaSemana", select: "dia horarioInicio horarioFinal" }
                        ]
                    }
                ]
            });

        res.status(200).json(calificaciones);
    } catch (error) {
        console.error("Error al obtener las calificaciones:", error);
        res.status(500).json({
            error: 'Error al obtener las calificaciones',
            detalle: error.message
        });
    }
});

// GET: Obtener una calificación por ID
router.get('/:id', async (req, res) => {
    try {
        const calificacion = await Calificacion.findById(req.params.id)
            .populate({
                path: 'idInscripcionClase',
                populate: [
                    {
                        path: 'idInscripcion',
                        populate: { path: "idAlumno", select: "nombre correo dataAlumno" }
                    },
                    {
                        path: 'idClase',
                        populate: [
                            { path: "idProfesor", select: "nombre correo" },
                            { path: "idMateria", select: "nombre clave" },
                            { path: "idDiaSemana", select: "dia" }
                        ]
                    }
                ]
            });

        if (!calificacion)
            return res.status(404).json({ error: 'Calificación no encontrada' });

        res.status(200).json(calificacion);
    } catch (error) {
        console.error("Error al obtener la calificación:", error);
        res.status(500).json({ error: 'Error al obtener la calificación', detalle: error.message });
    }
});

// GET: Obtener calificaciones por inscripción clase
router.get('/inscripcionClase/:idInscripcionClase', async (req, res) => {
    try {
        const calificaciones = await Calificacion.find({ idInscripcionClase: req.params.idInscripcionClase })
            .populate({
                path: 'idInscripcionClase',
                populate: [
                    {
                        path: 'idInscripcion',
                        populate: { path: "idAlumno", select: "nombre correo dataAlumno" }
                    },
                    {
                        path: 'idClase',
                        populate: [
                            { path: "idProfesor", select: "nombre correo" },
                            { path: "idMateria", select: "nombre clave" },
                            { path: "idDiaSemana", select: "dia" }
                        ]
                    }
                ]
            });

        res.status(200).json(calificaciones);
    } catch (error) {
        console.error("Error al obtener las calificaciones:", error);
        res.status(500).json({ error: 'Error al obtener las calificaciones', detalle: error.message });
    }
});

/**
 * @ROUTE GET /clase/:idClase/alumnos-con-calificaciones
 * @DESCRIPTION Obtiene alumnos de una clase con todas sus calificaciones (P1, P2, P3, Ord)
 */
router.get('/clase/:idClase/alumnos-con-calificaciones', async (req, res) => {
    try {
        const { idClase } = req.params;

        // Importar modelo InscripcionClase
        const { InscripcionClase } = await import('../models/InscripcionClase.js');

        // Buscar todas las inscripciones a esta clase
        const inscripciones = await InscripcionClase.find({ idClase: idClase })
            .populate({
                path: 'idInscripcion',
                model: 'Inscripcion',
                populate: {
                    path: 'idAlumno',
                    model: 'Usuario',
                    select: 'nombre correo boleta dataAlumno'
                }
            })
            .lean();

        // Para cada inscripción, obtener sus calificaciones
        const alumnosConCalificaciones = await Promise.all(
            inscripciones
                .filter(insc => insc.idInscripcion && insc.idInscripcion.idAlumno)
                .map(async (insc) => {
                    const alumno = insc.idInscripcion.idAlumno;

                    // Extraer boleta (está directamente en el Usuario, no en dataAlumno)
                    const boleta = alumno.boleta || 'N/A';

                    // Buscar todas las calificaciones de esta inscripción
                    const calificaciones = await Calificacion.find({
                        idInscripcionClase: insc._id
                    }).lean();

                    // Organizar calificaciones por tipo
                    const califs = {
                        P1: null,
                        P2: null,
                        P3: null,
                        Ord: null
                    };

                    calificaciones.forEach(calif => {
                        if (calif.tipoEvaluacion === 'P1') califs.P1 = calif.valor;
                        if (calif.tipoEvaluacion === 'P2') califs.P2 = calif.valor;
                        if (calif.tipoEvaluacion === 'P3') califs.P3 = calif.valor;
                        if (calif.tipoEvaluacion === 'Ord') califs.Ord = calif.valor;
                    });

                    // Calcular promedio y Ord automático
                    let promedioActual = null;
                    let ordCalculado = null;

                    const parciales = [califs.P1, califs.P2, califs.P3].filter(c => c !== null);
                    if (parciales.length > 0) {
                        const suma = parciales.reduce((acc, val) => acc + val, 0);
                        promedioActual = suma / parciales.length;

                        // Si tiene los 3 parciales, calcular Ord
                        if (parciales.length === 3) {
                            // Regla: redondear hacia arriba desde .5, excepto 5.5
                            if (promedioActual === 5.5) {
                                ordCalculado = 5;
                            } else {
                                ordCalculado = Math.round(promedioActual);
                            }
                        }
                    }

                    return {
                        idInscripcionClase: insc._id,
                        idAlumno: alumno._id,
                        boleta: boleta,
                        nombre: alumno.nombre || 'N/A',
                        correo: alumno.correo || 'N/A',
                        P1: califs.P1,
                        P2: califs.P2,
                        P3: califs.P3,
                        Ord: califs.Ord || ordCalculado, // Usar guardado o calculado
                        promedioActual: promedioActual,
                        tieneTresParciales: parciales.length === 3
                    };
                })
        );

        // Ordenar por boleta
        alumnosConCalificaciones.sort((a, b) => {
            if (a.boleta === 'N/A') return 1;
            if (b.boleta === 'N/A') return -1;
            return String(a.boleta).localeCompare(String(b.boleta));
        });

        res.status(200).json(alumnosConCalificaciones);
    } catch (error) {
        console.error('Error al obtener alumnos con calificaciones:', error);
        res.status(500).json({
            error: 'Error al obtener alumnos con calificaciones',
            detalle: error.message
        });
    }
});

/**
 * @ROUTE POST /guardar-calificaciones-parciales
 * @DESCRIPTION Guarda calificaciones parciales (P1, P2, P3) y genera Ord automáticamente
 * Body: { calificaciones: [{ idInscripcionClase, P1, P2, P3 }] }
 */
router.post('/guardar-calificaciones-parciales', async (req, res) => {
    try {
        const { calificaciones } = req.body;

        if (!calificaciones || !Array.isArray(calificaciones)) {
            return res.status(400).json({
                error: 'Se requiere un array de calificaciones'
            });
        }

        const resultados = {
            exitosos: 0,
            creados: 0,
            actualizados: 0,
            ordinarios: 0,
            fallidos: 0,
            errores: []
        };

        for (const item of calificaciones) {
            try {
                const { idInscripcionClase, P1, P2, P3 } = item;

                if (!idInscripcionClase) {
                    resultados.fallidos++;
                    resultados.errores.push({
                        idInscripcionClase,
                        error: 'ID de inscripción clase requerido'
                    });
                    continue;
                }

                // Guardar P1, P2, P3
                const parciales = [
                    { tipo: 'P1', valor: P1 },
                    { tipo: 'P2', valor: P2 },
                    { tipo: 'P3', valor: P3 }
                ];

                for (const parcial of parciales) {
                    if (parcial.valor !== null && parcial.valor !== undefined && parcial.valor !== '') {
                        const valor = parseFloat(parcial.valor);

                        // Validar rango
                        if (valor < 0 || valor > 10) {
                            resultados.fallidos++;
                            resultados.errores.push({
                                idInscripcionClase,
                                tipo: parcial.tipo,
                                error: 'Calificación fuera de rango (0-10)'
                            });
                            continue;
                        }

                        // Buscar si existe
                        const existente = await Calificacion.findOne({
                            idInscripcionClase,
                            tipoEvaluacion: parcial.tipo
                        });

                        if (existente) {
                            existente.valor = valor;
                            existente.fechaRegistro = new Date();
                            await existente.save();
                            resultados.actualizados++;
                        } else {
                            const nueva = new Calificacion({
                                idInscripcionClase,
                                valor: valor,
                                tipoEvaluacion: parcial.tipo,
                                fechaRegistro: new Date()
                            });
                            await nueva.save();
                            resultados.creados++;
                        }
                    }
                }

                // *** Calcular y guardar Ord si tiene los 3 parciales ***
                const todasLasCalificaciones = await Calificacion.find({
                    idInscripcionClase,
                    tipoEvaluacion: { $in: ['P1', 'P2', 'P3'] }
                }).lean();

                if (todasLasCalificaciones.length === 3) {
                    const suma = todasLasCalificaciones.reduce((acc, c) => acc + c.valor, 0);
                    const promedio = suma / 3;

                    // Calcular Ord con regla especial para 5.5
                    let ordValor;
                    if (promedio === 5.5) {
                        ordValor = 5;
                    } else {
                        ordValor = Math.round(promedio);
                    }

                    // Guardar u actualizar Ord
                    const ordExistente = await Calificacion.findOne({
                        idInscripcionClase,
                        tipoEvaluacion: 'Ord'
                    });

                    if (ordExistente) {
                        ordExistente.valor = ordValor;
                        ordExistente.fechaRegistro = new Date();
                        await ordExistente.save();
                    } else {
                        const nuevaOrd = new Calificacion({
                            idInscripcionClase,
                            valor: ordValor,
                            tipoEvaluacion: 'Ord',
                            fechaRegistro: new Date()
                        });
                        await nuevaOrd.save();
                        resultados.ordinarios++;
                    }
                }

                resultados.exitosos++;

            } catch (error) {
                resultados.fallidos++;
                resultados.errores.push({
                    idInscripcionClase: item.idInscripcionClase,
                    error: error.message
                });
            }
        }

        res.status(200).json({
            mensaje: 'Proceso completado',
            resultados
        });

    } catch (error) {
        console.error('Error al guardar calificaciones parciales:', error);
        res.status(500).json({
            error: 'Error al guardar calificaciones',
            detalle: error.message
        });
    }
});

// POST: Crear calificación
router.post('/', async (req, res) => {
    try {
        const calificacion = new Calificacion(req.body);
        const saved = await calificacion.save();

        const populated = await Calificacion.findById(saved._id)
            .populate({
                path: 'idInscripcionClase',
                populate: [
                    {
                        path: 'idInscripcion',
                        populate: { path: "idAlumno", select: "nombre correo dataAlumno" }
                    },
                    {
                        path: 'idClase',
                        populate: [
                            { path: "idProfesor", select: "nombre correo" },
                            { path: "idMateria", select: "nombre clave" }
                        ]
                    }
                ]
            });

        res.status(201).json(populated);
    } catch (error) {
        console.error("Error al crear la calificación:", error);
        res.status(500).json({ error: 'Error al crear la calificación', detalle: error.message });
    }
});

// PUT: Actualizar calificación
router.put('/:id', async (req, res) => {
    try {
        const updated = await Calificacion.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updated)
            return res.status(404).json({ error: 'Calificación no encontrada' });

        const populated = await Calificacion.findById(updated._id)
            .populate({
                path: 'idInscripcionClase',
                populate: [
                    {
                        path: 'idInscripcion',
                        populate: { path: "idAlumno", select: "nombre correo dataAlumno" }
                    },
                    {
                        path: 'idClase',
                        populate: [
                            { path: "idProfesor", select: "nombre correo" },
                            { path: "idMateria", select: "nombre clave" }
                        ]
                    }
                ]
            });

        res.status(200).json(populated);
    } catch (error) {
        console.error("Error al actualizar la calificación:", error);
        res.status(500).json({ error: 'Error al actualizar la calificación', detalle: error.message });
    }
});

// DELETE: Eliminar calificación
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Calificacion.findByIdAndDelete(req.params.id);
        if (!deleted)
            return res.status(404).json({ error: 'Calificación no encontrada' });

        res.status(200).json({ message: 'Calificación eliminada correctamente' });
    } catch (error) {
        console.error("Error al eliminar la calificación:", error);
        res.status(500).json({ error: 'Error al eliminar la calificación', detalle: error.message });
    }
});

/**
 * @ROUTE GET /calificacion/grupo/:grupoId/materia/:materiaId/parcial/:parcial
 * @DESCRIPTION Obtiene calificaciones de un grupo/materia/parcial específico para gráficas
 */
router.get('/grupo/:grupoId/materia/:materiaId/parcial/:parcial', async (req, res) => {
    try {
        const { grupoId, materiaId, parcial } = req.params;

        // Importar modelos necesarios
        const { Clase } = await import('../models/Clase.js');
        const { InscripcionClase } = await import('../models/InscripcionClase.js');

        // Buscar la clase específica
        const clase = await Clase.findOne({
            idGrupo: grupoId,
            idMateria: materiaId
        });

        if (!clase) {
            return res.status(404).json({
                error: 'No se encontró clase para este grupo y materia'
            });
        }

        // Buscar inscripciones a esta clase (Inscrito o Cursando)
        const inscripciones = await InscripcionClase.find({
            idClase: clase._id,
            estatus: { $in: ['Inscrito', 'Cursando'] }
        }).populate({
            path: 'idInscripcion',
            populate: {
                path: 'idAlumno',
                select: 'nombre boleta'
            }
        });

        // Para cada inscripción, buscar la calificación del parcial
        const resultado = await Promise.all(
            inscripciones.map(async (insc) => {
                const alumno = insc.idInscripcion?.idAlumno;
                if (!alumno) return null;

                // Buscar calificación del parcial específico
                const calificacion = await Calificacion.findOne({
                    idInscripcionClase: insc._id,
                    tipoEvaluacion: parcial // "P1", "P2", "P3"
                });

                return {
                    idAlumno: alumno._id,
                    nombre: alumno.nombre,
                    boleta: alumno.boleta || 'N/A',
                    calificacion: calificacion?.valor ?? null
                };
            })
        );

        // Filtrar nulos y ordenar por boleta
        const alumnosConCalificaciones = resultado
            .filter(item => item !== null)
            .sort((a, b) => {
                if (a.boleta === 'N/A') return 1;
                if (b.boleta === 'N/A') return -1;
                return String(a.boleta).localeCompare(String(b.boleta));
            });

        res.status(200).json(alumnosConCalificaciones);
    } catch (error) {
        console.error('Error al obtener calificaciones para gráfica:', error);
        res.status(500).json({
            error: 'Error al obtener calificaciones',
            detalle: error.message
        });
    }
});

/**
 * @ROUTE GET /calificacion/profesor/:profesorId/resumen-grupos
 * @DESCRIPTION Obtiene resumen de calificaciones de todos los grupos del profesor
 */
router.get('/profesor/:profesorId/resumen-grupos', async (req, res) => {
    try {
        const { profesorId } = req.params;

        const { Clase } = await import('../models/Clase.js');
        const { InscripcionClase } = await import('../models/InscripcionClase.js');
        const { Grupo } = await import('../models/Grupo.js');

        // Buscar todas las clases del profesor
        const clases = await Clase.find({ idProfesor: profesorId })
            .populate('idGrupo')
            .populate('idMateria');

        if (clases.length === 0) {
            return res.status(200).json([]);
        }

        // Agrupar por grupo
        const gruposMap = new Map();

        for (const clase of clases) {
            if (!clase.idGrupo) continue;

            const grupoId = clase.idGrupo._id.toString();

            if (!gruposMap.has(grupoId)) {
                gruposMap.set(grupoId, {
                    grupoId: grupoId,
                    grupoNombre: clase.idGrupo.nombre,
                    alumnos: []
                });
            }

            // Buscar inscripciones de esta clase
            const inscripciones = await InscripcionClase.find({
                idClase: clase._id,
                estatus: { $in: ['Inscrito', 'Cursando'] }
            }).populate({
                path: 'idInscripcion',
                populate: {
                    path: 'idAlumno',
                    select: 'nombre boleta'
                }
            });

            // Para cada inscripción, obtener calificaciones
            for (const insc of inscripciones) {
                const alumno = insc.idInscripcion?.idAlumno;
                if (!alumno) continue;

                // Buscar calificaciones P1, P2, P3
                const calificaciones = await Calificacion.find({
                    idInscripcionClase: insc._id,
                    tipoEvaluacion: { $in: ['P1', 'P2', 'P3'] }
                });

                const califs = { P1: null, P2: null, P3: null };
                calificaciones.forEach(cal => {
                    califs[cal.tipoEvaluacion] = cal.valor;
                });

                // Buscar si ya existe el alumno en este grupo
                const grupoData = gruposMap.get(grupoId);
                const alumnoExistente = grupoData.alumnos.find(
                    a => a.boleta === alumno.boleta
                );

                if (!alumnoExistente) {
                    grupoData.alumnos.push({
                        boleta: alumno.boleta || 'N/A',
                        nombre: alumno.nombre,
                        p1: califs.P1,
                        p2: califs.P2,
                        p3: califs.P3
                    });
                } else {
                    // Actualizar calificaciones si hay datos
                    if (califs.P1 !== null) alumnoExistente.p1 = califs.P1;
                    if (califs.P2 !== null) alumnoExistente.p2 = califs.P2;
                    if (califs.P3 !== null) alumnoExistente.p3 = califs.P3;
                }
            }
        }

        // Convertir Map a array y ordenar alumnos por boleta
        const resultado = Array.from(gruposMap.values()).map(grupo => ({
            ...grupo,
            alumnos: grupo.alumnos.sort((a, b) => {
                if (a.boleta === 'N/A') return 1;
                if (b.boleta === 'N/A') return -1;
                return String(a.boleta).localeCompare(String(b.boleta));
            })
        }));

        res.status(200).json(resultado);
    } catch (error) {
        console.error('Error al obtener resumen de grupos:', error);
        res.status(500).json({
            error: 'Error al obtener resumen de grupos',
            detalle: error.message
        });
    }
});

export default router;