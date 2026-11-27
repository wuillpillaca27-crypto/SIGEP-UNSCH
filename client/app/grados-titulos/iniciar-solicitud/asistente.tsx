"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  cargarDocumento,
  descargarDocumento,
  ErrorDocumento,
  estadoVisible,
  rutaConstancia,
  solicitudes,
  type OpcionesSolicitud,
  type Perfil,
  type Solicitud,
} from "../solicitudes-api";
import { esCertificacion, rutaSolicitud } from "../tramites";
import styles from "../orientacion.module.css";
import visual from "./asistente.module.css";

const pasos = ["Datos personales", "Programa académico", "Requisitos académicos", "Documentos", "Confirmación"];
const navegarAlLogin = (destino: string) => window.location.replace(destino);

function destinoLogin(codigo?: string) {
  const destino = `/login?continuar=${encodeURIComponent(window.location.pathname + window.location.search)}`;
  return codigo === "SESION_EXPIRADA" ? destino + "&sesion=expirada" : destino;
}

const motivos: Record<NonNullable<OpcionesSolicitud["motivo"]>, (programa: string) => string> = {
  sin_matricula: () => "Tu cuenta no tiene una matrícula de estudiante vinculada. Solicita a la Escuela de Posgrado que revise tu registro.",
  programa_inactivo: (programa) => `El programa ${programa} está registrado como inactivo. La Escuela de Posgrado debe confirmar su vigencia antes de habilitar solicitudes.`,
  sin_requisitos_activos: (programa) => `${programa} no tiene requisitos activos publicados para su trámite. Solicita a la Escuela de Posgrado que verifique el catálogo autorizado.`,
  tramite_deshabilitado: (programa) => `El trámite de ${programa} está deshabilitado. Consulta con la Escuela de Posgrado.`,
  plantilla_no_publicada: (programa) => `Los requisitos de ${programa} están configurados, pero la plantilla todavía no está publicada.`,
  matricula_no_habilitada: (programa) => `La matrícula de ${programa} no está habilitada para solicitar este trámite. Consulta su estado con la Escuela de Posgrado.`,
};

