"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  cargarDocumento,
  descargarDocumento,
  ErrorDocumento,
  estadoVisible,
  solicitudes,
  type OpcionesSolicitud,
  type Perfil,
  type Solicitud,
} from "../solicitudes-api";
import { esCertificacion } from "../tramites";
import styles from "../orientacion.module.css";
import visual from "./asistente.module.css";

const pasos = ["Datos personales y programa", "Requisitos académicos", "Documentos", "Confirmación"];
const navegarAlLogin = (destino: string) => window.location.replace(destino);

function destinoLogin() {
  return `/login?continuar=${encodeURIComponent(window.location.pathname + window.location.search)}`;
}

const motivos: Record<NonNullable<OpcionesSolicitud["motivo"]>, (programa: string) => string> = {
  sin_matricula: () => "Tu cuenta no tiene una matrícula de estudiante vinculada. Solicita a la Escuela de Posgrado que revise tu registro.",
  programa_inactivo: (programa) => `El programa ${programa} está registrado como inactivo. La Escuela de Posgrado debe confirmar su vigencia antes de habilitar solicitudes.`,
  sin_requisitos_activos: (programa) => `${programa} no tiene requisitos activos publicados para su trámite. Solicita a la Escuela de Posgrado que verifique el catálogo autorizado.`,
};

