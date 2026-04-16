import { Usuario } from "../models/Usuario.js";
import { InscripcionClase } from "../models/InscripcionClase.js";
import { Calificacion } from "../models/Calificacion.js";
import { Materia } from "../models/Materia.js";
import { Inscripcion } from "../models/Inscripcion.js";

export async function getAlumnoOverview(alumnoId) {
  try {
    // 1. Info general del alumno
    const alumno = await Usuario.findById(alumnoId)
      .populate("dataAlumno.idCarrera", "nombre clave")
      .lean();

    if (!alumno) {
      return { error: "Alumno no encontrado" };
    }

    // 2. Inscripciones (periodo actual y anteriores)
    let id = alumnoId;
      if (mongoose.Types.ObjectId.isValid(id)) {
          id = new mongoose.Types.ObjectId(id);
      }

      const inscripciones = await Inscripcion.find({ idAlumno: id })
      .populate("idPeriodo", "nombre fechaInicio fechaFinal")
      .lean();

    // 3. Inscripción a clases del periodo más reciente
    const ultimaInscripcion = inscripciones[inscripciones.length - 1];

    let clases = [];
    if (ultimaInscripcion) {
      clases = await InscripcionClase.find({
        idInscripcion: ultimaInscripcion._id
      })
        .populate({
          path: "idClase",
          populate: [
            { path: "idMateria", select: "nombre creditos" },
            { path: "idProfesor", select: "nombre" }
          ]
        })
        .lean();
    }

    // 4. Calificaciones
    const calificaciones = await Calificacion.find({
      idInscripcionClase: { $in: clases.map(c => c._id) }
    }).lean();

    return {
      alumno,
      inscripciones,
      clases,
      calificaciones
    };

  } catch (error) {
    console.error("Error en alumnoTools:", error);
    return { error: error.message };
  }
}