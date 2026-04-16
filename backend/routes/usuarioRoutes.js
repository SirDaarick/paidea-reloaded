import express from 'express';
import { Usuario } from '../models/Usuario.js';
import nodemailer from 'nodemailer'; // 👈 AGREGA ESTO
const router = express.Router();

//--- Rutas CRUD para Usuarios ---//

router.get('/', async (req, res) => {
    try {
        // Se utiliza el método .find() para traer todos los documentos.
        // No se requiere .populate() ya que todos los sub-documentos están embebidos.
        const usuarios = await Usuario.find({});
        res.status(200).json(usuarios);
    } catch (error) {
        console.error("Error al obtener los usuarios:", error);
        res.status(500).json({ error: 'Error al obtener los usuarios', detalle: error.message });
    }
});


router.get('/boleta/:boleta', async (req, res) => {
    try {
        const usuario = await Usuario.findOne({ boleta: req.params.boleta });
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.status(200).json(usuario);
    } catch (error) {
        console.error("Error al obtener el usuario:", error);
        res.status(500).json({ error: 'Error al obtener el usuario', detalle: error.message });
    }
});


router.get('/rfc/:rfc', async (req, res) => {
    try {
        // Buscar por el campo anidado datosPersonales.rfc
        const usuario = await Usuario.findOne({ 'datosPersonales.rfc': req.params.rfc });

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.status(200).json(usuario);
    } catch (error) {
        console.error("Error al obtener el usuario:", error);
        res.status(500).json({ error: 'Error al obtener el usuario', detalle: error.message });
    }
});

router.get('/profesores', async (req, res) => {
    try {
        const profesores = await Usuario.find({ rol: 'Profesor' });
        res.status(200).json(profesores);
    } catch (error) {
        console.error("Error al obtener los profesores:", error);
        res.status(500).json({ error: 'Error al obtener los profesores', detalle: error.message });
    }
});


router.get('/:id', async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.status(200).json(usuario);
    } catch (error) {
        console.error("Error al obtener el usuario:", error);
        res.status(500).json({ error: 'Error al obtener el usuario', detalle: error.message });
    }
});


router.post('/', async (req, res) => {
    try {
        const usuario = new Usuario(req.body);
        const savedUsuario = await usuario.save();
        res.status(201).json(savedUsuario);
    } catch (error) {
        console.error("Error al crear el usuario:", error);

        // Mongoose Validation Error (ej. campos requeridos, 'unique', 'enum')
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Error de validación al crear el usuario', detalle: error.message });
        }
        // Duplicate Key Error (ej. 'unique: true' en correo o curp)
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Datos duplicados', detalle: 'El correo, CURP o NSS ya existe.' });
        }

        res.status(500).json({ error: 'Error interno al crear el usuario', detalle: error.message });
    }
});

router.post('/compare-password/:id', async (req, res) => {
    try {
        const { password } = req.body;

        const usuario = await Usuario.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const isMatch = await usuario.comparePassword(password);
        res.status(200).json({ isMatch });
    } catch (error) {
        console.error("Error al comparar la contraseña:", error);
        res.status(500).json({ error: 'Error al comparar la contraseña', detalle: error.message });
    }
});


// La forma SEGURA de actualizar la contraseña - DEBE IR ANTES DEL PUT /:id
router.put("/users/:id/password", async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Validar que se envió la nueva contraseña
    if (!newPassword) {
      return res.status(400).json({ 
        message: "La nueva contraseña es requerida" 
      });
    }

    // Validar longitud mínima
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "La contraseña debe tener al menos 6 caracteres" 
      });
    }

    // Buscar usuario
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({ 
        message: "Usuario no encontrado" 
      });
    }

    // Actualizar contraseña (el pre-save hook de bcrypt la hasheará automáticamente)
    usuario.contrasena = newPassword;
    
    // Marcar que ya NO es primer inicio
    usuario.primerInicio = false;
    
    // Guardar cambios
    await usuario.save();

    console.log(`✅ Contraseña actualizada para usuario: ${usuario.nombre} (${usuario.correo})`);

    res.status(200).json({ 
      message: "Contraseña actualizada correctamente",
      primerInicio: usuario.primerInicio
    });

  } catch (error) {
    console.error("❌ Error actualizando contraseña:", error);
    res.status(500).json({ 
      message: "Error al actualizar la contraseña",
      error: error.message 
    });
  }
});


