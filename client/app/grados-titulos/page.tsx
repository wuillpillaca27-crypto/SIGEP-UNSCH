// /grados-titulos — página pública informativa
export default function GradosTitulosPage() {
  return (
    <main className="pub-contenido">
      <div className="pub-hero-mini">
        <span className="eyebrow">ESCUELA DE POSGRADO · UNSCH</span>
        <h1 className="serif">Grados y Títulos</h1>
        <p>Información sobre los procedimientos para obtener grados académicos y títulos de segunda especialidad.</p>
      </div>

      <div className="pub-secciones">
        <section id="maestro" className="pub-seccion">
          <h2 className="serif">Grado de Maestro</h2>
          <p>El grado de Maestro se otorga al egresado de maestría que aprueba los requisitos académicos y administrativos establecidos por la Escuela de Posgrado de la UNSCH, incluyendo la sustentación de tesis o trabajo de investigación.</p>
          <div className="pub-info-pendiente">
            <InfoIcon />
            Los requisitos detallados se publicarán cuando el módulo de grados esté habilitado.
          </div>
        </section>

        <section id="doctor" className="pub-seccion">
          <h2 className="serif">Grado de Doctor</h2>
          <p>El grado de Doctor se otorga al egresado del programa doctoral que demuestra contribución original al conocimiento mediante la sustentación y aprobación de su tesis doctoral.</p>
          <div className="pub-info-pendiente">
            <InfoIcon />
            Los requisitos detallados se publicarán cuando el módulo de grados esté habilitado.
          </div>
        </section>

        <section id="segunda-especialidad" className="pub-seccion">
          <h2 className="serif">Título de Segunda Especialidad</h2>
          <p>El Título de Segunda Especialidad acredita la formación especializada en un área profesional, obtenido tras completar el programa correspondiente y cumplir los requisitos de titulación.</p>
          <div className="pub-info-pendiente">
            <InfoIcon />
            Los requisitos detallados se publicarán cuando el módulo de grados esté habilitado.
          </div>
        </section>

        <section id="requisitos" className="pub-seccion">
          <h2 className="serif">Requisitos y procedimientos</h2>
          <p>Los procedimientos de obtención de grados y títulos se realizan de forma presencial en la Oficina de Grados y Títulos de la Escuela de Posgrado, ubicada en el Campus Universitario de la UNSCH.</p>
          <div className="pub-requisitos-lista">
            <div className="pub-requisito-item">
              <span className="pub-requisito-num">1</span>
              <span>Cumplir los créditos y requisitos académicos del programa</span>
            </div>
            <div className="pub-requisito-item">
              <span className="pub-requisito-num">2</span>
              <span>Presentar solicitud en la Oficina de Grados y Títulos</span>
            </div>
            <div className="pub-requisito-item">
              <span className="pub-requisito-num">3</span>
              <span>Adjuntar los documentos requeridos según el tipo de grado</span>
            </div>
            <div className="pub-requisito-item">
              <span className="pub-requisito-num">4</span>
              <span>Pagar los aranceles universitarios correspondientes</span>
            </div>
            <div className="pub-requisito-item">
              <span className="pub-requisito-num">5</span>
              <span>Sustentar y aprobar la tesis o trabajo de investigación</span>
            </div>
          </div>
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
