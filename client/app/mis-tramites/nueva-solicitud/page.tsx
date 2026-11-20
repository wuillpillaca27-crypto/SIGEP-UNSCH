import Link from "next/link";

export default function Page() {
  return (
    <main className="pub-contenido">
      <div className="pub-hero-mini">
        <span className="eyebrow">MIS TRÁMITES</span>
        <h1 className="serif">Nueva Solicitud</h1>
        <p>Selecciona el trámite que deseas iniciar.</p>
      </div>
      <div className="pub-secciones">
        <div className="pub-seccion">
          <p><Link href="/grados-titulos/iniciar-solicitud" className="pub-btn-accion">Solicitar un grado o título</Link></p>
          <p><Link href="/certificaciones/iniciar-solicitud" className="pub-btn-accion">Solicitar una certificación</Link></p>
          <Link href="/mis-tramites" className="pub-btn-volver">← Volver a Mis Trámites</Link>
        </div>
      </div>
    </main>
  );
}
