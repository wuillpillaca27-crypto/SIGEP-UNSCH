import Link from "next/link";
import { Suspense } from "react";
import { esTramite, tramites } from "../tramites";
import styles from "../orientacion.module.css";
import Asistente from "./asistente";
import { SelloPosgrado } from "../orientacion";

type Parametros = Promise<{ tramite?: string | string[] }>;

export default function IniciarSolicitud({ searchParams }: { searchParams: Parametros }) {
  return <Suspense fallback={<main className={styles.pagina}>Cargando solicitud…</main>}>
    <Contenido searchParams={searchParams} />
  </Suspense>;
}

async function Contenido({
  searchParams,
}: {
  searchParams: Parametros;
}) {
  const { tramite } = await searchParams;
  const seleccion = typeof tramite === "string" && esTramite(tramite) ? tramite : undefined;

  return (
    <main className={styles.pagina}>
      <nav aria-label="Ruta de navegación" className={styles.ruta}>
        <Link href="/">Inicio</Link><span aria-hidden="true">/</span>
        <Link href="/grados-titulos">Grados y Títulos</Link><span aria-hidden="true">/</span>
        <span aria-current="page">Iniciar solicitud</span>
      </nav>
      <header className={styles.hero}>
        <SelloPosgrado />
        <h1 className="serif">Iniciar solicitud</h1>
        {seleccion && <p>{tramites[seleccion].nombre}</p>}
        <div className={styles.acciones}>
          <Link href="/grados-titulos/requisitos">Consultar requisitos</Link>
          <Link href="/ayuda">Solicitar orientación</Link>
        </div>
      </header>
      <Asistente seleccion={seleccion} />
    </main>
  );
}
