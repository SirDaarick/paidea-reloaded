import React, { useState, useEffect } from "react";
import MenuAdmin from "components/MenuAdmin";
import Table from "components/Table";
import Button from "components/Button";
import Mensaje from "components/Mensaje"; // <-- importamos el componente
import "styles/ETS.css";

export default function ETS() {

  // -------------------- CONFIGURACIÓN DE LA TABLA --------------------
  const columns = [
    { key: "boleta", label: "Boleta" },
    { key: "nombre", label: "Nombre completo" },
    { key: "correo", label: "Correo" },
    { key: "pago", label: "Pago" },
  ];

  const [alumnos, setAlumnos] = useState(
    Array.from({ length: 21 }, (_, i) => ({
      boleta: `20236300${(i + 1).toString().padStart(2, "0")}`,
      nombre: "Nombre Apellido Apellido",
      correo: "alumno1900@alumno.ipn.mx",
      pago: i % 2 === 0,
    }))
  );

  // -------------------- ESTADOS DEL FORMULARIO --------------------
  const [carrera, setCarrera] = useState("");
  const [semestre, setSemestre] = useState("");
  const [unidad, setUnidad] = useState("");
  const [profesor, setProfesor] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [horario, setHorario] = useState("");
  const [fechaAplicacion, setFechaAplicacion] = useState("");
  const [horaAplicacion, setHoraAplicacion] = useState("");
  const [salon, setSalon] = useState("");

  // Estados para mostrar mensajes
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitulo, setModalTitulo] = useState("");
  const [modalMensaje, setModalMensaje] = useState("");

  const unidadesPorCarrera = {
    "Ingeníeria en Inteligencia Artificial 2020": ["Sistemas multiagentes", "IA aplicada", "Aprendizaje profundo"],
    "Ingeníeria en Sistemas Computacionales 2020": ["Bases de datos", "Redes", "Programación avanzada"],
    "Ingeníeria en Sistemas Computacionales 2009": ["Algoritmos", "Sistemas operativos"],
    "Licenciatura en Ciencia de Datos 2020": ["Estadística", "Minería de datos", "Modelos predictivos"],
  };

  const profesoresPorUnidad = {
    "Sistemas multiagentes": ["Profesor IA 1", "Profesor IA 2"],
    "IA aplicada": ["Profesor IA 3", "Profesor IA 4"],
    "Aprendizaje profundo": ["Profesor IA 5"],
    "Bases de datos": ["Profesor SC 1", "Profesor SC 2"],
    "Redes": ["Profesor SC 3"],
    "Programación avanzada": ["Profesor SC 4", "Profesor SC 5"],
    "Algoritmos": ["Profesor SC6"],
    "Sistemas operativos": ["Profesor SC7"],
    "Estadística": ["Profesor CD 1"],
    "Minería de datos": ["Profesor CD 2", "Profesor CD 3"],
    "Modelos predictivos": ["Profesor CD 4"],
  };

  const togglePago = (index) => {
    setAlumnos((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, pago: !item.pago } : item
      )
    );
  };

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Listado de alumnos - ETS</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { text-align: center; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f0f0f0; }
            tr:nth-child(even) { background: #f9f9f9; }
            input[type="checkbox"] { width: 16px; height: 16px; accent-color: #800000; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h2>Listado de alumnos inscritos al ETS</h2>
          <table>
            <thead>
              <tr>
                <th>Boleta</th>
                <th>Nombre completo</th>
                <th>Correo</th>
                <th>Pago</th>
              </tr>
            </thead>
            <tbody>
              ${alumnos.map(a => `
                <tr>
                  <td>${a.boleta}</td>
                  <td>${a.nombre}</td>
                  <td>${a.correo}</td>
                  <td><input type="checkbox" ${a.pago ? "checked" : ""} /></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">Generado automáticamente desde el sistema ETS</div>
        </body>
      </html>
    `;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  useEffect(() => {
    setUnidad("");
    setProfesor("");
  }, [carrera]);

  const handleAgregarCita = () => {
    if (!fechaInicio || !fechaFin || !horario || !carrera || !semestre || !unidad || !profesor || !fechaAplicacion || !horaAplicacion || !salon) {
      setModalTitulo("Error");
      setModalMensaje("Por favor completa todos los campos antes de agregar la cita.");
      setModalVisible(true);
      return;
    }

    const resumen = `
Carrera: ${carrera}
Semestre: ${semestre}
Unidad: ${unidad}
Profesor: ${profesor}
Fecha de inicio: ${fechaInicio}
Fecha de fin: ${fechaFin}
Horario: ${horario}
Fecha de aplicación: ${fechaAplicacion}
Hora: ${horaAplicacion}
Salón: ${salon}
    `;
    setModalTitulo("¡Operación exitosa!");
    setModalMensaje(`El ETS se agregó correctamente:\n\n${resumen}`);
    setModalVisible(true);
  };

  return (
    <div className="ets-container">
      <MenuAdmin />

      <div className="ets-content">
        {/* ---------- CREAR ETS ---------- */}
        <section className="ets-section">
          <h3>Crear / Agregar ETS</h3>
          {/* Fechas y horarios */}
          <div className="ets-periodo-inputs">
            <div>
              <label>Fecha de inicio</label>
              <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </div>
            <div>
              <label>Fecha de fin</label>
              <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>
            <div>
              <label>Horario</label>
              <input type="text" placeholder="0 - 24 hrs" value={horario} onChange={(e) => setHorario(e.target.value)} />
            </div>
          </div>

          {/* Datos generales */}
          <div className="ets-datos-grid">
            <div>
              <label>Plan de estudios</label>
              <select value={carrera} onChange={(e) => setCarrera(e.target.value)}>
                <option value="">Selecciona una carrera</option>
                {Object.keys(unidadesPorCarrera).map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Semestre</label>
              <select value={semestre} onChange={(e) => setSemestre(e.target.value)}>
                <option value="">Selecciona un semestre</option>
                {Array.from({ length: 8 }, (_, i) => (
                  <option key={i} value={i + 1}>{`${i + 1}º semestre`}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Unidad de aprendizaje</label>
              <select value={unidad} onChange={(e) => setUnidad(e.target.value)}>
                <option value="">Selecciona una unidad</option>
                {carrera && unidadesPorCarrera[carrera].map((u, i) => (
                  <option key={i} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Asignar profesor</label>
              <select value={profesor} onChange={(e) => setProfesor(e.target.value)}>
                <option value="">Selecciona un profesor</option>
                {unidad && profesoresPorUnidad[unidad]?.map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Fecha de aplicación</label>
              <input type="date" value={fechaAplicacion} onChange={(e) => setFechaAplicacion(e.target.value)} />
            </div>

            <div>
              <label>Hora de aplicación</label>
              <select value={horaAplicacion} onChange={(e) => setHoraAplicacion(e.target.value)}>
                <option value="">Selecciona una hora</option>
                <option>10:00 - 14:00</option>
              </select>
            </div>

            <div>
              <label>Salón asignado</label>
              <select value={salon} onChange={(e) => setSalon(e.target.value)}>
                <option value="">Selecciona un salón</option>
                <option>LIA2</option>
              </select>
            </div>
          </div>

          <div className="ets-agregar">
            <Button variant="primary" onClick={handleAgregarCita}>Agregar fecha</Button>
          </div>
        </section>

        {/* ---------- LISTADO DE ALUMNOS ---------- */}
        <section className="ets-section">
          <h3>Alumnos inscritos al ETS</h3>
          <Table
            columns={columns}
            data={alumnos}
            striped
            hover
            renderCell={(item, key, index) =>
              key === "pago" ? (
                <input
                  type="checkbox"
                  checked={!!item.pago}
                  onChange={() => togglePago(index)}
                />
              ) : (
                item[key]
              )
            }
            emptyMessage="No hay alumnos registrados"
          />
          <div className="ets-imprimir">
            <Button variant="primary" onClick={handlePrint}>
              Imprimir listado
            </Button>
          </div>
        </section>

        {/* ---------- MODAL UNIFICADO ---------- */}
        <Mensaje
          titulo={modalTitulo}
          mensaje={modalMensaje}
          visible={modalVisible}
          onCerrar={() => setModalVisible(false)}
        />
      </div>
    </div>
  );
}
