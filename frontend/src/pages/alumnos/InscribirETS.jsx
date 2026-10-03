import React, { useState } from "react";
import Menu from "components/Menu";
import { useAuth } from "context/AuthContext";

export default function InscribirETS() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("inscribir"); // 'inscribir' | 'inscritos' | 'historial'
  const [searchQuery, setSearchQuery] = useState("");
  const [registeredEts, setRegisteredEts] = useState([
    {
      clave: "IA-301",
      materia: "Probabilidad y Estadística Aplicada",
      profesor: "Dr. Benjamín Luna Benoso",
      fecha: "Jueves 26 de Febrero, 2026",
      horario: "10:00 - 12:00 hrs",
      aula: "Edif. 1 · Salón 1205",
      turno: "Matutino",
      creditos: 7.0,
      folio: "ETS-2026-1-84920",
    },
  ]);
  const [modalConfirm, setModalConfirm] = useState(null);

  // Catálogo de ETS disponibles para el alumno en ESCOM
  const availableEts = [
    {
      clave: "IA-402",
      materia: "Teoría de la Computación",
      profesor: "M. en C. Roberto Palacios Nava",
      fecha: "Viernes 27 de Febrero, 2026",
      horario: "08:00 - 10:00 hrs",
      aula: "Edificio 1 · Salón 1104",
      turno: "Matutino",
      creditos: 7.5,
      cupo_disponible: 14,
      cupo_total: 30,
      icon: "terminal",
    },
    {
      clave: "IA-401",
      materia: "Arquitectura de Computadoras",
      profesor: "M. en C. Miguel Ángel Sánchez",
      fecha: "Lunes 23 de Febrero, 2026",
      horario: "12:00 - 14:00 hrs",
      aula: "Edificio 2 · Salón 2101",
      turno: "Matutino",
      creditos: 7.0,
      cupo_disponible: 8,
      cupo_total: 25,
      icon: "memory",
    },
    {
      clave: "IA-303",
      materia: "Álgebra Lineal Avanzada",
      profesor: "Dra. Gabriela Corona",
      fecha: "Martes 24 de Febrero, 2026",
      horario: "14:00 - 16:00 hrs",
      aula: "Edificio 1 · Auditorio 2",
      turno: "Vespertino",
      creditos: 6.5,
      cupo_disponible: 22,
      cupo_total: 40,
      icon: "calculate",
    },
    {
      clave: "IA-204",
      materia: "Ecuaciones Diferenciales",
      profesor: "Dr. Fernando Arreola",
      fecha: "Miércoles 25 de Febrero, 2026",
      horario: "10:00 - 12:00 hrs",
      aula: "Edificio 2 · Salón 2203",
      turno: "Matutino",
      creditos: 7.5,
      cupo_disponible: 5,
      cupo_total: 30,
      icon: "functions",
    },
  ];

  // Historial de ETS previamente presentados
  const historyEts = [
    {
      periodo: "2025-2",
      clave: "IA-202",
      materia: "Matemáticas Discretas",
      profesor: "Dr. Edgardo Franco Martínez",
      calificacion: 8.0,
      estado: "Aprobado",
      fecha: "Junio 2025",
    },
    {
      periodo: "2025-1",
      clave: "IA-102",
      materia: "Física Clásica y Termodinámica",
      profesor: "M. en C. Juan Carlos Moreno",
      calificacion: 9.0,
      estado: "Aprobado",
      fecha: "Enero 2025",
    },
  ];

  const maxEts = 2;
  const currentCount = registeredEts.length;

  const handleRegisterConfirm = () => {
    if (modalConfirm) {
      setRegisteredEts([
        ...registeredEts,
        {
          ...modalConfirm,
          folio: `ETS-2026-1-${Math.floor(10000 + Math.random() * 90000)}`,
        },
      ]);
      setModalConfirm(null);
    }
  };

  const handleCancelEts = (clave) => {
    setRegisteredEts(registeredEts.filter((e) => e.clave !== clave));
  };

  const filteredAvailable = availableEts.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      item.materia.toLowerCase().includes(q) ||
      item.clave.toLowerCase().includes(q) ||
      item.profesor.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-surface-ice font-body-md text-text-primary">
      <Menu />

      <main className="w-full max-w-[1440px] mx-auto pt-6 px-4 sm:px-6 lg:px-8 pb-16 space-y-6">
        {/* Top Header & Actions Bar */}
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-text-muted text-xs">
              <span>PAIDEA</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span>Trámites Escolares</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-primary font-bold">Exámenes a Título de Suficiencia (ETS)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              Gestión de Exámenes a Título de Suficiencia (ETS)
            </h1>
            <p className="text-xs sm:text-sm text-text-muted">
              Periodo Lectivo 2026-1 · Dirección de Administración Escolar (DAE - ESCOM)
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-card text-primary text-xs sm:text-sm font-bold shadow-[6px_6px_16px_rgba(62,81,125,0.08),-4px_-4px_12px_#ffffff] hover:bg-surface-bright transition-all active:scale-98 cursor-pointer"
            >
              <span className="material-symbols-outlined text-accent-blue text-[18px]">picture_as_pdf</span>
              <span>Descargar Comprobante ETS (PDF)</span>
            </button>
          </div>
        </section>

        {/* Rule / Banner Callout Card */}
        <section className="relative overflow-hidden bg-surface-card rounded-2xl p-5 sm:p-6 shadow-[8px_8px_20px_rgba(62,81,125,0.08),-6px_-6px_16px_#FFFFFF]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 max-w-3xl">
              <div className="p-2.5 rounded-xl bg-tertiary-fixed text-primary shrink-0 flex items-center justify-center shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
                <span className="material-symbols-outlined text-[24px]">verified_user</span>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">Reglamento General de Estudios del IPN</span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-low text-text-muted text-[10px] font-semibold">
                    Art. 47
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                  Tienes derecho a presentar un máximo de <strong className="text-text-primary">2 ETS por periodo ordinario</strong>. Las asignaciones de fecha, cupo y sinodales se encuentran sujetas a la capacidad operativa de la ESCOM.
                </p>
              </div>
            </div>

            {/* Counter Pill Indicator */}
            <div className="px-4 py-2 rounded-xl bg-surface-container-low flex items-center gap-3 shrink-0 self-start md:self-center shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Inscripciones</span>
                <span className="text-base font-extrabold text-primary leading-none">
                  {currentCount} / {maxEts} <span className="text-xs text-text-muted font-normal">activas</span>
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-surface-card p-1 shadow-sm flex items-center justify-center">
                <span className="material-symbols-outlined text-accent-blue text-[18px]">
                  {currentCount >= maxEts ? "lock" : "edit_calendar"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation Tabs & Search */}
        <section className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex items-center p-1.5 rounded-full bg-surface-container-low gap-1 shrink-0 shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
            <button
              onClick={() => setActiveTab("inscribir")}
              className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === "inscribir"
                  ? "bg-primary-container text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">edit_calendar</span>
              <span>Inscribir ETS</span>
            </button>
            <button
              onClick={() => setActiveTab("inscritos")}
              className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === "inscritos"
                  ? "bg-primary-container text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">checklist_rtl</span>
              <span>Mis Exámenes Inscritos</span>
              <span className="px-1.5 py-0.5 rounded-full bg-secondary-fixed text-primary text-[10px] font-bold">
                {currentCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("historial")}
              className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === "historial"
                  ? "bg-primary-container text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">history_edu</span>
              <span>Historial de Resultados ETS</span>
            </button>
          </div>

          {activeTab === "inscribir" && (
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[19px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar materia por clave o profesor..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-low text-xs sm:text-sm placeholder:text-text-muted focus:bg-surface-card focus:outline-none transition-all shadow-[inset_1px_1px_3px_rgba(62,81,125,0.06)]"
              />
            </div>
          )}
        </section>

        {/* Tab 1: Inscribir ETS */}
        {activeTab === "inscribir" && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-primary">
                  Inscribir Exámenes a Título de Suficiencia
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-primary text-xs font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Periodo ETS Ordinario 2026-1 · Ventana Abierta
                </span>
              </div>
              <span className="text-xs text-text-muted">Cierre: 18 de Febrero, 23:59 hrs</span>
            </div>

            <div className="space-y-3.5">
              {filteredAvailable.map((item) => {
                const isAlreadyInscribed = registeredEts.some((e) => e.clave === item.clave);

                return (
                  <div
                    key={item.clave}
                    className="p-5 rounded-2xl bg-surface-card shadow-[8px_8px_20px_rgba(62,81,125,0.08),-6px_-6px_16px_#FFFFFF] flex flex-col xl:flex-row xl:items-center justify-between gap-4 hover:-translate-y-0.5 transition-transform"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0 shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
                        <span className="material-symbols-outlined text-[24px]">{item.icon || "school"}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs px-2 py-0.5 rounded-md bg-surface-container-low text-text-muted font-bold font-mono">
                            Clave: {item.clave}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-tertiary-fixed text-primary font-semibold">
                            {item.creditos} Créditos SATCA
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-text-primary">{item.materia}</h3>
                        <p className="text-xs text-text-muted flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">person</span>
                          <span>
                            Profesor Titular: <strong className="text-text-primary">{item.profesor}</strong>
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-2 xl:py-0 border-y xl:border-y-0 border-surface-container-high/40 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-surface-container-low text-primary shadow-sm">
                          <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-text-muted block">Fecha de Examen</span>
                          <span className="font-bold text-text-primary">{item.fecha}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-surface-container-low text-primary shadow-sm">
                          <span className="material-symbols-outlined text-[18px]">schedule</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-text-muted block">Horario y Aula</span>
                          <span className="font-bold text-text-primary">{item.horario}</span>
                          <span className="text-[10px] text-text-muted block">{item.aula}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-surface-container-low text-primary shadow-sm">
                          <span className="material-symbols-outlined text-[18px]">group</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-text-muted block">Disponibilidad</span>
                          <span className="font-bold text-emerald-700">
                            {item.cupo_disponible} de {item.cupo_total} lugares
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end shrink-0">
                      {isAlreadyInscribed ? (
                        <span className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          Inscrito
                        </span>
                      ) : currentCount >= maxEts ? (
                        <button
                          disabled
                          className="px-4 py-2 rounded-xl bg-surface-container-low text-text-muted text-xs font-semibold cursor-not-allowed"
                        >
                          Límite Alcanzado (2/2)
                        </button>
                      ) : (
                        <button
                          onClick={() => setModalConfirm(item)}
                          className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary-container transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">add_circle</span>
                          <span>Inscribir ETS</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Tab 2: Mis Exámenes Inscritos */}
        {activeTab === "inscritos" && (
          <section className="space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-primary">Mis Exámenes Inscritos (Periodo 2026-1)</h2>
            {registeredEts.length === 0 ? (
              <div className="p-12 bg-surface-card rounded-2xl shadow-[8px_8px_20px_rgba(62,81,125,0.08)] text-center text-text-muted">
                No tienes exámenes ETS registrados para este periodo.
              </div>
            ) : (
              <div className="space-y-3">
                {registeredEts.map((item) => (
                  <div
                    key={item.clave}
                    className="p-5 rounded-2xl bg-surface-card shadow-[8px_8px_20px_rgba(62,81,125,0.08),-6px_-6px_16px_#FFFFFF] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-surface-container-low font-bold text-primary font-mono">
                          {item.clave}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                          Registro Activo
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-text-primary">{item.materia}</h3>
                      <p className="text-xs text-text-muted">
                        {item.profesor} · {item.fecha} ({item.horario}) · {item.aula}
                      </p>
                      <span className="text-[11px] font-mono text-secondary block pt-1">
                        Folio Comprobante: {item.folio}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.print()}
                        className="px-3.5 py-2 rounded-xl bg-surface-container-low text-primary text-xs font-bold hover:bg-surface-card shadow-sm flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">print</span>
                        <span>Imprimir</span>
                      </button>
                      <button
                        onClick={() => handleCancelEts(item.clave)}
                        className="px-3.5 py-2 rounded-xl bg-red-50 text-error hover:bg-red-100 text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                        <span>Dar de baja</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab 3: Historial de Resultados ETS */}
        {activeTab === "historial" && (
          <section className="space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-primary">Historial de Calificaciones ETS</h2>
            <div className="space-y-3">
              {historyEts.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-surface-card shadow-[8px_8px_20px_rgba(62,81,125,0.08),-6px_-6px_16px_#FFFFFF] flex items-center justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs text-text-muted font-semibold">Periodo {item.periodo} · {item.fecha}</span>
                    <h3 className="text-base font-bold text-text-primary">{item.materia}</h3>
                    <p className="text-xs text-text-muted">{item.profesor} · Clave {item.clave}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xl font-extrabold text-emerald-800">{item.calificacion.toFixed(1)}</span>
                      <span className="text-xs text-emerald-700 font-semibold block">{item.estado}</span>
                    </div>
                    <span className="material-symbols-outlined text-emerald-600 text-[24px]">verified</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Modal de Confirmación de Inscripción ETS */}
        {modalConfirm && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface-card rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-secondary-fixed text-primary mx-auto flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[32px]">edit_calendar</span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-extrabold text-primary">Confirmar Inscripción a ETS</h3>
                <p className="text-xs sm:text-sm text-text-muted mt-1">
                  ¿Deseas inscribir la asignatura <strong>{modalConfirm.materia}</strong> ({modalConfirm.clave})?
                </p>
              </div>

              <div className="p-3.5 bg-surface-container-low rounded-xl text-xs space-y-1">
                <div><strong>Fecha:</strong> {modalConfirm.fecha}</div>
                <div><strong>Horario:</strong> {modalConfirm.horario}</div>
                <div><strong>Aula:</strong> {modalConfirm.aula}</div>
                <div><strong>Sinodal:</strong> {modalConfirm.profesor}</div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setModalConfirm(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-muted hover:bg-surface-container-low"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRegisterConfirm}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-container"
                >
                  Confirmar Registro
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}