import mongoose from "mongoose";

const GrupoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true,
    },
    idCarrera: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Carrera',
        required: true,
    },
    semestre: {
        type: Number,
        required: true,
        min: 1,
    },
    turno: {
        type: String,
        required: true,
        enum: ['Matutino', 'Vespertino', 'Mixto'],
    },
    idPeriodo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PeriodoAcademico',
        required: true,
    },
}, { timestamps: true });

export const Grupo = mongoose.model("Grupo", GrupoSchema);