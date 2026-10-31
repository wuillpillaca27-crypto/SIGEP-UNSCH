// /certificaciones — página pública informativa
export default function CertificacionesPage() {
  return (
    <main className="pub-contenido">
      <div className="pub-hero-mini">
        <span className="eyebrow">ESCUELA DE POSGRADO · UNSCH</span>
        <h1 className="serif">Certificaciones</h1>
        <p>Información sobre diplomados de posgrado y certificaciones por módulos ofrecidos por la Escuela de Posgrado.</p>
      </div>

      <div className="pub-secciones">
        <section id="diplomados" className="pub-seccion">
          <h2 className="serif">Diplomados de Posgrado</h2>
          <p>Los diplomados son programas de formación continua de corta duración que permiten la actualización y especialización en áreas específicas del conocimiento. Al concluir satisfactoriamente el programa se otorga un certificado de diplomado.</p>
          <div className="pub-info-pendiente">
            <InfoIcon />
            El catálogo de diplomados vigentes se publicará próximamente.
          </div>
        </section>

        <section id="modulos" className="pub-seccion">
          <h2 className="serif">Certificaciones por Módulos</h2>
          <p>Las certificaciones por módulos permiten acreditar competencias específicas mediante la aprobación de módulos independientes. Cada módulo aprobado genera un certificado individual.</p>
          <div className="pub-info-pendiente">
            <InfoIcon />
            El catálogo de módulos vigentes se publicará próximamente.
          </div>
        </section>

        <section id="requisitos" className="pub-seccion">
          <h2 className="serif">Requisitos de certificación</h2>
          <div className="pub-requisitos-lista">
            <div className="pub-requisito-item">
              <span className="pub-requisito-num">1</span>
              <span>Estar matriculado en el programa de diplomado o módulo</span>
            </div>
            <div className="pub-requisito-item">
              <span className="pub-requisito-num">2</span>
              <span>Cumplir con la asistencia mínima requerida</span>
            </div>
            <div className="pub-requisito-item">
              <span className="pub-requisito-num">3</span>
              <span>Aprobar las evaluaciones del programa</span>
            </div>
            <div className="pub-requisito-item">
              <span className="pub-requisito-num">4</span>
              <span>Solicitar la emisión del certificado en la Oficina de Posgrado</span>
            </div>
          </div>
        </section>

        <section id="programas" className="pub-seccion">
          <h2 className="serif">Programas y procedimientos</h2>
          <p>Los programas de diplomados y certificaciones son ofrecidos por las distintas Unidades de Posgrado de la UNSCH. Para información sobre programas disponibles, horarios e inscripciones, comuníquese con la Escuela de Posgrado.</p>
          <a href="/mis-tramites/nueva-solicitud" className="pub-btn-accion">
            Iniciar solicitud →
          </a>
        </section>
      </div>
    </main>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}
