// models/InscripcionClase.js
import mongoose from "mongoose";

const InscripcionClaseSchema = new mongoose.Schema({
  idInscripcion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inscripcion',
    required: true,
  },
  idClase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clase',
    required: true,
  },
  estatus: {
    type: String,
    enum: ['Inscrito', 'Aprobado', 'Reprobado', 'Baja'],
    default: 'Inscrito',
  }
}, { timestamps: true });

// --- Índices para optimización ---
// Índice compuesto único: evita inscripciones duplicadas
InscripcionClaseSchema.index({ idInscripcion: 1, idClase: 1 }, { unique: true });

// Índice para consultas rápidas de ocupabilidad por clase
InscripcionClaseSchema.index({ idClase: 1 });

// Índice para consultas por inscripción
InscripcionClaseSchema.index({ idInscripcion: 1 });

// Índice para filtrar por estatus
InscripcionClaseSchema.index({ estatus: 1 });

export const InscripcionClase = mongoose.model("InscripcionClase", InscripcionClaseSchema);