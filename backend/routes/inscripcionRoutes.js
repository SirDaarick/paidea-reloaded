import express from 'express';
import { Inscripcion } from '../models/Inscripcion.js'; // Ajusta la ruta si es necesario
import { PeriodoInscripcion } from '../models/PeriodoInscripcion.js';
import { Cita } from '../models/Cita.js';

const router = express.Router();

// --- Función de Populate Reutilizable para Inscripcion ---
const populateInscripcion = (query) => {
    return query
        .populate({
            path: 'idAlumno', 
            model: 'Usuario', 
            select: 'nombre correo boleta datosPersonales.curp dataAlumno', // Seleccionar dataAlumno para el populate anidado
            populate: {
                path: 'dataAlumno.idCarrera', // Populate anidado para obtener la Carrera del Alumno
                model: 'Carrera',
                select: 'nombre clave' // Solo traer campos relevantes de Carrera
            }
        })
        .populate('idPeriodo');
}


// --- Rutas CRUD para Inscripciones --- //

/**
 * @ROUTE GET /
 * @DESCRIPTION Obtiene todas las inscripciones, incluyendo el Alumno (con Carrera) y el Periodo.
 */
router.get('/', async (req, res) => {
    try {
        const inscripciones = await populateInscripcion(Inscripcion.find());
        res.status(200).json(inscripciones);
    } catch (error) {
        console.error("Error al obtener las inscripciones:", error);
        res.status(500).json({ error: 'Error al obtener las inscripciones', detalle: error.message });
    }
});

/**
 * @ROUTE GET /:id
 * @DESCRIPTION Obtiene una inscripción por ID, incluyendo el Alumno (con Carrera) y el Periodo.
 */
router.get('/:id', async (req, res) => {
    try {
        const inscripcion = await populateInscripcion(Inscripcion.findById(req.params.id));
            
        if (!inscripcion) {
            return res.status(404).json({ error: 'Inscripción no encontrada' });
        }
        res.status(200).json(inscripcion);
    } catch (error) {
        console.error("Error al obtener la inscripción:", error);
        res.status(500).json({ error: 'Error al obtener la inscripción', detalle: error.message });
    }
});

router.get('/alumno/:idAlumno', async (req, res) => {
    try {
        const inscripciones = await populateInscripcion(Inscripcion.find({ idAlumno: req.params.idAlumno }));
        res.status(200).json(inscripciones);
    } catch (error) {
        console.error("Error al obtener las inscripciones del alumno:", error);
        res.status(500).json({ error: 'Error al obtener las inscripciones del alumno', detalle: error.message });
    }
});

router.get('/grupo/:idGrupo', async (req, res) => {
    try {
        const inscripciones = await Inscripcion.find()
        .populate({
            path: 'idAlumno', 
            model: 'Usuario', 
            select: 'nombre correo datosPersonales.curp dataAlumno', // Seleccionar dataAlumno para el populate anidado
            populate: {
                path: 'dataAlumno.idCarrera', // Populate anidado para obtener la Carrera del Alumno
                model: 'Carrera',
                select: 'nombre clave' // Solo traer campos relevantes de Carrera
            }
        })
        .populate('idPeriodo')
        .where('idGrupo').equals(req.params.idGrupo);
        res.status(200).json(inscripciones);
    } catch (error) {
        console.error("Error al obtener las inscripciones del grupo:", error);
        res.status(500).json({ error: 'Error al obtener las inscripciones del grupo', detalle: error.message });
    }
});

/**
 * @ROUTE POST /
 * @DESCRIPTION Crea una nueva inscripción.
 */

router.post('/', async (req, res) => {
    try {
        const inscripcion = new Inscripcion(req.body);
        const savedInscripcion = await inscripcion.save();

        // Devolver la inscripción con el populate completo
        const fullInscripcion = await populateInscripcion(Inscripcion.findById(savedInscripcion._id));

        res.status(201).json(fullInscripcion);
    } catch (error) {
        console.error("Error al crear la inscripción:", error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Error de validación al crear la inscripción', detalle: error.message });
        }
        
        res.status(500).json({ error: 'Error al crear la inscripción', detalle: error.message });
    }
});

