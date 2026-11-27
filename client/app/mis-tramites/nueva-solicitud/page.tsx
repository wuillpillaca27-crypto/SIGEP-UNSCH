"use client";

import Link from "next/link";
import { SelloPosgrado } from "../../grados-titulos/orientacion";
import styles from "../../grados-titulos/orientacion.module.css";
import ProgramasAcademicos from "../programas/programas";

export default function Page() {
  return (
    <main className={styles.pagina}>
      <nav className={styles.ruta} aria-label="Ruta de navegación">
        <Link href="/mis-tramites">Mis Trámites</Link><span aria-hidden="true">/</span><span aria-current="page">Nueva solicitud</span>
      </nav>
      <header className={styles.hero}>
        <SelloPosgrado />
        <h1>Nueva Solicitud</h1>
        <p>Elige el programa académico correspondiente al trámite.</p>
      </header>
      <ProgramasAcademicos />
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
