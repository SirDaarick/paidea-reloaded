import mongoose from "mongoose";

const CalificacionETSSchema = new mongoose.Schema({
    idInscripcionETS: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InscripcionETS',
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
}, { timestamps: true });

export const CalificacionETS = mongoose.model("CalificacionETS", CalificacionETSSchema);