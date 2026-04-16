import express from "express";
import { InscripcionClase } from "../models/InscripcionClase.js";
import { Clase } from "../models/Clase.js";
import { Usuario } from "../models/Usuario.js";
import { PeriodoInscripcion } from "../models/PeriodoInscripcion.js";

const router = express.Router();

// =====================================================
// FUNCIÓN REUTILIZABLE DE POPULATE
// =====================================================
const populateInscripcionClase = (query) => {
    return query
        .populate({
            path: 'idInscripcion',
            model: 'Inscripcion',
            populate: [
                {
                    path: 'idAlumno',
                    model: 'Usuario',
                    select: 'nombre correo rol dataAlumno boleta datosPersonales',
                    populate: {
                        path: 'dataAlumno.idCarrera',
                        model: 'Carrera',
                        select: 'nombre clave'
                    }
                },
                {
                    path: 'idPeriodo',
                    model: 'PeriodoAcademico'
                }
            ]
        })
        .populate({
            path: 'idClase',
            model: 'Clase',
            populate: [
                { path: 'idGrupo', model: 'Grupo', populate: ['idCarrera', 'idPeriodo'] },
                { path: 'idMateria', model: 'Materia' },
                { path: 'idProfesor', model: 'Usuario', select: 'nombre correo' },
                { path: 'horario.lunes.idDia', model: 'DiaSemana' },
                { path: 'horario.martes.idDia', model: 'DiaSemana' },
                { path: 'horario.miercoles.idDia', model: 'DiaSemana' },
                { path: 'horario.jueves.idDia', model: 'DiaSemana' },
                { path: 'horario.viernes.idDia', model: 'DiaSemana' },
                { path: 'horario.sabado.idDia', model: 'DiaSemana' }
            ]
        });
};

// =====================================================
// GET TODAS
// =====================================================
router.get("/", async (req, res) => {
    try {
        const inscripciones = await populateInscripcionClase(
            InscripcionClase.find()
        );
        res.status(200).json(inscripciones);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener inscripciones" });
    }
});

// =====================================================
// CONTEO POR CLASE
// =====================================================
router.get("/clase/:idClase/conteo", async (req, res) => {
    try {
        const conteo = await InscripcionClase.countDocuments({
            idClase: req.params.idClase
        });
        res.status(200).json({ inscritos: conteo });
    } catch (error) {
        res.status(500).json({ error: "Error al contar inscripciones" });
    }
});

router.get("/clase/:idClase", async (req, res) => {
    try {
        const inscripciones = await InscripcionClase.find({
            idClase: req.params.idClase
        })
        .populate({
            path: 'idInscripcion',
            populate: { 
                path: 'idAlumno', 
                select: 'nombre boleta correo dataAlumno' 
            }
        })
        .populate({
            path: 'idClase',
            populate: [
                { path: 'idMateria', select: 'nombre clave semestre creditos' },
                { path: 'idProfesor', select: 'nombre correo' },
                { path: 'idGrupo', select: 'nombre' }
            ]
        });

        res.status(200).json(inscripciones);
    } catch (error) {
        console.error("Error al obtener inscripciones por clase:", error);
        res.status(500).json({ 
            error: "Error al obtener inscripciones por clase", 
            detalle: error.message 
        });
    }
});

// =====================================================
// GET POR INSCRIPCIÓN
// =====================================================
router.get("/inscripcion/:idInscripcion", async (req, res) => {
    try {
        const inscripciones = await populateInscripcionClase(
            InscripcionClase.find({ idInscripcion: req.params.idInscripcion })
        );
        res.status(200).json(inscripciones);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener inscripciones" });
    }
});

/**
 * @ROUTE GET /alumno/:idAlumno/materias-reprobadas
 * @DESCRIPTION Obtiene las materias reprobadas de un alumno que NO han sido aprobadas posteriormente.
 * Esta ruta está optimizada para reducir el número de consultas y mejorar el rendimiento.
 */
