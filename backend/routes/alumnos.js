import express from "express";
import mongoose from "mongoose";
const router = express.Router();

// MODELOS
import { Usuario } from "../models/Usuario.js";
import { Inscripcion } from "../models/Inscripcion.js";
import { InscripcionClase } from "../models/InscripcionClase.js";
import { Calificacion } from "../models/Calificacion.js";
import { Materia } from "../models/Materia.js";
import { Clase } from "../models/Clase.js";
import { DiaSemana } from "../models/DiaSemana.js";

// ======================================================
//  UTILIDAD para validar/convertir ObjectId
// ======================================================
function normalizeId(id) {
  return mongoose.Types.ObjectId.isValid(id)
    ? new mongoose.Types.ObjectId(id)
    : id;
}

// ======================================================
//  PROMEDIO DEL ALUMNO
// ======================================================
router.get("/:id/promedio", async (req, res) => {
  try {
    let alumnoId = normalizeId(req.params.id);

    const inscripcion = await Inscripcion.findOne({ idAlumno: alumnoId })
      .sort({ fechaInscripcion: -1 });

    if (!inscripcion)
      return res.status(404).json({ message: "No existen inscripciones" });

    const inscClases = await InscripcionClase.find({
      idInscripcion: inscripcion._id
    });

    let suma = 0, total = 0;

    for (const ic of inscClases) {
      const cal = await Calificacion.findOne({ idInscripcionClase: ic._id });
      if (cal?.valor !== undefined) {
        suma += cal.valor;
        total++;
      }
    }

    const promedio = total > 0 ? (suma / total).toFixed(2) : 0;

    return res.json({
      alumnoId,
      promedio: Number(promedio),
      totalMaterias: total
    });

  } catch (e) {
    return res.status(500).json({ 
      message: "Error al calcular promedio", 
      error: e.message 
    });
  }
});

// ======================================================
//  MATERIAS ACTUALES (TOOL #1)
// ======================================================
router.get("/:id/materias-actuales", async (req, res) => {
  try {
    let alumnoId = normalizeId(req.params.id);

    const inscripcion = await Inscripcion.findOne({ idAlumno: alumnoId })
      .sort({ fechaInscripcion: -1 });

    if (!inscripcion)
      return res.status(404).json({ message: "No existen inscripciones" });

    const inscClases = await InscripcionClase.find({
      idInscripcion: inscripcion._id
    });

    let resultado = [];

    for (const ic of inscClases) {
      const clase = await Clase.findById(ic.idClase)
        .populate("idMateria", "nombre clave semestre creditos")
        .populate("idProfesor", "nombre");

      if (!clase) continue;

      let horarioTexto = "Horario no registrado";

      for (const [dia, obj] of Object.entries(clase.horario)) {
        if (obj?.idDia) {
          const diaInfo = await DiaSemana.findById(obj.idDia);
          if (diaInfo) {
            horarioTexto = `${diaInfo.dia}: ${diaInfo.horarioInicio} - ${diaInfo.horarioFinal}`;
          }
        }
      }

      resultado.push({
        materia: clase.idMateria.nombre,
        clave: clase.idMateria.clave,
        semestre: clase.idMateria.semestre,
        creditos: clase.idMateria.creditos,
        profesor: clase.idProfesor?.nombre ?? "Sin asignar",
        salon: clase.salon,
        horario: horarioTexto
      });
    }

    return res.json(resultado);

  } catch (err) {
    return res.status(500).json({
      message: "Error al obtener materias actuales",
      error: err.message
    });
  }
});

// ======================================================
//  CALIFICACIONES (TOOL #2)
// ======================================================
router.get("/:id/calificaciones", async (req, res) => {
  try {
    let alumnoId = normalizeId(req.params.id);

    const inscripcion = await Inscripcion.findOne({ idAlumno: alumnoId })
      .sort({ fechaInscripcion: -1 });

    if (!inscripcion)
      return res.status(404).json({ message: "No hay inscripciones" });

    const inscClases = await InscripcionClase.find({
      idInscripcion: inscripcion._id
    });

    let resultado = [];

    for (const ic of inscClases) {
      const clase = await Clase.findById(ic.idClase)
        .populate("idMateria", "nombre clave semestre");

      const cal = await Calificacion.findOne({
        idInscripcionClase: ic._id
      });

      resultado.push({
        materia: clase.idMateria.nombre,
        clave: clase.idMateria.clave,
        semestre: clase.idMateria.semestre,
        estatus: ic.estatus,  // Aprobada / Reprobada / Inscrita
        calificacion: cal?.valor ?? null
      });
    }

    return res.json(resultado);

  } catch (err) {
    return res.status(500).json({
      message: "Error al obtener calificaciones",
      error: err.message
    });
  }
});

