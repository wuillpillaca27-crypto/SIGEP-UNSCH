import Link from "next/link";
import { SelloPosgrado } from "../../grados-titulos/orientacion";
import styles from "../../grados-titulos/orientacion.module.css";
import ProgramasAcademicos from "./programas";

export default function Pagina() {
  return <main className={styles.pagina}>
    <nav className={styles.ruta} aria-label="Ruta de navegación">
      <Link href="/mis-tramites">Mis Trámites</Link><span aria-hidden="true">/</span><span aria-current="page">Mis programas académicos</span>
    </nav>
    <header className={styles.hero}>
      <SelloPosgrado />
      <h1>Mis programas académicos</h1>
      <p>Consulta tus matrículas, los requisitos publicados y los expedientes de cada programa.</p>
    </header>
    <ProgramasAcademicos />
  </main>;
}
