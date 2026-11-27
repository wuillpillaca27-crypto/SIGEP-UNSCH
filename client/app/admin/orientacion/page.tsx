"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "../../lib/api";
import styles from "../../grados-titulos/orientacion.module.css";

type Consulta = {
  id: number; codigo: string; asunto: string; descripcion: string; nombres: string; correo: string;
  programa: string; tipoTramite: string | null; respuesta: string | null;
};
type Pagina = { datos: Consulta[]; siguiente: boolean };

export default function OrientacionAdmin() {
  const [pagina, setPagina] = useState(1);
  const [revision, setRevision] = useState(0);
  const [resultado, setResultado] = useState<Pagina>();
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    let vigente = true;
    api.get<Pagina>(`/atencion-orientacion?pagina=${pagina}`).then((respuesta) => {
      if (!vigente) return;
      setResultado(respuesta.datos);
      setError(respuesta.error ?? "");
    });
    return () => { vigente = false; };
  }, [pagina, revision]);

  async function responder(evento: FormEvent<HTMLFormElement>, id: number) {
    evento.preventDefault();
    setOcupado(true);
    try {
      const respuesta = await api.patch(`/atencion-orientacion/${id}/respuesta`, Object.fromEntries(new FormData(evento.currentTarget)));
      if (respuesta.ok) setRevision((previa) => previa + 1);
      else setError(respuesta.error ?? "No se pudo guardar la respuesta.");
    } finally { setOcupado(false); }
  }

  return <main className={styles.pagina}>
    <Link href="/admin">Volver al panel administrativo</Link>
    <h1>Consultas de orientación</h1>
    {error && <p role="alert">{error}</p>}
    {!resultado && !error && <p role="status">Consultando solicitudes de orientación…</p>}
    {resultado?.datos.length === 0 && <p>No hay consultas en esta página.</p>}
    {resultado?.datos.map((consulta) => <section className={styles.panel} key={consulta.id}>
      <h2>{consulta.asunto}</h2>
      <p>{consulta.codigo} · {consulta.nombres} · {consulta.correo}</p>
      <p>{[consulta.programa, consulta.tipoTramite?.replaceAll("_", " ")].filter(Boolean).join(" · ")}</p>
      <p style={{ whiteSpace: "pre-wrap" }}>{consulta.descripcion}</p>
      {consulta.respuesta ? <p style={{ whiteSpace: "pre-wrap" }}><strong>Respuesta registrada</strong> · {consulta.respuesta}</p>
        : <form className={styles.formulario} onSubmit={(evento) => responder(evento, consulta.id)}>
          <label>Respuesta<textarea name="respuesta" required rows={4} maxLength={3000} /></label>
          <button disabled={ocupado}>Publicar respuesta</button>
        </form>}
    </section>)}
    <div className={styles.controles}>
      <button type="button" disabled={pagina === 1 || ocupado} onClick={() => setPagina(pagina - 1)}>Anterior</button>
      <button type="button" disabled={!resultado?.siguiente || ocupado} onClick={() => setPagina(pagina + 1)}>Siguiente</button>
    </div>
  </main>;
}
