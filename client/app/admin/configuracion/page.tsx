"use client";

import Link from "next/link";
import { useContext, useEffect, useState, type FormEvent } from "react";
import { api } from "../../lib/api";
import styles from "../../grados-titulos/orientacion.module.css";
import { estadoVisible } from "../../grados-titulos/solicitudes-api";
import { PerfilAdministrativo } from "../perfil";
import Gestion from "../gestion";

type Programa = { id: number; nombre: string; facultad: string; activo: boolean };
const normativa = { fuente: "Fuente institucional", costos: "Costos autorizados", plazos: "Plazos oficiales", procedimiento: "Procedimiento oficial" };
type Configuracion = Programa & {
  tipoTramite: string;
  configuracionTramite: ({ habilitado: boolean } & Record<keyof typeof normativa, string | null>) | null;
  plantillasRequisito: { id: number; nombre: string; codigo: string; activo: boolean; obligatorio: boolean; versionNorm: string }[];
  cambiosAcademicos: { id: number; accion: string; creadoEn: string; usuario: { nombres: string; apellidos: string } }[];
};

export default function Pagina() {
  const perfil = useContext(PerfilAdministrativo);
  return perfil?.rol === "administrador" ? <ConfiguracionAcademica /> : <Gestion seccion="configuracion" />;
}

function ConfiguracionAcademica() {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [programa, setPrograma] = useState("");
  const [revision, setRevision] = useState(0);
  const [configuracion, setConfiguracion] = useState<Configuracion>();
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState("");
  useEffect(() => {
    let vigente = true;
    api.get<Programa[]>("/administracion/programas").then((r) => {
      if (!vigente) return;
      if (r.datos) setProgramas(r.datos);
      else setError(r.error ?? "No se pudo consultar los programas.");
    });
    return () => { vigente = false; };
  }, [revision]);
  useEffect(() => {
    let vigente = true;
    if (programa) api.get<Configuracion>(`/administracion/configuracion-academica/${programa}`).then((r) => {
      if (!vigente) return;
      setConfiguracion(r.datos);
      if (!r.datos) setError(r.error ?? "No se pudo consultar la configuración.");
    });
    return () => { vigente = false; };
  }, [programa, revision]);

  async function actualizar(ruta: string, datos: unknown) {
    setOcupado(true);
    setError("");
    setMensaje("");
    try {
      const respuesta = await api.patch(ruta, datos);
      if (respuesta.ok) {
        setRevision((previa) => previa + 1);
        setMensaje("Cambios guardados.");
      } else setError(respuesta.error ?? "No se pudo guardar.");
    } finally { setOcupado(false); }
  }

  function guardar(evento: FormEvent<HTMLFormElement>, detalle: Configuracion) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    void actualizar(`/administracion/configuracion-academica/${detalle.id}`, {
      ...Object.fromEntries(datos), tipoTramite: detalle.tipoTramite,
      activo: datos.has("activo"), habilitado: datos.has("habilitado"),
    });
  }

  return <main className={styles.pagina}>
    <h1 className="serif">Configuración académica y trámites</h1>
    <div className={styles.controles}>
      <Link href="/admin/programas">Registrar programa</Link>
      <Link href="/admin/validacion-requisitos/plantillas">Crear requisito o versión</Link>
    </div>
    {error && <p role="alert">{error}</p>}
    {mensaje && <p role="status">{mensaje}</p>}
    <label>Programa académico{" "}<select value={programa} disabled={ocupado} onChange={(evento) => {
      setPrograma(evento.target.value); setConfiguracion(undefined); setError(""); setMensaje("");
    }}>
      <option value="">Selecciona un programa</option>
      {programas.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
    </select></label>
    {configuracion && <section className={styles.panel}>
      <h2>{estadoVisible(configuracion.tipoTramite)}</h2>
      {!configuracion.activo && <p>El programa está inactivo.</p>}
      {configuracion.configuracionTramite?.habilitado === false && <p>El trámite está deshabilitado.</p>}
      {!configuracion.plantillasRequisito.some(({ activo }) => activo) && <p>Publica al menos un requisito para habilitar el trámite.</p>}
      <form key={`${configuracion.id}/${revision}`} className={styles.formulario} onSubmit={(evento) => guardar(evento, configuracion)}>
        <label>Nombre<input name="nombre" defaultValue={configuracion.nombre} maxLength={160} required /></label>
        <label>Facultad<input name="facultad" defaultValue={configuracion.facultad} maxLength={160} required /></label>
        <label><span><input type="checkbox" name="activo" defaultChecked={configuracion.activo} /> Programa activo</span></label>
        <label><span><input type="checkbox" name="habilitado" defaultChecked={configuracion.configuracionTramite?.habilitado ?? false} /> Trámite habilitado</span></label>
        {(Object.keys(normativa) as (keyof typeof normativa)[]).map((campo) => <label key={campo}>{normativa[campo]}
          <textarea name={campo} maxLength={2000} defaultValue={configuracion.configuracionTramite?.[campo] ?? ""} />
        </label>)}
        <button disabled={ocupado}>Guardar configuración</button>
      </form>
      <h3>Publicación de requisitos</h3>
      <ul className={styles.lista}>{configuracion.plantillasRequisito.map((item) => <li key={item.id}>
        <p>{item.nombre} · {item.versionNorm} · {item.obligatorio ? "Obligatorio" : "Opcional"} · {item.activo ? "Publicado" : "Sin publicar"}</p>
        <button type="button" disabled={ocupado} onClick={() => void actualizar(`/administracion/requisitos/${item.id}/publicacion`, { activo: !item.activo })}>
          {item.activo ? "Retirar publicación" : "Publicar"}
        </button>
      </li>)}</ul>
      <h3>Historial de cambios</h3>
      <ul className={styles.lista}>{configuracion.cambiosAcademicos.map((cambio) => <li key={cambio.id}>
        {new Date(cambio.creadoEn).toLocaleString("es-PE")} · {estadoVisible(cambio.accion)} · {cambio.usuario.nombres} {cambio.usuario.apellidos}
      </li>)}</ul>
    </section>}
  </main>;
}
