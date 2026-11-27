"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { certificaciones, esCertificacion, esTramite, tramites, tramitesAcademicos, type TramiteAcademico } from "./tramites";
import styles from "./orientacion.module.css";

type Programa = { id: number; nombre: string };
type Requisito = { id: number; nombre: string; descripcion: string; tipo: string; obligatorio: boolean; versionNorm: string };
type Catalogo = {
  requisitos: Requisito[];
  costos?: string;
  plazos?: string;
  procedimiento?: string;
  observaciones?: string;
  fuente?: string;
  demostracion?: boolean;
  formatos?: { nombre: string; url: string }[];
  fuenteFormatos?: string;
};
type Resultado<T> = { clave: string; datos?: T; error?: string };

const etapas = [
  ["Consultar", "Selecciona el trámite y el programa académico.", "M21 21l-5-5m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"],
  ["Preparar", "Reúne los documentos que respaldan tu solicitud.", "M3 7h7l2 2h9v10H3zM3 7V5h7l2 2"],
  ["Solicitar", "Revisa los datos y presenta tu solicitud.", "M5 3h9l5 5v13H5zm9 0v5h5M8 13h8m-8 4h6"],
  ["Seguimiento", "Consulta el expediente y atiende observaciones.", "M8 5h8m-8 7 2 2 5-5M6 4h12v16H6z"],
];

const normalizarBusqueda = (valor: string) => valor.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es");

function Icono({ ruta }: { ruta: string }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ruta} /></svg>;
}

export function SelloPosgrado() {
  return <div className={styles.sello}>
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="m2 9 10-5 10 5-10 5zM6 11v5c3 3 9 3 12 0v-5m4-2v6" />
    </svg>
    Escuela de Posgrado
  </div>;
}

