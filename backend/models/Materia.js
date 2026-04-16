import mongoose from "mongoose";

const MateriaSchema = new mongoose.Schema({
    idCarrera: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Carrera',
        required: true,
    },
    clave: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    nombre: {
        type: String,
        required: true,
        trim: true,
    },
    creditos: {
        type: Number,
        required: true,
        min: 0,
    },
    semestre: { 
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    optativa: {
        type: Boolean,
        default: false,
    },
    url: {
        type: String,
        default: null,
    },
    // Relación many-to-many consigo misma (Prerrequisitos)
    prerrequisitos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Materia',
    }]
}, { timestamps: true });

export const Materia = mongoose.model("Materia", MateriaSchema);
