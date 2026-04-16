import React, { useState, useEffect } from "react";
import Menu from "components/Menu.jsx";
import Table from "components/Table.jsx";
import "styles/Seguimiento.css";
import Espera from "./Espera";
import { useDatosGen } from "consultas/datos_alumno_gen.jsx";
import { useIdAlumno } from "consultas/idAlumno.jsx";
import apiCall from "consultas/APICall.jsx";

const Seguimiento = () => {
  const datosGen = useDatosGen();
  const idAlumno = useIdAlumno();

  const [infoCarrera, setInfoCarrera] = useState([]);
  const [infoTrayectoria, setInfoTrayectoria] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [nivel, setNivel] = useState(1);
  const [cargando, setCargando] = useState(true); // ✅ Nuevo estado

  const columnasCarrera = [
    { key: "turno", label: "Turno" },
    { key: "totalCred", label: "Total de créditos" },
    { key: "cargaMax", label: "Carga máxima de créditos" },
    { key: "cargaMedia", label: "Carga media de créditos" },
    { key: "cargaMin", label: "Carga mínima de créditos" },
    { key: "duracion", label: "Duración (periodos escolares)" },
    { key: "durMax", label: "Duración máxima (periodos escolares)" },
  ];

  const columnasTrayectoria = [
    { key: "Reprobadas", label: "Reprobadas recientes" },
    { key: "CreditosObt", label: "Créditos obtenidos" },
    { key: "NoObtenidos", label: "Créditos faltantes" },
    { key: "Cursados", label: "Periodos cursados" },
    { key: "periodos", label: "Periodos disponibles" },
    { key: "CargaAut", label: "Carga autorizada" },
  ];

  const columnasMaterias = [
    { key: "materia", label: "Materia reprobada" },
    { key: "periodo", label: "Período" },
    { key: "status", label: "Estado" },
  ];

  const getStatusClass = (item) => {
    if (item.status === "Reprobada") return "reprobada";
    if (item.status === "Recursada") return "recursada";
    return "";
  };

  useEffect(() => {
    async function cargarDatos() {
      if (!datosGen || !idAlumno) return;

      try {
        console.log("=== INICIO CARGA DE SEGUIMIENTO ===");
        console.time("Carga total de seguimiento");
        setCargando(true); // ✅ Activar cargando

        // *** OPTIMIZACIÓN: Cargar todos los datos necesarios en paralelo ***
        console.time("Carga paralela de datos");
        const [usuario, inscripciones, materiasReprobadas] = await Promise.all([
          apiCall(`/usuario/${idAlumno}`, 'GET'),
          apiCall(`/inscripcion/alumno/${idAlumno}`, 'GET').catch(() => []),
          apiCall(`/inscripcionClase/alumno/${idAlumno}/materias-reprobadas`, 'GET').catch(() => [])
        ]);
        console.timeEnd("Carga paralela de datos");

        console.log("Usuario:", usuario);
        console.log("Inscripciones:", inscripciones.length);
        console.log("Materias reprobadas:", materiasReprobadas);

        // Obtener carrera
        const idCarrera = usuario?.dataAlumno?.idCarrera;
        const carrera = await apiCall(`/carrera/${idCarrera}`, 'GET')
          .catch(err => {
            console.error("Error obteniendo carrera:", err);
            throw err;
          });

        console.log("Carrera:", carrera);

        // Configurar información de la carrera
        setInfoCarrera([{
          turno: carrera?.turno || "M",
          totalCred: carrera?.creditosTotal || "351.00",
          cargaMax: carrera?.cargaMaxima || "50.00",
          cargaMedia: carrera?.cargaMedia || "40.00",
          cargaMin: carrera?.cargaMinima || "33.33",
          duracion: carrera?.cantidadSemestres || "8",
          durMax: carrera?.duracionMaxima || "12",
        }]);

        // Contar periodos cursados
        const periodosCursados = inscripciones.length || 0;
        console.log(`Periodos cursados: ${periodosCursados}`);

        // Calcular créditos
        const creditosCursados = usuario?.dataAlumno?.creditosCursados || 0;
        const totalCreditos = carrera?.creditosTotal || 351;
        const creditosFaltantes = totalCreditos - creditosCursados;

        console.log(`Créditos: ${creditosCursados}/${totalCreditos}`);

        // *** Las materias reprobadas ya vienen procesadas del backend ***
        setMaterias(materiasReprobadas);

        // Determinar carga autorizada basada en el promedio
        const promedio = usuario?.dataAlumno?.promedio || 0;
        let cargaAutorizada = "MÍNIMA (33.33 CRÉDITOS)";
        if (promedio >= 9.5) {
          cargaAutorizada = "MÁXIMA (50 CRÉDITOS)";
        } else if (promedio >= 8.0) {
          cargaAutorizada = "MEDIA (40 CRÉDITOS)";
        }

        // Configurar información de trayectoria
        const cantidadReprobadas = materiasReprobadas.length;
        const mensajeReprobadas = cantidadReprobadas === 0 
          ? "Sin materias reprobadas"
          : cantidadReprobadas === 1
          ? "1 materia reprobada recientemente"
          : `${cantidadReprobadas} materias reprobadas recientemente`;

        setInfoTrayectoria([{
          Reprobadas: mensajeReprobadas,
          CreditosObt: creditosCursados.toString(),
          NoObtenidos: creditosFaltantes.toString(),
          Cursados: periodosCursados.toString(),
          periodos: (carrera?.duracionMaxima || 12).toString(),
          CargaAut: cargaAutorizada,
        }]);

        // ✅ Calcular nivel de irregularidad AQUÍ (antes de desactivar cargando)
        const materiasReprobadasCount = materiasReprobadas.filter((m) => m.status === "Reprobada").length;
        const durMax = carrera?.duracionMaxima || 12;
        const porcentajeTiempo = (periodosCursados / durMax) * 100;

        if (materiasReprobadasCount === 0 && porcentajeTiempo <= 75) {
          setNivel(1);
        } else if (materiasReprobadasCount <= 1 || (porcentajeTiempo > 75 && porcentajeTiempo < 100)) {
          setNivel(2);
        } else if (materiasReprobadasCount >= 2 || periodosCursados >= durMax) {
          setNivel(3);
        }

        console.log(`Nivel calculado: ${materiasReprobadasCount === 0 && porcentajeTiempo <= 75 ? 1 : materiasReprobadasCount <= 1 ? 2 : 3}`);

        console.timeEnd("Carga total de seguimiento");
        console.log("=== FIN CARGA DE SEGUIMIENTO ===");

      } catch (error) {
        console.error("Error al cargar seguimiento:", error.message);

        // Datos por defecto en caso de error
        setInfoCarrera([{
          turno: "M",
          totalCred: "351.00",
          cargaMax: "50.00",
          cargaMedia: "40.00",
          cargaMin: "33.33",
          duracion: "8",
          durMax: "12",
        }]);

        setInfoTrayectoria([{
          Reprobadas: "Error al cargar datos",
          CreditosObt: "0",
          NoObtenidos: "0",
          Cursados: "0",
          periodos: "12",
          CargaAut: "MÍNIMA (33.33 CRÉDITOS)",
        }]);

        setMaterias([]);
      } finally {
        // ✅ Desactivar cargando DESPUÉS de todo el procesamiento
        setCargando(false);
      }
    }

    cargarDatos();
  }, [datosGen, idAlumno]);

  useEffect(() => {
    const nuevasRecomendaciones = [];
    const materiasReprobadas = materias.filter((m) => m.status === "Reprobada").length;
    const materiasRecursadas = materias.filter((m) => m.status === "Recursada").length;

    if (materiasReprobadas === 0 && materiasRecursadas === 0) {
      nuevasRecomendaciones.push("Estás en situación regular (Art. 37). Mantén tu buen desempeño académico.");
    } else if (materiasReprobadas === 1) {
      nuevasRecomendaciones.push("Tienes una materia reprobada, por lo tanto eres alumno irregular (Art. 37).");
    } else if (materiasReprobadas > 1) {
      nuevasRecomendaciones.push("Tienes varias materias reprobadas, lo que incrementa el riesgo de irregularidad (Art. 48).");
      nuevasRecomendaciones.push("Considera recursarlas y consultar con tu tutor académico o jefe de grupo.");
    }

    if (materiasRecursadas > 0) {
      nuevasRecomendaciones.push("Recuerda que solo puedes recursar una vez la misma unidad de aprendizaje (Art. 48-II).");
    }

    if (nuevasRecomendaciones.length === 0) {
      nuevasRecomendaciones.push("No hay observaciones académicas relevantes por el momento.");
    }

    setRecomendaciones(nuevasRecomendaciones);
  }, [materias, infoTrayectoria, infoCarrera]);

  // ✅ Mostrar espera mientras está cargando o no hay datos
  if (!datosGen || !idAlumno || cargando) {
    return <Espera />;
  }

  const colorFlecha = nivel === 1 ? "#00C49F" : nivel === 2 ? "#FFBB28" : "#FF4444";

  return (
    <div className="seguimiento-page">
      <Menu />
      <div className="seguimiento-container">
        <h2>Seguimiento de irregularidades</h2>

        <div className="datos-alumno">
          <p><strong>Boleta:</strong> {datosGen.boleta}</p>
          <p><strong>Nombre:</strong> {datosGen.nombre}</p>
          <p><strong>Carrera:</strong> {datosGen.carrera}</p>
          <p><strong>Plan:</strong> {datosGen.plan}</p>
        </div>

        <div className="velocimetro-container">
          <h3>Situación académica</h3>
          <div className="velocimetro">
            <svg viewBox="0 0 200 120" width="100%" height="120">
              <path d="M20,100 A80,80 0 0,1 180,100" fill="none" stroke="#00C49F" strokeWidth="20" />
              <path d="M70,25 A80,80 0 0,1 130,25" fill="none" stroke="#FFBB28" strokeWidth="20" />
              <path d="M130,25 A80,80 0 0,1 180,100" fill="none" stroke="#FF4444" strokeWidth="20" />

              <line
                x1="100"
                y1="100"
                x2="100"
                y2="30"
                stroke={colorFlecha}
                strokeWidth="4"
                strokeLinecap="round"
                style={{
                  transformOrigin: "100px 100px",
                  transform: `rotate(${nivel === 1 ? -90 : nivel === 2 ? 0 : 60}deg)`,
                  transition: "transform 0.8s ease-out",
                }}
              />
              <circle cx="100" cy="100" r="6" fill="#333" />
            </svg>
            <p className={`velocimetro-text nivel-${nivel}`}>
              {nivel === 1 ? "Regular" : nivel === 2 ? "Irregular leve" : "Irregular grave"}
            </p>
          </div>
        </div>

        <h3>Información sobre tu carrera</h3>
        <Table columns={columnasCarrera} data={infoCarrera} />

        <h3>Trayectoria escolar</h3>
        <Table columns={columnasTrayectoria} data={infoTrayectoria} />

        <h3>Motivo de la irregularidad</h3>
        <Table 
          columns={columnasMaterias} 
          data={materias} 
          getRowClass={(item) => getStatusClass(item)}
          emptyMessage="No tienes materias reprobadas. ¡Excelente trabajo!"
        />

        <div className="orientacion">
          <h3>Orientación / Recomendaciones</h3>
          <ul>
            {recomendaciones.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Seguimiento;