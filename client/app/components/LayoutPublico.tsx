"use client";
// ─────────────────────────────────────────────────────────────
//  LayoutPublico — envuelve todas las páginas públicas con
//  NavbarPublica + footer + AccesibilidadWidget
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import NavbarPublica from "./NavbarPublica";
import AccesibilidadWidget from "./AccesibilidadWidget";

export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  const [oscuro, setOscuro] = useState(false);

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
    <div className={`pagina-publica${oscuro ? " tema-oscuro" : ""}`}>
      <NavbarPublica oscuro={oscuro} onToggleTema={toggleTema} />
      {children}
      <footer className="footer">© UNSCH · Ayacucho, Perú · SIGEP-UNSCH</footer>
      <AccesibilidadWidget />
    </div>
  );
}
