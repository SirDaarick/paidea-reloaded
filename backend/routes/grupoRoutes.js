import express from 'express';
import { Grupo } from '../models/Grupo.js'; // Ajusta la ruta si es necesario
import { Clase } from '../models/Clase.js';

const router = express.Router();

// --- Rutas CRUD para Grupos --- //

router.get('/', async (req, res) => {
    try {
        const grupos = await Grupo.find()
            .populate('idCarrera')      // Traer datos de la Carrera
            .populate('idPeriodo');     // Traer datos del PeriodoAcademico
        res.status(200).json(grupos);
    } catch (error) {
        console.error("Error al obtener los grupos:", error);
        res.status(500).json({ error: 'Error al obtener los grupos', detalle: error.message });
    }
});

router.get('/filtrar', async (req, res) => {
    try {
        const { idCarrera, idPeriodo, semestre, turno } = req.query;

        const filtro = {};

        if (idCarrera) filtro.idCarrera = idCarrera;
        if (idPeriodo) filtro.idPeriodo = idPeriodo;
        if (semestre) filtro.semestre = parseInt(semestre);
        if (turno) filtro.turno = turno;

        const grupos = await Grupo.find(filtro)
            .populate('idCarrera')
            .populate('idPeriodo')
            .sort({ nombre: 1 });

        res.status(200).json(grupos);
    } catch (error) {
        console.error("Error al filtrar grupos:", error);
        res.status(500).json({ error: 'Error al filtrar grupos', detalle: error.message });
    }
});


// Obtener grupos asignados a un profesor
router.get('/profesor/:profesorId', async (req, res) => {
    try {
        const { profesorId } = req.params;
        // Buscar clases donde idProfesor = profesorId
        const clases = await Clase.find({ idProfesor: profesorId })
            .populate('idGrupo')
            .populate('idMateria')
            .populate('idProfesor', 'nombre correo')
            .populate('horario.lunes.idDia')
            .populate('horario.martes.idDia')
            .populate('horario.miercoles.idDia')
            .populate('horario.jueves.idDia')
            .populate('horario.viernes.idDia')
            .populate('horario.sabado.idDia');

        // Extraer grupos únicos
        const gruposMap = new Map();
        clases.forEach(clase => {
            if (clase.idGrupo && !gruposMap.has(clase.idGrupo._id.toString())) {
                gruposMap.set(clase.idGrupo._id.toString(), {
                    ...clase.idGrupo.toObject(),
                    materias: []
                });
            }
        });

        // Agregar materias y horarios a cada grupo
        clases.forEach(clase => {
            const grupoId = clase.idGrupo._id.toString();
            const grupo = gruposMap.get(grupoId);
            if (grupo && clase.idMateria) {
                // Construir horarios por día
                const horarios = {
                    lunes: clase.horario?.lunes?.idDia?.horarioInicio && clase.horario?.lunes?.idDia?.horarioFinal
                        ? `${clase.horario.lunes.idDia.horarioInicio}-${clase.horario.lunes.idDia.horarioFinal}` : '-',
                    martes: clase.horario?.martes?.idDia?.horarioInicio && clase.horario?.martes?.idDia?.horarioFinal
                        ? `${clase.horario.martes.idDia.horarioInicio}-${clase.horario.martes.idDia.horarioFinal}` : '-',
                    miercoles: clase.horario?.miercoles?.idDia?.horarioInicio && clase.horario?.miercoles?.idDia?.horarioFinal
                        ? `${clase.horario.miercoles.idDia.horarioInicio}-${clase.horario.miercoles.idDia.horarioFinal}` : '-',
                    jueves: clase.horario?.jueves?.idDia?.horarioInicio && clase.horario?.jueves?.idDia?.horarioFinal
                        ? `${clase.horario.jueves.idDia.horarioInicio}-${clase.horario.jueves.idDia.horarioFinal}` : '-',
                    viernes: clase.horario?.viernes?.idDia?.horarioInicio && clase.horario?.viernes?.idDia?.horarioFinal
                        ? `${clase.horario.viernes.idDia.horarioInicio}-${clase.horario.viernes.idDia.horarioFinal}` : '-'
                };

                grupo.materias.push({
                    id: clase.idMateria._id,
                    nombre: clase.idMateria.nombre,
                    clave: clase.idMateria.clave,
                    claseId: clase._id,
                    salon: clase.salon || 'N/A',
                    horarios: horarios
                });
            }
        });

        res.status(200).json(Array.from(gruposMap.values()));
    } catch (error) {
        console.error("Error al obtener grupos del profesor:", error);
        res.status(500).json({ error: 'Error al obtener los grupos', detalle: error.message });
    }
});


router.get('/:id', async (req, res) => {
    try {
        const grupo = await Grupo.findById(req.params.id)
            .populate('idCarrera')
            .populate('idPeriodo');

        if (!grupo) {
            return res.status(404).json({ error: 'Grupo no encontrado' });
        }
        res.status(200).json(grupo);
    } catch (error) {
        console.error("Error al obtener el grupo:", error);
        res.status(500).json({ error: 'Error al obtener el grupo', detalle: error.message });
    }
});


router.post('/', async (req, res) => {
    try {
        const grupo = new Grupo(req.body);
        const savedGrupo = await grupo.save();
        res.status(201).json(savedGrupo);
    } catch (error) {
        console.error("Error al crear el grupo:", error);

        // Mongoose Validation Error (ej. campos requeridos, 'enum' en turno, 'min' en semestre)
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Error de validación al crear el grupo', detalle: error.message });
        }

        res.status(500).json({ error: 'Error interno al crear el grupo', detalle: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const updatedGrupo = await Grupo.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true } // Ejecutar validadores para 'min' y 'enum'
        );

        if (!updatedGrupo) {
            return res.status(404).json({ error: 'Grupo no encontrado' });
        }
        res.status(200).json(updatedGrupo);
    } catch (error) {
        console.error("Error al actualizar el grupo:", error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Error de validación al actualizar el grupo', detalle: error.message });
        }

        res.status(500).json({ error: 'Error al actualizar el grupo', detalle: error.message });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const deletedGrupo = await Grupo.findByIdAndDelete(req.params.id);
        if (!deletedGrupo) {
            return res.status(404).json({ error: 'Grupo no encontrado' });
        }
        res.status(200).json({ message: 'Grupo eliminado correctamente' });
    } catch (error) {
        console.error("Error al eliminar el grupo:", error);
        res.status(500).json({ error: 'Error al eliminar el grupo', detalle: error.message });
    }
});

export default router;