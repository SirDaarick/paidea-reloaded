import mongoose from "mongoose";

// --- Subesquema de Horario por Día ---
const DiaHorarioSchema = new mongoose.Schema({
  idDia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiaSemana',
    default: null,
  },
}, { _id: false });

// --- Esquema principal de Clase ---
const ClaseSchema = new mongoose.Schema({
  idGrupo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grupo',
    required: true,
  },
  idMateria: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Materia',
    required: true,
  },
  salon: {
    type: String,
    trim: true,
    default: null,
  },
  cupoMaximo: {
    type: Number,
    default: 30,
    min: 1,
  },
  idProfesor: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Usuario',
  validate: {
    validator: async function (id) {
      if (!id) return true; // ✅ Permitir null/undefined
      // Si hay un ID, validar que sea un profesor
      const UsuarioModel = mongoose.models && mongoose.models.Usuario;
      if (!UsuarioModel) return true;
      const usuario = await UsuarioModel.findById(id);
      return usuario && usuario.rol === 'Profesor';
    },
    message: 'El usuario asignado no tiene rol de Profesor',
  },
},
  horario: {
    lunes: DiaHorarioSchema,
    martes: DiaHorarioSchema,
    miercoles: DiaHorarioSchema,
    jueves: DiaHorarioSchema,
    viernes: DiaHorarioSchema,
    sabado: DiaHorarioSchema,
  },
}, { timestamps: true });

// --- Índices ---
ClaseSchema.index({ idGrupo: 1, idMateria: 1 }, { unique: true });
ClaseSchema.index({ idProfesor: 1 });

// --- Validación personalizada ---
// Validar que la clase tenga al menos un día asignado en el horario
ClaseSchema.pre('save', function (next) {
  if (this.horario) {
    const tieneAlgunDia = Object.values(this.horario).some(dia => dia && dia.idDia);
    if (!tieneAlgunDia) {
      return next(new Error('La clase debe tener al menos un día asignado.'));
    }
  }
  next();
});

export const Clase = mongoose.model("Clase", ClaseSchema);
