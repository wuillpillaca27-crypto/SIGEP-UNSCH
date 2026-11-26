import Image from "next/image";
import Link from "next/link";
import styles from "./PortalAcademico.module.css";

const iconos = {
  grado: "m2 9 10-5 10 5-10 5zM6 11v6c3 3 9 3 12 0v-6m4-2v6",
  doctor: "M17 8a5 5 0 1 1-10 0 5 5 0 0 1 10 0ZM9 13l-2 7 5-2 5 2-2-7",
  libro: "M12 6v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2z",
  documento: "M5 3h10l4 4v14H5zM14 3v5h5M8 12h8m-8 4h8",
  lista: "M9 5H5v16h14V5h-4M9 3h6v4H9zM8 11h1m3 0h4m-8 4h1m3 0h4",
  escudo: "M12 2l8 4v6c0 5-4 8-8 10-4-2-8-5-8-10V6zM8 12l3 3 5-6",
  capas: "m2 7 10-5 10 5-10 5zm0 5 10 5 10-5M2 17l10 5 10-5",
  aviso: "M3 10v4h5l4 7h3l-3-7 8 4V6l-8 4zM3 10H2v4h1",
  buscar: "M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0zm-1 5 6 6",
  validar: "M20 12v8H4V4h12M8 12l3 3 9-10",
  seguimiento: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM8 12l3 3 5-6",
  instagram: "M3 3h18v18H3zM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0zm1-5h.1",
} as const;

function Icono({ nombre }: { nombre: keyof typeof iconos }) {
  return <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={iconos[nombre]} /></svg>;
}

const servicios = [
  ["grado", "Grado de Maestro", "Requisitos, procedimiento y solicitud del grado.", "/grados-titulos/maestro"],
  ["doctor", "Grado de Doctor", "Trámite para la obtención del grado doctoral.", "/grados-titulos/doctor"],
  ["libro", "Título de Segunda Especialidad", "Obtención del título de segunda especialidad.", "/grados-titulos/segunda-especialidad"],
  ["documento", "Certificaciones", "Consulta los programas y solicita tu certificado.", "/certificaciones"],
  ["lista", "Mis Trámites", "Consulta y seguimiento de tus solicitudes.", "/mis-tramites"],
  ["escudo", "Verificar Documento", "Consulta el código de un documento emitido.", "/verificar-documento"],
] as const;

const pasos = [
  ["buscar", "Consulta", "Revisa los requisitos del trámite.", "/grados-titulos/requisitos"],
  ["documento", "Solicita", "Presenta tu solicitud y documentos.", "/mis-tramites/nueva-solicitud"],
  ["validar", "Validación", "La Escuela de Posgrado revisa tu expediente.", null],
  ["seguimiento", "Seguimiento", "Consulta el estado de tu expediente.", "/mis-tramites/expedientes"],
] as const;

const comunicados = "https://posgrado.unsch.edu.pe/category/comunicado/";