// ===========================
//   CREAR INSCRIPCIÓN (SOLO POR FECHA)
// ===========================
router.post("/validacion", async (req, res) => {
  try {
    const { idAlumno, idPeriodo } = req.body;

    console.log("📝 POST /inscripcion/validacion - Body recibido:", req.body);

    // Validar datos de entrada
    if (!idAlumno || !idPeriodo) {
      console.error("❌ Faltan datos requeridos");
      return res.status(400).json({
        error: "DATOS_FALTANTES",
        mensaje: "Se requiere idAlumno e idPeriodo"
      });
    }

    const ahora = new Date();
    console.log("🕐 Fecha actual:", ahora);

    // ✅ VALIDACIÓN 1: Verificar si ya tiene inscripción en este periodo
    const inscripcionExistente = await Inscripcion.findOne({
      idAlumno: idAlumno,
      idPeriodo: idPeriodo
    });

    if (inscripcionExistente) {
      console.log("⚠️ El alumno ya tiene inscripción en este periodo");
      return res.status(409).json({
        error: "YA_INSCRITO",
        mensaje: "Ya tienes una inscripción en este periodo",
        data: inscripcionExistente
      });
    }

    // ✅ VALIDACIÓN 2: Buscar periodo de inscripción activo
    const periodoActivo = await PeriodoInscripcion.findOne({
      tipo: "Reinscripcion",
      fechaInicio: { $lte: ahora },
      fechaFinal: { $gte: ahora }
    });

    console.log("📅 Periodo activo encontrado:", periodoActivo);

    if (!periodoActivo) {
      console.error("❌ No hay periodo de reinscripción activo");
      return res.status(403).json({
        error: "FUERA_DE_PERIODO",
        mensaje: "No te encuentras dentro del periodo oficial de reinscripción"
      });
    }

    // ✅ VALIDACIÓN 3: Buscar cita del alumno
    const cita = await Cita.findOne({
      idAlumno: idAlumno,
      idPeriodoInscripcion: periodoActivo._id
    });

    if (!cita) {
      console.error("❌ No existe cita asignada para el alumno");
      return res.status(404).json({
        error: "SIN_CITA",
        mensaje: "No tienes una cita asignada"
      });
    }

    console.log("📋 Cita encontrada:", {
      fechaInicio: cita.fechaInicio,
      fechaFinal: cita.fechaFinal,
      ahora: ahora
    });

    // ✅ VALIDACIÓN 4: Verificar si aún no es momento de la cita
    if (cita.fechaInicio > ahora) {
      console.error("⏰ Aún no es momento de la cita");
      return res.status(403).json({
        error: "CITA_FUTURA",
        mensaje: "Aún no es momento de tu reinscripción",
        fechaInicio: cita.fechaInicio
      });
    }

    // ✅ VALIDACIÓN 5: Verificar si la cita ya expiró
    if (cita.fechaFinal < ahora) {
      console.error("❌ La cita ya expiró");
      return res.status(403).json({
        error: "CITA_EXPIRADA",
        mensaje: "Tu periodo de reinscripción ya expiró"
      });
    }

    // ✅ Todas las validaciones pasaron, crear inscripción
    console.log("➕ Creando nueva inscripción...");

    const inscripcion = new Inscripcion({
      idAlumno: idAlumno,
      idPeriodo: idPeriodo,
      creditos: 0
    });

    const savedInscripcion = await inscripcion.save();
    console.log("✅ Inscripción creada:", savedInscripcion._id);

    res.status(201).json(savedInscripcion);

  } catch (error) {
    console.error("💥 Error al crear inscripción:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ 
      error: "ERROR_SERVIDOR",
      mensaje: "Error al procesar la inscripción",
      detalle: error.message
    });
  }
});
/**
 * @ROUTE PUT /:id
 * @DESCRIPTION Actualiza una inscripción por ID.
 */
router.put('/:id', async (req, res) => {
    try {
        const updatedInscripcion = await Inscripcion.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true } // Ejecutar validadores para 'min'
        );

        if (!updatedInscripcion) {
            return res.status(404).json({ error: 'Inscripción no encontrada' });
        }
        
        // Devolver la inscripción con el populate completo
        const fullInscripcion = await populateInscripcion(Inscripcion.findById(updatedInscripcion._id));

        res.status(200).json(fullInscripcion);
    } catch (error) {
        console.error("Error al actualizar la inscripción:", error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Error de validación al actualizar la inscripción', detalle: error.message });
        }
        
        res.status(500).json({ error: 'Error al actualizar la inscripción', detalle: error.message });
    }
});

/**
 * @ROUTE DELETE /:id
 * @DESCRIPTION Elimina una inscripción por ID.
 */
router.delete('/:id', async (req, res) => {
    try {
        const deletedInscripcion = await Inscripcion.findByIdAndDelete(req.params.id);
        if (!deletedInscripcion) {
            return res.status(404).json({ error: 'Inscripción no encontrada' });
        }
        res.status(200).json({ message: 'Inscripción eliminada correctamente' });
    } catch (error) {
        console.error("Error al eliminar la inscripción:", error);
        res.status(500).json({ error: 'Error al eliminar la inscripción', detalle: error.message });
    }
});




export default router;
