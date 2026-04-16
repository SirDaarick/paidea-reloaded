import mongoose from "mongoose";

const PeriodoAcademicoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        unique: true,
        trim: true,
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

export const PeriodoAcademico = mongoose.model("PeriodoAcademico", PeriodoAcademicoSchema);
