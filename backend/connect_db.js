import 'dotenv/config';
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import calificacionRoutes from "./routes/calificacionRoutes.js";
import carreraRoutes from "./routes/carreraRoutes.js";
import claseRoutes from "./routes/claseRoutes.js";
import diaSemanaRoutes from "./routes/diaSemanaRoutes.js";
import grupoRoutes from "./routes/grupoRoutes.js";
import inscripcionClaseRoutes from "./routes/inscripcionClaseRoutes.js";
import inscripcionRoutes from "./routes/inscripcionRoutes.js";
import materiaRoutes from "./routes/materiaRoutes.js";
import periodoRoutes from "./routes/periodoAcademicoRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import optativasSemestreRoutes from "./routes/optativasSemestreRoutes.js";
import alumnoRoutes from "./routes/alumnos.js";
import profesorRoutes from "./routes/profesores.js";
import inscripcionETSRoutes from "./routes/inscripcionETSRoutes.js";
import etsRoutes from "./routes/etsRoutes.js";
import calificacionETSRoutes from "./routes/calificacionETSRoutes.js";
import periodoInscripcionRoutes from "./routes/periodoInscripcionRoutes.js";
import citaRoutes from "./routes/citaRoutes.js";
import solicitudRoutes from './routes/solicitudRoutes.js';
import periodosCompletosRoutes from "./routes/periodosCompletos.js";
const app = express();

// Configuración de CORS
app.use(cors({
  origin: [
    'http://localhost:3000',  // Backend (si tienes frontend en otro puerto)
    'http://localhost:3001',  // React dev server común
    'http://localhost:3002',  // Puerto adicional del frontend
    'http://localhost:5173',  // Vite dev server
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'https://paideaescom.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-token']
}));

// Middleware para parsing JSON
app.use(express.json());

// Conexión a MongoDB
const MONGODB_URI = process.env.MONGO_URI;
if (!MONGODB_URI) {
  throw new Error("Falta MONGO_URI en variables de entorno.");
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch(err => console.error("❌ Error de conexión:", err));

// Rutas
app.use("/calificacion", calificacionRoutes);
app.use("/carrera", carreraRoutes);
app.use("/clase", claseRoutes);
app.use("/diaSemana", diaSemanaRoutes);
app.use("/grupo", grupoRoutes);
app.use("/inscripcionClase", inscripcionClaseRoutes);
app.use("/inscripcion", inscripcionRoutes);
app.use("/materia", materiaRoutes);
app.use("/periodoAcademico", periodoRoutes);
app.use("/usuario", usuarioRoutes);
app.use("/optativasSemestre", optativasSemestreRoutes);
app.use("/alumnos", alumnoRoutes);
app.use("/profesores", profesorRoutes);
app.use("/inscripcionETS", inscripcionETSRoutes);
app.use("/ets", etsRoutes);
app.use("/calificacionETS", calificacionETSRoutes);
app.use("/periodoInscripcion", periodoInscripcionRoutes);
app.use("/cita", citaRoutes);
app.use('/solicitud', solicitudRoutes);
app.use("/periodosCompletos", periodosCompletosRoutes);


// Ruta de prueba para verificar CORS
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend con CORS funcionando",
    timestamp: new Date().toISOString()
  });
});

app.get("/debug", (req, res) => {
  res.json({ ok: true });
});


export default app;