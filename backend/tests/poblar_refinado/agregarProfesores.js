// agregarProfesores.js
// Ejecutar con: node agregarProfesores.js
// Este script lee profesores desde profesores.json y los agrega a la base de datos

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = "https://paidea.onrender.com";

async function apiCall(endpoint, method = 'GET', body = null) {
    const options = { method, headers: {} };
    if (body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }
    try {
        const res = await fetch(`${API_URL}${endpoint}`, options);
        let data = null;
        const text = await res.text();
        try { data = text ? JSON.parse(text) : null; } catch { data = text; }
        if (!res.ok) {
            const msg = data && (data.detalle || data.message || data.error) ? (data.detalle || data.message || data.error) : JSON.stringify(data);
            throw new Error(`Error ${res.status} en ${method} ${endpoint}: ${msg}`);
        }
        return data;
    } catch (error) {
        console.error(`apiCall fallo -> ${method} ${endpoint}:`, error.message);
        throw error;
    }
}

async function agregarProfesores() {
    console.log("=== Agregando Profesores desde JSON ===\n");

    // Leer el archivo JSON
    const jsonPath = path.join(__dirname, 'profesores.json');
    
    let profesores;
    try {
        const jsonData = fs.readFileSync(jsonPath, 'utf8');
        profesores = JSON.parse(jsonData);
        console.log(`✓ Archivo JSON leído correctamente`);
        console.log(`✓ Total de profesores en el archivo: ${profesores.length}\n`);
    } catch (error) {
        console.error(`❌ Error al leer el archivo JSON:`, error.message);
        return;
    }

    const timestamp = Date.now();
    const creados = [];
    let exitosos = 0;
    let fallidos = 0;

    console.log("--- Creando Profesores ---\n");

    for (let i = 0; i < profesores.length; i++) {
        const profesor = profesores[i];

        try {
            // Agregar sufijos únicos a RFC y CURP para evitar duplicados
            const payload = {
                boleta: profesor.boleta,
                nombre: profesor.nombre,
                correo: profesor.correo.replace('@ipn.mx', `.${timestamp}@ipn.mx`),
                contrasena: profesor.contrasena,
                rol: "Profesor",
                datosPersonales: {
                    ...profesor.datosPersonales,
                    rfc: `${profesor.datosPersonales.rfc}${timestamp.toString().slice(-3)}`,
                    curp: `${profesor.datosPersonales.curp}${(timestamp % 100).toString().padStart(2, '0')}`
                },
                direcciones: profesor.direcciones,
                dataProfesor: profesor.dataProfesor
            };

            const respuesta = await apiCall('/usuario', 'POST', payload);
            const idProfesor = respuesta._id ?? respuesta.id_usuario ?? respuesta.id;

            creados.push({
                nombre: profesor.nombre,
                id: idProfesor,
                correo: payload.correo,
                boleta: profesor.boleta
            });

            exitosos++;
            console.log(`✅ Profesor ${i + 1}/${profesores.length} creado: ${profesor.nombre}`);
            console.log(`   ID: ${idProfesor}`);
            console.log(`   Boleta: ${profesor.boleta}`);
            console.log(`   Correo: ${payload.correo}`);
            console.log();

        } catch (error) {
            fallidos++;
            console.log(`❌ Error al crear profesor ${i + 1}/${profesores.length} (${profesor.nombre}): ${error.message}`);
            console.log();
        }
    }

    // Resumen final
    console.log("\n=== RESUMEN FINAL ===");
    console.log(`Total en archivo: ${profesores.length}`);
    console.log(`✅ Exitosos: ${exitosos}`);
    console.log(`❌ Fallidos: ${fallidos}`);

    console.log(`\nProfesores creados:`);

    creados.forEach((p, idx) => {
        console.log(`${idx + 1}. ${p.nombre}`);
        console.log(`   ID MongoDB: ${p.id}`);
        console.log(`   Boleta: ${p.boleta}`);
        console.log(`   Correo: ${p.correo}`);
    });

    if (creados.length > 0) {
        console.log(`\nPrimeros 5 profesores creados:`);
        creados.slice(0, 5).forEach((p, idx) => {
            console.log(`${idx + 1}. ${p.nombre}`);
            console.log(`   ID MongoDB: ${p.id}`);
            console.log(`   Boleta: ${p.boleta}`);
            console.log(`   Correo: ${p.correo}`);
        });

        console.log("\n📌 Para probar en el frontend:");
        console.log("   1. Abre la consola del navegador (F12)");
        console.log("   2. Ejecuta:");
        console.log(`      localStorage.setItem("profesorId", "${creados[0].id}");`);
        console.log(`      location.reload();`);
        console.log("   3. Deberías ver los datos del profesor cargados");
    }

    console.log("\n¡Proceso completado!");
}

// Ejecutar
agregarProfesores().catch(err => {
    console.error("\n❌ Error general:", err);
    process.exit(1);
});