import mongoose from "mongoose";

const ETSSchema = new mongoose.Schema({
    idProfesor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        required: true,
    },
    idCarrera: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Carrera",
        required: true,
    },
    idMateria: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Materia",
        required: true,
    },
    idDiaSemana: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DiaSemana",
        required: true,
    },
    idPeriodo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Periodo",
        required: true,
    },
    salon: {
        type: String,
        required: true,
    },
}, { timestamps: true });

export const ETS = mongoose.model("ETS", ETSSchema);