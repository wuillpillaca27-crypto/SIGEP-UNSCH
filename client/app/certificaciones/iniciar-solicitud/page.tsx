import Link from "next/link";
import { Suspense } from "react";
import Asistente from "../../grados-titulos/iniciar-solicitud/asistente";
import { SelloPosgrado } from "../../grados-titulos/orientacion";
import { certificaciones, esCertificacion } from "../../grados-titulos/tramites";
import styles from "../../grados-titulos/orientacion.module.css";

type Props = { searchParams: Promise<{ tramite?: string | string[]; programa?: string | string[] }> };

export default function Pagina(props: Props) {
  return <Suspense fallback={<main className={styles.pagina}>Cargando solicitud…</main>}><Contenido {...props} /></Suspense>;
}

async function Contenido({ searchParams }: Props) {
  const { tramite, programa } = await searchParams;
  const programaInicial = typeof programa === "string" && /^[1-9]\d{0,9}$/.test(programa) ? programa : undefined;
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
        <div className={styles.acciones}>
          <Link href={seleccion ? `/certificaciones/${seleccion}#requisitos` : "/certificaciones/requisitos"}>Consultar requisitos</Link>
        </div>
      </header>
      <Asistente key={`${seleccion ?? "certificaciones"}/${programaInicial ?? ""}`} seleccion={seleccion} programaInicial={programaInicial} certificaciones />
    </main>
  );
}
