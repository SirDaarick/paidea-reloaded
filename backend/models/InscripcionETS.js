import mongoose from "mongoose";

const InscripcionETSSchema = new mongoose.Schema({
    idETS: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ETS',
        required: true,
    },
    idInscripcion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inscripcion',
        required: true,
    },
}, { timestamps: true });

export const InscripcionETS = mongoose.model("InscripcionETS", InscripcionETSSchema);