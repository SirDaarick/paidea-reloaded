// models/PeriodoInscripcion.js
import mongoose from "mongoose";

const PeriodoInscripcionSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: [
      'Reinscripcion',
      'ETS',
      'Calif-P1',
      'Calif-P2',
      'Calif-P3'
    ],
    required: true,
  },
  fechaInicio: {
    type: Date,
    required: true,
  },
  fechaFinal: {
    type: Date,
    required: true,
  },
  idPeriodoAcademico: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PeriodoAcademico",
    required: true
  }
}, { timestamps: true });

export const PeriodoInscripcion = mongoose.model(
  "PeriodoInscripcion",
  PeriodoInscripcionSchema
);
