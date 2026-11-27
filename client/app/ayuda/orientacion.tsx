"use client";

import { useState, type FormEvent } from "react";
import { api } from "../lib/api";
import { tramitesAcademicos } from "../grados-titulos/tramites";
import styles from "../grados-titulos/orientacion.module.css";

type Consulta = { codigo: string; respuesta?: string | null };

export default function Orientacion() {
  const [registrada, setRegistrada] = useState("");
  const [resultado, setResultado] = useState<string>();
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>, seguimiento = false) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    setOcupado(true);
    setError("");
    setResultado(undefined);
    try {
      const respuesta = await api.post<Consulta>(seguimiento ? "/orientacion/consultar" : "/orientacion", Object.fromEntries(new FormData(formulario)));
      if (!respuesta.datos) setError(respuesta.error ?? "No se pudo procesar la consulta.");
      else if (seguimiento) setResultado(respuesta.datos.respuesta ?? "La consulta está pendiente de respuesta.");
      else { setRegistrada(respuesta.datos.codigo); formulario.reset(); }
    } finally { setOcupado(false); }
  }

  return <section className="pub-seccion" id="orientacion">
    <h2 className="serif">Solicitar orientación</h2>
    <p>Guarda el código de atención para consultar la respuesta con el mismo correo. Nunca incluyas tu contraseña.</p>
    {error && <p role="alert">{error}</p>}
    {registrada && <p role="status">Consulta registrada. Código de atención <strong>{registrada}</strong>.</p>}
    <form className={styles.formulario} onSubmit={enviar}>
      <label>Nombres y apellidos<input name="nombres" autoComplete="name" required maxLength={160} /></label>
      <label>Correo electrónico<input name="correo" type="email" autoComplete="email" required maxLength={254} /></label>
      <label>Tipo de trámite<select name="tipoTramite">
        <option value="">Consulta general</option>
        {Object.values(tramitesAcademicos).map((tramite) => <option key={tramite.tipo} value={tramite.tipo}>{tramite.nombre}</option>)}
      </select></label>
      <label>Programa académico<input name="programa" maxLength={160} /></label>
      <label>Asunto<input name="asunto" required maxLength={180} /></label>
      <label>Descripción<textarea name="descripcion" required maxLength={3000} rows={4} /></label>
      <button className="btn btn-rojo" disabled={ocupado}>Registrar consulta</button>
    </form>
    <h3>Consultar respuesta</h3>
    <form className={styles.formulario} onSubmit={(evento) => enviar(evento, true)}>
      <label>Código de atención<input key={registrada} name="codigo" defaultValue={registrada} required maxLength={36} /></label>
      <label>Correo de la consulta<input name="correo" type="email" required maxLength={254} /></label>
      <button className="btn btn-rojo" disabled={ocupado}>Consultar respuesta</button>
    </form>
    {resultado && <p role="status" style={{ whiteSpace: "pre-wrap" }}>{resultado}</p>}
  </section>;
}
