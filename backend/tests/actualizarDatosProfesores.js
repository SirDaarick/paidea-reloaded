import 'dotenv/config';
import mongoose from "mongoose";
import { Usuario } from "../models/Usuario.js";
const MONGODB_URI = process.env.MONGO_URI;

async function actualizarDatosProfesores() {
    try {
        if (!MONGODB_URI) {
            throw new Error("Falta MONGO_URI en variables de entorno.");
        }
        await mongoose.connect(MONGODB_URI);
        console.log("\n=== ACTUALIZANDO DATOS DE PROFESORES ===\n");

        // Obtener todos los profesores
        const profesores = await Usuario.find({ rol: "Profesor" });
        console.log(`📋 Total de profesores encontrados: ${profesores.length}\n`);

        let actualizados = 0;
        const sexos = ["Masculino", "Femenino"];
        const estadosCiviles = ["Soltero", "Casado", "Divorciado", "Viudo"];

        for (const profesor of profesores) {
            // Generar datos aleatorios pero realistas
            const sexo = sexos[Math.floor(Math.random() * sexos.length)];
            const estadoCivil = estadosCiviles[Math.floor(Math.random() * estadosCiviles.length)];

            // Inicializar datosPersonales si no existe
            if (!profesor.datosPersonales) {
                profesor.datosPersonales = {};
            }

            // Actualizar campos
            profesor.datosPersonales.sexo = sexo;
            profesor.datosPersonales.estadoCivil = estadoCivil;

            // Guardar
            await profesor.save();

            console.log(`✅ ${profesor.nombre}`);
            console.log(`   Sexo: ${sexo}`);
            console.log(`   Estado Civil: ${estadoCivil}\n`);

            actualizados++;
        }

        console.log(`\n🎉 Actualización completada: ${actualizados} profesores actualizados`);

        // Verificar algunos profesores
        console.log("\n=== VERIFICACIÓN ===\n");
        const pedroActualizado = await Usuario.findOne({ nombre: /Pedro.*Rodríguez/i });
        if (pedroActualizado) {
            console.log(`Pedro Rodríguez Jiménez:`);
            console.log(`  Sexo: ${pedroActualizado.datosPersonales?.sexo || "N/A"}`);
            console.log(`  Estado Civil: ${pedroActualizado.datosPersonales?.estadoCivil || "N/A"}`);
        }

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await mongoose.connection.close();
    }
}

actualizarDatosProfesores();
