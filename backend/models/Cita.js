import mongoose from "mongoose";

const CitaSchema = new mongoose.Schema({
    idAlumno: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
    },
    idPeriodoInscripcion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PeriodoInscripcion',
        required: true,
    },
    fechaInicio: {
        type: Date,
        required: true,
    },
    fechaFinal: {
        type: Date,
        required: true,
    }
}, { timestamps: true });

export const Cita = mongoose.model("Cita", CitaSchema);
