import mongoose from "mongoose";

const DiaSemanaSchema = new mongoose.Schema({
    // Almacenar horarios como string 'HH:MM' o Number para manejo en JS
    horarioInicio: {
        type: String,
        required: true,
    },
    horarioFinal: {
        type: String,
        required: true,
    },
}, { timestamps: true });

export const DiaSemana = mongoose.model("DiaSemana", DiaSemanaSchema);
