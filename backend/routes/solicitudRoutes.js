// backend/routes/solicitudRoutes.js
import express from 'express';
import {Solicitud} from '../models/Solicitud.js';
import {Usuario} from '../models/Usuario.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Crear directorio si no existe
const uploadsDir = 'uploads/solicitudes/';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF, JPG, JPEG y PNG'));
    }
  }
});

// Función helper para populate completo
const populateSolicitud = (query) => {
  return query
    .populate({
      path: 'idAlumno',
      select: 'nombre correo boleta dataAlumno',
      populate: {
        path: 'dataAlumno.idCarrera',
        select: 'nombre clave'
      }
    })
    .populate('procesadoPor', 'nombre correo rol');
};

// ========== CRUD BÁSICO ==========

// GET / - Listar todas las solicitudes (con filtros opcionales)
router.get('/', async (req, res) => {
  try {
    const { estado, tipoTramite, idAlumno, desde, hasta } = req.query;
    
    let filtro = {};
    
    if (estado) filtro.estado = estado;
    if (tipoTramite) filtro.tipoTramite = tipoTramite;
    if (idAlumno) filtro.idAlumno = idAlumno;
    
    // Filtro por rango de fechas
    if (desde || hasta) {
      filtro.fechaSolicitud = {};
      if (desde) filtro.fechaSolicitud.$gte = new Date(desde);
      if (hasta) filtro.fechaSolicitud.$lte = new Date(hasta);
    }
    
    const solicitudes = await populateSolicitud(
      Solicitud.find(filtro).sort({ fechaSolicitud: -1 })
    );
    
    res.json(solicitudes);
  } catch (error) {
    console.error('Error al listar solicitudes:', error);
    res.status(500).json({ message: 'Error al obtener solicitudes', error: error.message });
  }
});

// GET /:id - Obtener solicitud por ID
router.get('/:id', async (req, res) => {
  try {
    const solicitud = await populateSolicitud(
      Solicitud.findById(req.params.id)
    );
    
    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    
    res.json(solicitud);
  } catch (error) {
    console.error('Error al obtener solicitud:', error);
    res.status(500).json({ message: 'Error al obtener solicitud', error: error.message });
  }
});

// POST / - Crear nueva solicitud (con archivo opcional)
router.post('/', upload.single('archivo'), async (req, res) => {
  try {
    const { idAlumno, tipoTramite, comentarioAlumno } = req.body;
    
    // Validar que el alumno exista
    const alumno = await Usuario.findById(idAlumno);
    if (!alumno || alumno.rol !== 'Alumno') {
      return res.status(404).json({ message: 'Alumno no encontrado' });
    }
    
    // Preparar datos de la solicitud
    const solicitudData = {
      idAlumno,
      tipoTramite,
      comentarioAlumno: comentarioAlumno || '',
      estado: 'Pendiente'
    };
    
    // Si hay archivo adjunto
    if (req.file) {
      solicitudData.archivoAdjunto = {
        nombre: req.file.originalname,
        url: `/uploads/solicitudes/${req.file.filename}`,
        tipo: req.file.mimetype,
        tamaño: req.file.size
      };
    }
    
    const solicitud = new Solicitud(solicitudData);
    await solicitud.save();
    
    const solicitudCompleta = await populateSolicitud(
      Solicitud.findById(solicitud._id)
    );
    
    res.status(201).json({
      message: 'Solicitud creada exitosamente',
      solicitud: solicitudCompleta
    });
    
  } catch (error) {
    console.error('Error al crear solicitud:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Error de validación',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ message: 'Error al crear solicitud', error: error.message });
  }
});

