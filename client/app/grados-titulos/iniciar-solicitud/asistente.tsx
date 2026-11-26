"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { certificaciones, tramites, type TramiteAcademico } from "../tramites";
import { cargarDocumento, descargarDocumento, estadoVisible, solicitudes, type Perfil, type Solicitud } from "../solicitudes-api";
import styles from "../orientacion.module.css";

const pasos = ["Datos personales", "Requisitos académicos", "Documentos", "Confirmación"];

export default function Asistente({ seleccion, certificacion = false }: { seleccion?: TramiteAcademico; certificacion?: boolean }) {
  const [perfil, setPerfil] = useState<Perfil | null>();
  const [solicitud, setSolicitud] = useState<Solicitud>();
  const [paso, setPaso] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const opciones = certificacion ? Object.entries(certificaciones) : Object.entries(tramites);
  const coincidencia = opciones.find(([, item]) => item.programa === perfil?.estudiante?.programa.tipo);
  const tramite = coincidencia?.[1];
  const compatible = tramite && (!seleccion || coincidencia?.[0] === seleccion);

  useEffect(() => {
    let activo = true;
    solicitudes.perfil().then((respuesta) => {
      if (!activo) return;
      setPerfil(respuesta.datos ?? null);
    });
    return () => { activo = false; };
  }, []);

  async function ejecutar(accion: () => Promise<void>) {
    setOcupado(true);
    setError("");
    setMensaje("");
    try { await accion(); }
    catch (problema) { setError(problema instanceof Error ? problema.message : "El servicio no está disponible."); }
    finally { setOcupado(false); }
  }

  function ingresar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    void ejecutar(async () => {
      const respuesta = await solicitudes.ingresar(String(datos.get("usuario")).trim(), String(datos.get("password")));
      if (!respuesta.datos) throw new Error(respuesta.error);
      setPerfil(respuesta.datos.usuario);
    });
  }

  function guardar(avanzar: boolean) {
    if (!compatible) return;
    void ejecutar(async () => {
      const respuesta = await solicitudes.crear(tramite.tipo);
      if (!respuesta.datos) throw new Error(respuesta.error);
      setSolicitud(respuesta.datos);
      if (avanzar) setPaso(1);
      else setMensaje("Borrador guardado.");
    });
  }

  return (
    <section className={styles.panel} aria-busy={ocupado}>
      <h2>{perfil ? "Asistente de solicitud" : "Acceso a la solicitud"}</h2>
      {error && <p role="alert">{error}</p>}
      {mensaje && <p role="status">{mensaje}</p>}
      {perfil === undefined && <p role="status">Comprobando la sesión…</p>}
      {perfil === null && (
        <form onSubmit={ingresar} className={styles.formulario}>
          <p>Ingresa con una cuenta de estudiante de SIGEP.</p>
          <label>DNI o correo personal registrado<input name="usuario" autoComplete="username" required /></label>
          <label>Contraseña<input name="password" type="password" autoComplete="current-password" required /></label>
          <button type="submit" disabled={ocupado}>{ocupado ? "Verificando…" : "Ingresar"}</button>
        </form>
      )}
      {perfil && !compatible && (
        <p role="status">{tramite ? "El trámite seleccionado no corresponde a tu programa académico." : "Tu cuenta no tiene un programa académico habilitado para estos trámites."}</p>
      )}
      {perfil && compatible && !solicitud?.presentadoEn && (
        <>
          <ol className={styles.etapas}>{pasos.map((nombre, indice) => (
            <li key={nombre} aria-current={paso === indice ? "step" : undefined}>{nombre}</li>
          ))}</ol>
          <h3>{pasos[paso]}</h3>
          {paso === 0 && (
            <>
              <dl className={styles.datos}>
                <div><dt>Código universitario</dt><dd>{perfil.estudiante?.codigoUniv}</dd></div>
                <div><dt>Nombres y apellidos</dt><dd>{perfil.nombres} {perfil.apellidos}</dd></div>
                <div><dt>Documento</dt><dd>{perfil.dni}</dd></div>
                <div><dt>Correo</dt><dd>{perfil.email}</dd></div>
                <div><dt>Programa</dt><dd>{perfil.estudiante?.programa.nombre}</dd></div>
                <div><dt>Trámite</dt><dd>{tramite.nombre}</dd></div>
              </dl>
              <button type="button" disabled={ocupado} onClick={() => guardar(true)}>Continuar o retomar borrador</button>
            </>
          )}
          {paso === 1 && (
            <ul className={styles.lista}>{solicitud?.validaciones.map(({ id, plantilla, estado, observacion }) => (
              <li key={id}><strong>{plantilla.nombre}</strong> · {estadoVisible(estado)}<p>{observacion ?? plantilla.descripcion}</p></li>
            ))}</ul>
          )}
          {paso === 2 && solicitud && (
            <div className={styles.formulario}>
              <p>Adjunta un PDF de hasta 10 MB por requisito documental.</p>
              {solicitud.validaciones.filter(({ plantilla }) => plantilla.tipo === "documental").map(({ plantilla }) => {
                const documento = solicitud.documentos.find((item) => item.tipoDoc === String(plantilla.id));
                return (
                  <div key={plantilla.id}>
                    <label>{plantilla.nombre} · {documento ? "Adjunto" : "Pendiente"}
                      <input type="file" accept="application/pdf" disabled={ocupado} onChange={(evento) => {
                        const archivo = evento.currentTarget.files?.[0];
                        evento.currentTarget.value = "";
                        if (archivo) void ejecutar(async () => setSolicitud(await cargarDocumento(solicitud.id, plantilla.id, archivo)));
                      }} />
                    </label>
                    {documento && <div className={styles.controles}>
                      <button type="button" disabled={ocupado} onClick={() => ejecutar(() => descargarDocumento(solicitud.id, documento.id, false, true))}>Visualizar PDF</button>
                      <button type="button" disabled={ocupado} onClick={() => ejecutar(() => descargarDocumento(solicitud.id, documento.id))}>Descargar para revisar</button>
                    </div>}
                  </div>
                );
              })}
            </div>
          )}
          {paso === 3 && solicitud && (
            <>
              <p>{perfil.nombres} {perfil.apellidos} · {tramite.nombre} · {solicitud.programa.nombre}</p>
              <p>Documentos adjuntos: {solicitud.documentos.length}.</p>
              <button type="button" disabled={ocupado} onClick={() => ejecutar(async () => {
                const respuesta = await solicitudes.presentar(solicitud.id);
                if (!respuesta.datos) throw new Error(respuesta.error);
                setSolicitud(respuesta.datos);
              })}>Presentar solicitud</button>
            </>
          )}
          <div className={styles.controles}>
            {paso > 0 && <button type="button" disabled={ocupado} onClick={() => setPaso(paso - 1)}>Anterior</button>}
            {paso > 0 && paso < 3 && <button type="button" disabled={ocupado} onClick={() => setPaso(paso + 1)}>Siguiente</button>}
            <button type="button" disabled={ocupado} onClick={() => guardar(false)}>Guardar borrador</button>
          </div>
        </>
      )}
      {solicitud?.presentadoEn && (
        <p role="status">Solicitud presentada. Expediente <strong>{solicitud.codigo}</strong>. <Link href="/mis-tramites/expedientes">Consultar expediente</Link></p>
      )}
    </section>
  );
}
