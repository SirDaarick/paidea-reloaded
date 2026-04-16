import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "styles/index.css";
import MenuProfesor from "components/MenuProfesor.jsx";
import Button from "components/Button";
import InputField from "components/InputField";
import { useProfesor, useUpdateProfesor } from "hooks/useProfesor";
import { useIdProfesor } from "hooks/useIdProfesor";
import Espera from "./EsperaProfesores.jsx";
import Mensaje from "components/Mensaje.jsx";

export default function EditarDatosPersonalesProfesor() {
  const navigate = useNavigate();
  const { idProfesor } = useIdProfesor();
  const [pwd, setPwd] = useState("");
  const [form, setForm] = useState({
    curp: "",
    rfc: "",
    fechaNacimiento: "",
    nacionalidad: "",
    estadoNacimiento: "",
    calle: "",
    noExt: "",
    noInt: "",
    colonia: "",
    cp: "",
    estado: "",
    delegacion: "",
    telefono: "",
    movil: "",
    email: "",
    departamento: "",
  });

  // ESTADOS DEL MENSAJE
  const [msgVisible, setMsgVisible] = useState(false);
  const [msgTitulo, setMsgTitulo] = useState("");
  const [msgTexto, setMsgTexto] = useState("");

  const { profesor, loading } = useProfesor(idProfesor);
  const { updateData, loading: updating, success } = useUpdateProfesor();

  // Llenar formulario
  useEffect(() => {
    if (profesor) {
      const direccion =
        profesor.direcciones && profesor.direcciones.length > 0
          ? profesor.direcciones[0]
          : {};

      setForm({
        curp: profesor.datosPersonales?.curp || "",
        rfc: profesor.datosPersonales?.rfc || "",
        fechaNacimiento: profesor.datosPersonales?.nacimiento
          ? profesor.datosPersonales.nacimiento.split("T")[0]
          : "",
        nacionalidad: profesor.datosPersonales?.nacionalidad || "",
        estadoNacimiento: profesor.datosPersonales?.entidadNacimiento || "",
        calle: direccion.calle || "",
        noExt: direccion.noExt || "",
        noInt: direccion.noInt || "",
        colonia: direccion.colonia || "",
        cp: direccion.cp || "",
        estado: direccion.estado || "",
        delegacion: direccion.delegacion || "",
        telefono: profesor.datosPersonales?.telefono || "",
        movil: profesor.datosPersonales?.movil || "",
        email: profesor.correo || "",
        departamento: profesor.dataProfesor?.departamento || "",
      });
    }
  }, [profesor]);

  // Mostrar mensaje de éxito
  useEffect(() => {
    if (success) {
      setMsgTitulo("Cambios guardados");
      setMsgTexto("Datos personales actualizados correctamente.");
      setMsgVisible(true);

      setPwd("");

      // Redirigir cuando cierren el mensaje
      const timer = setTimeout(() => {
        navigate("/profesor/datos-personales");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!pwd.trim()) {
      setMsgTitulo("Falta contraseña");
      setMsgTexto("Para guardar cambios, ingresa tu contraseña.");
      setMsgVisible(true);
      return;
    }

    try {
      const updateData_body = {
        datosPersonales: {
          curp: form.curp,
          rfc: form.rfc,
          nacimiento: form.fechaNacimiento,
          nacionalidad: form.nacionalidad,
          entidadNacimiento: form.estadoNacimiento,
          telefono: form.telefono,
          movil: form.movil,
        },
        direcciones: [
          {
            calle: form.calle,
            noExt: form.noExt,
            noInt: form.noInt,
            colonia: form.colonia,
            cp: form.cp,
            estado: form.estado,
            delegacion: form.delegacion,
          },
        ],
        correo: form.email,
        dataProfesor: {
          departamento: form.departamento,
        },
      };

      await updateData(idProfesor, updateData_body);
    } catch (error) {
      setMsgTitulo("Error");
      setMsgTexto(`Error al guardar cambios: ${error.message}`);
      setMsgVisible(true);
    }
  };

  if (loading) {
    return <Espera />;
  }

  return (
    <div className="bienvenida-container">
      <MenuProfesor />

      {/* === MODAL DE MENSAJE === */}
      <Mensaje
        titulo={msgTitulo}
        mensaje={msgTexto}
        visible={msgVisible}
        onCerrar={() => setMsgVisible(false)}
      />

      <main className="page">
        <div className="edp-container">
          <aside className="edp-side card">
            <h2 className="edp-title">Editar datos personales</h2>
            <p className="edp-text">
              En esta sección podrás editar tus datos personales; recuerda ingresar tu
              contraseña para guardar los cambios realizados.
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
              <Button variant="secondary" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={onSubmit} disabled={updating}>
                {updating ? "Guardando..." : "Guardar cambios"}
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
                  <InputField
                    label="Nacionalidad"
                    name="nacionalidad"
                    value={form.nacionalidad}
                    onChange={onChange}
                  />
                  <InputField
                    label="Entidad de Nacimiento"
                    name="estadoNacimiento"
                    value={form.estadoNacimiento}
                    onChange={onChange}
                    wide
                  />
                </div>
              </div>

              <h3 className="edp-sec-title">Dirección</h3>
              <div className="edp-block">
                <div className="edp-grid">
                  <InputField label="Calle" name="calle" value={form.calle} onChange={onChange} wide />
                  <InputField label="No. Ext" name="noExt" value={form.noExt} onChange={onChange} />
                  <InputField label="No. Int" name="noInt" value={form.noInt} onChange={onChange} />
                  <InputField label="Colonia" name="colonia" value={form.colonia} onChange={onChange} />
                  <InputField label="C.P." name="cp" value={form.cp} onChange={onChange} />
                  <InputField label="Estado" name="estado" value={form.estado} onChange={onChange} />
                  <InputField label="Del/Mpo" name="delegacion" value={form.delegacion} onChange={onChange} />
                  <InputField label="Teléfono" name="telefono" value={form.telefono} onChange={onChange} />
                  <InputField label="Móvil" name="movil" value={form.movil} onChange={onChange} />
                  <InputField label="E-mail" name="email" value={form.email} onChange={onChange} wide />
                  <InputField label="Departamento" name="departamento" value={form.departamento} onChange={onChange} />
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
    </div>
  );
}