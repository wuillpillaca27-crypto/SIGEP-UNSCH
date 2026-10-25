import Image from "next/image";

const accesos = [
  "Estudiantes",
  "Docentes",
  "Administradores",
  "Nueva solicitud",
  "Seguimiento",
  "Reportes y auditoría",
];

const avisos = [
  { categoria: "[CATEGORÍA]", titulo: "[Título del aviso institucional]" },
  { categoria: "[CATEGORÍA]", titulo: "[Título del aviso institucional]" },
  { categoria: "[CATEGORÍA]", titulo: "[Título del aviso institucional]" },
];

export default function Home() {
  return (
    <>
      <header className="header">
        <div className="brand">
          <Image src="/escudo-unsch.png" alt="Escudo de la UNSCH" width={64} height={84} priority />
          <div className="brand-text">
            <div className="brand-title serif">SIGEP</div>
            <div className="brand-sub">UNIVERSIDAD NACIONAL DE SAN CRISTÓBAL DE HUAMANGA</div>
          </div>
        </div>
        <nav className="nav">
          <a href="#">TRÁMITES</a>
          <a href="#">SOLICITUDES</a>
          <a href="#">SEGUIMIENTO</a>
          <a href="#">REPORTES</a>
          <a href="#">AYUDA</a>
          <a href="#" className="cta">INGRESAR</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-tag">SISTEMA INSTITUCIONAL</div>
        <h1 className="serif">Gestión de procesos académicos y administrativos</h1>
        <div className="hero-line" />
        <p>Inicie, siga y consulte el estado de sus solicitudes con sus credenciales institucionales.</p>
        <div className="btns">
          <a className="btn btn-rojo" href="#">INICIAR SESIÓN</a>
          <a className="btn btn-borde" href="#">CONSULTAR MI TRÁMITE</a>
        </div>
      </section>

      <section className="section">
        <h2>EXPLORAR</h2>
        <div className="tiles">
          {accesos.map((nombre) => (
            <a key={nombre} className="tile" href="#">
              <div className="img" />
              <div className="lbl">{nombre}</div>
            </a>
          ))}
        </div>
      </section>

      <section className="section blanca">
        <h2>AVISOS</h2>
        <div className="cards">
          {avisos.map((a, i) => (
            <a key={i} className="card" href="#">
              <div className="img" />
              <div className="card-body">
                <div className="card-cat">{a.categoria}</div>
                <div className="card-title serif">{a.titulo}</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <footer className="footer">© UNSCH · Ayacucho, Perú · SIGEP-UNSCH</footer>
    </>
  );
}