"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { estadoVisible, solicitudes, type Matricula, type Solicitud } from "../../grados-titulos/solicitudes-api";
import { rutaSolicitud } from "../../grados-titulos/tramites";
import styles from "../../grados-titulos/orientacion.module.css";
import visual from "./programas.module.css";

const tipos: Record<string, string> = {
  maestria: "Maestría", doctorado: "Doctorado", segunda_especialidad: "Segunda Especialidad",
  diplomado: "Diplomado", certificacion_modulos: "Certificación por Módulos",
};
const motivos = {
  programa_inactivo: "Programa inactivo",
  matricula_no_habilitada: "Matrícula sin habilitación para solicitudes",
  tramite_deshabilitado: "Trámite deshabilitado",
  plantilla_no_publicada: "Plantilla sin publicar",
  sin_requisitos_activos: "Sin requisitos publicados",
};
const fecha = (valor: string) => new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(valor));

export default function ProgramasAcademicos() {
  const [matriculas, setMatriculas] = useState<Matricula[]>();
  const [expedientes, setExpedientes] = useState<Solicitud[]>([]);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    Promise.all([solicitudes.opciones(), solicitudes.listar()]).then(([oferta, registros]) => {
      if (!vigente) return;
      setMatriculas(oferta.datos?.matriculas);
      setExpedientes(registros.datos ?? []);
      setError(oferta.error ?? registros.error ?? (oferta.datos?.matriculas ? "" : "No se pudo consultar las matrículas."));
    });
    return () => { vigente = false; };
  }, [intento]);

  return <div className={visual.tarjetas}>
    {error && <section className={styles.panel}>
      <p role="alert">{error}</p>
      <button type="button" onClick={() => { setError(""); setIntento((previo) => previo + 1); }}>Volver a consultar</button>
    </section>}
    {!error && !matriculas && <p role="status">Consultando matrículas…</p>}
    {matriculas?.length === 0 && <section className={styles.panel}><p>Tu cuenta aún no tiene una matrícula académica asociada.</p>
      <Link href="/ayuda">Solicitar orientación</Link></section>}
    {matriculas?.map((matricula) => {
      const expediente = expedientes.find((item) => item.programa.id === matricula.id && item.presentadoEn);
      return <article key={matricula.matriculaId} className={`${styles.panel} ${visual.tarjeta}`}>
        <div className={visual.icono} aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="m2 9 10-5 10 5-10 5zM6 11v5c3 3 9 3 12 0v-5m4-2v6" />
          </svg>
        </div>
        <div className={visual.contenido}>
          <h2>{matricula.nombre}</h2>
          <p>{tipos[matricula.tipo] ?? estadoVisible(matricula.tipo)} · {estadoVisible(matricula.estadoAcad)}</p>
          <p>Matrícula {matricula.codigoUniv} · {fecha(matricula.fechaInicio)}{matricula.fechaFin && ` a ${fecha(matricula.fechaFin)}`}</p>
          {matricula.motivo && <p className={visual.estado}>{motivos[matricula.motivo]}</p>}
          {matricula.tramites.map((tramite) => <div key={tramite.clave}>
            <strong>{tramite.nombre}</strong>
            <details><summary>Requisitos publicados ({tramite.requisitos.length})</summary>
              <ul className={styles.lista}>{tramite.requisitos.map(({ id, nombre, descripcion, obligatorio }) => <li key={id}>
                <strong>{nombre}</strong> · {obligatorio ? "Obligatorio" : "Opcional"}<p>{descripcion}</p>
              </li>)}</ul>
            </details>
            <Link className={visual.accion} href={rutaSolicitud(tramite.clave, matricula.id)}>Iniciar solicitud</Link>
          </div>)}
          {expediente && <p><Link href={`/mis-tramites/expedientes#expediente-${expediente.id}`}>Consultar expediente</Link></p>}
        </div>
      </article>;
    })}
  </div>;
}
