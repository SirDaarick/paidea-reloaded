import express from "express";
import { Cita } from "../models/Cita.js";
import { PeriodoInscripcion } from "../models/PeriodoInscripcion.js";
import { Usuario } from "../models/Usuario.js";

const router = express.Router();

// ===========================
//   OBTENER TODAS LAS CITAS
// ===========================
router.get('/', async (req, res) => {
    try {
        const citas = await Cita.find();
        res.status(200).json(citas);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener citas' });
    }
});

// ===============================
//   GET CITA BY ALUMNO
// ===============================
router.get('/alumno/:idAlumno', async (req, res) => {
    try {
        const cita = await Cita.findOne({ idAlumno: req.params.idAlumno });

        if (!cita) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }
        res.status(200).json(cita);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener cita' });
    }
});


// ===========================
//   OBTENER CITA POR ID
// ===========================
router.get('/:id', async (req, res) => {
    try {
        const cita = await Cita.findById(req.params.id);
        if (!cita) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }
        res.status(200).json(cita);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener cita' });
    }
});


// ===========================
//   CREAR CITA
// ===========================
router.post('/', async (req, res) => {
    try {
        const nueva = new Cita(req.body);
        const guardada = await nueva.save();
        res.status(201).json(guardada);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear cita' });
    }
});

// ===========================
//   ACTUALIZAR CITA
// ===========================
router.put('/:id', async (req, res) => {
    try {
        const actualizada = await Cita.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(actualizada);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar cita' });
    }
});