export default function Asistente({ seleccion, programaInicial, certificaciones = false, navegar = navegarAlLogin }: {
  seleccion?: string; programaInicial?: string; certificaciones?: boolean; navegar?: (destino: string) => void;
}) {
  const [perfil, setPerfil] = useState<Perfil>();
  const [opciones, setOpciones] = useState<OpcionesSolicitud>();
  const [programaId, setProgramaId] = useState("");
  const [solicitud, setSolicitud] = useState<Solicitud>();
  const [paso, setPaso] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [intento, setIntento] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const compatibles = (opciones?.programas ?? []).filter(({ tramites }) => tramites.some(({ clave }) =>
    seleccion ? clave === seleccion : esCertificacion(clave) === certificaciones));
  const programaSeleccionado = programaId ? compatibles.find((item) => String(item.id) === programaId) : undefined;
  const programa = programaSeleccionado ?? (compatibles.length === 1 ? compatibles[0] : undefined);
  const programaIdVisible = programa ? String(programa.id) : "";
  const tramite = (programa ?? compatibles[0])?.tramites.find(({ clave }) => seleccion ? clave === seleccion : esCertificacion(clave) === certificaciones);
  const alternativas = opciones?.programas.flatMap((item) => item.tramites.map((disponible) => ({ ...disponible, programa: item })));
  const registro = opciones?.matriculas?.find((item) => item.id === programa?.id);

  useEffect(() => {
    let vigente = true;
    async function cargar() {
      const sesion = await solicitudes.perfil();
      if (!vigente) return;
      if (!sesion.datos) {
        if (sesion.estadoHttp === 401) {
          navegar(destinoLogin(sesion.codigo));
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
          navegar(destinoLogin(elegibilidad.codigo));
        } else setError(elegibilidad.error ?? "No se pudo consultar la disponibilidad del trámite.");
        setCargando(false);
        return;
      }
      setOpciones(elegibilidad.datos);
      setProgramaId(programaInicial ?? "");
      setCargando(false);
    }
    void cargar();
    return () => { vigente = false; };
  }, [navegar, seleccion, certificaciones, programaInicial, intento]);

  const documentosPendientes = useMemo(() => {
    if (!solicitud) return [];
    return solicitud.validaciones.filter(({ plantilla, estado }) =>
      plantilla.obligatorio && plantilla.tipo === "documental" && estado !== "no_aplica" &&
      !solicitud.documentos.some((documento) => documento.tipoDoc === String(plantilla.id))
    );
  }, [solicitud]);

  function redirigirSiVence(estadoHttp?: number, codigo?: string) {
    if (estadoHttp !== 401) return false;
    navegar(destinoLogin(codigo));
    return true;
  }

  async function asegurarBorrador() {
    if (!programa || !tramite) throw new Error("Selecciona un programa y un trámite habilitados.");
    const respuesta = await solicitudes.crear(tramite.tipoTramite, programa.id);
    if (!respuesta.datos) {
      if (redirigirSiVence(respuesta.estadoHttp, respuesta.codigo)) return null;
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
      if (problema instanceof ErrorDocumento && redirigirSiVence(problema.estadoHttp, problema.codigo)) return;
      setError(problema instanceof Error ? problema.message : "No se pudo completar la operación.");
    }
    finally { setOcupado(false); }
  }

  async function guardarBorrador(avanzar = false) {
    const borrador = await asegurarBorrador();
    if (!borrador) return;
    if (avanzar) setPaso(2);
    else setMensaje("Borrador guardado. Puedes retomarlo desde Mis Trámites.");
  }

  if (cargando) return <section className={styles.panel} role="status">Verificando sesión y programas asociados a tu matrícula…</section>;

  const programaRegistrado = opciones?.programaRegistrado;
  const bloqueada = opciones?.matriculas?.find((item) => item.motivo &&
    (!programaId || String(item.id) === programaId) &&
    (seleccion ? item.claveTramite === seleccion : esCertificacion(item.claveTramite) === certificaciones));
  const motivo = bloqueada?.motivo ?? opciones?.motivo;
  const textoMotivo = motivo ? motivos[motivo](bloqueada?.nombre ?? programaRegistrado?.nombre ?? "registrado") : "";

  return (
    <section className={styles.panel} aria-busy={ocupado}>
      <h2>Asistente de solicitud</h2>
      {error && <p role="alert">{error}</p>}
      {error && !opciones && (!perfil || perfil.rol === "estudiante") && (
        <button type="button" onClick={() => {
          setError("");
          setCargando(true);
          setIntento((previo) => previo + 1);
        }}>Reintentar conexión</button>
      )}
      {mensaje && <p role="status">{mensaje}</p>}
      {opciones && !compatibles.length && (
        <div className={visual.aviso} role="status">
          <h3>{textoMotivo ? "No hay un trámite habilitado para tu matrícula" : "El trámite solicitado no corresponde a tu matrícula"}</h3>
          <p>{textoMotivo || (programaRegistrado && (opciones.matriculas?.length ?? 1) === 1
            ? `Tu programa registrado es ${programaRegistrado.nombre}.` : "No hay una matrícula habilitada para el trámite seleccionado.")}</p>
          {!!alternativas?.length && <ul>{alternativas.map((item) => <li key={`${item.programa.id}/${item.clave}`}>
            <Link href={rutaSolicitud(item.clave, item.programa.id)}>{item.nombre} · {item.programa.nombre}</Link>
          </li>)}</ul>}
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
              <dl className={styles.datos}>
                <div><dt>Código universitario</dt><dd>{registro?.codigoUniv ?? perfil.estudiante?.codigoUniv}</dd></div>
                <div><dt>Nombres y apellidos</dt><dd>{perfil.nombres} {perfil.apellidos}</dd></div>
                <div><dt>DNI</dt><dd>{perfil.dni}</dd></div>
                <div><dt>Correo electrónico</dt><dd>{perfil.email}</dd></div>
              </dl>
          )}
          {paso === 1 && (
            <div className={`${styles.formulario} ${visual.seleccion}`}>
              <label>Programa académico
                <select value={programaIdVisible} disabled={ocupado || compatibles.length === 1} onChange={(evento) => {
                  setProgramaId(evento.target.value);
                  setSolicitud(undefined);
                }}>
                  {compatibles.length > 1 && <option value="">Selecciona un programa compatible</option>}
                  {compatibles.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                </select>
              </label>
              <label>Trámite disponible
                <select value={tramite.tipoTramite} disabled>
                  <option value={tramite.tipoTramite}>{tramite.nombre}</option>
                </select>
              </label>
              <div className={styles.controles}>
                <button type="button" disabled={ocupado || !programa} onClick={() => void ejecutar(() => guardarBorrador(true))}>Continuar</button>
                <button type="button" disabled={ocupado || !programa} onClick={() => void ejecutar(() => guardarBorrador())}>Guardar borrador</button>
              </div>
            </div>
          )}
          {paso === 2 && (
            <>
              <p>Revisa los requisitos vigentes para {programa?.nombre} · {tramite.nombre}.</p>
              <ul className={styles.lista}>{solicitud?.validaciones.map(({ id, plantilla, estado, observacion }) => (
                <li key={id}><strong>{plantilla.nombre}</strong> · {estadoVisible(estado)}{plantilla.obligatorio && " · Obligatorio"}<p>{observacion ?? plantilla.descripcion}</p></li>
              ))}</ul>
            </>
          )}
          {paso === 3 && solicitud && (
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
                  {documento && <div className={styles.controles}>
                    <button type="button" disabled={ocupado} onClick={() => void ejecutar(() => descargarDocumento(solicitud.id, documento.id, false, true))}>Visualizar PDF</button>
                    <button type="button" disabled={ocupado} onClick={() => void ejecutar(async () => {
                      const respuesta = await solicitudes.retirarDocumento(solicitud.id, documento.id);
                      if (redirigirSiVence(respuesta.estadoHttp, respuesta.codigo)) return;
                      if (!respuesta.datos) throw new Error(respuesta.error ?? "No se pudo retirar el archivo.");
                      setSolicitud(respuesta.datos);
                      setMensaje("Archivo retirado del borrador.");
                    })}>Retirar PDF</button>
                  </div>}
                </div>;
              })}
              {!solicitud.validaciones.some(({ plantilla }) => plantilla.tipo === "documental") && <p>No hay documentos publicados para este trámite.</p>}
            </div>
          )}
          {paso === 4 && solicitud && (
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
                  if (redirigirSiVence(respuesta.estadoHttp, respuesta.codigo)) return;
                  throw new Error(respuesta.error ?? "No se pudo presentar la solicitud.");
                }
                setSolicitud(respuesta.datos);
              })}>Presentar solicitud</button>
            </>
          )}
          <div className={styles.controles}>
            <Link href="/mis-tramites/solicitudes">Cancelar y salir</Link>
            {paso > 0 && <button type="button" disabled={ocupado} onClick={() => setPaso(paso - 1)}>Anterior</button>}
            {paso !== 1 && paso < 4 && <button type="button" disabled={ocupado} onClick={() => setPaso(paso + 1)}>Siguiente</button>}
            {paso > 1 && <button type="button" disabled={ocupado} onClick={() => void ejecutar(() => guardarBorrador())}>Guardar borrador</button>}
          </div>
        </>
      )}
      {solicitud?.presentadoEn && <p role="status">Solicitud presentada. Expediente <strong>{solicitud.codigo}</strong>. <Link href={`/mis-tramites/expedientes#expediente-${solicitud.id}`}>Consultar expediente en Mis Trámites</Link> · <a href={rutaConstancia(solicitud.id)}>Descargar acuse</a></p>}
      {programaRegistrado && opciones?.motivo && <small>Programa matriculado: {programaRegistrado.nombre} · estado {programaRegistrado.activo ? "activo" : "inactivo"}.</small>}
    </section>
  );
}