router.get("/alumno/:idAlumno/materias-reprobadas", async (req, res) => {
    try {
        const { idAlumno } = req.params;
        
        // 1. Obtener todas las inscripciones del alumno en una sola consulta optimizada
        const inscripciones = await InscripcionClase.find()
            .populate({
                path: 'idInscripcion',
                match: { idAlumno: idAlumno },
                populate: {
                    path: 'idPeriodo',
                    model: 'PeriodoAcademico',
                    select: 'nombre'
                }
            })
            .populate({
                path: 'idClase',
                model: 'Clase',
                populate: {
                    path: 'idMateria',
                    model: 'Materia',
                    select: 'nombre _id'
                }
            })
            .lean();

        // Filtrar solo las que tienen idInscripcion válida (del alumno)
        const inscripcionesAlumno = inscripciones.filter(insc => insc.idInscripcion !== null);

        if (inscripcionesAlumno.length === 0) {
            return res.status(200).json([]);
        }

        // 2. Agrupar por materia
        const materiasPorId = {};

        for (const inscClase of inscripcionesAlumno) {
            if (!inscClase.idClase || !inscClase.idClase.idMateria) continue;

            const idMateria = inscClase.idClase.idMateria._id.toString();
            const nombreMateria = inscClase.idClase.idMateria.nombre;
            const nombrePeriodo = inscClase.idInscripcion?.idPeriodo?.nombre || "Periodo desconocido";
            const estatus = inscClase.estatus;

            if (!materiasPorId[idMateria]) {
                materiasPorId[idMateria] = {
                    idMateria,
                    nombreMateria,
                    registros: []
                };
            }

            materiasPorId[idMateria].registros.push({
                estatus,
                periodo: nombrePeriodo,
                fecha: inscClase.createdAt || new Date()
            });
        }

        // 3. Determinar materias que están reprobadas y no han sido aprobadas
        const materiasReprobadas = [];

        for (const idMateria in materiasPorId) {
            const materia = materiasPorId[idMateria];
            const registros = materia.registros;

            // Verificar si tiene al menos un "Reprobado"
            const tieneReprobado = registros.some(r => r.estatus === 'Reprobado');
            
            if (tieneReprobado) {
                // Verificar si posteriormente fue aprobada
                const tieneAprobado = registros.some(r => r.estatus === 'Aprobado');
                
                if (!tieneAprobado) {
                    // Obtener el registro de reprobado más reciente
                    const registrosReprobados = registros
                        .filter(r => r.estatus === 'Reprobado')
                        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
                    
                    const ultimoReprobado = registrosReprobados[0];
                    
                    // Verificar si es recursada (más de un intento reprobado)
                    const esRecursada = registrosReprobados.length > 1;

                    materiasReprobadas.push({
                        materia: materia.nombreMateria,
                        periodo: ultimoReprobado.periodo,
                        status: esRecursada ? "Recursada" : "Reprobada",
                        totalIntentos: registrosReprobados.length
                    });
                }
            }
        }

        // 4. Ordenar por periodo (más reciente primero)
        materiasReprobadas.sort((a, b) => {
            // Puedes mejorar esto si tus nombres de periodo siguen un patrón específico
            return b.periodo.localeCompare(a.periodo);
        });

        res.status(200).json(materiasReprobadas);

    } catch (error) {
        console.error("Error al obtener materias reprobadas:", error);
        res.status(500).json({ 
            error: "Error al obtener materias reprobadas", 
            detalle: error.message 
        });
    }
});

router.post("/", async (req, res) => {
    try {
        const inscripcionClase = new InscripcionClase(req.body);
        const guardada = await inscripcionClase.save();
        const completa = await populateInscripcionClase(
            InscripcionClase.findById(guardada._id)
        );
        res.status(201).json(completa);
    } catch (error) {
        res.status(500).json({ error: "Error al crear inscripción" });
    }
});

// =====================================================
// 🔒 POST — INSCRIBIR CLASE (VALIDADO POR FECHA)
// =====================================================
router.post("/validacion", async (req, res) => {
    try {
        const ahora = new Date();

        // 🔒 VALIDAR PERIODO DE REINSCRIPCIÓN
        const periodoActivo = await PeriodoInscripcion.findOne({
            tipo: "Reinscripcion",
            fechaInicio: { $lte: ahora },
            fechaFinal: { $gte: ahora }
        });

        if (!periodoActivo) {
            return res.status(403).json({
                error: "FUERA_DE_FECHA",
                mensaje: "No estás dentro del periodo de reinscripción"
            });
        }

        // ✅ LÓGICA ORIGINAL (NO SE TOCA)
        const inscripcionClase = new InscripcionClase(req.body);
        const guardada = await inscripcionClase.save();

        const completa = await populateInscripcionClase(
            InscripcionClase.findById(guardada._id)
        );

        res.status(201).json(completa);

    } catch (error) {
        console.error("Error al inscribir clase:", error);

        if (error.code === 11000) {
            return res.status(400).json({
                error: "INSCRIPCION_DUPLICADA",
                mensaje: "El alumno ya está inscrito en esta clase"
            });
        }

        res.status(500).json({
            error: "ERROR_INSCRIPCION",
            detalle: error.message
        });
    }
});

