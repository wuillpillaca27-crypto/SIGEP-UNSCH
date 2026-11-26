import Link from "next/link";
import { Suspense } from "react";
import AsistenteCertificacion from "./asistente";
import { SelloPosgrado } from "../../grados-titulos/orientacion";
import { certificaciones, esCertificacion } from "../../grados-titulos/tramites";
import styles from "../../grados-titulos/orientacion.module.css";

type Props = { searchParams: Promise<{ tramite?: string | string[] }> };

export default function Pagina(props: Props) {
  return <Suspense fallback={<main className={styles.pagina}>Cargando solicitud…</main>}><Contenido {...props} /></Suspense>;
}

async function Contenido({ searchParams }: Props) {
  const { tramite } = await searchParams;
  const seleccion = typeof tramite === "string" && esCertificacion(tramite) ? tramite : undefined;
  return (
    <main className={styles.pagina}>
      <nav className={styles.ruta} aria-label="Ruta de navegación">
        <Link href="/">Inicio</Link><span aria-hidden="true">/</span>
        <Link href="/certificaciones">Certificaciones</Link><span aria-hidden="true">/</span>
        <span aria-current="page">Iniciar solicitud</span>
      </nav>
      <header className={styles.hero}>
        <SelloPosgrado />
        <h1>Solicitar una certificación</h1>
        {seleccion && <p>{certificaciones[seleccion].nombre}</p>}
        <div className={styles.acciones}><Link href="/certificaciones/requisitos">Consultar requisitos</Link></div>
      </header>
      <AsistenteCertificacion seleccion={seleccion} />
    </main>
  );
}
