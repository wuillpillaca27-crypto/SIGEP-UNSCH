"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import AccesibilidadWidget from "./components/AccesibilidadWidget";
import NavbarPublica from "./components/NavbarPublica";

const accesos = [
  { label: "Estudiantes",          href: "/mis-tramites" },
  { label: "Docentes",             href: "/mis-tramites" },
  { label: "Administradores",      href: "/login" },
  { label: "Nueva solicitud",      href: "/mis-tramites/nueva-solicitud" },
  { label: "Seguimiento",          href: "/mis-tramites/expedientes" },
  { label: "Reportes y auditoría", href: "/login" },
];

const avisos = [
  { categoria: "[CATEGORÍA]", titulo: "[Título del aviso institucional]" },
  { categoria: "[CATEGORÍA]", titulo: "[Título del aviso institucional]" },
  { categoria: "[CATEGORÍA]", titulo: "[Título del aviso institucional]" },
];

export default function Home() {
  const [oscuro, setOscuro] = useState(false);
  const [mostrarVolverArriba, setMostrarVolverArriba] = useState(false);

  useEffect(() => {
    const guardado = localStorage.getItem("sigep-tema");
    if (guardado === "oscuro") setOscuro(true);
  }, []);

  useEffect(() => {
    const actualizarBoton = () => setMostrarVolverArriba(window.scrollY > 320);
    window.addEventListener("scroll", actualizarBoton, { passive: true });
    actualizarBoton();
    return () => window.removeEventListener("scroll", actualizarBoton);
  }, []);

  function toggleTema() {
    setOscuro((prev) => {
      const nuevo = !prev;
      localStorage.setItem("sigep-tema", nuevo ? "oscuro" : "claro");
      return nuevo;
    });
  }

  return (
    <div className={`pagina-inicio ${oscuro ? "tema-oscuro" : ""}`}>

      {/* ── Header con nueva navbar ─────────────────── */}
      <NavbarPublica oscuro={oscuro} onToggleTema={toggleTema} />

      {/* ── Hero ───────────────────────────────────── */}
      <section className="hero">
        <div className="hero-institution" aria-label="Escuela de Posgrado">
          <Image
            src="/escudo-unsch.png"
            alt="Escudo de la UNSCH"
            width={92}
            height={120}
          />
          <span>ESCUELA DE<br /><strong>POSGRADO</strong></span>
        </div>
        <div className="hero-tag">SISTEMA INSTITUCIONAL</div>
        <h1 className="serif">
          Gestión de procesos académicos y administrativos
        </h1>
        <div className="hero-line" />
        <p>
          Inicie, siga y consulte el estado de sus solicitudes con sus
          credenciales institucionales.
        </p>
        <aside className="social-bar" aria-label="Redes sociales">
          <a className="social-link facebook"   href="#" aria-label="Facebook"  title="Facebook">f</a>
          <a className="social-link youtube"    href="#" aria-label="YouTube"   title="YouTube">▶</a>
          <a className="social-link instagram"  href="#" aria-label="Instagram" title="Instagram">◎</a>
          <a className="social-link tiktok"     href="#" aria-label="TikTok"    title="TikTok">♪</a>
          <a className="social-link linkedin"   href="#" aria-label="LinkedIn"  title="LinkedIn">in</a>
        </aside>
        <button
          className={`back-to-top ${mostrarVolverArriba ? "back-to-top-visible" : ""}`}
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Volver arriba"
          title="Volver arriba"
        >
          ↑
        </button>
        <div className="btns">
          <a className="btn btn-rojo" href="/login">INICIAR SESIÓN</a>
          <a className="btn btn-borde" href="/verificar-documento">CONSULTAR MI TRÁMITE</a>
        </div>
      </section>

      {/* ── Rector ─────────────────────────────────── */}
      <section className="rector-section" aria-labelledby="rector-title">
        <div className="rector-content">
          <div className="rector-copy">
            <div className="rector-eyebrow">AUTORIDADES UNIVERSITARIAS</div>
            <h2 id="rector-title" className="serif">Dr. Emilio Ramírez Roca</h2>
            <div className="rector-role">RECTOR</div>
            <p>
              Comprometidos con una gestión cercana, transparente y orientada
              al desarrollo académico de nuestra comunidad universitaria.
            </p>
          </div>
          <Image
            className="rector-photo"
            src="/rector-emilio-ramirez-roca-sin-fondo.png"
            alt="Dr. Emilio Ramírez Roca, Rector de la Universidad Nacional de San Cristóbal de Huamanga"
            width={360}
            height={610}
          />
        </div>
      </section>

      {/* ── Explorar ───────────────────────────────── */}
      <section className="section">
        <h2>EXPLORAR</h2>
        <div className="tiles">
          {accesos.map((acc) => (
            <a key={acc.label} className="tile" href={acc.href}>
              <div className="img" />
              <div className="lbl">{acc.label}</div>
            </a>
          ))}
        </div>
      </section>

      {/* ── Avisos ─────────────────────────────────── */}
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

      {/* ── Footer ─────────────────────────────────── */}
      <footer className="footer">© UNSCH · Ayacucho, Perú · SIGEP-UNSCH</footer>
      <AccesibilidadWidget />
    </div>
  );
}
