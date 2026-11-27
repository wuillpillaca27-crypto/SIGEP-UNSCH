"use client";

import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { estadoVisible, solicitudes, type Notificacion, type Solicitud } from "../grados-titulos/solicitudes-api";
import { SelloPosgrado } from "../grados-titulos/orientacion";
import { PerfilEstudiante } from "./sesion";
import styles from "../grados-titulos/orientacion.module.css";

const opciones = [
  ["programas", "Mis programas académicos", "Consulta tus matrículas y los trámites habilitados por programa."],
  ["nueva-solicitud", "Nueva solicitud", "Elige un grado, título o certificación."],
  ["solicitudes", "Mis solicitudes", "Revisa tus solicitudes y retoma un borrador."],
  ["expedientes", "Estado de expediente", "Consulta el estado y los documentos de los trámites presentados."],
  ["observaciones", "Observaciones pendientes", "Identifica los requisitos que debes corregir."],
  ["subsanacion", "Subsanar documentos", "Adjunta los archivos corregidos y envíalos a revisión."],
  ["historial", "Historial de trámites", "Consulta los movimientos y las fechas de tus expedientes."],
];

export default function MisTramites() {
  const perfil = useContext(PerfilEstudiante);
  const [lista, setLista] = useState<Solicitud[]>();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [errorNotificaciones, setErrorNotificaciones] = useState("");
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    Promise.all([solicitudes.listar(), solicitudes.notificaciones()]).then(([respuesta, bandeja]) => {
      if (!vigente) return;
      setLista(respuesta.datos);
      if (!respuesta.ok) setError(respuesta.error ?? "No se pudo cargar el resumen.");
      setNotificaciones(bandeja.datos?.datos ?? []);
      if (!bandeja.ok) setErrorNotificaciones(bandeja.error ?? "No se pudieron consultar las notificaciones.");
    });
    return () => { vigente = false; };
  }, [intento]);

  async function marcarNotificacion(id: number) {
    const respuesta = await solicitudes.marcarNotificacion(id);
    if (!respuesta.ok) { setErrorNotificaciones(respuesta.error ?? "No se pudo marcar la notificación."); return; }
    setNotificaciones((actuales) => actuales.map((item) => item.id === id ? { ...item, leida: true, leidaEn: new Date().toISOString() } : item));
  }

  async function marcarTodas() {
    const respuesta = await solicitudes.marcarTodasNotificaciones();
    if (!respuesta.ok) { setErrorNotificaciones(respuesta.error ?? "No se pudieron marcar las notificaciones."); return; }
    setNotificaciones((actuales) => actuales.map((item) => ({ ...item, leida: true, leidaEn: item.leidaEn ?? new Date().toISOString() })));
  }

  const recientes = lista?.flatMap((solicitud) => solicitud.historial.map((movimiento) => ({
    ...movimiento, solicitudId: solicitud.id, codigo: solicitud.codigo,
  }))).sort((a, b) => Date.parse(b.creadoEn) - Date.parse(a.creadoEn) || b.id - a.id).slice(0, 5);
  const pendientes = lista?.reduce((suma, solicitud) => suma + solicitud.validaciones.filter(({ estado }) => estado === "observado").length, 0) ?? 0;

  return (
    <main className={styles.pagina}>
      <header className={styles.hero}>
        <SelloPosgrado />
        <h1>Mis Trámites</h1>
        <p>{perfil?.nombres} {perfil?.apellidos}</p>
        <div className={styles.acciones}><Link href="/mis-tramites/nueva-solicitud">Nueva solicitud</Link></div>
      </header>
      {error && <div className={styles.panel}>
        <p role="alert">{error}</p>
        <button type="button" onClick={() => { setError(""); setIntento(intento + 1); }}>Reintentar resumen</button>
      </div>}
      {!lista && !error && <p role="status">Consultando el resumen…</p>}
      {lista && (
        <div className={styles.tarjetas}>
          {[
            ["solicitudes", "Total de solicitudes", lista.length],
            ["solicitudes", "Borradores", lista.filter(({ estado }) => estado === "borrador").length],
            ["expedientes", "En proceso", lista.filter(({ estado }) => ["presentado", "en_revision", "validado", "pendiente_aprobacion", "aprobado", "en_emision"].includes(estado)).length],
            ["observaciones", "Observados", lista.filter(({ estado }) => estado === "observado").length],
            ["observaciones", "Observaciones pendientes", pendientes],
            ["historial", "Aprobados", lista.filter(({ estado }) => estado === "aprobado").length],
            ["historial", "Finalizados", lista.filter(({ estado }) => ["emitido", "rechazado", "desistido", "anulado"].includes(estado)).length],
            ["historial", "Documentos emitidos", lista.reduce((total, solicitud) => total + solicitud.documentos.filter(({ tipoDoc }) => tipoDoc === "documento_emitido").length, 0)],
          ].map(([ruta, titulo, total]) => (
            <Link className={styles.tarjeta} key={`${ruta}-${titulo}`} href={`/mis-tramites/${ruta}`}><strong>{total}</strong><span>{titulo}</span></Link>
          ))}
        </div>
      )}
      {lista && <section className={styles.panel}>
        <h2>Notificaciones {notificaciones.some(({ leida }) => !leida) && <span>· {notificaciones.filter(({ leida }) => !leida).length} sin leer</span>}</h2>
        {errorNotificaciones && <p role="alert">{errorNotificaciones}</p>}
        {!notificaciones.length && !errorNotificaciones && <p>No tienes notificaciones nuevas.</p>}
        {notificaciones.some(({ leida }) => !leida) && <button type="button" onClick={() => void marcarTodas()}>Marcar todas como leídas</button>}
        <ul className={styles.lista}>{notificaciones.map((aviso) => <li key={aviso.id}>
          {aviso.solicitudId ? <Link href={`/mis-tramites/expedientes#expediente-${aviso.solicitudId}`}>{aviso.mensaje}</Link> : aviso.mensaje}
          {!aviso.leida && <button type="button" onClick={() => void marcarNotificacion(aviso.id)}>Marcar notificación como leída</button>}
        </li>)}</ul>
      </section>}
      {recientes?.length ? <section className={styles.panel}>
        <h2>Actividad reciente</h2>
        <ol className={styles.lista}>{recientes.map((movimiento) => <li key={`${movimiento.solicitudId}-${movimiento.id}`}>
          <Link href={`/mis-tramites/expedientes#expediente-${movimiento.solicitudId}`}>{movimiento.codigo}</Link> · {estadoVisible(movimiento.estadoDespues)} · {new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(movimiento.creadoEn))}
          {movimiento.motivo && <p>{movimiento.motivo}</p>}
        </li>)}</ol>
      </section> : null}
      <div className={styles.campos}>
        {opciones.map(([ruta, titulo, descripcion]) => (
          <section className={styles.panel} key={ruta}>
            <h2><Link href={`/mis-tramites/${ruta}`}>{titulo}</Link></h2>
            <p>{descripcion}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
