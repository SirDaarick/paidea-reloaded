import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import ChatWidget from "./components/ChatWidget";

// ===LOGIN===
import Login from "./pages/index/Login";

// === CAMBIAR CONTRASEÑA ===
import CambioContraseña from "./components/shared/CambioContraseña";

// === ALUMNOS ===
import Bienvenida from "./pages/alumnos/Bienvenida";
import ErrorAlumno from "./pages/alumnos/Error";
import Analisis from "./pages/alumnos/Analisis";
import EditarDatosPersonales from "./pages/alumnos/EditarDatosPersonales";
import RendimientoAcademico from "./pages/alumnos/RendimientoAcademico";
import Salones from "./pages/alumnos/Salones";
import Calificaciones from "./pages/alumnos/Calificaciones";
import Horario from "./pages/alumnos/Horario";
import Calendario from "./pages/alumnos/Calendario";
import DatosPersonales from "./pages/alumnos/DatosPersonales";
import Ocupabilidad from "./pages/alumnos/Ocupabilidad";
import PlanEstudios from "./pages/alumnos/PlanEstudios";
import Optativas from "./pages/alumnos/Optativas";
import Seguimiento from "./pages/alumnos/Seguimiento";
import Reinscripciones from "./pages/alumnos/Reinscripciones";
import Kardex from "./pages/alumnos/Kardex";
import Documentos from "./pages/alumnos/Documentos";
import SolicitarDocumentos from "./pages/alumnos/SolicitarDocumentos";
import InscripcionETS from "pages/alumnos/InscribirETS";
import CitaReinscripcion from "pages/alumnos/CitaReinscripcion"
import ResultadosETS from "pages/alumnos/ResultadosETS"

// === PROFESORES ===
import BienvenidaProfesor from "./pages/profesores/BienvenidaProfesor";
import ErrorProfesor from "./pages/profesores/ErrorProfesor";
import EditarDatosPersonalesProfesor from "./pages/profesores/EditarDatosPersonalesProfesor";
import DatosPersonalesProfesor from "./pages/profesores/DatosPersonalesProfesor";
import GruposAsignadosProfesor from "./pages/profesores/GruposAsignadosProfesor";
import CalendarioProfesor from "./pages/profesores/CalendarioProfesor";
import Asistencias from "./pages/profesores/Asistencias";
import DesempenoGrupal from "./pages/profesores/DesempenoGrupal";
import ReportesProfesor from "./pages/profesores/ReportesProfesor";
import CalificarGruposProfesor from "./pages/profesores/CalificarGruposProfesor";
import ListadosETS from "./pages/profesores/ListadosETS";
import CalificarETS from "./pages/profesores/CalificarETS";
import SalonesProfesor from "./pages/profesores/SalonesProfesor";

// === ADMINISTRADORES ===
import BienvenidaAdministrador from "./pages/administradores/BienvenidaAdministrador";
import CorrecionActas from "pages/administradores/CorrecionActa";
import GestionAlumnos from "./pages/administradores/GestionAlumnos";
import GestionarGrupos  from "pages/administradores/GestionGrupos";
import SolicitudTramites from "pages/administradores/SolicitudTramites";
import GestionProfesores from "pages/administradores/GestionProfesores";
import GestionMateriasAlumno from "pages/administradores/GestionarMateriasAlumno";
import GestionHorarioProfesor from "pages/administradores/GestionHorarioProfesor";
import AsignarCita from "pages/administradores/AsignarCita";
import ETS from "pages/administradores/ETS";
import CorrecionActa from "pages/administradores/CorrecionActa";
import CopiaSeguridad from "pages/administradores/CopiaSeguridad";
import PeriodosAcademicos from "pages/administradores/PeriodosAcademicos";
import PlanSintetico from "pages/administradores/PlanSintetico";
import KardexAdmin from "./pages/administradores/KardexAdmin";
import PeriodosAcademicos2 from "pages/administradores/PeriodosAcademicos2";

function App() {
  return (
    <Router>
      <Routes>
        {/* ================= ALUMNO ================= */}
        <Route path="/alumno/*" element={<RutasAlumno />} />

        {/* ================= PROFESOR ================= */}
        <Route path="/profesor/*" element={<RutasProfesor />} />

        {/* ================= ADMINISTRADOR ================= */}
        <Route path="/administrador/*" element={<RutasAdministrador />} />

        {/* ================= FALLBACK GLOBAL ================= */}
        <Route path="*" element={<Login />} />
      </Routes>

      {/* === Widget del burrito === */}
      <ChatWidget />
    </Router>
  );
}

