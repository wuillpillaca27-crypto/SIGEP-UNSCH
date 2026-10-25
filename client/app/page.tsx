"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

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
  const [oscuro, setOscuro] = useState(false);

  // Recuperar preferencia guardada
  useEffect(() => {
    const guardado = localStorage.getItem("sigep-tema");
    if (guardado === "oscuro") setOscuro(true);
  }, []);

  function toggleTema() {
    setOscuro((prev) => {
      const nuevo = !prev;
      localStorage.setItem("sigep-tema", nuevo ? "oscuro" : "claro");
      return nuevo;
    });
  }

  return (
    <div className={oscuro ? "tema-oscuro" : ""}>
      {/* ── Header ─────────────────────────────────── */}
      <header className="header">
        <div className="brand">
          <Image
            src="/escudo-unsch.png"
            alt="Escudo de la UNSCH"
            width={64}
            height={84}
            priority
          />
          <div className="brand-text">
            <div className="brand-title serif">SIGEP</div>
            <div className="brand-sub">
              UNIVERSIDAD NACIONAL DE SAN CRISTÓBAL DE HUAMANGA
            </div>
          </div>
        </div>

        <nav className="nav">
          <a href="#">TRÁMITES</a>
          <a href="#">SOLICITUDES</a>
          <a href="#">SEGUIMIENTO</a>
          <a href="#">REPORTES</a>
          <a href="#">AYUDA</a>

          {/* Toggle modo oscuro */}
          <button
            className="toggle-tema"
            onClick={toggleTema}
            aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            title={oscuro ? "Modo claro" : "Modo oscuro"}
          >
            {oscuro ? "☀" : "🌙"}
          </button>

          <a href="/login" className="cta">INGRESAR</a>
        </nav>
      </header>

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
          <a className="social-link facebook" href="#" aria-label="Facebook" title="Facebook">f</a>
          <a className="social-link youtube" href="#" aria-label="YouTube" title="YouTube">▶</a>
          <a className="social-link instagram" href="#" aria-label="Instagram" title="Instagram">◎</a>
          <a className="social-link tiktok" href="#" aria-label="TikTok" title="TikTok">♪</a>
          <a className="social-link linkedin" href="#" aria-label="LinkedIn" title="LinkedIn">in</a>
        </aside>
        <div className="btns">
          <a className="btn btn-rojo" href="/login">
            INICIAR SESIÓN
          </a>
          <a className="btn btn-borde" href="#">
            CONSULTAR MI TRÁMITE
          </a>
        </div>
      </section>

      {/* ── Explorar ───────────────────────────────── */}
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
    </div>
  );
}
