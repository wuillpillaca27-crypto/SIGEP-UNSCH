// /ayuda — página de ayuda y contacto institucional
export default function AyudaPage() {
  return (
    <main className="pub-contenido">
      <div className="pub-hero-mini">
        <span className="eyebrow">ESCUELA DE POSGRADO · UNSCH</span>
        <h1 className="serif">Ayuda y Contacto</h1>
        <p>Información de contacto y preguntas frecuentes sobre el uso del sistema SIGEP-UNSCH.</p>
      </div>

      <div className="pub-secciones">
        <section className="pub-seccion">
          <h2 className="serif">Contacto institucional</h2>
          <div className="ayuda-contacto-grid">
            <div className="ayuda-contacto-item">
              <span className="ayuda-contacto-icono">📍</span>
              <div>
                <strong>Dirección</strong>
                <p>Portal Independencia N° 57, Ayacucho – Perú</p>
              </div>
            </div>
            <div className="ayuda-contacto-item">
              <span className="ayuda-contacto-icono">📞</span>
              <div>
                <strong>Teléfono</strong>
                <p>(066) 312510 – Anexo Escuela de Posgrado</p>
              </div>
            </div>
            <div className="ayuda-contacto-item">
              <span className="ayuda-contacto-icono">✉️</span>
              <div>
                <strong>Correo</strong>
                <p>posgrado@unsch.edu.pe</p>
              </div>
            </div>
            <div className="ayuda-contacto-item">
              <span className="ayuda-contacto-icono">🕐</span>
              <div>
                <strong>Horario de atención</strong>
                <p>Lunes a viernes: 8:00 a.m. – 1:00 p.m. / 2:00 p.m. – 5:00 p.m.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="pub-seccion">
          <h2 className="serif">Preguntas frecuentes</h2>
          <div className="ayuda-faq">
            {[
              { p: "¿Cómo inicio sesión en el sistema?", r: "Usa tu DNI o correo institucional (@unsch.edu.pe) junto con tu contraseña asignada por la Oficina de Posgrado. Haz clic en INGRESAR en la barra superior." },
              { p: "¿Olvidé mi contraseña, qué hago?", r: "En la pantalla de inicio de sesión encontrarás el enlace ¿Olvidaste tu contraseña? Ingresa tu correo institucional y recibirás instrucciones." },
              { p: "¿Cómo verifico la autenticidad de un documento?", r: "Ve a VERIFICAR DOCUMENTO en el menú principal, selecciona el tipo de documento e ingresa el código único que aparece en el documento físico." },
              { p: "¿Dónde puedo ver el estado de mi expediente?", r: "Inicia sesión y ve a MIS TRÁMITES → Estado de expediente. Encontrarás el estado actual y las observaciones de tu trámite." },
              { p: "¿Qué documentos necesito para iniciar un trámite?", r: "Los requisitos varían según el tipo de grado o certificación. Revisa la sección GRADOS Y TÍTULOS o CERTIFICACIONES para conocer los requisitos específicos." },
            ].map((faq, i) => (
              <details key={i} className="ayuda-faq-item">
                <summary className="ayuda-faq-pregunta">{faq.p}</summary>
                <p className="ayuda-faq-respuesta">{faq.r}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="pub-seccion">
          <h2 className="serif">Soporte técnico</h2>
          <p>Para problemas técnicos con el sistema SIGEP-UNSCH, comunícate con la Oficina de Tecnologías de la Información de la UNSCH o escribe a soporte-sigep@unsch.edu.pe indicando el problema encontrado y tu número de DNI.</p>
        </section>
      </div>
    </main>
  );
}