export default function Orientacion({ inicial, seccion, programasDestacados }: { inicial?: TramiteAcademico; seccion?: "certificaciones"; programasDestacados?: boolean }) {
  const esCert = seccion === "certificaciones";
  const opcionesTramite = esCert ? certificaciones : tramites;
  const base = esCert ? "/certificaciones" : "/grados-titulos";
  const [seleccion, setSeleccion] = useState<TramiteAcademico>(esCert ? "diplomados" : "maestro");
  const tramite = inicial ?? seleccion;
  const datos = tramitesAcademicos[tramite];
  const titulo = inicial ? datos.titulo : programasDestacados ? "Programas y Procedimientos" : esCert ? "Requisitos de Certificación" : "Requisitos y Procedimiento";
  const [programas, setProgramas] = useState<Resultado<Programa[]>>();
  const [programa, setPrograma] = useState("");
  const [catalogo, setCatalogo] = useState<Resultado<Catalogo>>();
  const [busqueda, setBusqueda] = useState("");
  const programasVisibles = programas?.clave === datos.programa ? programas : undefined;
  const opciones = programasVisibles?.datos;
  const programaActual = opciones?.some((item) => String(item.id) === programa) ? programa
    : opciones?.length === 1 ? String(opciones[0].id) : "";
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
  const informacion = detalle?.datos;
  const consulta = normalizarBusqueda(busqueda.trim());
  const requisitosAcademicos = informacion?.requisitos.filter(({ tipo }) => tipo !== "documental") ?? [];
  const requisitos = requisitosAcademicos.filter(({ nombre, descripcion }) =>
    normalizarBusqueda(`${nombre} ${descripcion}`).includes(consulta));
  const documentos = informacion?.requisitos.filter(({ tipo }) => tipo === "documental") ?? [];

  return (
    <main className={`${styles.pagina} ${styles.orientacion}`}>
      <nav aria-label="Ruta de navegación" className={styles.ruta}>
        <Link href="/">Inicio</Link><span aria-hidden="true">/</span>
        <Link href={base}>{esCert ? "Certificaciones" : "Grados y Títulos"}</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{inicial ? datos.nombre : titulo}</span>
      </nav>
      <header className={styles.hero}>
        <SelloPosgrado />
        <h1 className="serif">{titulo}</h1>
        <p>Consulta los requisitos de tu programa, prepara los documentos y presenta tu solicitud.</p>
        <div className={styles.acciones}>
          <Link href={`${base}/iniciar-solicitud?tramite=${tramite}`}>Iniciar solicitud</Link>
          <a href="#requisitos">{programasDestacados ? "Ver programas" : "Ver requisitos"}</a>
          <Link href="/verificar-documento">Verificar documento</Link>
        </div>
      </header>
      <div className={styles.tarjetas}>
        {[
          ["M8 5h8m-8 7 2 2 5-5M6 4h12v16H6z", "Requisitos", "Qué necesitas", "#requisitos"],
          ["M6 3h8l4 4v14H6zM14 3v5h4m-8 5h4m-4 4h4", "Documentos", "Qué presentar", "#documentos"],
          ["m10 14 4-4m-6 2-3 3a3 3 0 0 0 4 4l3-3m0-8 3-3a3 3 0 0 1 4 4l-3 3", "Seguimiento", "Estado del trámite", "/mis-tramites/expedientes"],
        ].map(([icono, nombre, descripcion, enlace]) => (
          <Link className={styles.tarjeta} key={nombre} href={enlace}>
            <span className={styles.iconoTarjeta}><Icono ruta={icono} /></span>
            <strong>{nombre}</strong><span>{descripcion}</span>
          </Link>
        ))}
      </div>
      <section className={styles.panel}>
        <h2>{esCert ? "¿Cómo obtener tu certificado?" : inicial === "segunda-especialidad" ? "¿Cómo obtener tu título?" : inicial ? "¿Cómo obtener tu grado?" : "Procedimiento"}</h2>
        <ol className={styles.recorrido}>{etapas.map(([nombre, texto, icono]) => (
          <li key={nombre}><span aria-hidden="true"><Icono ruta={icono} /></span><strong>{nombre}</strong><p>{texto}</p></li>
        ))}</ol>
      </section>
      <section id="requisitos" className={styles.panel}>
        <h2>{programasDestacados ? "Programas disponibles" : "Requisitos por programa"}</h2>
        <p>Selecciona un programa para consultar su catálogo publicado.</p>
        <div className={styles.campos}>
          {!inicial && (
            <label>¿Qué trámite deseas realizar?
              <select value={tramite} onChange={(evento) => {
                const valor = evento.target.value;
                if (esTramite(valor) || esCertificacion(valor)) setSeleccion(valor);
                setPrograma("");
                setBusqueda("");
              }}>
                {Object.entries(opcionesTramite).map(([id, item]) => <option key={id} value={id}>{item.nombre}</option>)}
              </select>
            </label>
          )}
          <label>Programa académico
            <select value={programaActual} onChange={(evento) => { setPrograma(evento.target.value); setBusqueda(""); }}
              disabled={!opciones?.length}>
              {opciones?.length !== 1 && <option value="">Selecciona un programa</option>}
              {opciones?.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
            </select>
          </label>
        </div>
        <div role="status">
          {informacion?.demostracion && <p className={styles.avisoDemo}><strong>Programa de demostración.</strong> Los requisitos y documentos son ejemplos para pruebas locales.</p>}
          {!programasVisibles && <p>Consultando programas…</p>}
          {programasVisibles?.error && <p>{programasVisibles.error} Puedes volver a intentar recargando la página.</p>}
          {programasVisibles?.datos?.length === 0 && <p>No hay programas publicados para este trámite.</p>}
          {clave && !detalle && <p>Consultando requisitos…</p>}
          {detalle?.error && <p>{detalle.error}</p>}
        </div>
        <div className={styles.catalogo}>
          <section aria-labelledby="requisitos-academicos">
            <h3 id="requisitos-academicos">Requisitos académicos</h3>
            <label className={styles.buscador}>Buscar requisitos
              <span><Icono ruta="M21 21l-5-5m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
                <input type="search" value={busqueda} placeholder="Nombre o descripción" disabled={!requisitosAcademicos.length}
                  onChange={(evento) => setBusqueda(evento.target.value)} />
              </span>
            </label>
            {informacion && requisitos.length === 0 && <p role="status">{consulta ? "No hay resultados para esta búsqueda." : "No hay requisitos académicos publicados."}</p>}
            <Lista items={requisitos} />
          </section>
          <section aria-labelledby="documentos" className={styles.documentos}>
            <h3 id="documentos">Documentos necesarios</h3>
            {!programaActual && <p>Selecciona un programa para ver sus documentos.</p>}
            {informacion && documentos.length === 0 && <p>No hay documentos publicados para este programa.</p>}
            <Lista items={documentos} />
            {!!informacion?.formatos?.length && <div className={styles.formatos}>
              <h4>Formatos oficiales</h4>
              <ul>{informacion.formatos.map(({ nombre, url }, indice) => <li key={`${url}/${indice}`}>
                <a href={url} target="_blank" rel="noopener noreferrer" download>{nombre}</a>
              </li>)}</ul>
              {informacion.fuenteFormatos && informacion.fuenteFormatos !== informacion.fuente && <p>Fuente: {informacion.fuenteFormatos}</p>}
            </div>}
          </section>
        </div>
        {informacion && !informacion.demostracion && <dl className={styles.condiciones}>
          <div><dt>Procedimiento oficial</dt><dd>{informacion.procedimiento ?? "Sin información oficial disponible."}</dd></div>
          <div><dt>Costos autorizados</dt><dd>{informacion.costos ?? "Sin información oficial disponible."}</dd></div>
          <div><dt>Plazos oficiales</dt><dd>{informacion.plazos ?? "Sin información oficial disponible."}</dd></div>
          {informacion.observaciones && <div><dt>Observaciones</dt><dd>{informacion.observaciones}</dd></div>}
          {informacion.fuente && <div><dt>Referencia institucional</dt><dd>{informacion.fuente}</dd></div>}
        </dl>}
      </section>
      <section className={`${styles.panel} ${styles.preguntas}`}>
        <h2>Preguntas frecuentes</h2>
        <details><summary>¿Dónde encuentro los requisitos de mi programa?</summary><p>Selecciona tu programa en la sección de requisitos para consultar la información publicada.</p></details>
        <details><summary>¿Cómo presento mis documentos?</summary><p>Consulta la <a href="#documentos">lista de documentos</a> y adjunta los PDF desde el asistente de solicitud.</p></details>
        <details><summary>¿Cómo consulto mi expediente?</summary><p>Abre <Link href="/mis-tramites/expedientes">Mis Trámites</Link> e ingresa con tu cuenta para consultar las solicitudes registradas.</p></details>
        <details><summary>¿Dónde confirmo los montos y plazos?</summary><p>Revisa la información publicada para tu programa. Si aún no figura, consulta con la Escuela de Posgrado antes de realizar un pago.</p></details>
        <details><summary>¿Qué hago si mi solicitud tiene observaciones?</summary><p>Consulta los archivos observados y envía su corrección desde <Link href="/mis-tramites/subsanacion">Subsanar documentos</Link>.</p></details>
      </section>
    </main>
  );
}

function Lista({ items }: { items?: Requisito[] }) {
  if (!items?.length) return null;
  return <ul className={styles.itemsCatalogo}>{items.map((item) => (
    <li key={item.id}>
      <div><strong>{item.nombre}</strong><span>{item.obligatorio ? "Obligatorio" : "Opcional"}</span></div>
      <p>{item.descripcion}</p>
      <small>Versión de la plantilla: {item.versionNorm}</small>
    </li>
  ))}</ul>;
}
