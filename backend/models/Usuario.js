import mongoose from "mongoose";
import bcrypt from "bcrypt";


const saltRounds = 10;
// --- Subesquemas ---
// DatosPersonales (embebido, 1:1)
const DatosPersonalesSchema = new mongoose.Schema({
  curp: {
    type: String,
    uppercase: true,
    trim: true,
  },
  rfc: {
    type: String,
    uppercase: true,
    trim: true,
  },
  nacimiento: Date,
  nacionalidad: String,
  entidadNacimiento: String,
  telefono: String,
  movil: String,
  labora: String,
  telOficina: String,
  plantel: String,
  sexo: {
    type: String,
    enum: ['Masculino', 'Femenino'],
  },
  estadoCivil: {
    type: String,
    enum: ['Soltero', 'Casado', 'Divorciado', 'Viudo'],
  },
}, { _id: false });

// Direccion (embebido, 1:N)
const DireccionSchema = new mongoose.Schema({
  estado: String,
  delegacion: String,
  colonia: String,
  calle: String,
  noExt: String,
  noInt: String,
  cp: String,
}, { _id: false });

// Datos Alumno (subdocumento)
const AlumnoDataSchema = new mongoose.Schema({
  idCarrera: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Carrera',
  },
  promedio: {
    type: Number,
    min: 0,
    max: 10,
  },
  creditosCursados: {
    type: Number,
    default: 0,
    min: 0,
  },
  situacionEscolar: String,
}, { _id: false });

// Datos Profesor (subdocumento)
const ProfesorDataSchema = new mongoose.Schema({
  departamento: String,
}, { _id: false });

/** Esquema principal de Usuario */
const UsuarioSchema = new mongoose.Schema({
  boleta: {
    type: Number,
    // ya no forzamos unique/required aquí: lo controlamos por índices condicionales abajo
  },
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  correo: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  contrasena: {
    type: String,
    required: true,
    minlength: 6,
  },
  rol: {
    type: String,
    required: true,
    enum: ['Alumno', 'Profesor', 'Administrativo'],
  },
  primerInicio: {
  type: Boolean,
  default: true,
  },
  /*activo: {   Para despues________________
    type: Boolean,
    default: true,
  }, */
  datosPersonales: {
    type: DatosPersonalesSchema,
    // opcional; si lo quieres obligatorio pon `required: true`
  },
  direcciones: {
    type: [DireccionSchema],
    default: []
  },
  dataAlumno: {
    type: AlumnoDataSchema,
    required: function () { return this.rol === 'Alumno'; }
  },
  dataProfesor: {
    type: ProfesorDataSchema,
    required: function () { return this.rol === 'Profesor'; }
  }
}, { timestamps: true });

// Índices y unicidad controlada con parcialFilterExpression
// 1) correo debe ser único siempre
UsuarioSchema.index({ correo: 1 }, { unique: true });

// 2) boleta solo debe ser único cuando exista (i.e., para alumnos)
UsuarioSchema.index({ boleta: 1 }, {
  unique: true,
  partialFilterExpression: { boleta: { $exists: true } }
});

// 3) curp único solo cuando exista (está dentro de datosPersonales)
UsuarioSchema.index({ 'datosPersonales.curp': 1 }, {
  unique: true,
  partialFilterExpression: { 'datosPersonales.curp': { $exists: true } }
});


UsuarioSchema.pre('save', async function (next) {
  const user = this;

  // Solo hasheamos la contraseña si ha sido modificada o es nueva
  if (!user.isModified('contrasena')) {
    return next();
  }

  try {
    // Genera el salt (la cadena aleatoria)
    const salt = await bcrypt.genSalt(saltRounds);

    // Hashea la contraseña usando el salt
    const hashedPassword = await bcrypt.hash(user.contrasena, salt);

    // Reemplaza la contraseña de texto plano con el hash
    user.contrasena = hashedPassword;

    next(); // Continúa con la operación de guardado
  } catch (error) {
    return next(error); // Pasa el error para que Mongoose lo maneje
  }
});

UsuarioSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    // 'candidatePassword' es la contraseña de texto plano ingresada por el usuario
    // 'this.password' es el hash almacenado en la DB
    const isMatch = await bcrypt.compare(candidatePassword, this.contrasena);
    return isMatch;
  } catch (error) {
    throw error;
  }
};



export const Usuario = mongoose.model("Usuario", UsuarioSchema);
