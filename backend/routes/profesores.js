import express from 'express';
import { Usuario } from '../models/Usuario.js'; // Ajusta si tu modelo está en otra ruta
//OLA
const router = express.Router();

// GET: Listar solo Profesores
router.get('/listar', async (req, res) => {
    try {
        // Filtramos por rol "Profesor"
        const profesores = await Usuario.find({ rol: "Profesor" });
        res.status(200).json(profesores);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST: Crear Profesor (Alta)
router.post('/crear', async (req, res) => {
    try {
        // 1. RECIBIMOS EL CURP
        const { rfc, curp, nombre, academia } = req.body;

        const timestamp = Date.now(); 

        const nuevoProfesor = new Usuario({
            nombre,
            correo: `${nombre.split(' ')[0].toLowerCase()}.${timestamp}@ipn.mx`, 
            contrasena: "$2b$10$ejZ0rVAWF2s...", 
            rol: "Profesor",
            
            datosPersonales: {
                rfc: rfc.toUpperCase(),
                
                // 2. USAMOS EL CURP REAL QUE TÚ ESCRIBISTE
                curp: curp.toUpperCase(), 
                
                nacionalidad: "Mexicana"
            },
            
            dataProfesor: {
                departamento: academia 
            },
            direcciones: [] 
        });

        await nuevoProfesor.save();
        res.status(201).json(nuevoProfesor);
    } catch (error) {
        console.error(error);
        // Manejo de error específico de Mongo (Código 11000 = Duplicado)
        if (error.code === 11000) {
             return res.status(400).json({ message: "Error: El RFC o el CURP ya existen en el sistema." });
        }
        res.status(500).json({ message: error.message });
    }
});

// DELETE: Eliminar Profesor
router.delete('/:id', async (req, res) => {
    try {
        const eliminado = await Usuario.findByIdAndDelete(req.params.id);
        if (!eliminado) return res.status(404).json({ message: "Profesor no encontrado" });
        res.json({ message: "Profesor eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;