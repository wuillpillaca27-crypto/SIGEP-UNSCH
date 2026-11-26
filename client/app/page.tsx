"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import AccesibilidadWidget from "./components/AccesibilidadWidget";
import NavbarPublica from "./components/NavbarPublica";
import PortalAcademico from "./components/PortalAcademico";

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
      <NavbarPublica />

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

      <section className="rector-section" aria-label="Autoridades universitarias" style={{ padding: 0 }}>
        <a
          href="/banner-institucional-posgrado.png"
          target="_blank"
          rel="noopener"
          title="Ver el banner a tamaño original"
          style={{ display: "block" }}
        >
          <Image
            src="/banner-institucional-posgrado.png"
            alt="Escuela de Posgrado de la UNSCH. El director, Dr. Johnny Aldo Tinco Jayo, da la bienvenida a los estudiantes. A la derecha, el rector, Dr. Emilio Ramírez Roca."
            width={2172}
            height={724}
            sizes="100vw"
            style={{ display: "block", width: "100%", height: "auto", objectFit: "contain" }}
          />
        </a>
      </section>

      <PortalAcademico oscuro={oscuro} cambiarTema={toggleTema} />
      <AccesibilidadWidget />
    </div>
  );
}
