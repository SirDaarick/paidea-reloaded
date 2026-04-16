import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import MenuAdmin from "components/MenuAdmin";
import Table from "components/Table";
import "styles/index.css";
import apiCall from "consultas/APICall";
import "styles/kardex.css";

export default function KardexAdmin() {
  const { boletaAlumno } = useParams();
  
  const [alumno, setAlumno] = useState(null);
  const [kardex, setKardex] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (boletaAlumno) {
        cargarKardex();
    } else {
        setError("No se proporcionó la boleta del alumno en la URL.");
        setLoading(false);
    }
  }, [boletaAlumno]);

  const cargarKardex = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Obtener alumno
      const alumnoData = await apiCall(`/usuario/boleta/${boletaAlumno}`);
      
      if (!alumnoData || !alumnoData._id) {
        setAlumno(null);
        setError("No se encontró el alumno con esa boleta.");
        setLoading(false);
        return;
      }

      // 2. Obtener carrera
      let carreraNombre = "Sin carrera";
      if (alumnoData.dataAlumno?.idCarrera) {
        try {
          const carrera = await apiCall(`/carrera/${alumnoData.dataAlumno.idCarrera}`);
          carreraNombre = carrera?.nombre || "Sin carrera";
        } catch (err) {
          console.error("Error cargando carrera:", err);
        }
      }

      setAlumno({
        ...alumnoData,
        carrera: carreraNombre
      });

      // 3. Obtener inscripciones y armar kárdex
      const inscripciones = await apiCall(`/inscripcion/alumno/${alumnoData._id}`);
      const temp = {};

      for (const inscripcion of inscripciones) {
        const periodoNombre = inscripcion.idPeriodo?.nombre || "Periodo desconocido";
        const inscripcionesClase = await apiCall(`/inscripcionClase/inscripcion/${inscripcion._id}`);

        for (const insc of inscripcionesClase) {
          const clase = insc.idClase;
          const materia = typeof clase.idMateria === "object"
              ? clase.idMateria
              : await apiCall(`/materia/${clase.idMateria}`);

          const calificaciones = await apiCall(`/calificacion/inscripcionClase/${insc._id}`);

          let califFinal = "-";
          let tipoEval = "-";

          const ord = calificaciones.find((c) => c.tipoEvaluacion === "Ord");
          const ext = calificaciones.find((c) => c.tipoEvaluacion === "Ext");

          if (ord) {
            califFinal = ord.valor;
            tipoEval = "Ordinaria";
          } else if (ext) {
            califFinal = ext.valor;
            tipoEval = "Extraordinaria";
          }

          const semestre = materia.semestre || 1;
          if (!temp[semestre]) temp[semestre] = [];

          temp[semestre].push({
            materia: materia.nombre,
            creditos: materia.creditos,
            periodo: periodoNombre,
            evaluacion: tipoEval,
            calificacion: califFinal,
          });
        }
      }

      setKardex(temp);
      setLoading(false);

    } catch (err) {
      console.error("❌ Error cargando kardex:", err);
      setError("Error al cargar el kárdex del alumno.");
      setLoading(false);
    }
  };

  const columnas = [
    { key: "materia", label: "Materia", width: "35%" },
    { key: "creditos", label: "Créditos", width: "10%" },
    { key: "periodo", label: "Periodo", width: "15%" },
    { key: "evaluacion", label: "Evaluación", width: "20%" },
    { key: "calificacion", label: "Calif.", width: "10%" },
  ];

  // --- RENDERIZADO ---

  if (loading) {
    return (
      <div className="bienvenida-container">
        <MenuAdmin />
        <main className="page" style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
          <p>Cargando kárdex...</p>
        </main>
      </div>
    );
  }

  if (error || !alumno) {
    return (
      <div className="bienvenida-container">
        <MenuAdmin />
        <main className="page" style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
          <p style={{ color: "red", fontWeight: "bold" }}>
            {error || "Alumno no encontrado."}
          </p>
        </main>
      </div>
    );
  }

  const semestresOrdenados = Object.keys(kardex).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="bienvenida-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f8' }}>
      <MenuAdmin />

      {/* Contenedor principal centrado */}
      <main style={{ 
          flex: 1, 
          padding: "30px", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", // Centra el contenido horizontalmente
          overflowY: "auto"
      }}>
        
        {/* Envoltura para limitar el ancho y que no se estire infinito */}
        <div style={{ width: "100%", maxWidth: "1000px" }}>
            
            <h2 style={{ 
                textAlign: "center", 
                color: "#1a2b4b", 
                marginBottom: "30px",
                fontSize: "2rem",
                fontWeight: "bold"
            }}>
                Kárdex del Alumno
            </h2>

            {/* Tarjeta de Información del Alumno */}
            <div style={{ 
                backgroundColor: "white", 
                padding: "25px", 
                borderRadius: "12px", 
                boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                marginBottom: "30px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", // Columnas responsivas
                gap: "20px",
                border: "1px solid #e0e0e0"
            }}>
                <div style={{ textAlign: "center" }}>
                    <span style={{ display: "block", color: "#6b7280", fontSize: "0.9rem", marginBottom: "5px" }}>Boleta</span>
                    <strong style={{ fontSize: "1.2rem", color: "#333" }}>{alumno.boleta}</strong>
                </div>
                <div style={{ textAlign: "center", borderLeft: "1px solid #eee", borderRight: "1px solid #eee" }}>
                    <span style={{ display: "block", color: "#6b7280", fontSize: "0.9rem", marginBottom: "5px" }}>Nombre</span>
                    <strong style={{ fontSize: "1.2rem", color: "#333" }}>{alumno.nombre}</strong>
                </div>
                <div style={{ textAlign: "center" }}>
                    <span style={{ display: "block", color: "#6b7280", fontSize: "0.9rem", marginBottom: "5px" }}>Carrera</span>
                    <strong style={{ fontSize: "1.1rem", color: "#0056b3" }}>{alumno.carrera}</strong>
                </div>
            </div>

            {/* Listado de Semestres */}
            {semestresOrdenados.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", backgroundColor: "white", borderRadius: "10px" }}>
                    <p style={{ color: "#666", fontSize: "1.1rem" }}>No hay materias registradas en el kárdex.</p>
                </div>
            ) : (
                semestresOrdenados.map((sem) => (
                    <div key={sem} style={{ marginBottom: "35px" }}>
                        <div style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            marginBottom: "15px",
                            borderBottom: "2px solid #0056b3",
                            paddingBottom: "5px"
                        }}>
                            <h3 style={{ margin: 0, color: "#0056b3", fontSize: "1.4rem" }}>
                                Semestre {sem}
                            </h3>
                        </div>
                        
                        <div style={{ 
                            backgroundColor: "white", 
                            borderRadius: "10px", 
                            overflow: "hidden", 
                            boxShadow: "0 2px 5px rgba(0,0,0,0.05)" 
                        }}>
                            <Table columns={columnas} data={kardex[sem]} />
                        </div>
                    </div>
                ))
            )}
        </div>
      </main>
    </div>
  );
}