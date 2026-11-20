"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "../lib/api";
import { descargarDocumento, estadoVisible, type Solicitud } from "../grados-titulos/solicitudes-api";
import { tramitesAcademicos } from "../grados-titulos/tramites";
import styles from "../grados-titulos/orientacion.module.css";

type Caso = Solicitud & { usuario: { nombres: string; apellidos: string } };
type Pagina = { datos: Caso[]; siguiente: boolean; puedeAprobar: boolean };
type Resumen = { tipoTramite: string; estado: string; total: number };

type Props = { titulo?: string; tipos?: string; estado?: string; plantillas?: boolean };
export default function Revision(props: Props) {
  return <Suspense fallback={<p role="status">Consultando expedientes…</p>}><Filtros {...props} /></Suspense>;
}

function Filtros(props: Props) {
  const buscar = useSearchParams().get("buscar") ?? "";
  return <Expedientes key={buscar} {...props} buscar={buscar} />;
}

function Expedientes({ titulo = "Revisión de expedientes académicos", tipos, estado, plantillas, buscar }: Props & { buscar: string }) {
  const [pagina, setPagina] = useState(1);
  const [lista, setLista] = useState<Pagina>();
  const [reporte, setReporte] = useState<Resumen[]>();
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    let vigente = true;
    const query = new URLSearchParams({ pagina: String(pagina), buscar });
    if (tipos) query.set("tipos", tipos);
    if (estado) query.set("estado", estado);
    api.get<Pagina>(`/revision-grados?${query}`).then((respuesta) => {
      if (!vigente) return;
      setLista(respuesta.datos);
      setError(respuesta.error ?? "");
    });
    return () => { vigente = false; };
  }, [pagina, buscar, tipos, estado]);

  async function ejecutar(accion: () => Promise<void>) {
    setError("");
    setOcupado(true);
    try { await accion(); }
    catch (excepcion) { setError(excepcion instanceof Error ? excepcion.message : "No se completó la acción."); }
    finally { setOcupado(false); }
  }

  function cambiar(id: number, accion: string, requisitoId?: number, comentario?: FormDataEntryValue | null) {
    void ejecutar(async () => {
      const respuesta = await api.post<Caso>(`/revision-grados/${id}/acciones`, { accion, requisitoId, comentario });
      const actualizado = respuesta.datos;
      if (!actualizado) throw new Error(respuesta.error);
      setLista((vigente) => vigente && { ...vigente, datos: vigente.datos.map((caso) => caso.id === id ? actualizado : caso) });
      setReporte(undefined);
    });
  }

  return (
    <main className={styles.pagina}>
      <h1>{titulo}</h1>
      {plantillas && <p><Link href="/admin/validacion-requisitos/plantillas">Gestionar plantillas de requisitos</Link></p>}
      {buscar && <p>Resultados de la búsqueda · <Link href="/admin/expedientes">Quitar filtro</Link></p>}
      {error && <p role="alert">{error}</p>}
      {!lista && !error && <p role="status">Consultando expedientes…</p>}
      {lista && (
        <section className={styles.panel}>
          <button type="button" disabled={ocupado} onClick={() => ejecutar(async () => {
            const respuesta = await api.get<Resumen[]>("/revision-grados/reporte");
            if (!respuesta.datos) throw new Error(respuesta.error);
            setReporte(respuesta.datos);
          })}>Generar reporte por estado</button>
          {reporte && <ul>{reporte.map((fila) => (
            <li key={`${fila.tipoTramite}/${fila.estado}`}>{estadoVisible(fila.tipoTramite)} · {estadoVisible(fila.estado)} · {fila.total}</li>
          ))}</ul>}
          {reporte?.length === 0 && <p>No hay datos para reportar.</p>}
          <div className={styles.controles}>
            <button type="button" disabled={pagina === 1 || ocupado} onClick={() => setPagina(pagina - 1)}>Página anterior</button>
            <span>Página {pagina}</span>
            <button type="button" disabled={!lista.siguiente || ocupado} onClick={() => setPagina(pagina + 1)}>Página siguiente</button>
          </div>
        </section>
      )}
      {lista?.datos.length === 0 && <p>No hay expedientes en esta página.</p>}
      {lista?.datos.map((caso) => (
        <article key={caso.id} className={styles.panel}>
          <h2>{caso.codigo}</h2>
          <p>{caso.usuario.nombres} {caso.usuario.apellidos} · {caso.programa.nombre} · {estadoVisible(caso.estado)}</p>
          <p>{Object.values(tramitesAcademicos).find((t) => t.tipo === caso.tipoTramite)?.nombre}</p>
          {caso.estado === "presentado" && <button type="button" disabled={ocupado} onClick={() => cambiar(caso.id, "revisar")}>Iniciar revisión</button>}
          {caso.estado === "en_revision" && lista.puedeAprobar && <button type="button" disabled={ocupado} onClick={() => cambiar(caso.id, "aprobar")}>Aprobar expediente</button>}
          {caso.estado === "aprobado" && lista.puedeAprobar && <form className={styles.formulario} onSubmit={(evento) => {
            evento.preventDefault();
            cambiar(caso.id, "emitir", undefined, new FormData(evento.currentTarget).get("referencia"));
          }}>
            <label>Referencia del documento ya emitido<input name="referencia" required maxLength={1500} /></label>
            <button type="submit" disabled={ocupado}>Registrar emisión</button>
          </form>}
          {caso.estado === "emitido" && <p><Link href={`/verificar-documento?codigo=${encodeURIComponent(caso.codigo)}`}>Verificar documento emitido</Link></p>}
          <details>
            <summary>Requisitos y documentos</summary>
            <ul className={styles.lista}>{caso.validaciones.map(({ id, plantilla, estado }) => {
              const documento = caso.documentos.find((registro) => registro.tipoDoc === String(plantilla.id));
              return (
                <li key={id}>
                  <p>{plantilla.nombre} · {estadoVisible(estado)}</p>
                  {documento && <button type="button" disabled={ocupado} onClick={() => ejecutar(() => descargarDocumento(caso.id, documento.id, true))}>Descargar documento</button>}
                  {["en_revision", "observado"].includes(caso.estado) && (
                    <form className={styles.formulario} onSubmit={(evento) => {
                      evento.preventDefault();
                      const datos = new FormData(evento.currentTarget, (evento.nativeEvent as SubmitEvent).submitter);
                      cambiar(caso.id, String(datos.get("accion") ?? "validar"), id, datos.get("comentario"));
                    }}>
                      <label>Evidencia u observación<input name="comentario" required maxLength={1500} /></label>
                      <button type="submit" name="accion" value="validar" disabled={ocupado}>Registrar validación</button>
                      {plantilla.tipo === "documental" && <button type="submit" name="accion" value="observar" disabled={ocupado}>Solicitar subsanación</button>}
                    </form>
                  )}
                </li>
              );
            })}</ul>
          </details>
          <details><summary>Historial</summary><ol>{caso.historial.map((mov) => (
            <li key={mov.id}>{new Date(mov.creadoEn).toLocaleString("es-PE")} · {estadoVisible(mov.estadoDespues)} {mov.motivo}</li>
          ))}</ol></details>
        </article>
      ))}
    </main>
  );
}
