import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ==============================================================
// 1. WIDGET: KÁRDEX ESCOLAR
// ==============================================================
const KardexWidget = ({ data }) => {
  const promedio = Number(data.promedio || 0).toFixed(2);
  const creditos = Number(data.creditos || 0).toFixed(1);
  const creditosTotales = Number(data.creditos_totales || 352).toFixed(1);
  const pctAvance = Math.min(100, Math.round((creditos / creditosTotales) * 100));

  return (
    <div className="agent-widget kardex-widget">
      <div className="widget-header">
        <span className="widget-icon">🎓</span>
        <div className="widget-titles">
          <h4>Kárdex Oficial de Calificaciones</h4>
          <span className="widget-subtitle">{data.carrera || "ESCOM - IPN"}</span>
        </div>
      </div>

      <div className="kardex-stats-grid">
        <div className="stat-card primary">
          <span className="stat-label">Promedio General</span>
          <span className="stat-value">{promedio}</span>
          <span className="stat-badge">Top Académico</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avance Curricular</span>
          <span className="stat-value">{pctAvance}%</span>
          <span className="stat-sub">{creditos} / {creditosTotales} Créditos</span>
        </div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${pctAvance}%` }}></div>
      </div>
    </div>
  );
};

// ==============================================================
// 2. WIDGET: HORARIO DE CLASES
// ==============================================================
const HorarioWidget = ({ data }) => {
  const clases = data.clases || [];

  return (
    <div className="agent-widget horario-widget">
      <div className="widget-header">
        <span className="widget-icon">📅</span>
        <div className="widget-titles">
          <h4>Horario Oficial Vigente</h4>
          <span className="widget-subtitle">Periodo 2026-1 · {clases.length} Materias</span>
        </div>
      </div>

      <div className="horario-cards-list">
        {clases.map((c, i) => (
          <div key={i} className="horario-item">
            <div className="horario-item-top">
              <span className="materia-name">{c.materia}</span>
              <span className="grupo-tag">{c.grupo}</span>
            </div>
            <div className="horario-item-bottom">
              <span className="aula-tag">📍 {c.aula}</span>
              <span className="horas-tag">⏰ {c.horarios}</span>
            </div>
            {c.profesor && <span className="profe-tag">👨‍🏫 {c.profesor}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ==============================================================
// 3. WIDGET: CLASE ACTUAL / PRÓXIMA
// ==============================================================
const ClaseActualWidget = ({ data }) => {
  const c = data.clase || {};

  return (
    <div className="agent-widget clase-actual-widget">
      <div className="widget-header">
        <span className="widget-icon">⏰</span>
        <div className="widget-titles">
          <h4>Sesión en Curso / Próxima</h4>
          <span className="widget-subtitle">{c.estado || "Información de agenda"}</span>
        </div>
      </div>

      <div className="clase-actual-body">
        <h3 className="materia-destacada">{c.materia}</h3>
        <div className="info-pills">
          <span className="pill group">Grupo {c.grupo}</span>
          <span className="pill aula">📍 {c.aula}</span>
          <span className="pill time">⏱️ {c.horario}</span>
        </div>
        {c.profesor && <p className="profesor-name">Docente: <strong>{c.profesor}</strong></p>}
      </div>
    </div>
  );
};

// ==============================================================
// 4. WIDGET: SIMULADOR DE CALIFICACIONES (INTERACTIVO)
// ==============================================================
const SimuladorWidget = ({ data }) => {
  const p1 = Number(data.p1 || 8.0);
  const p2 = Number(data.p2 || 8.0);
  const [meta, setMeta] = useState(Number(data.meta || 8.0));

  const p3Calculado = Number((3 * meta - (p1 + p2)).toFixed(1));
  const esAlcanzable = p3Calculado <= 10.0;
  const esExcedente = p3Calculado <= 6.0;

  return (
    <div className="agent-widget simulador-widget">
      <div className="widget-header">
        <span className="widget-icon">🎯</span>
        <div className="widget-titles">
          <h4>Simulador de 3er Parcial</h4>
          <span className="widget-subtitle">{data.materia || "Materia en Curso"}</span>
        </div>
      </div>

      <div className="simulador-grid">
        <div className="parcial-mini-card">
          <span className="mini-label">1er Parcial</span>
          <span className="mini-val">{p1}</span>
        </div>
        <div className="parcial-mini-card">
          <span className="mini-label">2do Parcial</span>
          <span className="mini-val">{p2}</span>
        </div>
        <div className={`parcial-mini-card destacada ${!esAlcanzable ? "danger" : esExcedente ? "success" : "info"}`}>
          <span className="mini-label">Requerido P3</span>
          <span className="mini-val">{Math.max(0, p3Calculado)}</span>
        </div>
      </div>

      <div className="simulador-slider-control">
        <div className="slider-header">
          <span>Meta de Promedio Final:</span>
          <strong>{meta.toFixed(1)}</strong>
        </div>
        <input
          type="range"
          min="6.0"
          max="10.0"
          step="0.5"
          value={meta}
          onChange={(e) => setMeta(parseFloat(e.target.value))}
          className="slider-range"
        />
        <div className="slider-ticks">
          <span>6.0</span>
          <span>7.0</span>
          <span>8.0</span>
          <span>9.0</span>
          <span>10.0</span>
        </div>
      </div>

      <div className={`simulador-feedback ${!esAlcanzable ? "danger" : esExcedente ? "success" : "info"}`}>
        {!esAlcanzable ? (
          <span>⚠️ Requiere más de 10.0 en el 3er parcial. Se recomienda presentar Examen Extraordinario (ETS).</span>
        ) : esExcedente ? (
          <span>✨ ¡Vas con holgura! Asegurando 6.0 o más cumples tu meta de promedio final.</span>
        ) : (
          <span>🎯 Necesitas obtener al menos <strong>{p3Calculado}</strong> en tu 3er examen departamental.</span>
        )}
      </div>
    </div>
  );
};

// ==============================================================
// 5. WIDGET: AUDITORÍA REGLAMENTARIA
// ==============================================================
const AuditoriaWidget = ({ data }) => {
  const regular = data.estado === "Alumno Regular";

  return (
    <div className={`agent-widget auditoria-widget ${regular ? "regular" : "irregular"}`}>
      <div className="widget-header">
        <span className="widget-icon">⚖️</span>
        <div className="widget-titles">
          <h4>Auditoría de Situación Escolar (RGE)</h4>
          <span className={`status-badge ${regular ? "regular" : "irregular"}`}>
            {data.estado}
          </span>
        </div>
      </div>

      <div className="auditoria-list">
        <div className="auditoria-row">
          <span>Reglamento Art. 41 (Permanencia Máxima):</span>
          <strong>{data.art_41_ok ? "✅ En norma (12 sem máx)" : "⚠️ Excedido"}</strong>
        </div>
        <div className="auditoria-row">
          <span>Semestres Ordinarios Disponibles:</span>
          <strong>{data.semestres_disponibles ?? 4} semestres</strong>
        </div>
        <div className="auditoria-row">
          <span>Reglamento Art. 47 (Derecho a ETS):</span>
          <strong>{data.art_47_ets_disponibles ?? 2} Exámenes Ordinarios</strong>
        </div>
        <div className="auditoria-row">
          <span>Dictamen COSSIE:</span>
          <strong>{data.dictamen_requerido ? "⚠️ Requerido" : "✅ No requiere"}</strong>
        </div>
      </div>
    </div>
  );
};

// ==============================================================
// 6. WIDGET: CITA DE REINSCRIPCIÓN
// ==============================================================
const CitaWidget = ({ data }) => {
  return (
    <div className="agent-widget cita-widget">
      <div className="widget-header">
        <span className="widget-icon">🎟️</span>
        <div className="widget-titles">
          <h4>Cita Oficial de Reinscripción</h4>
          <span className="widget-subtitle">{data.turno || "Turno Ordinario"}</span>
        </div>
      </div>
      <div className="cita-body">
        <div className="cita-info">
          <span className="cita-fecha">📅 {data.fecha}</span>
          <span className="cita-lugar">📍 {data.lugar}</span>
        </div>
      </div>
    </div>
  );
};

// ==============================================================
// 7. WIDGET: RECOMENDACIÓN DE MATERIAS
// ==============================================================
const RecomendacionWidget = ({ data }) => {
  const materias = data.materias || [];

  return (
    <div className="agent-widget recomendacion-widget">
      <div className="widget-header">
        <span className="widget-icon">💡</span>
        <div className="widget-titles">
          <h4>Propuesta de Horario Sin Empalmes</h4>
          <span className="widget-subtitle">Turno {data.turno || "Matutino"} · {data.total_creditos} Créditos</span>
        </div>
      </div>
      <div className="rec-materias-list">
        {materias.map((m, i) => (
          <div key={i} className="rec-item">
            <span className="rec-name"><strong>{m.materia}</strong> ({m.clave})</span>
            <span className="rec-details">{m.horario} · Grupo {m.grupo} · {m.salon}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==============================================================
// 8. WIDGET: MÉTRICAS DOCENTES
// ==============================================================
const MetricasDocenteWidget = ({ data }) => {
  const m = data.metricas || {};

  return (
    <div className="agent-widget metricas-widget">
      <div className="widget-header">
        <span className="widget-icon">📊</span>
        <div className="widget-titles">
          <h4>Rendimiento Académico Docente</h4>
          <span className="widget-subtitle">{m.profesor}</span>
        </div>
      </div>
      <div className="metricas-grid">
        <div className="m-card">
          <span>Alumnos Totales</span>
          <strong>{m.total_alumnos}</strong>
        </div>
        <div className="m-card">
          <span>Promedio Grupal</span>
          <strong>{m.promedio_general} / 10</strong>
        </div>
        <div className="m-card">
          <span>% Aprobación</span>
          <strong>{m.aprobacion_pct}%</strong>
        </div>
        <div className="m-card">
          <span>Asistencia</span>
          <strong>{m.asistencia_promedio}%</strong>
        </div>
      </div>
    </div>
  );
};

// ==============================================================
// 9. WIDGET: TRÁMITE CONFIRMADO
// ==============================================================
const TramiteWidget = ({ data }) => {
  return (
    <div className="agent-widget tramite-widget">
      <div className="widget-header">
        <span className="widget-icon">📄</span>
        <div className="widget-titles">
          <h4>Trámite Escolar Registrado</h4>
          <span className="widget-subtitle">{data.tramite}</span>
        </div>
      </div>
      <div className="tramite-body">
        <div className="folio-badge">Folio: <code>{data.folio}</code></div>
        <p className="tramite-estado">Estado: <strong>{data.estado}</strong></p>
      </div>
    </div>
  );
};

// ==============================================================
// 🆕 10. WIDGET: EXÁMENES ETS
// ==============================================================
const ETSWidget = ({ data }) => {
  const examenes = data.examenes || [];

  return (
    <div className="agent-widget ets-widget">
      <div className="widget-header">
        <span className="widget-icon">📝</span>
        <div className="widget-titles">
          <h4>Exámenes a Título de Suficiencia (ETS)</h4>
          <span className="widget-subtitle">Periodo Oficial ESCOM</span>
        </div>
      </div>
      <div className="ets-list">
        {examenes.map((e, idx) => (
          <div key={idx} className="ets-item-card">
            <div className="ets-item-header">
              <span className="ets-materia">{e.materia}</span>
              <span className={`ets-badge ${e.estado === "Aprobado" ? "aprobado" : e.estado === "Reprobado" ? "reprobado" : "pendiente"}`}>
                {e.estado}
              </span>
            </div>
            <div className="ets-details">
              <span>📅 {e.fecha}</span>
              <span>📍 {e.aula}</span>
              <span>👨‍🏫 {e.profesor}</span>
            </div>
            {e.calificacion && e.calificacion !== "Sin presentar" && (
              <div className="ets-calif">Calificación: <strong>{e.calificacion}</strong></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ==============================================================
// 🆕 11. WIDGET: PLAN DE ESTUDIOS Y OPTATIVAS
// ==============================================================
const PlanOptativasWidget = ({ data }) => {
  const materias = data.materias || [];

  return (
    <div className="agent-widget optativas-widget">
      <div className="widget-header">
        <span className="widget-icon">📚</span>
        <div className="widget-titles">
          <h4>Materias Optativas y Mapa Curricular</h4>
          <span className="widget-subtitle">{data.carrera}</span>
        </div>
      </div>
      <div className="optativas-grid">
        {materias.map((m, idx) => (
          <div key={idx} className="optativa-card">
            <span className="opt-title">{m.nombre}</span>
            <div className="opt-meta">
              <span className="opt-clave">`{m.clave}`</span>
              <span className="opt-sem">Semestre {m.semestre}</span>
            </div>
            <span className="opt-cred">{m.creditos} Créditos · {m.horas}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==============================================================
// 🆕 12. WIDGET: UBICACIÓN DE PROFESOR O SALÓN
// ==============================================================
const UbicacionWidget = ({ data }) => {
  const resultados = data.resultados || [];

  return (
    <div className="agent-widget ubicacion-widget">
      <div className="widget-header">
        <span className="widget-icon">📍</span>
        <div className="widget-titles">
          <h4>Ubicación en el Plantel ESCOM</h4>
          <span className="widget-subtitle">Directorio de salones y cubículos</span>
        </div>
      </div>
      <div className="ubicaciones-list">
        {resultados.map((u, idx) => (
          <div key={idx} className="ubicacion-card">
            <div className="ub-top">
              <span className="ub-nombre">{u.nombre}</span>
              <span className="ub-tipo">{u.tipo}</span>
            </div>
            <p className="ub-lugar">📍 <strong>{u.cubiculo}</strong></p>
            <span className="ub-acad">{u.academia}</span>
            {u.contacto && <span className="ub-mail">✉️ {u.contacto}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ==============================================================
// 🆕 13. WIDGET: DATOS PERSONALES Y ESCOLARES
// ==============================================================
const DatosPersonalesWidget = ({ data }) => {
  const d = data.datos || {};

  return (
    <div className="agent-widget datos-widget">
      <div className="widget-header">
        <span className="widget-icon">👤</span>
        <div className="widget-titles">
          <h4>Ficha Escolar Oficial</h4>
          <span className="widget-subtitle">{d.carrera || "ESCOM - IPN"}</span>
        </div>
      </div>
      <div className="datos-content">
        <div className="datos-row">
          <span>Identificador Oficial:</span>
          <strong>{d.identificador} ({d.rol})</strong>
        </div>
        <div className="datos-row">
          <span>CURP:</span>
          <code>{d.curp}</code>
        </div>
        <div className="datos-row">
          <span>RFC:</span>
          <code>{d.rfc}</code>
        </div>
        <div className="datos-row">
          <span>Correo Institucional:</span>
          <span>{d.correo}</span>
        </div>
        <div className="datos-row">
          <span>Teléfono:</span>
          <span>{d.telefono}</span>
        </div>
        <div className="datos-row">
          <span>Domicilio Registrado:</span>
          <span className="domicilio-text">{d.domicilio}</span>
        </div>
      </div>
    </div>
  );
};

// ==============================================================
// 14. WIDGET: AUDITORÍA DE ASISTENCIAS (ART. 45 RGE)
// ==============================================================
const AsistenciasWidget = ({ data }) => {
  const materias = data.materias || [];

  return (
    <div className="agent-widget asistencias-widget">
      <div className="widget-header">
        <span className="widget-icon">📋</span>
        <div className="widget-titles">
          <h4>Auditoría de Asistencias y Faltas</h4>
          <span className="widget-subtitle">Normativa Art. 45 RGE · Mínimo 80% Asistencia Requerida</span>
        </div>
      </div>

      <div className="asistencias-list">
        {materias.map((m, idx) => {
          const isWarning = m.estado === "PRECAUCION";
          const isDanger = m.estado === "SIN_DERECHO";
          const badgeClass = isDanger ? "badge-danger" : isWarning ? "badge-warning" : "badge-success";

          return (
            <div key={idx} className={`asistencia-card ${m.estado.toLowerCase()}`}>
              <div className="asistencia-card-header">
                <span className="asistencia-materia-title">{m.materia} <small>({m.grupo})</small></span>
                <span className={`status-badge ${badgeClass}`}>
                  {m.asistencia_pct}% ({m.estado})
                </span>
              </div>

              <div className="asistencia-progress-bar">
                <div
                  className={`asistencia-progress-fill ${badgeClass}`}
                  style={{ width: `${Math.min(100, m.asistencia_pct)}%` }}
                ></div>
              </div>

              <div className="asistencia-meta">
                <span>Faltas: <strong>{m.faltas}</strong> / Máx. {m.faltas_permitidas}</span>
                <span className="asistencia-alerta">{m.alerta}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==============================================================
// 15. WIDGET: MONITOR DE CUPOS Y OCUPABILIDAD
// ==============================================================
const CuposWidget = ({ data }) => {
  const clases = data.clases || [];

  return (
    <div className="agent-widget cupos-widget">
      <div className="widget-header">
        <span className="widget-icon">📈</span>
        <div className="widget-titles">
          <h4>Monitor de Cupos y Ocupabilidad</h4>
          <span className="widget-subtitle">Disponibilidad en Periodo Activo</span>
        </div>
      </div>

      <div className="cupos-grid">
        {clases.map((c, idx) => {
          const badgeClass = c.estado === "DISPONIBLE" ? "badge-success" : c.estado === "POCOS_CUPOS" ? "badge-warning" : "badge-danger";

          return (
            <div key={idx} className="cupo-card">
              <div className="cupo-header">
                <span className="cupo-materia">{c.materia}</span>
                <span className={`status-badge ${badgeClass}`}>{c.disponibles} libres</span>
              </div>
              <div className="cupo-details">
                <span>Grupo: <strong>{c.grupo}</strong> ({c.turno})</span>
                <span>Docente: {c.profesor}</span>
                <span>Aula: {c.aula} · Cupo: {c.inscritos}/{c.cupo_maximo}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==============================================================
// 16. WIDGET: ESTATUS DE TRÁMITES ESCOLARES
// ==============================================================
const EstatusTramitesWidget = ({ data }) => {
  const tramites = data.tramites || [];

  return (
    <div className="agent-widget tramites-estatus-widget">
      <div className="widget-header">
        <span className="widget-icon">📑</span>
        <div className="widget-titles">
          <h4>Seguimiento de Trámites Escolares</h4>
          <span className="widget-subtitle">Gestión Escolar ESCOM</span>
        </div>
      </div>

      <div className="tramites-timeline">
        {tramites.map((t, idx) => (
          <div key={idx} className="tramite-timeline-item">
            <div className="timeline-marker"></div>
            <div className="timeline-content">
              <div className="timeline-header">
                <strong>{t.tipo}</strong>
                <span className="timeline-folio">#{t.folio}</span>
              </div>
              <div className="timeline-sub">
                <span className="timeline-date">📅 {t.fecha}</span>
                <span className={`status-badge badge-${t.estado.toLowerCase()}`}>{t.estado}</span>
              </div>
              <p className="timeline-desc">{t.comentarios || t.descripcion}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==============================================================
// 17. WIDGET: CONFIRMACIÓN DE ACCIONES HUMAN-IN-THE-LOOP
// ==============================================================
const ActionConfirmationWidget = ({ data, onConfirmAction }) => {
  const [status, setStatus] = useState("pending"); // pending, loading, confirmed, cancelled, error
  const [feedback, setFeedback] = useState("");

  const handleConfirm = async () => {
    setStatus("loading");
    if (onConfirmAction) {
      try {
        const result = await onConfirmAction(data.action, data.payload);
        if (result && result.success) {
          setStatus("confirmed");
          setFeedback(result.mensaje || "Acción confirmada exitosamente.");
        } else {
          setStatus("error");
          setFeedback(result?.detail || "Ocurrió un error al procesar la confirmación.");
        }
      } catch (err) {
        setStatus("error");
        setFeedback("Error de comunicación al autorizar la acción.");
      }
    } else {
      setStatus("confirmed");
      setFeedback("Acción autorizada por el usuario.");
    }
  };

  const handleCancel = () => {
    setStatus("cancelled");
    setFeedback("Operación cancelada por el alumno.");
  };

  return (
    <div className={`agent-widget action-confirmation-widget ${status}`}>
      <div className="widget-header">
        <span className="widget-icon">🛡️</span>
        <div className="widget-titles">
          <h4>{data.titulo || "Confirmación Requerida"}</h4>
          <span className="widget-subtitle">Acción Crítica Escolar (Human-in-the-Loop)</span>
        </div>
      </div>

      <p className="confirm-desc">{data.descripcion}</p>

      {data.payload && (
        <div className="confirm-payload-box">
          {Object.entries(data.payload).map(([k, v]) => (
            <div key={k} className="payload-row">
              <span className="payload-key">{k}:</span>
              <span className="payload-val">{String(v)}</span>
            </div>
          ))}
        </div>
      )}

      {status === "pending" && (
        <div className="confirm-actions-row">
          <button className="confirm-btn-primary" onClick={handleConfirm}>
            ✓ Confirmar y Registrar
          </button>
          <button className="confirm-btn-secondary" onClick={handleCancel}>
            ✕ Cancelar
          </button>
        </div>
      )}

      {status === "loading" && (
        <div className="confirm-loading-state">
          <span>Procesando registro seguro en PAIDEA...</span>
        </div>
      )}

      {(status === "confirmed" || status === "cancelled" || status === "error") && (
        <div className={`confirm-result-banner ${status}`}>
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
};

// ==============================================================
// 18. WIDGET: ALUMNOS EN RIESGO (VISTA DOCENTE)
// ==============================================================
const AlumnosRiesgoWidget = ({ data }) => {
  const alumnos = data.alumnos || [];

  return (
    <div className="agent-widget alumnos-riesgo-widget">
      <div className="widget-header">
        <span className="widget-icon">⚠️</span>
        <div className="widget-titles">
          <h4>Alerta Temprana: Alumnos en Riesgo</h4>
          <span className="widget-subtitle">{data.total_riesgo || alumnos.length} Alumnos Detectados con Promedio Reprobatorio</span>
        </div>
      </div>

      <div className="riesgo-cards-list">
        {alumnos.map((a, idx) => (
          <div key={idx} className="riesgo-item-card">
            <div className="riesgo-card-top">
              <strong>{a.nombre}</strong>
              <span className="status-badge badge-danger">P1: {a.parcial_1} | P2: {a.parcial_2}</span>
            </div>
            <div className="riesgo-card-mid">
              <span>Boleta: <code>{a.boleta}</code> · Grupo: {a.grupo} ({a.materia})</span>
            </div>
            <div className="riesgo-card-bottom">
              <span className="riesgo-motivo">Motivo: {a.motivo}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==============================================================
// 19. WIDGET: LISTA DE ALUMNOS POR GRUPO (VISTA DOCENTE)
// ==============================================================
const ListaGrupoWidget = ({ data }) => {
  const alumnos = data.alumnos || [];

  return (
    <div className="agent-widget lista-grupo-widget">
      <div className="widget-header">
        <span className="widget-icon">👥</span>
        <div className="widget-titles">
          <h4>Lista Oficial de Alumnos</h4>
          <span className="widget-subtitle">Grupo {data.grupo} · {data.materia} ({data.total_alumnos || alumnos.length} Alumnos)</span>
        </div>
      </div>

      <div className="alumnos-table-wrapper">
        <table className="alumnos-table">
          <thead>
            <tr>
              <th>Boleta</th>
              <th>Nombre</th>
              <th>P1</th>
              <th>P2</th>
              <th>Final</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((a, idx) => (
              <tr key={idx}>
                <td><code>{a.boleta}</code></td>
                <td>{a.nombre}</td>
                <td>{a.parcial_1}</td>
                <td>{a.parcial_2}</td>
                <td><strong>{a.final}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==============================================================
// 💡 CHIPS DE SEGUIMIENTO DINÁMICOS (Follow-Up Suggestions)
// ==============================================================
const FollowUpSuggestions = ({ suggestions, onSelectSuggestion }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="followup-suggestions-container">
      <span className="followup-label">💡 Sugerencias de seguimiento:</span>
      <div className="followup-chips">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            className="followup-chip-btn"
            onClick={() => onSelectSuggestion && onSelectSuggestion(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};

// ==============================================================
// 🎯 PARSER PRINCIPAL DE GENERATIVE UI (WidgetRenderer)
// ==============================================================
export const WidgetRenderer = ({ content, onSelectSuggestion, onConfirmAction }) => {
  if (!content) return null;

  // 1. Extraer sugerencias contextuales [SUGGESTIONS:[...]]
  let cleanContent = content;
  let suggestions = [];
  const suggestionsRegex = /\[SUGGESTIONS:(\[[\s\S]*?\])\]/;
  const suggMatch = suggestionsRegex.exec(content);
  if (suggMatch) {
    try {
      suggestions = JSON.parse(suggMatch[1]);
    } catch (e) {
      console.warn("Error al deserializar sugerencias:", e);
    }
    cleanContent = content.replace(suggestionsRegex, "").trim();
  }

  // 2. Extraer widgets interactivos [WIDGET:TIPO:{JSON}]
  const widgetRegex = /\[WIDGET:([A-Z_]+):(\{[\s\S]*?\})\]/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = widgetRegex.exec(cleanContent)) !== null) {
    const textBefore = cleanContent.substring(lastIndex, match.index);
    if (textBefore.trim()) {
      parts.push({ type: "text", content: textBefore });
    }

    const widgetType = match[1];
    let widgetData = {};
    try {
      widgetData = JSON.parse(match[2]);
    } catch (e) {
      console.warn("Error al deserializar JSON de widget:", e);
    }

    parts.push({ type: "widget", widgetType, data: widgetData });
    lastIndex = widgetRegex.lastIndex;
  }

  const remainingText = cleanContent.substring(lastIndex);
  if (remainingText.trim()) {
    parts.push({ type: "text", content: remainingText });
  }

  return (
    <div className="rendered-message-flow">
      {parts.length === 0 ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanContent}</ReactMarkdown>
      ) : (
        parts.map((p, idx) => {
          if (p.type === "text") {
            return (
              <div key={idx} className="text-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.content}</ReactMarkdown>
              </div>
            );
          }

          switch (p.widgetType) {
            case "KARDEX":
              return <KardexWidget key={idx} data={p.data} />;
            case "HORARIO":
              return <HorarioWidget key={idx} data={p.data} />;
            case "CLASE_ACTUAL":
              return <ClaseActualWidget key={idx} data={p.data} />;
            case "SIMULADOR":
              return <SimuladorWidget key={idx} data={p.data} />;
            case "AUDITORIA":
              return <AuditoriaWidget key={idx} data={p.data} />;
            case "CITA":
              return <CitaWidget key={idx} data={p.data} />;
            case "RECOMENDACION":
              return <RecomendacionWidget key={idx} data={p.data} />;
            case "METRICAS_DOCENTE":
              return <MetricasDocenteWidget key={idx} data={p.data} />;
            case "TRAMITE":
              return <TramiteWidget key={idx} data={p.data} />;
            case "ETS":
              return <ETSWidget key={idx} data={p.data} />;
            case "PLAN_OPTATIVAS":
              return <PlanOptativasWidget key={idx} data={p.data} />;
            case "UBICACION":
              return <UbicacionWidget key={idx} data={p.data} />;
            case "DATOS_PERSONALES":
              return <DatosPersonalesWidget key={idx} data={p.data} />;
            case "ASISTENCIAS":
              return <AsistenciasWidget key={idx} data={p.data} />;
            case "CUPOS":
              return <CuposWidget key={idx} data={p.data} />;
            case "ESTATUS_TRAMITES":
              return <EstatusTramitesWidget key={idx} data={p.data} />;
            case "ACTION_CONFIRMATION":
              return <ActionConfirmationWidget key={idx} data={p.data} onConfirmAction={onConfirmAction} />;
            case "ALUMNOS_RIESGO":
              return <AlumnosRiesgoWidget key={idx} data={p.data} />;
            case "LISTA_GRUPO":
              return <ListaGrupoWidget key={idx} data={p.data} />;
            default:
              return null;
          }
        })
      )}

      {/* Renderizar chips de seguimiento contextual */}
      {suggestions.length > 0 && (
        <FollowUpSuggestions
          suggestions={suggestions}
          onSelectSuggestion={onSelectSuggestion}
        />
      )}
    </div>
  );
};

export default WidgetRenderer;