export default function Asistente({ seleccion, certificaciones = false, navegar = navegarAlLogin }: {
  seleccion?: string; certificaciones?: boolean; navegar?: (destino: string) => void;
}) {
  const [perfil, setPerfil] = useState<Perfil>();
  const [opciones, setOpciones] = useState<OpcionesSolicitud>();
  const [programaId, setProgramaId] = useState("");
  const [tipoTramite, setTipoTramite] = useState("");
  const [solicitud, setSolicitud] = useState<Solicitud>();
  const [paso, setPaso] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const programa = opciones?.programas.find((item) => String(item.id) === programaId);
  const tramite = programa?.tramites.find((item) => item.tipoTramite === tipoTramite);
  const otroTramite = opciones?.programas.flatMap((item) => item.tramites).find(({ clave }) =>
    seleccion ? clave !== seleccion : esCertificacion(clave) !== certificaciones);

  useEffect(() => {
    let vigente = true;
    async function cargar() {
      const sesion = await solicitudes.perfil();
      if (!vigente) return;
      if (!sesion.datos) {
        if (sesion.estadoHttp === 401) {
          navegar(destinoLogin());
        } else setError(sesion.error ?? "No se pudo verificar tu sesión. Intenta nuevamente.");
        setCargando(false);
        return;
      }
      setPerfil(sesion.datos);
      if (sesion.datos.rol !== "estudiante") {
        setError("El asistente requiere una cuenta con rol de estudiante. Si tu cuenta debería tener ese rol, solicita orientación.");
        setCargando(false);
        return;
      }

      const elegibilidad = await solicitudes.opciones();
      if (!vigente) return;
      if (!elegibilidad.datos) {
        if (elegibilidad.estadoHttp === 401) {
          navegar(destinoLogin());
        } else setError(elegibilidad.error ?? "No se pudo consultar la disponibilidad del trámite.");
        setCargando(false);
        return;
      }
      setOpciones(elegibilidad.datos);
      const inicial = elegibilidad.datos.programas[0];
      if (inicial) {
        setProgramaId(String(inicial.id));
        const tramiteInicial = inicial.tramites.find(({ clave }) => seleccion ? clave === seleccion : esCertificacion(clave) === certificaciones);
        setTipoTramite(tramiteInicial?.tipoTramite ?? "");
      }
      setCargando(false);
    }
    void cargar();
    return () => { vigente = false; };
  }, [navegar, seleccion, certificaciones]);

  const documentosPendientes = useMemo(() => {
    if (!solicitud) return [];
    return solicitud.validaciones.filter(({ plantilla, estado }) =>
      plantilla.obligatorio && plantilla.tipo === "documental" && estado !== "no_aplica" &&
      !solicitud.documentos.some((documento) => documento.tipoDoc === String(plantilla.id))
    );
  }, [solicitud]);

  function redirigirSiVence(estadoHttp?: number) {
    if (estadoHttp !== 401) return false;
    navegar(destinoLogin());
    return true;
  }

  async function asegurarBorrador() {
    if (!programa || !tramite) throw new Error("Selecciona un programa y un trámite habilitados.");
    const respuesta = await solicitudes.crear(tramite.tipoTramite, programa.id);
    if (!respuesta.datos) {
      if (redirigirSiVence(respuesta.estadoHttp)) return null;
      throw new Error(respuesta.error ?? "No se pudo guardar el borrador.");
    }
    setSolicitud(respuesta.datos);
    return respuesta.datos;
  }

  async function ejecutar(accion: () => Promise<void>) {
    setOcupado(true);
    setError("");
    setMensaje("");
    try { await accion(); }
    catch (problema) {
      if (problema instanceof ErrorDocumento && redirigirSiVence(problema.estadoHttp)) return;
      setError(problema instanceof Error ? problema.message : "No se pudo completar la operación.");
    }
    finally { setOcupado(false); }
  }

  async function guardarBorrador(avanzar = false) {
    const borrador = await asegurarBorrador();
    if (!borrador) return;
    if (avanzar) setPaso(1);
    else setMensaje("Borrador guardado. Puedes retomarlo desde Mis Trámites.");
  }

  if (cargando) return <section className={styles.panel} role="status">Verificando sesión y programas asociados a tu matrícula…</section>;

  const programaRegistrado = opciones?.programaRegistrado;
  const textoMotivo = opciones?.motivo ? motivos[opciones.motivo](programaRegistrado?.nombre ?? "registrado") : "";

  return (
    <section className={styles.panel} aria-busy={ocupado}>
      <h2>Asistente de solicitud</h2>
      {error && <p role="alert">{error}</p>}
      {mensaje && <p role="status">{mensaje}</p>}
      {opciones?.motivo && (
        <div className={visual.aviso} role="status">
          <h3>No hay un trámite habilitado para tu matrícula</h3>
          <p>{textoMotivo}</p>
          <p>La oferta solo se habilita cuando el programa y sus requisitos están registrados y activos.</p>
          <Link href="/ayuda">Solicitar orientación</Link>
        </div>
      )}
      {otroTramite && !tramite && (
        <div className={visual.aviso} role="status">
          <h3>El trámite solicitado no corresponde a tu matrícula</h3>
          <p>Tu programa registrado es {programaRegistrado?.nombre}.</p>
          <p><Link href={`/${esCertificacion(otroTramite.clave) ? "certificaciones" : "grados-titulos"}/iniciar-solicitud?tramite=${otroTramite.clave}`}>
            Ir a {otroTramite.nombre}
          </Link></p>
          <Link href="/ayuda">Solicitar orientación</Link>
        </div>
      )}
      {perfil && perfil.rol !== "estudiante" && <Link href="/ayuda">Solicitar orientación</Link>}
      {perfil && opciones && tramite && !solicitud?.presentadoEn && (
        <>
          <ol className={visual.pasos} aria-label="Pasos de la solicitud">
            {pasos.map((nombre, indice) => (
              <li key={nombre} aria-current={paso === indice ? "step" : undefined}>
                <span aria-hidden="true">{indice + 1}</span>{nombre}
              </li>
            ))}
          </ol>
          <h3>{pasos[paso]}</h3>
          {paso === 0 && (
            <div className={`${styles.formulario} ${visual.seleccion}`}>
              <dl className={styles.datos}>
                <div><dt>Código universitario</dt><dd>{perfil.estudiante?.codigoUniv}</dd></div>
                <div><dt>Nombres y apellidos</dt><dd>{perfil.nombres} {perfil.apellidos}</dd></div>
                <div><dt>DNI</dt><dd>{perfil.dni}</dd></div>
                <div><dt>Correo electrónico</dt><dd>{perfil.email}</dd></div>
              </dl>
              <label>Programa académico
                <select value={programaId} onChange={(evento) => {
                  setProgramaId(evento.target.value);
                  const siguiente = opciones.programas.find((item) => String(item.id) === evento.target.value);
                  setTipoTramite(siguiente?.tramites.find(({ clave }) => seleccion ? clave === seleccion : esCertificacion(clave) === certificaciones)?.tipoTramite ?? "");
                  setSolicitud(undefined);
                }}>
                  {opciones.programas.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                </select>
              </label>
              <label>Trámite disponible
                <select value={tipoTramite} onChange={(evento) => { setTipoTramite(evento.target.value); setSolicitud(undefined); }}>
                  <option value={tramite.tipoTramite}>{tramite.nombre}</option>
                </select>
              </label>
              <div className={styles.controles}>
                <button type="button" disabled={ocupado} onClick={() => void ejecutar(() => guardarBorrador(true))}>Continuar</button>
                <button type="button" disabled={ocupado} onClick={() => void ejecutar(() => guardarBorrador())}>Guardar borrador</button>
              </div>
            </div>
          )}
          {paso === 1 && (
            <>
              <p>Revisa los requisitos vigentes para {programa?.nombre} · {tramite.nombre}.</p>
              <ul className={styles.lista}>{solicitud?.validaciones.map(({ id, plantilla, estado, observacion }) => (
                <li key={id}><strong>{plantilla.nombre}</strong> · {estadoVisible(estado)}{plantilla.obligatorio && " · Obligatorio"}<p>{observacion ?? plantilla.descripcion}</p></li>
              ))}</ul>
            </>
          )}
          {paso === 2 && solicitud && (
            <div className={styles.formulario}>
              <p>Adjunta los PDF solicitados. El servidor valida tipo, tamaño y pertenencia al expediente.</p>
              {solicitud.validaciones.filter(({ plantilla }) => plantilla.tipo === "documental").map(({ plantilla }) => {
                const documento = solicitud.documentos.find((item) => item.tipoDoc === String(plantilla.id));
                return <div key={plantilla.id}>
                  <label>{plantilla.nombre} · {documento ? "Adjunto" : "Pendiente"}
                    <input type="file" accept="application/pdf" disabled={ocupado} onChange={(evento) => {
                      const archivo = evento.currentTarget.files?.[0];
                      evento.currentTarget.value = "";
                      if (archivo) void ejecutar(async () => setSolicitud(await cargarDocumento(solicitud.id, plantilla.id, archivo)));
                    }} />
                  </label>
                  {documento && <button type="button" disabled={ocupado} onClick={() => void ejecutar(() => descargarDocumento(solicitud.id, documento.id, false, true))}>Visualizar PDF</button>}
                </div>;
              })}
              {!solicitud.validaciones.some(({ plantilla }) => plantilla.tipo === "documental") && <p>No hay documentos publicados para este trámite.</p>}
            </div>
          )}
          {paso === 3 && solicitud && (
            <>
              <h4>Confirma tu solicitud</h4>
              <dl className={styles.datos}>
                <div><dt>Estudiante</dt><dd>{perfil.nombres} {perfil.apellidos}</dd></div>
                <div><dt>Documento</dt><dd>{perfil.dni}</dd></div>
                <div><dt>Programa</dt><dd>{solicitud.programa.nombre}</dd></div>
                <div><dt>Trámite</dt><dd>{tramite.nombre}</dd></div>
                <div><dt>Documentos adjuntos</dt><dd>{solicitud.documentos.length}</dd></div>
              </dl>
              {documentosPendientes.length > 0 && <p role="alert">Falta adjuntar: {documentosPendientes.map(({ plantilla }) => plantilla.nombre).join(", ")}.</p>}
              <button type="button" disabled={ocupado || documentosPendientes.length > 0} onClick={() => void ejecutar(async () => {
                const respuesta = await solicitudes.presentar(solicitud.id);
                if (!respuesta.datos) {
                  if (redirigirSiVence(respuesta.estadoHttp)) return;
                  throw new Error(respuesta.error ?? "No se pudo presentar la solicitud.");
                }
                setSolicitud(respuesta.datos);
              })}>Presentar solicitud</button>
            </>
          )}
          <div className={styles.controles}>
            {paso > 0 && <button type="button" disabled={ocupado} onClick={() => setPaso(paso - 1)}>Anterior</button>}
            {paso > 0 && paso < 3 && <button type="button" disabled={ocupado} onClick={() => setPaso(paso + 1)}>Siguiente</button>}
            {paso > 0 && <button type="button" disabled={ocupado} onClick={() => void ejecutar(() => guardarBorrador())}>Guardar borrador</button>}
          </div>
        </>
      )}
      {solicitud?.presentadoEn && <p role="status">Solicitud presentada. Expediente <strong>{solicitud.codigo}</strong>. <Link href={`/mis-tramites/expedientes#expediente-${solicitud.id}`}>Consultar expediente en Mis Trámites</Link></p>}
      {programaRegistrado && opciones?.motivo && <small>Programa matriculado: {programaRegistrado.nombre} · estado {programaRegistrado.activo ? "activo" : "inactivo"}.</small>}
    </section>
  );
}