export default function PortalAcademico({ oscuro, cambiarTema }: { oscuro: boolean; cambiarTema: () => void }) {
  return (
    <>
      <div className={styles.fondo}>
        <div className={styles.interior}>
          <section aria-labelledby="servicios-academicos">
            <div className={styles.intro}>
              <p className={styles.marca}>SIGEP-UNSCH</p>
              <h2 className="serif" id="servicios-academicos">Nuestros servicios académicos</h2>
              <p>Accede de forma rápida y segura a los principales servicios de la Escuela de Posgrado.</p>
            </div>
            <div className={styles.servicios}>
              {servicios.map(([icono, titulo, descripcion, ruta]) => (
                <Link className={styles.tarjeta} href={ruta} key={ruta}>
                  <span className={styles.iconoServicio}><Icono nombre={icono} /></span>
                  <h3>{titulo}</h3><p>{descripcion}</p>
                  <span className={styles.conocer}>Conocer más <span aria-hidden="true">→</span></span>
                </Link>
              ))}
            </div>
          </section>
          <div className={styles.paneles}>
            <section className={styles.panel} aria-labelledby="pasos-tramite">
              <div className={styles.tituloPanel}><Icono nombre="capas" /><h2 className="serif" id="pasos-tramite">Realiza tu trámite en 4 pasos</h2></div>
              <ol className={styles.pasos}>
                {pasos.map(([icono, titulo, descripcion, ruta], indice) => (
                  <li key={titulo}>
                    <div className={styles.pasoIconos}><span aria-hidden="true">{indice + 1}</span><div><Icono nombre={icono} /></div></div>
                    <h3>{ruta ? <Link href={ruta}>{titulo}</Link> : titulo}</h3>
                    <p>{descripcion}</p>
                    {indice < pasos.length - 1 && <span className={styles.flecha} aria-hidden="true">→</span>}
                  </li>
                ))}
              </ol>
            </section>
            <section className={styles.panel} aria-labelledby="avisos-comunicados">
              <div className={styles.cabeceraAvisos}>
                <div className={styles.tituloPanel}><Icono nombre="aviso" /><h2 className="serif" id="avisos-comunicados">Avisos y comunicados</h2></div>
                <a className={styles.verTodos} href={comunicados} aria-label="Ver todos los comunicados en el sitio oficial de Posgrado">Ver todos <span aria-hidden="true">→</span></a>
              </div>
              <p className={styles.avisoVacio}>Todavía no hay avisos publicados en SIGEP. Consulta los comunicados vigentes en el sitio oficial de la Escuela de Posgrado.</p>
            </section>
          </div>
        </div>
      </div>
      <footer className={styles.footer}>
        <svg className={styles.onda} aria-hidden="true" viewBox="0 0 1200 26" preserveAspectRatio="none"><path fill="#cb941d" d="M0 12c150-32 220 20 345 5 144-18 223-12 365-4 166 10 226-15 342-5 63 5 102 5 148-5v23H0z" /><path fill="#581d29" d="M0 20c150-32 220 20 345 5 144-18 223-12 365-4 166 10 226-15 342-5 63 5 102 5 148-5v15H0z" /></svg>
        <div className={styles.grupos}>
          <div className={styles.identidad}>
            <Image src="/escudo-unsch.png" alt="Escudo de la UNSCH" width={56} height={72} loading="eager" />
            <div><strong className="serif">SIGEP-<span>UNSCH</span></strong><p>Escuela de Posgrado</p><small>Sistema Integral de Gestión y Validación de Grados, Títulos y Certificaciones</small></div>
          </div>
          <nav aria-label="Enlaces de interés"><h2 className="serif">Enlaces de interés</h2>
            <a href="https://www.gob.pe/unsch">Portal institucional UNSCH</a>
            <a href="https://posgrado.unsch.edu.pe/">Escuela de Posgrado</a>
            <a href="https://enlinea2.unsch.edu.pe/new_transparencia/informacion-de-la-escuela-de-posgrado/">Reglamentos y resoluciones</a>
          </nav>
          <nav aria-label="Soporte y ayuda"><h2 className="serif">Soporte y ayuda</h2>
            <Link href="/ayuda">Ayuda con mi cuenta</Link>
            <a href="https://campus.unsch.edu.pe/recuperar-contrasena">Recuperar contraseña</a>
            <Link href="/verificar-documento">Verificar un documento</Link>
          </nav>
          <section><h2 className="serif">Contáctanos</h2><address>
            <a href="https://posgrado.unsch.edu.pe/">Av. Independencia s/n, Campus Universitario · Ayacucho</a>
            <a href="tel:+51955658258">955 658 258</a>
            <a href="mailto:posgrado@unsch.edu.pe">posgrado@unsch.edu.pe</a>
          </address></section>
          <nav aria-label="Redes sociales de la UNSCH"><h2 className="serif">Síguenos</h2>
            <div className={styles.redes}>
              <a href="https://www.facebook.com/unsch.oficial" aria-label="Facebook de la UNSCH">f</a>
              <a href="https://www.instagram.com/unsch.oficial/" aria-label="Instagram de la UNSCH"><Icono nombre="instagram" /></a>
            </div>
          </nav>
        </div>
        <div className={styles.franja}><div>
          <small>© SIGEP-UNSCH · Universidad Nacional de San Cristóbal de Huamanga. Todos los derechos reservados.</small>
          <nav aria-label="Información del portal">
            <Link href="/informacion-del-portal#privacidad">Privacidad</Link>
            <Link href="/informacion-del-portal#uso">Términos de uso</Link>
            <button type="button" onClick={() => document.querySelector<HTMLButtonElement>(".accessibility-trigger")?.click()}>Accesibilidad</button>
            <button type="button" onClick={cambiarTema}>{oscuro ? "Modo claro" : "Modo oscuro"}</button>
          </nav>
        </div></div>
      </footer>
    </>
  );
}
