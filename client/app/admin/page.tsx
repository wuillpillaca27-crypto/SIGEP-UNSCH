import ReportesPanel from "./reportes-panel";
import Link from "next/link";
import styles from "../grados-titulos/orientacion.module.css";

export default function Pagina() {
  return <><div className={styles.pagina}><Link href="/admin/orientacion">Atender consultas de orientación</Link></div>
    <ReportesPanel titulo="Resumen de la Escuela de Posgrado" /></>;
}
