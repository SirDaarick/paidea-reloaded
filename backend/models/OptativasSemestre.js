// models/OptativasSemestre.js
import mongoose from "mongoose";

const OptativasSemestreSchema = new mongoose.Schema({
    idCarrera: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Carrera',
    required: true,
  },
    semestre: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
        unique: true,
    },
  num_optativas: {
        type: Number,
        required: true,
        min: 0,
    }
}, { timestamps: true });

export const OptativasSemestre = mongoose.model("OptativasSemestre", OptativasSemestreSchema);