// ===========================
//   ELIMINAR CITA
// ===========================
router.delete('/:id', async (req, res) => {
    try {
        await Cita.findByIdAndDelete(req.params.id);
        res.status(200).json({ mensaje: "Cita eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar cita' });
    }
});

// ===============================================
//   ELIMINAR TODAS LAS CITAS
// ===============================================
router.delete('/todas/eliminar', async (req, res) => {
    try {
        const resultado = await Cita.deleteMany({});
        res.status(200).json({ 
            mensaje: "Todas las citas eliminadas correctamente",
            eliminadas: resultado.deletedCount
        });
    } catch (error) {
        console.error('Error al eliminar todas las citas:', error);
        res.status(500).json({ error: 'Error al eliminar citas' });
    }
});

// ===============================================
//   ASIGNAR CITAS AUTOMÁTICAMENTE POR PROMEDIO
// ===============================================
router.post('/asignar-automaticamente', async (req, res) => {
    try {
        console.log("=== INICIANDO ASIGNACIÓN AUTOMÁTICA DE CITAS ===");

        // 1. Buscar periodo de reinscripción activo
        const periodoReinscripcion = await PeriodoInscripcion.findOne({
            tipo: 'Reinscripcion'
        }).sort({ fechaInicio: -1 }); // El más reciente

        if (!periodoReinscripcion) {
            return res.status(404).json({
                error: 'No hay periodo de reinscripción configurado'
            });
        }

        console.log("Periodo encontrado:", periodoReinscripcion);

        const fechaInicio = new Date(periodoReinscripcion.fechaInicio);
        const fechaFinal = new Date(periodoReinscripcion.fechaFinal);

        // 2. Obtener todos los alumnos
        const alumnos = await Usuario.find({ 
            rol: 'Alumno',
            'dataAlumno': { $exists: true } // ⬅️ Solo alumnos con dataAlumno
        }).lean();
        
        console.log(`Total de alumnos: ${alumnos.length}`);

        // 3. Extraer promedio de cada alumno
        const alumnosConPromedio = alumnos
            .filter(alumno => alumno.dataAlumno) // ⬅️ Filtrar que tengan dataAlumno
            .map(alumno => ({
                idAlumno: alumno._id,
                boleta: alumno.boleta || 'N/A',
                nombre: alumno.nombre,
                promedio: alumno.dataAlumno.promedio || 0 // ⬅️ Acceso correcto
            }));

        console.log(`Alumnos con promedio: ${alumnosConPromedio.length}`);

        // 4. Ordenar por promedio (de mayor a menor)
        alumnosConPromedio.sort((a, b) => b.promedio - a.promedio);
        console.log("Alumnos ordenados por promedio");
        console.log("Top 5:", alumnosConPromedio.slice(0, 5).map(a => 
            `${a.nombre} (${a.promedio})`
        ));

        // 5. Generar rangos de horas
        const HORA_INICIO = 9;  // 9 AM
        const HORA_FIN = 18;    // 6 PM
        const DURACION_CITA = 60; // 60 minutos
        const DIFERENCIA_MINUTOS = 5; // 5 minutos entre citas

        const rangosCitas = [];
        let fechaActual = new Date(fechaInicio);
        
        // Generar rangos para cada día del periodo
        while (fechaActual <= fechaFinal) {
            // Solo lunes a viernes
            const diaSemana = fechaActual.getDay();
            if (diaSemana >= 1 && diaSemana <= 5) {
                
                // Generar slots de tiempo para este día
                for (let minuto = 0; minuto < (HORA_FIN - HORA_INICIO) * 60; minuto += DIFERENCIA_MINUTOS) {
                    const horaInicio = new Date(fechaActual);
                    horaInicio.setHours(HORA_INICIO + Math.floor(minuto / 60));
                    horaInicio.setMinutes(minuto % 60);
                    horaInicio.setSeconds(0);

                    const horaFin = new Date(horaInicio);
                    horaFin.setMinutes(horaFin.getMinutes() + DURACION_CITA);

                    // Solo agregar si la cita termina antes de las 6 PM
                    if (horaFin.getHours() <= HORA_FIN) {
                        rangosCitas.push({
                            fechaInicio: new Date(horaInicio),
                            fechaFinal: new Date(horaFin)
                        });
                    }
                }
            }

            // Siguiente día
            fechaActual.setDate(fechaActual.getDate() + 1);
            fechaActual.setHours(0, 0, 0, 0);
        }

        console.log(`Total de rangos de citas disponibles: ${rangosCitas.length}`);

        // 6. Calcular cuántos alumnos por rango
        const alumnosPorRango = Math.ceil(alumnosConPromedio.length / rangosCitas.length);
        console.log(`Alumnos por rango: ${alumnosPorRango}`);

        // 7. Asignar citas
        const citasCreadas = [];
        let rangoIndex = 0;

        for (let i = 0; i < alumnosConPromedio.length; i++) {
            const alumno = alumnosConPromedio[i];
            
            // Si se acabaron los rangos, reutilizar desde el principio
            if (rangoIndex >= rangosCitas.length) {
                rangoIndex = 0;
            }

            const rango = rangosCitas[rangoIndex];

            // Crear la cita
            const nuevaCita = new Cita({
                idAlumno: alumno.idAlumno,
                idPeriodoInscripcion: periodoReinscripcion._id, // ⬅️ Asegúrate que este campo exista en el modelo Cita
                fechaInicio: rango.fechaInicio,
                fechaFinal: rango.fechaFinal
            });

            await nuevaCita.save();
            citasCreadas.push(nuevaCita);

            console.log(`✓ Cita ${i+1}/${alumnosConPromedio.length}: ${alumno.nombre} (${alumno.promedio}) - ${rango.fechaInicio.toLocaleString('es-MX')}`);

            // Cada X alumnos, avanzar al siguiente rango
            if ((i + 1) % alumnosPorRango === 0) {
                rangoIndex++;
            }
        }

        console.log(`Citas creadas: ${citasCreadas.length}`);
        console.log("=== ASIGNACIÓN COMPLETADA ===");

        res.status(201).json({
            mensaje: 'Citas asignadas automáticamente',
            totalAlumnos: alumnosConPromedio.length,
            totalRangos: rangosCitas.length,
            alumnosPorRango: alumnosPorRango,
            citasCreadas: citasCreadas.length,
            periodo: {
                fechaInicio: periodoReinscripcion.fechaInicio,
                fechaFinal: periodoReinscripcion.fechaFinal
            }
        });

    } catch (error) {
        console.error('Error al asignar citas automáticamente:', error);
        res.status(500).json({ 
            error: 'Error al asignar citas',
            detalle: error.message 
        });
    }
});
export default router;