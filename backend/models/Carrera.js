import mongoose from "mongoose";

const CarreraSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    clave: {
        type: String,
        required: true,
        trim: true,
    },
    cantidadSemestres: {
        type: Number,
        required: true,
        min: 1,
    },
    creditosTotal: {
        type: Number,
        required: true,
        min: 1,
    },
    PlanAcademico: {
        type: Number,
        required: true,
    }
}, { timestamps: true });

export const Carrera = mongoose.model("Carrera", CarreraSchema);