// =====================================================
// PUT
// =====================================================
router.put("/:id", async (req, res) => {
    try {
        const actualizada = await InscripcionClase.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!actualizada) {
            return res.status(404).json({ error: "Inscripción no encontrada" });
        }

        const completa = await populateInscripcionClase(
            InscripcionClase.findById(actualizada._id)
        );

        res.status(200).json(completa);
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar inscripción" });
    }
});

// =====================================================
// DELETE
// =====================================================
router.delete("/:id", async (req, res) => {
    try {
        const eliminada = await InscripcionClase.findByIdAndDelete(req.params.id);
        if (!eliminada) {
            return res.status(404).json({ error: "Inscripción no encontrada" });
        }
        res.status(200).json({ message: "Inscripción eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar inscripción" });
    }
});

// =====================================================
// GET ASISTENCIAS POR GRUPO Y MATERIA
// =====================================================
// Ruta para obtener asistencias por claseId (recomendado)
router.get("/asistencias/clase/:claseId", async (req, res) => {
    try {
        const { claseId } = req.params;

        // Verificar que la clase existe
        const clase = await Clase.findById(claseId);
        if (!clase) {
            return res.status(404).json({
                error: "Clase no encontrada",
                mensaje: "No existe una clase con ese ID"
            });
        }

        // Obtener las inscripciones de esa clase con status Inscrito o Cursando
        const inscripciones = await populateInscripcionClase(
            InscripcionClase.find({
                idClase: claseId,
                estatus: { $in: ['Inscrito', 'Cursando'] }
            })
        );

        res.status(200).json(inscripciones);
    } catch (error) {
        console.error("Error al obtener asistencias:", error);
        res.status(500).json({
            error: "Error al obtener asistencias",
            detalle: error.message
        });
    }
});

// Ruta legacy para obtener asistencias por grupoId y materiaId (mantener compatibilidad)
router.get("/asistencias/:grupoId/:materiaId", async (req, res) => {
    try {
        const { grupoId, materiaId } = req.params;

        // Buscar la clase que corresponde al grupo y materia
        const clase = await Clase.findOne({
            idGrupo: grupoId,
            idMateria: materiaId
        });

        if (!clase) {
            return res.status(404).json({
                error: "Clase no encontrada",
                mensaje: "No existe una clase para este grupo y materia"
            });
        }

        // Obtener las inscripciones de esa clase con status Inscrito o Cursando
        const inscripciones = await populateInscripcionClase(
            InscripcionClase.find({
                idClase: clase._id,
                estatus: { $in: ['Inscrito', 'Cursando'] }
            })
        );

        res.status(200).json(inscripciones);
    } catch (error) {
        console.error("Error al obtener asistencias:", error);
        res.status(500).json({
            error: "Error al obtener asistencias",
            detalle: error.message
        });
    }
});


router.get("/:id", async (req, res) => {
    try {
        const inscripcion = await populateInscripcionClase(
            InscripcionClase.findById(req.params.id)
        );
        if (!inscripcion) {
            return res.status(404).json({ error: "Inscripción no encontrada" });
        }
        res.status(200).json(inscripcion);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener inscripción" });
    }
});

// =====================================================
// POST ASISTENCIAS POR CLASE ID
// =====================================================
router.post("/asistencias/clase/:claseId", async (req, res) => {
    try {
        const { claseId } = req.params;
        const asistencias = req.body;

        if (!Array.isArray(asistencias)) {
            return res.status(400).json({
                error: "Formato inválido",
                mensaje: "Se esperaba un array de asistencias"
            });
        }

        // Verificar que la clase existe
        const clase = await Clase.findById(claseId);
        if (!clase) {
            return res.status(404).json({
                error: "Clase no encontrada",
                mensaje: "No existe una clase con ese ID"
            });
        }

        // Actualizar cada inscripción con su asistencia
        const resultados = [];
        for (const item of asistencias) {
            if (!item.idInscripcionClase) continue;

            const actualizada = await InscripcionClase.findByIdAndUpdate(
                item.idInscripcionClase,
                { 
                    asistencias: item.asistencias || 0,
                    faltas: item.faltas || 0
                },
                { new: true }
            );

            if (actualizada) {
                resultados.push(actualizada);
            }
        }

        res.status(200).json({
            mensaje: "Asistencias guardadas correctamente",
            actualizadas: resultados.length
        });
    } catch (error) {
        console.error("Error al guardar asistencias:", error);
        res.status(500).json({
            error: "Error al guardar asistencias",
            detalle: error.message
        });
    }
});

export default router;
