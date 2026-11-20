"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cargarDocumento, descargarDocumento, estadoVisible, solicitudes, type Solicitud } from "../../grados-titulos/solicitudes-api";
import { esCertificacion, tramitesAcademicos } from "../../grados-titulos/tramites";
import styles from "../../grados-titulos/orientacion.module.css";

export default function Seguimiento({ soloObservados = false }: { soloObservados?: boolean }) {
  const [lista, setLista] = useState<Solicitud[]>();
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    if (ocupado) return;
    let vigente = true;
    let anterior: Solicitud[] | undefined;
    async function consultar() {
      const respuesta = await solicitudes.listar();
      if (!vigente) return;
      if (!respuesta.datos) {
        if (!anterior) {
          setLista([]);
          setError(respuesta.error ?? "No se pudieron consultar los expedientes.");
        }
        return;
      }
      const previos = new Map(anterior?.map((item) => [item.id, item.estado]));
      const cambios = respuesta.datos.filter((item) => previos.has(item.id) && previos.get(item.id) !== item.estado);
      if (cambios.length) {
        setAviso(cambios.map((item) => `Expediente ${item.codigo}: ${estadoVisible(item.estado)}.`).join(" "));
      }
      anterior = respuesta.datos;
      setLista(respuesta.datos);
    }
    void consultar();
    const intervalo = window.setInterval(() => {
      if (document.visibilityState === "visible") void consultar();
    }, 30_000);
    return () => {
      vigente = false;
      window.clearInterval(intervalo);
    };
  }, [ocupado]);

  async function ejecutar(accion: () => Promise<Solicitud | void>) {
    setOcupado(true);
    setError("");
    try {
      const actual = await accion();
      if (actual) setLista((previo) => previo?.map((item) => item.id === actual.id ? actual : item));
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : "No se pudo completar la acción.");
    } finally { setOcupado(false); }
  }

  const expedientes = lista?.filter((item) => !soloObservados || item.estado === "observado");
  return (
    <main className={styles.pagina}>
      <header className={styles.hero}>
        <h1 className="serif">{soloObservados ? "Observaciones y subsanación" : "Mis expedientes"}</h1>
        <p>Revisa el avance de tus solicitudes de grado, título y certificación.</p>
        <div className={styles.acciones}><Link href="/mis-tramites/nueva-solicitud">Nueva solicitud</Link></div>
      </header>
      {error && <p role="alert">{error}</p>}
      {aviso && <p role="status">{aviso}</p>}
      {!lista && <p role="status">Consultando solicitudes…</p>}
      {expedientes?.length === 0 && !error && <p>No hay expedientes para mostrar.</p>}
      {expedientes?.map((item) => {
        const tramite = Object.entries(tramitesAcademicos).find(([, datos]) => datos.tipo === item.tipoTramite);
        const base = tramite && esCertificacion(tramite[0]) ? "/certificaciones" : "/grados-titulos";
        return (
          <article key={item.id} className={styles.panel}>
            <h2>{tramite?.[1].nombre ?? item.tipoTramite}</h2>
            <p>{item.programa.nombre} · <strong>{estadoVisible(item.estado)}</strong></p>
            {item.presentadoEn ? <p>{item.codigo} · {new Date(item.presentadoEn).toLocaleDateString("es-PE")}</p>
              : <p><Link href={`${base}/iniciar-solicitud${tramite ? `?tramite=${tramite[0]}` : ""}`}>Continuar borrador</Link></p>}
            {item.observaciones && <p>{item.observaciones}</p>}
            {item.estado === "observado" && (
              <div className={styles.formulario}>
                <h3>Próxima acción · Subsanar observaciones</h3>
                {item.validaciones.filter(({ estado }) => estado === "observado").map(({ id, plantilla, observacion }) => (
                  <div key={id}>
                    <p><strong>{plantilla.nombre}</strong> · {observacion}</p>
                    {plantilla.tipo === "documental" && (
                      <label>Adjuntar corrección para {plantilla.nombre}
                        <input type="file" accept="application/pdf" disabled={ocupado} onChange={(evento) => {
                          const archivo = evento.currentTarget.files?.[0];
                          evento.currentTarget.value = "";
                          if (archivo) void ejecutar(() => cargarDocumento(item.id, plantilla.id, archivo));
                        }} />
                      </label>
                    )}
                  </div>
                ))}
                <button type="button" disabled={ocupado || item.validaciones.some(({ estado }) => estado === "observado")}
                  onClick={() => ejecutar(async () => {
                    const respuesta = await solicitudes.subsanar(item.id);
                    if (!respuesta.datos) throw new Error(respuesta.error);
                    return respuesta.datos;
                  })}>Enviar subsanación</button>
              </div>
            )}
            {item.estado === "presentado" || item.estado === "en_revision" ? <p>Próxima acción · Esperar la revisión de la Escuela de Posgrado.</p> : null}
            <details>
              <summary>Documentos e historial</summary>
              {item.documentos.length === 0 && <p>Sin documentos adjuntos.</p>}
              <ul className={styles.lista}>{item.documentos.map((doc) => (
                <li key={doc.id}><button type="button" disabled={ocupado} onClick={() => ejecutar(() => descargarDocumento(item.id, doc.id))}>{doc.nombre}</button></li>
              ))}</ul>
              <ol className={styles.lista}>{item.historial.map((movimiento) => (
                <li key={movimiento.id}><time dateTime={movimiento.creadoEn}>{new Date(movimiento.creadoEn).toLocaleString("es-PE")}</time> · {estadoVisible(movimiento.estadoDespues)}{movimiento.motivo && <p>{movimiento.motivo}</p>}</li>
              ))}</ol>
            </details>
          </article>
        );
      })}
    </main>
  );
}
