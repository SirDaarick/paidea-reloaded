// Ejemplo de Script de Migración
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { Usuario } from './models/Usuario.js'; 
const saltRounds = 10;
const MONGODB_URI = process.env.MONGO_URI;

async function migratePasswords() {
    if (!MONGODB_URI) {
        throw new Error("Falta MONGO_URI en variables de entorno.");
    }
    await mongoose.connect(MONGODB_URI);

    console.log("Iniciando migración de contraseñas...");

    const users = await Usuario.find({}); // Obtener todos los usuarios

    for (const user of users) {

        // ✔ CORRECCIÓN: no re-hashear contraseñas que ya son hashes bcrypt
        if (
            !user.contrasena.startsWith('$2a') &&
            !user.contrasena.startsWith('$2b') &&
            !user.contrasena.startsWith('$2y')
        ) { 
            try {
                console.log(`Hasheando contraseña para el usuario: ${user.correo}`);

                const salt = await bcrypt.genSalt(saltRounds);
                const hashedPassword = await bcrypt.hash(user.contrasena, salt);

                user.contrasena = hashedPassword;

                await user.save({ validateBeforeSave: false }); 

            } catch (error) {
                console.error(`Error al hashear ${user.correo}:`, error);
            }
        }
    }

    console.log("Migración completada.");
    mongoose.disconnect();
}

migratePasswords();