// ======================================================
//  CLASES DEL DIA (TOOL #3)
// ======================================================
router.get("/:id/clases-dia/:dia", async (req, res) => {
  try {
    let alumnoId = normalizeId(req.params.id);
    const diaBuscado = req.params.dia.toLowerCase();

    const inscripcion = await Inscripcion.findOne({ idAlumno: alumnoId })
      .sort({ fechaInscripcion: -1 });

    if (!inscripcion)
      return res.json([]);

    const inscClases = await InscripcionClase.find({
      idInscripcion: inscripcion._id
    });

    let resultado = [];

    for (const ic of inscClases) {
      const clase = await Clase.findById(ic.idClase)
        .populate("idMateria", "nombre clave semestre")
        .populate("idProfesor", "nombre");

      const datos = clase.horario[diaBuscado];
      if (!datos?.idDia) continue;

      const dia = await DiaSemana.findById(datos.idDia);

      resultado.push({
        materia: clase.idMateria.nombre,
        clave: clase.idMateria.clave,
        profesor: clase.idProfesor?.nombre ?? "Sin profesor",
        salon: clase.salon,
        dia: dia.dia,
        horario: `${dia.horarioInicio} - ${dia.horarioFinal}`
      });
    }

    return res.json(resultado);

  } catch (err) {
    return res.status(500).json({
      message: "Error al obtener clases del día",
      error: err.message
    });
  }
});

// ======================================================
//  CREDITOS DEL ALUMNO (TOOL #4)
// ======================================================
router.get("/:id/creditos", async (req, res) => {
  try {
    const alumno = await Usuario.findById(req.params.id)
      .populate("dataAlumno.idCarrera");

    if (!alumno)
      return res.status(404).json({ message: "Alumno no encontrado" });

    const cursados = alumno.dataAlumno.creditosCursados ?? 0;
    const total = alumno.dataAlumno.idCarrera?.totalCreditos ?? null;

    return res.json({
      creditosCursados: cursados,
      creditosTotales: total,
      porcentaje: total ? ((cursados / total) * 100).toFixed(2) : null
    });

  } catch (err) {
    return res.status(500).json({ message: "Error en créditos" });
  }
});

// ======================================================
//  DATOS DEL ALUMNO (TOOL #5)
// ======================================================
router.get("/:id/datos", async (req, res) => {
  try {
    const alumno = await Usuario.findById(req.params.id)
      .populate("dataAlumno.idCarrera");

    if (!alumno)
      return res.status(404).json({ message: "No encontrado" });

    return res.json({
      nombre: alumno.nombre,
      correo: alumno.correo,
      carrera: alumno.dataAlumno.idCarrera.nombre,
      sigla: alumno.dataAlumno.idCarrera.sigla,
      creditosCursados: alumno.dataAlumno.creditosCursados,
      promedio: alumno.dataAlumno.promedio
    });

  } catch (err) {
    return res.status(500).json({
      message: "Error al obtener datos",
      error: err.message
    });
  }
});

// ======================================================
//  HORARIO COMPLETO (TOOL #6)
// ======================================================
router.get("/:id/horario", async (req, res) => {
  try {
    let alumnoId = normalizeId(req.params.id);

    const inscripcion = await Inscripcion.findOne({ idAlumno: alumnoId })
      .sort({ fechaInscripcion: -1 });

    if (!inscripcion) return res.json([]);

    const inscClases = await InscripcionClase.find({
      idInscripcion: inscripcion._id
    });

    let horario = [];

    for (const ic of inscClases) {
      const clase = await Clase.findById(ic.idClase)
        .populate("idMateria", "nombre clave")
        .populate("idProfesor", "nombre");

      for (const [dia, obj] of Object.entries(clase.horario)) {
        if (!obj?.idDia) continue;

        const diaInfo = await DiaSemana.findById(obj.idDia);

        horario.push({
          materia: clase.idMateria.nombre,
          clave: clase.idMateria.clave,
          profesor: clase.idProfesor?.nombre,
          dia: diaInfo.dia,
          horario: `${diaInfo.horarioInicio} - ${diaInfo.horarioFinal}`,
          salon: clase.salon
        });
      }
    }

    return res.json(horario);

  } catch (err) {
    return res.status(500).json({
      message: "Error en horario",
      error: err.message
    });
  }
});

// ======================================================
//  🔥 NUEVO: TODAS LAS INSCRIPCIONES DEL ALUMNO
// ======================================================
router.get("/:id/inscripciones", async (req, res) => {
  try {
    const alumnoId = normalizeId(req.params.id);

    const inscripciones = await Inscripcion.find({ idAlumno: alumnoId })
      .sort({ fechaInscripcion: 1 })
      .lean();

    return res.json(inscripciones);

  } catch (err) {
    return res.status(500).json({
      message: "Error al obtener inscripciones",
      error: err.message
    });
  }
});

// ======================================================
//  🔥 NUEVO: CLASES DE UNA INSCRIPCIÓN ESPECÍFICA
// ======================================================
router.get("/:id/inscripcion-clases/:inscripcionId", async (req, res) => {
  try {
    const inscripcionId = normalizeId(req.params.inscripcionId);

    const clases = await InscripcionClase.find({ idInscripcion: inscripcionId })
      .populate({
        path: "idClase",
        populate: [
          { path: "idMateria", select: "nombre semestre creditos clave" },
          { path: "idProfesor", select: "nombre" }
        ]
      })
      .lean();

    return res.json(clases);

  } catch (err) {
    return res.status(500).json({
      message: "Error al obtener clases de inscripción",
      error: err.message
    });
  }
});

// ======================================================
//  🔥 NUEVO: OBTENER UNA MATERIA POR ID (usado por la IA)
// ======================================================
router.get("/materias/:materiaId", async (req, res) => {
  try {
    const id = normalizeId(req.params.materiaId);

    const materia = await Materia.findById(id);

    if (!materia)
      return res.status(404).json({ message: "Materia no encontrada" });

    return res.json(materia);

  } catch (err) {
    return res.status(500).json({
      message: "Error al obtener materia",
      error: err.message
    });
  }
});

export default router;