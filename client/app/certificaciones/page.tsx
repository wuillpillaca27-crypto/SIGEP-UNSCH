import Link from "next/link";
import { SelloPosgrado } from "../grados-titulos/orientacion";
import styles from "../grados-titulos/orientacion.module.css";

const enlaces = [
  ["diplomados", "Diplomados de Posgrado", "Consulta el catálogo y solicita el certificado de tu diplomado."],
  ["modulos", "Certificaciones por Módulos", "Consulta los programas habilitados y presenta tu solicitud."],
  ["requisitos", "Requisitos de Certificación", "Revisa los requisitos y documentos publicados para tu programa."],
  ["programas", "Programas y Procedimientos", "Encuentra tu programa y conoce las etapas de la solicitud."],
];

export default function CertificacionesPage() {
  return (
    <main className={styles.pagina}>
      <nav className={styles.ruta} aria-label="Ruta de navegación">
        <Link href="/">Inicio</Link><span aria-hidden="true">/</span>
        <span aria-current="page">Certificaciones</span>
      </nav>
      <header className={styles.hero}>
        <SelloPosgrado />
        <h1>Certificaciones</h1>
        <p>Consulta los programas de posgrado, prepara tus documentos y sigue el estado de tu solicitud.</p>
        <div className={styles.acciones}>
          <Link href="/certificaciones/iniciar-solicitud">Iniciar solicitud</Link>
          <Link href="/mis-tramites/expedientes">Consultar expediente</Link>
        </div>
      </header>
      <div className={styles.campos}>
        {enlaces.map(([ruta, titulo, descripcion]) => (
          <section key={ruta} id={ruta} className={styles.panel}>
            <h2><Link href={`/certificaciones/${ruta}`}>{titulo}</Link></h2>
            <p>{descripcion}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
