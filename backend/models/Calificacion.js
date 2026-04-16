import mongoose from "mongoose";

const CalificacionSchema = new mongoose.Schema({
    idInscripcionClase: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InscripcionClase',
        required: true,
    },
    valor: {
        type: Number,
        required: true,
        min: 0,
        max: 10,
    },
    fechaRegistro: {
        type: Date,
        default: Date.now,
    },
    tipoEvaluacion: {
        type: String,
        required: true,
    }
}, { timestamps: true });

export const Calificacion = mongoose.model("Calificacion", CalificacionSchema);