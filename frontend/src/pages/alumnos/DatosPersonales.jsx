import React, { useState } from "react";
import Menu from "components/Menu";
import { useAuth } from "context/AuthContext";

export default function DatosPersonales() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    telefono: "55 8492 1042",
    celular: "55 1204 8839",
    correoPersonal: "contacto.personal@gmail.com",
    calle: "Av. Juan de Dios Bátiz",
    numExt: "420",
    numInt: "Edif. B Depto 102",
    colonia: "Lindavista",
    alcaldia: "Gustavo A. Madero",
    cp: "07738",
    contactoEmergencia: "Laura Reyes Morales (Madre)",
    telEmergencia: "55 4920 1832",
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const alumno = user?.alumno;
  const nombreDisplay = user?.nombre_completo || "Carlos Pérez Ramírez";
  const boletaDisplay = alumno?.boleta || "2021630001";
  const carreraDisplay = alumno?.carrera?.nombre || "Ingeniería en Sistemas Computacionales";
  const correoDisplay = user?.email || "alumno1@paidea.ipn.mx";

  const handleCopy = () => {
    navigator.clipboard.writeText(boletaDisplay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-surface-ice font-body-md text-text-primary">
      <Menu />

      <main className="w-full max-w-[1440px] mx-auto pt-6 px-4 sm:px-6 lg:px-8 pb-16 space-y-6">
        {/* Top Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full bg-secondary-fixed text-primary text-xs font-semibold flex items-center gap-1 shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
                <span className="material-symbols-outlined text-[15px]">badge</span>
                Estudiante · Expediente Digital DAE
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-text-muted text-xs font-semibold">
                Semestre 2026-1
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              Mi Perfil y Expediente de Datos
            </h1>
            <p className="text-xs sm:text-sm text-text-muted">
              Gestiona tu información personal, credencial escolar institucional y datos de contacto oficiales ante la ESCOM.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-card text-primary text-xs font-bold shadow-[6px_6px_16px_rgba(62,81,125,0.08),-4px_-4px_12px_#ffffff] hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-secondary text-[18px]">download_for_offline</span>
              <span>Descargar Ficha de Registro (PDF)</span>
            </button>
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Credencial Digital (5 cols) */}
          <aside className="lg:col-span-5 space-y-4">
            <div className="bg-surface-card rounded-2xl p-6 shadow-[10px_14px_28px_rgba(62,81,125,0.08),-6px_-6px_16px_#FFFFFF] flex flex-col items-center text-center relative overflow-hidden">
              <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-surface-container-high/40 text-xs font-semibold text-text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                  IPN · ESCOM | Credencial Digital
                </span>
                <span className="material-symbols-outlined text-secondary text-[20px]">contactless</span>
              </div>

              {/* Foto Circular Clay */}
              <div className="relative my-3">
                <div className="w-28 h-28 rounded-full bg-primary-container text-white text-3xl font-extrabold flex items-center justify-center shadow-[8px_8px_20px_rgba(62,81,125,0.15),-6px_-6px_16px_#ffffff,inset_2px_2px_4px_rgba(255,255,255,0.4)]">
                  {nombreDisplay.charAt(0)}
                </div>
              </div>

              <h2 className="text-lg font-extrabold text-primary">{nombreDisplay}</h2>
              <span className="px-3 py-1 rounded-full bg-secondary-fixed text-primary text-xs font-semibold mt-1">
                Alumno Regular de Licenciatura
              </span>

              {/* Carrera Pill */}
              <div className="w-full p-2.5 rounded-xl bg-surface-container-low my-3 shadow-[inset_1px_1px_3px_rgba(62,81,125,0.06)]">
                <p className="text-xs font-bold text-primary">{carreraDisplay}</p>
                <p className="text-[11px] text-text-muted">Plan de Estudios 2020 · Semestre 6</p>
              </div>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Activo y Regular · Periodo 2026-1</span>
              </div>

              {/* Datos de Identificación en pastillas */}
              <div className="w-full space-y-2 text-left">
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-muted font-medium">No. de Boleta</span>
                    <span className="text-xs font-bold font-mono text-text-primary">{boletaDisplay}</span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg bg-surface-card text-primary shadow-sm hover:bg-surface-bright"
                    title="Copiar boleta"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copied ? "check" : "content_copy"}
                    </span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low shadow-[inset_1px_1px_2px_rgba(62,81,125,0.06)]">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-muted font-medium">Correo Institucional</span>
                    <span className="text-xs font-semibold text-primary truncate max-w-[200px]">
                      {correoDisplay}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-[18px]">mail</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Columna Derecha: Formulario de Datos Personales (7 cols) */}
          <section className="lg:col-span-7 bg-surface-card rounded-2xl p-6 sm:p-7 shadow-[10px_14px_28px_rgba(62,81,125,0.08),-6px_-6px_16px_#FFFFFF] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
              <h2 className="text-base sm:text-lg font-bold text-primary">Información de Contacto y Domicilio</h2>
              <span className="text-xs text-text-muted">Actualizado: 2026-1</span>
            </div>

            {savedSuccess && (
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>¡Datos de contacto actualizados correctamente en el expediente institucional!</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-text-muted mb-1">Teléfono Fijo</label>
                  <input
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs sm:text-sm focus:outline-none focus:bg-surface-card shadow-[inset_1px_1px_3px_rgba(62,81,125,0.08)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-muted mb-1">Teléfono Móvil</label>
                  <input
                    type="text"
                    name="celular"
                    value={formData.celular}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs sm:text-sm focus:outline-none focus:bg-surface-card shadow-[inset_1px_1px_3px_rgba(62,81,125,0.08)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-muted mb-1">Correo Electrónico Alterno</label>
                <input
                  type="email"
                  name="correoPersonal"
                  value={formData.correoPersonal}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs sm:text-sm focus:outline-none focus:bg-surface-card shadow-[inset_1px_1px_3px_rgba(62,81,125,0.08)]"
                />
              </div>

              <div className="pt-2 border-t border-surface-container-high/40">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
                  Domicilio Registrado
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-8">
                    <label className="block text-[11px] font-bold text-text-muted mb-1">Calle y Número</label>
                    <input
                      type="text"
                      name="calle"
                      value={formData.calle}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs sm:text-sm focus:outline-none focus:bg-surface-card shadow-[inset_1px_1px_3px_rgba(62,81,125,0.08)]"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-text-muted mb-1">Código Postal</label>
                    <input
                      type="text"
                      name="cp"
                      value={formData.cp}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs sm:text-sm focus:outline-none focus:bg-surface-card shadow-[inset_1px_1px_3px_rgba(62,81,125,0.08)]"
                    />
                  </div>
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-bold text-text-muted mb-1">Colonia</label>
                    <input
                      type="text"
                      name="colonia"
                      value={formData.colonia}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs sm:text-sm focus:outline-none focus:bg-surface-card shadow-[inset_1px_1px_3px_rgba(62,81,125,0.08)]"
                    />
                  </div>
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-bold text-text-muted mb-1">Alcaldía / Municipio</label>
                    <input
                      type="text"
                      name="alcaldia"
                      value={formData.alcaldia}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs sm:text-sm focus:outline-none focus:bg-surface-card shadow-[inset_1px_1px_3px_rgba(62,81,125,0.08)]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-surface-container-high/40">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
                  Contacto de Emergencia
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-text-muted mb-1">Nombre y Parentesco</label>
                    <input
                      type="text"
                      name="contactoEmergencia"
                      value={formData.contactoEmergencia}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs sm:text-sm focus:outline-none focus:bg-surface-card shadow-[inset_1px_1px_3px_rgba(62,81,125,0.08)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-text-muted mb-1">Teléfono de Emergencia</label>
                    <input
                      type="text"
                      name="telEmergencia"
                      value={formData.telEmergencia}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs sm:text-sm focus:outline-none focus:bg-surface-card shadow-[inset_1px_1px_3px_rgba(62,81,125,0.08)]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-container transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[17px]">save</span>
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}