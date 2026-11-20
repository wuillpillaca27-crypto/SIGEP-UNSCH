"use client";

import Link from "next/link";
import { useContext } from "react";
import { SelloPosgrado } from "../../grados-titulos/orientacion";
import styles from "../../grados-titulos/orientacion.module.css";
import { esCertificacion, tramitesAcademicos } from "../../grados-titulos/tramites";
import { PerfilEstudiante } from "../sesion";

export default function Page() {
  const perfil = useContext(PerfilEstudiante);
  const programa = perfil?.estudiante?.programa;
  const tramite = Object.entries(tramitesAcademicos).find(([, datos]) => datos.programa === programa?.tipo);
  const categoria = tramite && esCertificacion(tramite[0]) ? "/certificaciones" : "/grados-titulos";
  return (
    <main className={styles.pagina}>
      <nav className={styles.ruta} aria-label="Ruta de navegación">
        <Link href="/mis-tramites">Mis Trámites</Link><span aria-hidden="true">/</span><span aria-current="page">Nueva solicitud</span>
      </nav>
      <header className={styles.hero}>
        <SelloPosgrado />
        <h1>Nueva Solicitud</h1>
        {tramite ? <p>{programa?.nombre} · {tramite[1].nombre}</p> : <p>Consulta las modalidades disponibles.</p>}
        {tramite && <div className={styles.acciones}>
          <Link href={`${categoria}/iniciar-solicitud?tramite=${tramite[0]}`}>Iniciar solicitud de mi programa</Link>
        </div>}
      </header>
      <div className={styles.campos}>
        <section className={styles.panel}>
          <h2><Link href="/grados-titulos">Grados y Títulos</Link></h2>
          <p>Maestro, Doctor o Segunda Especialidad.</p>
        </section>
        <section className={styles.panel}>
          <h2><Link href="/certificaciones">Certificaciones</Link></h2>
          <p>Certificado de diplomado o por módulos.</p>
        </section>
      </div>
    </main>
  );
}
