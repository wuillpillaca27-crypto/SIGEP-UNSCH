"use client";

import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { solicitudes, type Solicitud } from "../grados-titulos/solicitudes-api";
import { SelloPosgrado } from "../grados-titulos/orientacion";
import { PerfilEstudiante } from "./sesion";
import styles from "../grados-titulos/orientacion.module.css";

const opciones = [
  ["nueva-solicitud", "Nueva solicitud", "Elige un grado, título o certificación."],
  ["solicitudes", "Mis solicitudes", "Revisa tus solicitudes y retoma un borrador."],
  ["expedientes", "Estado de expediente", "Consulta el estado y los documentos de los trámites presentados."],
  ["observaciones", "Observaciones pendientes", "Identifica los requisitos que debes corregir."],
  ["subsanacion", "Subsanar documentos", "Adjunta los archivos corregidos y envíalos a revisión."],
  ["historial", "Historial de trámites", "Consulta los movimientos y las fechas de tus expedientes."],
];

export default function MisTramites() {
  const perfil = useContext(PerfilEstudiante);
  const [lista, setLista] = useState<Solicitud[]>();
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    solicitudes.listar().then((respuesta) => {
      if (!vigente) return;
      setLista(respuesta.datos);
      if (!respuesta.ok) setError(respuesta.error ?? "No se pudo cargar el resumen.");
    });
    return () => { vigente = false; };
  }, [intento]);

  return (
    <main className={styles.pagina}>
      <header className={styles.hero}>
        <SelloPosgrado />
        <h1>Mis Trámites</h1>
        <p>{perfil?.nombres} {perfil?.apellidos} · {perfil?.estudiante?.programa.nombre}</p>
        <div className={styles.acciones}><Link href="/mis-tramites/nueva-solicitud">Nueva solicitud</Link></div>
      </header>
      {error && <div className={styles.panel}>
        <p role="alert">{error}</p>
        <button type="button" onClick={() => { setError(""); setIntento(intento + 1); }}>Reintentar resumen</button>
      </div>}
      {!lista && !error && <p role="status">Consultando el resumen…</p>}
      {lista && (
        <div className={styles.tarjetas}>
          {[
            ["solicitudes", "Borradores", lista.filter(({ estado }) => estado === "borrador").length],
            ["expedientes", "Presentados", lista.filter(({ presentadoEn }) => presentadoEn).length],
            ["observaciones", "Observados", lista.filter(({ estado }) => estado === "observado").length],
          ].map(([ruta, titulo, total]) => (
            <Link className={styles.tarjeta} key={ruta} href={`/mis-tramites/${ruta}`}><strong>{total}</strong><span>{titulo}</span></Link>
          ))}
        </div>
      )}
      <div className={styles.campos}>
        {opciones.map(([ruta, titulo, descripcion]) => (
          <section className={styles.panel} key={ruta}>
            <h2><Link href={`/mis-tramites/${ruta}`}>{titulo}</Link></h2>
            <p>{descripcion}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
