// backend/models/Solicitud.js
import mongoose from 'mongoose';

const solicitudSchema = new mongoose.Schema({
  // Referencia al alumno solicitante
  idAlumno: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El alumno es requerido']
  },
  
  // Datos básicos de la solicitud
  tipoTramite: {
    type: String,
    required: [true, 'El tipo de trámite es requerido'],
    enum: [
      'Constancia de estudios',
      'Boleta global',
      'Baja temporal',
      'Baja definitiva',
      'Constancia de servicio social',
      'Carta de buena conducta',
      'Constancia de créditos',
      'Constancia de horario'
    ]
  },
  
  // Estados del trámite
  estado: {
    type: String,
    required: true,
    enum: ['Pendiente', 'En proceso', 'Completado', 'Rechazado', 'Requiere presencia'],
    default: 'Pendiente'
  },
  
  // Fechas de seguimiento
  fechaSolicitud: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  fechaProcesado: {
    type: Date,
    default: null
  },
  
  fechaCompletado: {
    type: Date,
    default: null
  },
  
  // Archivo adjunto (carta para baja temporal, etc.)
  archivoAdjunto: {
    nombre: String,
    url: String,
    tipo: String, // 'application/pdf', 'image/jpeg', etc.
    tamaño: Number // en bytes
  },
  
  // Documento generado por el admin
  documentoGenerado: {
    nombre: String,
    url: String,
    tipo: String,
    fechaGeneracion: Date
  },
  
  // Comentarios y observaciones
  comentarioAlumno: {
    type: String,
    maxlength: [500, 'El comentario no puede exceder 500 caracteres'],
    default: ''
  },
  
  comentarioAdmin: {
    type: String,
    maxlength: [500, 'El comentario del admin no puede exceder 500 caracteres'],
    default: ''
  },
  
  // Control de citas
  requierePresencia: {
    type: Boolean,
    default: false
  },
  
  fechaCita: {
    type: Date,
    default: null
  },
  
  // Auditoría
  procesadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario', // Admin que procesó
    default: null
  },
  
  motivoRechazo: {
    type: String,
    maxlength: [300, 'El motivo de rechazo no puede exceder 300 caracteres'],
    default: ''
  }
  
}, {
  timestamps: true // createdAt, updatedAt automáticos
});

// Índices para optimizar búsquedas
solicitudSchema.index({ idAlumno: 1, fechaSolicitud: -1 });
solicitudSchema.index({ estado: 1, fechaSolicitud: -1 });
solicitudSchema.index({ tipoTramite: 1 });

// Virtual para calcular tiempo de procesamiento
solicitudSchema.virtual('tiempoProcesamiento').get(function() {
  if (!this.fechaCompletado || !this.fechaSolicitud) return null;
  const diff = this.fechaCompletado - this.fechaSolicitud;
  return Math.floor(diff / (1000 * 60 * 60 * 24)); // días
});

// Método para cambiar estado con validaciones
solicitudSchema.methods.cambiarEstado = function(nuevoEstado, adminId) {
  const transicionesValidas = {
    'Pendiente': ['En proceso', 'Rechazado'],
    'En proceso': ['Completado', 'Rechazado', 'Requiere presencia'],
    'Requiere presencia': ['En proceso', 'Completado', 'Rechazado'],
    'Completado': [],
    'Rechazado': []
  };
  
  if (!transicionesValidas[this.estado].includes(nuevoEstado)) {
    throw new Error(`No se puede cambiar de ${this.estado} a ${nuevoEstado}`);
  }
  
  this.estado = nuevoEstado;
  
  if (nuevoEstado === 'En proceso' && !this.fechaProcesado) {
    this.fechaProcesado = new Date();
    this.procesadoPor = adminId;
  }
  
  if (nuevoEstado === 'Completado') {
    this.fechaCompletado = new Date();
  }
  
  return this.save();
};

export const Solicitud = mongoose.model('Solicitud', solicitudSchema);