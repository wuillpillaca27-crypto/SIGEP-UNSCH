import Link from "next/link";
import LayoutPublico from "../components/LayoutPublico";

export default function InformacionDelPortal() {
  return (
    <LayoutPublico>
      <main className="pub-secciones">
        <h1 className="serif">Información del portal SIGEP-UNSCH</h1>
        <section id="privacidad" className="pub-seccion">
          <h2>Privacidad</h2>
          <p>El acceso a solicitudes y expedientes personales requiere una cuenta. El portal utiliza una cookie de sesión para mantener ese acceso. La verificación pública por código muestra datos del documento emitido y excluye los datos personales.</p>
          <p>Para consultas sobre el tratamiento de datos, contacta con la Escuela de Posgrado a través de su sitio oficial.</p>
          <a href="https://posgrado.unsch.edu.pe/">Escuela de Posgrado</a>
        </section>
        <section id="uso" className="pub-seccion">
          <h2>Términos de uso</h2>
          <p>Usa tu propia cuenta y adjunta únicamente los documentos requeridos para tu trámite. La Escuela de Posgrado revisa la solicitud y comunica el estado mediante Mis Trámites.</p>
          <p>Esta información describe el uso del portal. Consulta a la Escuela de Posgrado para obtener los términos institucionales aplicables.</p>
          <Link href="/ayuda">Ayuda y contacto</Link>
        </section>
      </main>
    </LayoutPublico>
  );
}
