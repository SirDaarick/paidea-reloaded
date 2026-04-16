import mongoose from "mongoose";

const InscripcionSchema = new mongoose.Schema({
    idAlumno: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario', // Referencia a Usuario, se asume que es Alumno
        required: true,
    },
    idPeriodo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PeriodoAcademico', // Referencia a Usuario, se asume que es Alumno
        required: true,
    },
    fechaInscripcion: {
        type: Date,
        default: Date.now,
    },
    creditos: {
        type: Number,
        required: true,
        min: 0,
    },
}, { timestamps: true });


export const Inscripcion = mongoose.model("Inscripcion", InscripcionSchema);