/* === Definición de rutas internas de ALUMNO === */
function RutasAlumno() {
  return (
    <Routes>
      <Route index element={<Bienvenida />} />
      <Route path="bienvenida" element={<Bienvenida />} />
      <Route path="analisis" element={<Analisis />} />
      <Route path="editar-datos" element={<EditarDatosPersonales />} />
      <Route path="rendimiento" element={<RendimientoAcademico />} />
      <Route path="salones" element={<Salones />} />
      <Route path="calificaciones" element={<Calificaciones />} />
      <Route path="horario" element={<Horario />} />
      <Route path="calendario" element={<Calendario />} />
      <Route path="ocupabilidad" element={<Ocupabilidad />} />
      <Route path="plan-estudios" element={<PlanEstudios />} />
      <Route path="optativas" element={<Optativas />} />
      <Route path="seguimiento" element={<Seguimiento />} />
      <Route path="reinscripciones" element={<Reinscripciones />} />
      <Route path="datos-personales" element={<DatosPersonales />} />
      <Route path="kardex" element={<Kardex />} />
      <Route path="cambiar-contraseña" element={<CambioContraseña />} />
      <Route path="documentos" element={<Documentos />} />
      <Route path="solicitar-documentos" element={<SolicitarDocumentos />} />
      <Route path="*" element={<ErrorAlumno />} />
      <Route path="inscribir-ETS" element={<InscripcionETS />} />
      <Route path="cita-Reinscripcion" element={<CitaReinscripcion/>}/>
      <Route path="Resultados-ETS" element={<ResultadosETS/>}/>
    </Routes>
  );
}

/* === Definición de rutas internas de PROFESOR === */
function RutasProfesor() {
  return (
    <Routes>
      <Route index element={<BienvenidaProfesor />} />
      <Route path="bienvenida" element={<BienvenidaProfesor />} />
      <Route path="editar" element={<EditarDatosPersonalesProfesor />} />
      <Route path="editar-datos" element={<EditarDatosPersonalesProfesor />} />
      <Route path="datos-personales" element={<DatosPersonalesProfesor />} />
      <Route path="grupos" element={<GruposAsignadosProfesor />} />
      <Route path="calificaciones" element={<CalificarGruposProfesor />} />
      <Route path="calendario" element={<CalendarioProfesor />} />
      <Route path="asistencias" element={<Asistencias />} />
      <Route path="desempeno" element={<DesempenoGrupal />} />
      <Route path="reportes" element={<ReportesProfesor />} />
      <Route path="ets-listados" element={<ListadosETS />} />
      <Route path="ets-calificar" element={<CalificarETS />} />
      <Route path="cambiar-contraseña" element={<CambioContraseña />} />
      <Route path="*" element={<ErrorProfesor />} />
      <Route path="salones" element={<SalonesProfesor />} />
    </Routes>
  );
}

/* === Definición de rutas internas de ADMINISTRADOR === */
function RutasAdministrador() {
  return (
    <Routes>
      <Route index element={<BienvenidaAdministrador />} />
      <Route path="BienvenidaAdministrador" element={<BienvenidaAdministrador />} />
      <Route path="correccion-actas" element={<CorrecionActas />}/>
      <Route path="gestion-alumnos" element={<GestionAlumnos />} />
      <Route path="gestion-grupos" element={<GestionarGrupos />} />
      <Route path="solicitud-tramites-admin" element={<SolicitudTramites />} />
      <Route path="gestion-profesores" element={<GestionProfesores />} />
      <Route path="gestionar-materias-alumno/:idAlumno" element={<GestionMateriasAlumno />} />
      <Route path="gestion-horario-profesor/:idProfesor" element={<GestionHorarioProfesor />} />
      <Route path="Asignar-Cita" element={<AsignarCita />} />
      <Route path="ETS" element={<ETS />} />
      <Route path="Correcion-Actas" element={<CorrecionActa />} />
      <Route path="copia-seguridad" element={<CopiaSeguridad />} />
      <Route path="plan-sintetico" element={<PlanSintetico />} />
      <Route path="cambiar-contraseña" element={<CambioContraseña />} />
      <Route path="periodos-academicos" element={<PeriodosAcademicos />} />
      <Route path="kardex-boleta/:boletaAlumno" element={<KardexAdmin />} />
      <Route path="periodos-academicos-2" element={<PeriodosAcademicos2 />} />
      <Route path="*" element={<ErrorAlumno />} />
    </Routes>
  );
}

export default App;
