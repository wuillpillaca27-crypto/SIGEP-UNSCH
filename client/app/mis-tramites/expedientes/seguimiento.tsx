"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cargarDocumento, descargarDocumento, estadoVisible, rutaConstancia, solicitudes, type Solicitud } from "../../grados-titulos/solicitudes-api";
import { rutaSolicitud, tramitesAcademicos } from "../../grados-titulos/tramites";
import styles from "../../grados-titulos/orientacion.module.css";

const vistas = {
  solicitudes: ["Mis solicitudes", "Consulta las solicitudes registradas y retoma tus borradores.", "No tienes solicitudes registradas."],
  expedientes: ["Estado de expediente", "Consulta el estado y los documentos de tus expedientes presentados.", "Aún no tienes expedientes presentados."],
  observaciones: ["Observaciones pendientes", "Revisa los requisitos que requieren atención antes de adjuntar una corrección.", "No tienes expedientes observados."],
  subsanacion: ["Subsanar documentos", "Adjunta los documentos corregidos y envía la subsanación a revisión.", "No tienes expedientes pendientes de subsanación."],
  historial: ["Historial de trámites", "Consulta los movimientos de tus expedientes, del más reciente al más antiguo.", "Aún no tienes movimientos de expedientes."],
} as const;

const fecha = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" });

