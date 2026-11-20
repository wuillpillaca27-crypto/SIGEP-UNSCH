"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { esTramite, tramites, type Tramite } from "./tramites";
import styles from "./orientacion.module.css";

type Programa = { id: number; nombre: string };
type Requisito = { id: number; nombre: string; descripcion: string; tipo: string; obligatorio: boolean; versionNorm: string };
type Catalogo = {
  requisitos: Requisito[];
  costos?: string;
  plazos?: string;
  observaciones?: string;
  fuente?: string;
};
type Resultado<T> = { clave: string; datos?: T; error?: string };

const etapas = [
  ["Consultar", "Selecciona el trámite y el programa académico."],
  ["Preparar", "Identifica qué archivos respaldan cada requisito."],
  ["Solicitar", "Revisa los datos y los documentos antes de enviarlos."],
  ["Seguimiento", "Consulta el expediente y atiende las observaciones en Mis Trámites."],
];

export function SelloPosgrado() {
  return <div className={styles.sello}>
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="m2 9 10-5 10 5-10 5zM6 11v5c3 3 9 3 12 0v-5m4-2v6" />
    </svg>
    Escuela de Posgrado
  </div>;
}

export default function Orientacion({ inicial }: { inicial?: Tramite }) {
  const [seleccion, setSeleccion] = useState<Tramite>("maestro");
  const tramite = inicial ?? seleccion;
  const datos = tramites[tramite];
  const titulo = inicial ? datos.titulo : "Requisitos y Procedimiento";
  const [programas, setProgramas] = useState<Resultado<Programa[]>>();
  const [programa, setPrograma] = useState("");
  const [catalogo, setCatalogo] = useState<Resultado<Catalogo>>();
  const [busqueda, setBusqueda] = useState("");
  const programasVisibles = programas?.clave === datos.programa ? programas : undefined;
  const opciones = programasVisibles?.datos;
  const programaActual = programa || (opciones?.length === 1 ? String(opciones[0].id) : "");
  const clave = programaActual ? `${datos.tipo}/${programaActual}` : "";

  useEffect(() => {
    let vigente = true;
    api.get<{ datos: Programa[] }>(`/catalogo-grados/${datos.tipo}`).then((respuesta) => {
      if (!vigente) return;
      if (!respuesta.ok) setProgramas({ clave: datos.programa, error: "No se pudo consultar el catálogo de programas." });
      else setProgramas({ clave: datos.programa, datos: respuesta.datos?.datos ?? [] });
    });
    return () => { vigente = false; };
  }, [datos.programa, datos.tipo]);

  useEffect(() => {
    if (!clave) return;
    let vigente = true;
    api.get<Catalogo>(`/catalogo-grados/${clave}`).then((respuesta) => {
      if (!vigente) return;
      if (!respuesta.ok) setCatalogo({ clave, error: "No se pudo consultar la información de este programa." });
      else setCatalogo({ clave, datos: respuesta.datos });
    });
    return () => { vigente = false; };
  }, [clave]);

  const detalle = catalogo?.clave === clave ? catalogo : undefined;
  const consulta = busqueda.trim().toLocaleLowerCase("es");
  const requisitos = detalle?.datos?.requisitos.filter((item) =>
    `${item.nombre} ${item.descripcion}`.toLocaleLowerCase("es").includes(consulta)
  );

  return (
    <main className={styles.pagina}>
      <nav aria-label="Ruta de navegación" className={styles.ruta}>
        <Link href="/">Inicio</Link><span aria-hidden="true">/</span>
        <Link href="/grados-titulos">Grados y Títulos</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{inicial ? datos.nombre : titulo}</span>
      </nav>
      <header className={styles.hero}>
        <SelloPosgrado />
        <h1 className="serif">{titulo}</h1>
        <p>Consulta los requisitos, prepara tus documentos y gestiona tu solicitud de forma sencilla desde SIGEP-UNSCH.</p>
        <div className={styles.acciones}>
          <Link href={`/grados-titulos/iniciar-solicitud?tramite=${tramite}`}>Iniciar solicitud</Link>
          <a href="#requisitos">Ver requisitos</a>
        </div>
      </header>
      <div className={styles.tarjetas}>
        {[
          ["M8 5h8m-8 7 2 2 5-5M6 4h12v16H6z", "Requisitos", "Qué necesitas", "#requisitos"],
          ["M6 3h8l4 4v14H6zM14 3v5h4m-8 5h4m-4 4h4", "Documentos", "Qué presentar", "#documentos"],
          ["m10 14 4-4m-6 2-3 3a3 3 0 0 0 4 4l3-3m0-8 3-3a3 3 0 0 1 4 4l-3 3", "Seguimiento", "Estado del trámite", "/mis-tramites/expedientes"],
        ].map(([icono, nombre, descripcion, enlace]) => (
          <Link className={styles.tarjeta} key={nombre} href={enlace}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icono}/></svg>
            <strong>{nombre}</strong><span>{descripcion}</span>
          </Link>
        ))}
      </div>
      <section className={styles.panel}>
        <h2>{inicial === "segunda-especialidad" ? "¿Cómo obtener tu título?" : inicial ? "¿Cómo obtener tu grado?" : "Procedimiento"}</h2>
        <ol className={styles.recorrido}>{etapas.map(([nombre, texto], indice) => (
          <li key={nombre}><span aria-hidden="true">{indice + 1}</span><strong>{nombre}</strong><p>{texto}</p></li>
        ))}</ol>
      </section>
      <section id="requisitos" className={styles.panel}>
        <h2>Requisitos por programa</h2>
        <p>{datos.temas}</p>
        <div className={styles.campos}>
          {!inicial && (
            <label>¿Qué trámite deseas realizar?
              <select value={tramite} onChange={(evento) => {
                const valor = evento.target.value;
                if (esTramite(valor)) setSeleccion(valor);
                setPrograma("");
                setBusqueda("");
              }}>
                {Object.entries(tramites).map(([id, item]) => <option key={id} value={id}>{item.nombre}</option>)}
              </select>
            </label>
          )}
          <label>Programa académico
            <select value={programaActual} onChange={(evento) => setPrograma(evento.target.value)}
              disabled={!opciones?.length}>
              {opciones?.length !== 1 && <option value="">Selecciona un programa</option>}
              {opciones?.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
            </select>
          </label>
          <label>Buscar requisitos
            <input type="search" value={busqueda} disabled={!detalle?.datos?.requisitos.length}
              onChange={(evento) => setBusqueda(evento.target.value)} />
          </label>
        </div>
        <div role="status">
          {!programasVisibles && <p>Consultando programas…</p>}
          {programasVisibles?.error && <p>{programasVisibles.error} Puedes volver a intentar recargando la página.</p>}
          {programasVisibles?.datos?.length === 0 && <p>No hay programas publicados para este trámite.</p>}
          {clave && !detalle && <p>Consultando requisitos…</p>}
          {detalle?.error && <p>{detalle.error}</p>}
          {detalle?.datos && !requisitos?.length && <p>{consulta ? "No hay resultados para esta búsqueda." : "Este programa aún no tiene requisitos publicados."}</p>}
        </div>
        <Lista items={requisitos?.filter((item) => item.tipo !== "documental")} />
        <h3 id="documentos">Documentos necesarios</h3>
        <Lista items={requisitos?.filter((item) => item.tipo === "documental")} />
        {!requisitos?.some((item) => item.tipo === "documental") && <p>No hay documentos para mostrar en la selección actual.</p>}
        <dl className={styles.datos}>
          <div><dt>Costos autorizados</dt><dd>{detalle?.datos?.costos ?? "Sin información oficial disponible."}</dd></div>
          <div><dt>Plazos oficiales</dt><dd>{detalle?.datos?.plazos ?? "Sin información oficial disponible."}</dd></div>
          {detalle?.datos?.observaciones && <div><dt>Observaciones</dt><dd>{detalle.datos.observaciones}</dd></div>}
          {detalle?.datos?.fuente && <div><dt>Referencia institucional</dt><dd>{detalle.datos.fuente}</dd></div>}
        </dl>
      </section>
      <section className={styles.panel}>
        <h2>Preguntas frecuentes</h2>
        <details><summary>¿Dónde encuentro los requisitos de mi programa?</summary><p>Selecciona tu programa en la sección de requisitos para consultar la información publicada.</p></details>
        <details><summary>¿Cómo consulto mi expediente?</summary><p>Abre <Link href="/mis-tramites/expedientes">Mis Trámites</Link> e ingresa con tu cuenta para consultar las solicitudes registradas.</p></details>
        <details><summary>¿Dónde confirmo los montos y plazos?</summary><p>Revisa la información publicada para tu programa. Si aún no figura, consulta con la Escuela de Posgrado antes de realizar un pago.</p></details>
      </section>
    </main>
  );
}

function Lista({ items }: { items?: Requisito[] }) {
  if (!items?.length) return null;
  return <ul className={styles.lista}>{items.map((item) => (
    <li key={item.id}>
      <strong>{item.nombre}</strong> <span>{item.obligatorio ? "Obligatorio" : "Opcional"}</span>
      <p>{item.descripcion}</p>
      <small>Versión de la plantilla: {item.versionNorm}</small>
    </li>
  ))}</ul>;
}
