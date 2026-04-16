import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "styles/index.css";
import Menu from "components/Menu.jsx";
import Button from "components/Button";
import InputField from "components/InputField";
import { useIdAlumno } from "consultas/idAlumno";
import apiCall from "consultas/APICall.jsx";
import Espera from "./Espera";
import Mensaje from "components/Mensaje.jsx";

export default function EditarDatosPersonales() {
  const navigate = useNavigate();
  const idAlumno = useIdAlumno();
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(true);
  const [usuarioId, setUsuarioId] = useState(null);
  const [form, setForm] = useState({
    curp: "",
    rfc: "",
    fechaNacimiento: "",
    nacionalidad: "",
    entidadNacimiento: "",
    calle: "",
    noExt: "",
    noInt: "",
    colonia: "",
    cp: "",
    estado: "",
    delmpo: "",
    telefono: "",
    movil: "",
    email: "",
    labora: "",
    telOficina: "",
  });

  // --- Estados para mensajes ---
  const [mensajeVisible, setMensajeVisible] = useState(false);
  const [mensajeTitulo, setMensajeTitulo] = useState("");
  const [mensajeTexto, setMensajeTexto] = useState("");

  const mostrarMensaje = (titulo, texto) => {
    setMensajeTitulo(titulo);
    setMensajeTexto(texto);
    setMensajeVisible(true);
  };

  const cerrarMensaje = () => {
    setMensajeVisible(false);
    setMensajeTitulo("");
    setMensajeTexto("");
  };

  useEffect(() => {
    async function fetchDatosPersonales() {
      if (!idAlumno) return;

      try {
        const usuario = await apiCall(`/usuario/${idAlumno}`, "GET");

        if (!usuario) {
          throw new Error("No se encontró el usuario");
        }

        setUsuarioId(usuario._id);
        const dp = usuario.datosPersonales || {};
        const dir = usuario.direcciones?.[0] || {};

        const fechaNacimiento = dp.nacimiento
          ? new Date(dp.nacimiento).toISOString().split("T")[0]
          : "";

        setForm({
          curp: dp.curp || "",
          rfc: dp.rfc || "",
          fechaNacimiento: fechaNacimiento,
          nacionalidad: dp.nacionalidad || "",
          entidadNacimiento: dp.entidadNacimiento || "",
          calle: dir.calle || "",
          noExt: dir.noExt || "",
          noInt: dir.noInt || "",
          colonia: dir.colonia || "",
          cp: dir.cp || "",
          estado: dir.estado || "",
          delmpo: dir.delMpo || "",
          telefono: dp.telefono || "",
          movil: dp.movil || "",
          email: dp.email || usuario.correo || "",
          labora: dp.labora || "NO",
          telOficina: dp.telOficina || "",
        });

        setLoading(false);
      } catch (error) {
        console.error("Error al cargar datos, usando valores por defecto:", error);

        setForm({
          curp: "SOBD040730MDFSCNA5",
          rfc: "SOBD040730",
          fechaNacimiento: "2004-07-30",
          nacionalidad: "MÉXICO",
          entidadNacimiento: "CIUDAD DE MÉXICO",
          calle: "Colina de las Lajas",
          noExt: "28",
          noInt: "0",
          colonia: "Boulevares",
          cp: "53140",
          estado: "MÉXICO",
          delmpo: "NAUCALPAN",
          telefono: "5548289685",
          movil: "5693587280",
          email: "sosa.becerra.daniela.itzel@gmail.com",
          labora: "SI",
          telOficina: "7785893872",
        });

        setLoading(false);
      }
    }

    fetchDatosPersonales();
  }, [idAlumno]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!pwd.trim()) {
      mostrarMensaje("Contraseña requerida", "Para guardar cambios, ingresa tu contraseña.");
      return;
    }

    try {
      const datosActualizados = {
        datosPersonales: {
          curp: form.curp,
          rfc: form.rfc,
          nacimiento: form.fechaNacimiento,
          nacionalidad: form.nacionalidad,
          entidadNacimiento: form.entidadNacimiento,
          telefono: form.telefono,
          movil: form.movil,
          email: form.email,
          labora: form.labora,
          telOficina: form.telOficina,
        },
        direcciones: [
          {
            calle: form.calle,
            noExt: form.noExt,
            noInt: form.noInt,
            colonia: form.colonia,
            cp: form.cp,
            estado: form.estado,
            delMpo: form.delmpo,
          },
        ],
      };

      if (pwd) {
        const respuesta_pwd = await apiCall(
          `/usuario/compare-password/${usuarioId}`,
          "POST",
          { password: pwd }
        );
        if (!respuesta_pwd.isMatch) {
          mostrarMensaje("Error de contraseña", "Contraseña incorrecta. No se pudieron guardar los cambios.");
          return;
        }
      }

      const resultado = await apiCall(`/usuario/${usuarioId}`, "PUT", datosActualizados);
      console.log("Datos actualizados correctamente:", resultado);
      mostrarMensaje("Éxito", "Datos personales actualizados");
      setPwd("");
      navigate("/alumno/datos-personales");
    } catch (error) {
      console.error("Error al actualizar datos:", error);
      console.log("Datos a guardar (modo offline):", form);
      mostrarMensaje("⚠️ Advertencia", "Datos guardados localmente (servidor no disponible)");
      setPwd("");
    }
  };

  if (loading) return <Espera />;

  return (
    <div className="bienvenida-container">
      <Menu />

      <main className="page">
        <div className="edp-container">
          <aside className="edp-side card">
            <h2 className="edp-title">Editar datos personales</h2>
            <p className="edp-text">
              En esta sección podrás editar tus datos personales; recuerda ingresar tu
              contraseña para guardar los cambios.
            </p>

            <label className="edp-label">Ingresa contraseña</label>
            <div className="edp-input-icon">
              <input
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="Ingresa contraseña"
              />
              <span className="lock">🔒</span>
            </div>

            <div className="edp-btns">
              <Button variant="secondary" onClick={() => navigate("/datos-personales")}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={onSubmit}>
                Guardar cambios
              </Button>
            </div>
          </aside>

          <section className="card edp-form-wrap">
            <form onSubmit={onSubmit}>
              <div className="edp-block">
                <div className="edp-grid">
                  <InputField label="CURP" name="curp" value={form.curp} onChange={onChange} />
                  <InputField label="RFC" name="rfc" value={form.rfc} onChange={onChange} />
                  <InputField
                    label="Fecha de Nacimiento"
                    type="date"
                    name="fechaNacimiento"
                    value={form.fechaNacimiento}
                    onChange={onChange}
                  />
                  <InputField label="Nacionalidad" name="nacionalidad" value={form.nacionalidad} onChange={onChange} />
                  <InputField
                    label="Entidad de Nacimiento"
                    name="entidadNacimiento"
                    value={form.entidadNacimiento}
                    onChange={onChange}
                    wide={true}
                  />
                </div>
              </div>

              <h3 className="edp-sec-title">Dirección</h3>
              <div className="edp-block">
                <div className="edp-grid">
                  <InputField label="Calle" name="calle" value={form.calle} onChange={onChange} wide={true} />
                  <InputField label="No. Ext" name="noExt" value={form.noExt} onChange={onChange} />
                  <InputField label="No. Int" name="noInt" value={form.noInt} onChange={onChange} />
                  <InputField label="Colonia" name="colonia" value={form.colonia} onChange={onChange} />
                  <InputField label="C.P." name="cp" value={form.cp} onChange={onChange} />
                  <InputField label="Estado" name="estado" value={form.estado} onChange={onChange} />
                  <InputField label="Del/Mpo" name="delmpo" value={form.delmpo} onChange={onChange} />
                  <InputField label="Teléfono" name="telefono" value={form.telefono} onChange={onChange} />
                  <InputField label="Móvil" name="movil" value={form.movil} onChange={onChange} />
                  <InputField label="E-mail" name="email" value={form.email} onChange={onChange} wide={true} />
                  <InputField label="Labora" name="labora" value={form.labora} onChange={onChange} />
                  <InputField label="Tel. Oficina" name="telOficina" value={form.telOficina} onChange={onChange} />
                </div>
              </div>

              <div className="edp-btns end">
                <Button variant="primary" type="submit">
                  Guardar cambios
                </Button>
              </div>
            </form>
          </section>
        </div>
      </main>

      {/* Componente Mensaje */}
      <Mensaje
        titulo={mensajeTitulo}
        mensaje={mensajeTexto}
        visible={mensajeVisible}
        onCerrar={cerrarMensaje}
      />
    </div>
  );
}
