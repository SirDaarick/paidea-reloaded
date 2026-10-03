import React, { useState } from "react";
import Menu from "components/Menu";
import { useAuth } from "context/AuthContext";

export default function Documentos() {
  const { user } = useAuth();
  const [solicitandoId, setSolicitandoId] = useState(null);
  const [tramitesActivos, setTramitesActivos] = useState([
    {
      folio: "TRA-2026-94812",
      tipo: "Constancia de Estudios con Calificaciones",
      fechaSolicitud: "12/02/2026",
      fechaEntrega: "13/02/2026",
      estado: "Completado",
      formato: "PDF Digital Firmado",
    },
    {
      folio: "TRA-2026-88319",
      tipo: "Constancia de Inscripción Simple",
      fechaSolicitud: "05/02/2026",
      fechaEntrega: "05/02/2026",
      estado: "Completado",
      formato: "PDF Digital Firmado",
    },
    {
      folio: "TRA-2026-99104",
      tipo: "Boleta Global Certificada",
      fechaSolicitud: "14/02/2026",
      fechaEntrega: "18/02/2026",
      estado: "En Proceso",
      formato: "Validación DAE",
    },
  ]);

  const catalogoTramites = [
    {
      id: "constancia-calif",
      titulo: "Constancia de Estudios con Calificaciones",
      descripcion: "Incluye promedio ponderado, asignaturas cursadas y créditos acumulados SATCA validados.",
      tiempo: "24 a 48 hrs",
      costo: "Sin costo (Alumno Regular)",
      icon: "history_edu",
      destacado: true,
    },
    {
      id: "constancia-simple",
      titulo: "Constancia de Inscripción Simple",
      descripcion: "Acreditación oficial para trámites de becas Elisa Acuña, IMSS, tarifa de transporte o servicio militar.",
      tiempo: "Inmediata",
      costo: "Sin costo",
      icon: "badge",
      destacado: false,
    },
    {
      id: "boleta-global",
      titulo: "Boleta Global Certificada",
      descripcion: "Historial curricular completo validado ante la Dirección General del IPN con código de seguridad QR.",
      tiempo: "3 a 5 días",
      costo: "Sin costo",
      icon: "workspace_premium",
      destacado: false,
    },
    {
      id: "reposicion-credencial",
      titulo: "Reposición de Credencial Institucional",
      descripcion: "Emisión de nueva credencial plástica con chip NFC para acceso a laboratorios y biblioteca ESCOM.",
      tiempo: "5 a 7 días",
      costo: "$120.00 MXN",
      icon: "contact_emergency",
      destacado: false,
    },
  ];

  const handleSolicitar = (tramite) => {
    setSolicitandoId(tramite.id);
    setTimeout(() => {
      const nuevoFolio = `TRA-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      setTramitesActivos([
        {
          folio: nuevoFolio,
          tipo: tramite.titulo,
          fechaSolicitud: new Date().toLocaleDateString("es-MX"),
          fechaEntrega: tramite.tiempo === "Inmediata" ? new Date().toLocaleDateString("es-MX") : "En 48 hrs",
          estado: tramite.tiempo === "Inmediata" ? "Completado" : "En Proceso",
          formato: "PDF Digital Firmado",
        },
        ...tramitesActivos,
      ]);
      setSolicitandoId(null);
      alert(`¡Trámite ${nuevoFolio} solicitado con éxito!`);
    }, 800);
  };

  const handleDescargar = (t) => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-surface-ice font-body-md text-text-primary">
      <Menu />

      <main className="w-full max-w-[1440px] mx-auto pt-6 px-4 sm:px-6 lg:px-8 pb-16 space-y-6">
        {/* Header Institucional & Status Bar */}
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-card p-6 sm:p-8 rounded-2xl shadow-[8px_8px_20px_rgba(62,81,125,0.08),-6px_-6px_16px_#FFFFFF]">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-secondary-fixed text-primary text-xs font-semibold shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                Periodo 2026-1
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Ventanilla Abierta (Atención 24/7)
              </span>
              <span className="text-text-muted text-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-accent-blue">verified_user</span>
                Validez Institucional IPN
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight pt-1">
              Ventanilla Virtual y Trámites Escolares
            </h1>
            <p className="text-xs sm:text-sm text-text-muted">
              Gestión y expedición digital de documentos oficiales con firma electrónica avanzada · Dirección de Administración Escolar (DAE - ESCOM).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => alert("Tabulador oficial IPN: Trámites académicos regulares son gratuitos para estudiantes inscritos.")}
              className="px-4 py-2.5 rounded-xl bg-surface-container-low text-primary text-xs font-bold shadow-sm flex items-center gap-2 hover:bg-surface-container-high transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">payments</span>
              <span>Tabulador y Aranceles</span>
            </button>
          </div>
        </section>

        {/* Sección 1: Catálogo de Trámites Disponibles */}
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs text-accent-blue uppercase tracking-widest font-bold block">
                Catálogo Académico
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">
                Trámites y Constancias Disponibles
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-text-muted text-xs">
              <span className="material-symbols-outlined text-[17px] text-emerald-600">bolt</span>
              <span>Emisión automatizada con cadena digital SHA-256</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {catalogoTramites.map((t) => (
              <div
                key={t.id}
                className={`bg-surface-card rounded-2xl p-5 shadow-[8px_8px_20px_rgba(62,81,125,0.08),-6px_-6px_16px_#FFFFFF] flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 relative ${
                  t.destacado ? "ring-2 ring-accent-blue/30" : ""
                }`}
              >
                {t.destacado && (
                  <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold shadow-sm">
                    Frecuente
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-secondary-fixed text-primary flex items-center justify-center shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
                      <span className="material-symbols-outlined text-[26px]">{t.icon}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">schedule</span>
                      {t.tiempo}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-text-primary leading-snug">{t.titulo}</h3>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">{t.descripcion}</p>
                  </div>

                  <div className="p-2 rounded-lg bg-surface-container-low text-[11px] text-text-muted flex justify-between items-center">
                    <span>Costo:</span>
                    <span className="font-bold text-emerald-700">{t.costo}</span>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => handleSolicitar(t)}
                    disabled={solicitandoId === t.id}
                    className="w-full py-2.5 px-3 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary-container transition-all active:scale-95 cursor-pointer disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {solicitandoId === t.id ? "sync" : "edit_document"}
                    </span>
                    <span>{solicitandoId === t.id ? "Generando..." : "Solicitar Trámite"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sección 2: Historial de Trámites Solicitados */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-primary">Historial de Solicitudes y Documentos</h2>
            <span className="text-xs text-text-muted">{tramitesActivos.length} registros</span>
          </div>

          <div className="bg-surface-card rounded-2xl shadow-[8px_8px_20px_rgba(62,81,125,0.08),-6px_-6px_16px_#FFFFFF] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-low text-text-muted uppercase tracking-wider font-semibold border-b border-surface-container-high/40">
                  <tr>
                    <th className="py-3 px-4">Folio Oficial</th>
                    <th className="py-3 px-4">Tipo de Trámite</th>
                    <th className="py-3 px-4">Fecha Solicitud</th>
                    <th className="py-3 px-4">Fecha Entrega</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Descarga</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high/30">
                  {tramitesActivos.map((t, idx) => {
                    const isCompletado = t.estado === "Completado";

                    return (
                      <tr key={idx} className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-primary">{t.folio}</td>
                        <td className="py-3.5 px-4 font-semibold text-text-primary">{t.tipo}</td>
                        <td className="py-3.5 px-4 text-text-muted">{t.fechaSolicitud}</td>
                        <td className="py-3.5 px-4 text-text-muted">{t.fechaEntrega}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              isCompletado
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[13px]">
                              {isCompletado ? "check_circle" : "hourglass_empty"}
                            </span>
                            {t.estado}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isCompletado ? (
                            <button
                              onClick={() => handleDescargar(t)}
                              className="px-3 py-1.5 rounded-lg bg-surface-container-low text-primary text-xs font-bold hover:bg-surface-card shadow-sm inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[15px] text-accent-blue">
                                download
                              </span>
                              <span>PDF</span>
                            </button>
                          ) : (
                            <span className="text-text-muted text-[11px] italic">En revisión DAE</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}