router.put('/:id', async (req, res) => {
    try {
        // Si estamos actualizando la contraseña, necesitamos usar .save() para ejecutar el pre-save hook
        if (req.body.contrasena) {
            const usuario = await Usuario.findById(req.params.id);

            if (!usuario) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            // Asignar todos los campos del body al usuario
            Object.keys(req.body).forEach(key => {
                usuario[key] = req.body[key];
            });

            // Guardar (esto ejecutará el pre-save hook que hashea la contraseña)
            await usuario.save();

            return res.status(200).json(usuario);
        }

        // Si no hay contraseña, usar el método normal que es más eficiente
        // Ejecutar validadores al actualizar para manejar campos condicionales (dataAlumno/dataProfesor)
        const updatedUsuario = await Usuario.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedUsuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.status(200).json(updatedUsuario);
    } catch (error) {
        console.error("Error al actualizar el usuario:", error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Error de validación al actualizar el usuario', detalle: error.message });
        }
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Datos duplicados', detalle: 'El correo, CURP o NSS ya existe en otro usuario.' });
        }

        res.status(500).json({ error: 'Error interno al actualizar el usuario', detalle: error.message });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const deletedUsuario = await Usuario.findByIdAndDelete(req.params.id);
        if (!deletedUsuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.status(200).json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error("Error al eliminar el usuario:", error);
        res.status(500).json({ error: 'Error al eliminar el usuario', detalle: error.message });
    }
});

// ... (tus otras rutas GET, POST, PUT, DELETE) ...

// 👇 PEGA ESTO ANTES DEL export default router
router.post('/recuperar-contrasena', async (req, res) => {
    const { identifier } = req.body;
    
    try {
        // 1. Buscar usuario
        const usuario = await Usuario.findOne({ 
           $or: [ { boleta: identifier }, { 'datosPersonales.rfc': identifier } ] 
        });
    
        if (!usuario) {
           return res.status(404).json({ error: "Usuario no encontrado" });
        }
    
        // 2. Generar nueva contraseña temporal
        // Nota: En producción, lo ideal es enviar un link con token, 
        // pero para este ejemplo rápido usaremos una contraseña temporal.
        const nuevaPass = "Temporal" + Math.floor(1000 + Math.random() * 9000); // Ej: Temporal4521
        
        // El pre-save hook de tu modelo Usuario se encargará de encriptarla
        usuario.contrasena = nuevaPass; 
        usuario.primerInicio = true; // Forzamos a que la cambie al entrar
        await usuario.save();
    
        // 3. Configurar Nodemailer
        // ⚠️ IMPORTANTE: Si usas Gmail, necesitas una "Contraseña de Aplicación", no tu contraseña normal.
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'soporte.paidea.escom@gmail.com', // 👈 PON TU CORREO REAL AQUÍ
                pass: 'paidea123' // 👈 PON TU CLAVE DE APLICACIÓN AQUÍ
            }
        });
    
        const mailOptions = {
            from: 'Soporte PAIDEA <soporte.paidea.escom@gmail.com>',
            to: usuario.correo,
            subject: 'Recuperación de Contraseña - PAIDEA',
            text: `Hola ${usuario.nombre},\n\nTu contraseña ha sido restablecida temporalmente.\n\nNueva contraseña: ${nuevaPass}\n\nPor favor inicia sesión y cámbiala inmediatamente.\n\nAtte: Equipo PAIDEA`
        };
    
        await transporter.sendMail(mailOptions);
        
        res.status(200).json({ mensaje: "Correo enviado correctamente" });

    } catch (error) {
        console.error("Error enviando correo:", error);
        res.status(500).json({ error: "Error al procesar la solicitud", detalle: error.message });
    }
});

export default router; // 👈 ESTO DEBE SEGUIR SIENDO LO ÚLTIMO