export default function Seguimiento({ vista }: { vista: keyof typeof vistas }) {
  const [lista, setLista] = useState<Solicitud[]>();
  const [error, setError] = useState("");
  const [errorConsulta, setErrorConsulta] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [reintento, setReintento] = useState(0);
  const [sesionVencida, setSesionVencida] = useState(false);
  const destinoAtendido = useRef("");

  useEffect(() => {
    const destino = window.location.hash.slice(1);
    if (!lista || !/^(expediente|subsanar)-\d+$/.test(destino) || destinoAtendido.current === destino) return;
    const elemento = document.getElementById(destino);
    if (elemento) {
      destinoAtendido.current = destino;
      elemento.scrollIntoView();
    }
  }, [lista]);

  useEffect(() => {
    if (ocupado) return;
    let vigente = true;
    let consultando = false;
    let anterior: Solicitud[] | undefined;
    async function consultar() {
      if (consultando) return;
      consultando = true;
      const respuesta = await solicitudes.listar();
      consultando = false;
      if (!vigente) return;
      if (!respuesta.datos) {
        if (!anterior || respuesta.estadoHttp === 401) {
          setLista([]);
        }
        setErrorConsulta(respuesta.error ?? "No se pudieron consultar los expedientes.");
        if (respuesta.estadoHttp === 401) setSesionVencida(true);
        return;
      }
      const previos = new Map(anterior?.map((item) => [item.id, item.estado]));
      const cambios = respuesta.datos.filter((item) => previos.has(item.id) && previos.get(item.id) !== item.estado);
      if (cambios.length) {
        setAviso(cambios.map((item) => `Expediente ${item.codigo}: ${estadoVisible(item.estado)}.`).join(" "));
      }
      anterior = respuesta.datos;
      setErrorConsulta("");
      setSesionVencida(false);
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
  }, [ocupado, reintento]);

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

  const [titulo, descripcion, vacio] = vistas[vista];
  const observados = vista === "observaciones" || vista === "subsanacion";
  const normalizar = (texto: string) => texto.toLocaleLowerCase("es").normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const consulta = normalizar(busqueda.trim());
  const expedientes = lista?.filter((item) => {
    if (estado && item.estado !== estado) return false;
    if (observados && item.estado !== "observado") return false;
    if (!observados && vista !== "solicitudes" && !item.presentadoEn) return false;
    const tipo = Object.values(tramitesAcademicos).find(({ tipo }) => tipo === item.tipoTramite);
    return normalizar(`${item.codigo} ${item.programa.nombre} ${tipo?.nombre ?? item.tipoTramite}`).includes(consulta);
  });
  const movimientos = vista === "historial" ? expedientes?.flatMap((item) =>
    item.historial.map((movimiento) => ({ ...movimiento, expedienteId: item.id, codigo: item.codigo }))
  ).sort((a, b) => Date.parse(b.creadoEn) - Date.parse(a.creadoEn) || b.id - a.id) : undefined;
  return (
    <main className={styles.pagina}>
      <nav className={styles.ruta} aria-label="Ruta de navegación">
        <Link href="/mis-tramites">Mis Trámites</Link><span aria-hidden="true">/</span><span aria-current="page">{titulo}</span>
      </nav>
      <header className={styles.hero}>
        <h1>{titulo}</h1>
        <p>{descripcion}</p>
        <div className={styles.acciones}><Link href="/mis-tramites/nueva-solicitud">Nueva solicitud</Link><Link href="/mis-tramites">Volver al panel</Link></div>
      </header>
      {error && <p role="alert">{error}</p>}
      {errorConsulta && <div className={styles.panel}>
        <p role="alert">{errorConsulta}</p>
        {sesionVencida ? <button type="button" onClick={() => window.location.reload()}>Volver a ingresar</button>
          : <button type="button" onClick={() => { setErrorConsulta(""); setReintento(reintento + 1); }}>Reintentar consulta</button>}
      </div>}
      {aviso && <p role="status">{aviso}</p>}
      {!lista && <p role="status">Consultando solicitudes…</p>}
      {lista && !sesionVencida && <section className={styles.panel}><div className={styles.formulario}>
        <label>Buscar por código, programa o trámite
          <input type="search" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} />
        </label>
        {!observados && <label>Filtrar por estado<select value={estado} onChange={(evento) => setEstado(evento.target.value)}>
          <option value="">Todos los estados</option>
          {[...new Set(lista.filter((item) => vista === "solicitudes" || item.presentadoEn).map((item) => item.estado))].map((valor) =>
            <option key={valor} value={valor}>{estadoVisible(valor)}</option>)}
        </select></label>}
      </div></section>}
      {(movimientos ?? expedientes)?.length === 0 && !errorConsulta && <p>{consulta || estado ? "No hay resultados para los filtros aplicados." : vacio}</p>}
      {movimientos && movimientos.length > 0 && <section className={styles.panel}>
        <ol className={styles.lista}>{movimientos.map((movimiento) => (
          <li key={movimiento.id}>
            <strong>{estadoVisible(movimiento.estadoDespues)}</strong> · <time dateTime={movimiento.creadoEn}>{fecha.format(new Date(movimiento.creadoEn))}</time>
            <p><Link href={`/mis-tramites/expedientes#expediente-${movimiento.expedienteId}`}>{movimiento.codigo}</Link></p>
            {movimiento.motivo && <p>{movimiento.motivo}</p>}
          </li>
        ))}</ol>
      </section>}
      {vista !== "historial" && expedientes?.map((item) => {
        const tramite = Object.entries(tramitesAcademicos).find(([, datos]) => datos.tipo === item.tipoTramite);
        return (
          <article key={item.id} id={vista === "expedientes" ? `expediente-${item.id}` : vista === "subsanacion" ? `subsanar-${item.id}` : undefined} className={styles.panel}>
            <h2>{tramite?.[1].nombre ?? item.tipoTramite}</h2>
            <p>{item.programa.nombre} · <strong>{estadoVisible(item.estado)}</strong></p>
            {item.presentadoEn ? <p>{item.codigo} · {new Date(item.presentadoEn).toLocaleDateString("es-PE")}</p>
              : item.estado === "borrador" && <p><Link href={tramite ? rutaSolicitud(tramite[0], item.programa.id) : "/mis-tramites/programas"}>Continuar borrador</Link></p>}
            {item.estado === "emitido" && <p><Link href={`/verificar-documento?codigo=${encodeURIComponent(item.codigo)}`}>Verificar documento emitido</Link></p>}
            {item.presentadoEn && <p><a href={rutaConstancia(item.id)}>Descargar acuse de presentación</a></p>}
            {vista === "solicitudes" && ["borrador", "presentado", "en_revision", "observado", "validado", "pendiente_aprobacion"].includes(item.estado) && (
              <details><summary>Desistir de esta solicitud</summary>
                <form className={styles.formulario} onSubmit={(evento) => {
                  evento.preventDefault();
                  const motivo = new FormData(evento.currentTarget).get("motivo");
                  void ejecutar(async () => {
                    const respuesta = await solicitudes.desistir(item.id, motivo);
                    if (!respuesta.datos) throw new Error(respuesta.error);
                    return respuesta.datos;
                  });
                }}>
                  <label>Motivo<input name="motivo" required maxLength={1500} /></label>
                  <button disabled={ocupado}>Confirmar desistimiento</button>
                </form>
              </details>
            )}
            {item.observaciones && <p>{item.observaciones}</p>}
            {item.estado === "observado" && vista !== "subsanacion" && (
              <>
                {vista === "observaciones" && <ul className={styles.lista}>{item.validaciones.filter(({ estado }) => estado === "observado").map(({ id, plantilla, observacion }) => (
                  <li key={id}><strong>{plantilla.nombre}</strong>{observacion && <p>{observacion}</p>}</li>
                ))}</ul>}
                <p><Link href={`/mis-tramites/subsanacion#subsanar-${item.id}`}>Subsanar documentos</Link></p>
              </>
            )}
            {item.estado === "observado" && vista === "subsanacion" && (
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
