import mongoose from 'mongoose';
import { Clase } from './models/Clase.js';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGO_URI;

async function verificarClases() {
    try {
        if (!MONGODB_URI) {
            throw new Error("Falta MONGO_URI en variables de entorno.");
        }
        await mongoose.connect(MONGODB_URI);
        console.log(" Conectado a MongoDB\n");

        // Buscar una clase con profesor asignado
        const clase = await Clase.findOne({ idProfesor: { $ne: null } })
            .populate('idGrupo')
            .populate('idMateria')
            .populate('idProfesor', 'nombre')
            .populate('horario.lunes.idDia')
            .populate('horario.martes.idDia')
            .populate('horario.miercoles.idDia')
            .populate('horario.jueves.idDia')
            .populate('horario.viernes.idDia');

        if (clase) {
            console.log(" Clase encontrada:");
            console.log("Grupo:", clase.idGrupo?.nombre);
            console.log("Materia:", clase.idMateria?.nombre);
            console.log("Salón:", clase.salon);
            console.log("Profesor:", clase.idProfesor?.nombre);
            console.log("\n Horarios:");
            console.log("Lunes:", clase.horario?.lunes?.idDia);
            console.log("Martes:", clase.horario?.martes?.idDia);
            console.log("Miércoles:", clase.horario?.miercoles?.idDia);
            console.log("Jueves:", clase.horario?.jueves?.idDia);
            console.log("Viernes:", clase.horario?.viernes?.idDia);
        } else {
            console.log(" No se encontró ninguna clase con profesor");
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error(" Error:", error);
        process.exit(1);
    }
}

verificarClases();
