// frontend/src/pages/administradores/PlanSintetico.jsx
import React, { useState, useEffect } from "react";
import MenuAdmin from "components/MenuAdmin";
import Button from "components/Button";
import SelectField from "components/SelectField";
import apiCall from "consultas/APICall";
import ModalAltaPlan from "pages/administradores/ModalAltaPlan";
import ModalEditarPlan from "pages/administradores/ModalEditarPlan";
import "styles/index.css";
import "styles/PlanSintetico.css";

const ADMIN_PASSWORD = "admin123";

const PLAN_IDS = {
  "IIA 2020": "690eacdab43948f952b9244f",
  "LCD 2020": "692265322d970dc69b0fe295",
  "ISC 2020": "692273ce2d970dc69b0fe298"
};

const urlRegex = /^(https?:\/\/)[^\s$.?#].[^\s]*$/i;

const PlanSintetico = () => {
  const [planEstudio, setPlanEstudio] = useState("IIA 2020");
  const [semestre, setSemestre] = useState("");
  const [materiaId, setMateriaId] = useState("");
  const [materias, setMaterias] = useState([]);
  const [selectedMateria, setSelectedMateria] = useState(null);

  const [showAltaModal, setShowAltaModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);

  const fetchMaterias = async () => {
    try {
      const data = await apiCall("/materia", "GET");
      const list = Array.isArray(data) ? data : (data?.docs ?? []);
      setMaterias(list);
    } catch (err) {
      console.error("Error cargando materias:", err.message);
    }
  };

  useEffect(() => {
    fetchMaterias();
  }, []);

  const filteredByPlan = materias.filter(m =>
    String(m.idCarrera?._id || m.idCarrera) === PLAN_IDS[planEstudio]
  );

  const semestresDisponibles = [...new Set(filteredByPlan.map(m => m.semestre))]
    .sort((a, b) => a - b)
    .map(s => ({ value: String(s), label: `Semestre ${s}` }));

  // NO se filtra por optativa, solo por semestre
  const materiasOptions = filteredByPlan
    .filter(m => !semestre || String(m.semestre) === String(semestre))
    .map(m => ({ value: m._id, label: `${m.clave} - ${m.nombre}` }));

  useEffect(() => {
    const mat = materias.find(m => String(m._id) === String(materiaId));
    setSelectedMateria(mat || null);
  }, [materiaId, materias]);

  // ✅ VALIDACIONES ESTRICTAS
  const validarMateria = (m) => {
    if (!urlRegex.test(m.url)) return "URL inválida";
    if (m.creditos < 1 || m.creditos > 20) return "Créditos deben estar entre 1 y 20";
    if (m.semestre < 1 || m.semestre > 12) return "Semestre inválido";
    return null;
  };

  const renderPdfViewer = (url) => (
    <iframe
      src={url}
      title="PDF"
      style={{ width: "100%", height: "75vh", border: "1px solid #ccc" }}
    />
  );

  return (
    <div className="bienvenida-container">
      <MenuAdmin />

      <div className="plan-sintetico-container">
        <aside className="plan-side">
          <h3>Plan Sintético</h3>

          <SelectField
            label="Plan de estudio"
            value={planEstudio}
            onChange={e => setPlanEstudio(e.target.value)}
            options={Object.keys(PLAN_IDS).map(p => ({ value: p, label: p }))}
          />

          <SelectField
            label="Semestre"
            value={semestre}
            onChange={e => setSemestre(e.target.value)}
            options={[{ value: "", label: "Seleccione" }, ...semestresDisponibles]}
          />

          <SelectField
            label="Materia"
            value={materiaId}
            onChange={e => setMateriaId(e.target.value)}
            options={[{ value: "", label: "Seleccione" }, ...materiasOptions]}
          />

          {/* ✅ BOTONES CENTRADOS */}
          <div style={{ marginTop: 15, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <Button variant="primary" onClick={() => setShowAltaModal(true)}>
              Nueva Materia
            </Button>

            {selectedMateria && (
              <Button variant="secondary" onClick={() => setShowEditarModal(true)}>
                Editar Materia
              </Button>
            )}
          </div>
        </aside>

        <main className="plan-main">
          <h2>Plan de Estudios</h2>

          {selectedMateria ? (
            <>
              <h3>{selectedMateria.nombre}</h3>
              <p><b>Clave:</b> {selectedMateria.clave}</p>
              <p><b>Créditos:</b> {selectedMateria.creditos}</p>
              <p><b>Semestre:</b> {selectedMateria.semestre}</p>
              {renderPdfViewer(selectedMateria.url)}
            </>
          ) : (
            <p>Selecciona una materia para visualizar el plan.</p>
          )}
        </main>
      </div>

      <ModalAltaPlan
        isOpen={showAltaModal}
        planId={PLAN_IDS[planEstudio]}
        onClose={() => setShowAltaModal(false)}
        onSuccess={() => {
          fetchMaterias();
          setShowAltaModal(false);
        }}
      />

      <ModalEditarPlan
        isOpen={showEditarModal}
        materia={selectedMateria}
        onClose={() => setShowEditarModal(false)}
        onSuccess={() => {
          fetchMaterias();
          setShowEditarModal(false);
        }}
        adminPassword={ADMIN_PASSWORD}
        validarMateria={validarMateria}
      />
    </div>
  );
};

export default PlanSintetico;