// PUT /:id - Actualizar solicitud (para admin)
router.put('/:id', upload.single('documentoGenerado'), async (req, res) => {
  try {
    const {
      estado,
      comentarioAdmin,
      requierePresencia,
      fechaCita,
      motivoRechazo,
      procesadoPor
    } = req.body;
    
    const solicitud = await Solicitud.findById(req.params.id);
    
    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    
    // Actualizar campos
    if (estado) {
      try {
        await solicitud.cambiarEstado(estado, procesadoPor);
      } catch (err) {
        return res.status(400).json({ message: err.message });
      }
    }
    
    if (comentarioAdmin !== undefined) solicitud.comentarioAdmin = comentarioAdmin;
    if (requierePresencia !== undefined) {
      solicitud.requierePresencia = requierePresencia === 'true' || requierePresencia === true;
    }
    if (fechaCita) solicitud.fechaCita = new Date(fechaCita);
    if (motivoRechazo) solicitud.motivoRechazo = motivoRechazo;
    
    // Si se subió documento generado
    if (req.file) {
      solicitud.documentoGenerado = {
        nombre: req.file.originalname,
        url: `/uploads/solicitudes/${req.file.filename}`,
        tipo: req.file.mimetype,
        fechaGeneracion: new Date()
      };
      
      // Si se sube documento, automáticamente marcar como completado
      if (solicitud.estado === 'En proceso') {
        solicitud.estado = 'Completado';
        solicitud.fechaCompletado = new Date();
      }
    }
    
    await solicitud.save();
    
    const solicitudActualizada = await populateSolicitud(
      Solicitud.findById(solicitud._id)
    );
    
    res.json({
      message: 'Solicitud actualizada exitosamente',
      solicitud: solicitudActualizada
    });
    
  } catch (error) {
    console.error('Error al actualizar solicitud:', error);
    res.status(500).json({ message: 'Error al actualizar solicitud', error: error.message });
  }
});

// DELETE /:id - Eliminar solicitud (solo si está pendiente)
router.delete('/:id', async (req, res) => {
  try {
    const solicitud = await Solicitud.findById(req.params.id);
    
    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    
    // Solo permitir eliminar si está pendiente
    if (solicitud.estado !== 'Pendiente') {
      return res.status(400).json({
        message: 'Solo se pueden eliminar solicitudes en estado Pendiente'
      });
    }
    
    await Solicitud.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Solicitud eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar solicitud:', error);
    res.status(500).json({ message: 'Error al eliminar solicitud', error: error.message });
  }
});

// ========== ENDPOINTS ESPECIALIZADOS ==========

// GET /alumno/:idAlumno - Solicitudes de un alumno específico
router.get('/alumno/:idAlumno', async (req, res) => {
  try {
    const solicitudes = await populateSolicitud(
      Solicitud.find({ idAlumno: req.params.idAlumno })
        .sort({ fechaSolicitud: -1 })
    );
    
    res.json(solicitudes);
  } catch (error) {
    console.error('Error al obtener solicitudes del alumno:', error);
    res.status(500).json({ message: 'Error al obtener solicitudes', error: error.message });
  }
});

// GET /estado/pendientes - Solicitudes pendientes para admin
router.get('/estado/pendientes', async (req, res) => {
  try {
    const solicitudes = await populateSolicitud(
      Solicitud.find({ estado: 'Pendiente' })
        .sort({ fechaSolicitud: 1 }) // Más antiguas primero
    );
    
    res.json(solicitudes);
  } catch (error) {
    console.error('Error al obtener solicitudes pendientes:', error);
    res.status(500).json({ message: 'Error al obtener solicitudes', error: error.message });
  }
});

// GET /estado/completadas - Solicitudes completadas
router.get('/estado/completadas', async (req, res) => {
  try {
    const solicitudes = await populateSolicitud(
      Solicitud.find({ estado: 'Completado' })
        .sort({ fechaCompletado: -1 })
    );
    
    res.json(solicitudes);
  } catch (error) {
    console.error('Error al obtener solicitudes completadas:', error);
    res.status(500).json({ message: 'Error al obtener solicitudes', error: error.message });
  }
});

// GET /admin/estadisticas - Estadísticas generales
router.get('/admin/estadisticas', async (req, res) => {
  try {
    const porEstado = await Solicitud.aggregate([
      {
        $group: {
          _id: '$estado',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const porTipo = await Solicitud.aggregate([
      {
        $group: {
          _id: '$tipoTramite',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const tiempoPromedio = await Solicitud.aggregate([
      {
        $match: {
          estado: 'Completado',
          fechaCompletado: { $exists: true }
        }
      },
      {
        $project: {
          diasProcesamiento: {
            $divide: [
              { $subtract: ['$fechaCompletado', '$fechaSolicitud'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          promedio: { $avg: '$diasProcesamiento' }
        }
      }
    ]);
    
    res.json({
      porEstado,
      porTipo,
      tiempoPromedioCompletado: tiempoPromedio[0]?.promedio || 0
    });
    
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
  }
});

export default router;