"use client";
// ─────────────────────────────────────────────────────────────
//  NavbarPublica — barra de navegación de la página principal
//  Cuatro secciones: Grados y Títulos · Certificaciones ·
//  Mis Trámites · Verificar Documento  +  INGRESAR
// ─────────────────────────────────────────────────────────────
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ── Estructura de menús desplegables ─────────────────────────
const MENU_ITEMS = [
  {
    id:    "grados",
    label: "GRADOS Y TÍTULOS",
    href:  "/grados-titulos",
    items: [
      { label: "Grado de Maestro",             href: "/grados-titulos#maestro" },
      { label: "Grado de Doctor",              href: "/grados-titulos#doctor" },
      { label: "Título Segunda Especialidad",  href: "/grados-titulos#segunda-especialidad" },
      { label: "Requisitos y procedimientos",  href: "/grados-titulos#requisitos" },
      { label: "Iniciar solicitud",            href: "/mis-tramites/nueva-solicitud" },
    ],
  },
  {
    id:    "certificaciones",
    label: "CERTIFICACIONES",
    href:  "/certificaciones",
    items: [
      { label: "Diplomados de posgrado",        href: "/certificaciones#diplomados" },
      { label: "Certificaciones por módulos",   href: "/certificaciones#modulos" },
      { label: "Requisitos de certificación",   href: "/certificaciones#requisitos" },
      { label: "Programas y procedimientos",    href: "/certificaciones#programas" },
    ],
  },
  {
    id:    "tramites",
    label: "MIS TRÁMITES",
    href:  "/mis-tramites",
    items: [
      { label: "Nueva solicitud",            href: "/mis-tramites/nueva-solicitud" },
      { label: "Mis solicitudes",            href: "/mis-tramites/solicitudes" },
      { label: "Estado de expediente",       href: "/mis-tramites/expedientes" },
      { label: "Observaciones pendientes",   href: "/mis-tramites/observaciones" },
      { label: "Subsanar documentos",        href: "/mis-tramites/subsanacion" },
      { label: "Historial de trámites",      href: "/mis-tramites/historial" },
    ],
    requiresAuth: true,
  },
  {
    id:    "verificar",
    label: "VERIFICAR DOCUMENTO",
    href:  "/verificar-documento",
    items: null, // sin desplegable — va directo a la página
  },
] as const;

type MenuItem = (typeof MENU_ITEMS)[number];

interface Props {
  oscuro: boolean;
  onToggleTema: () => void;
}

export default function NavbarPublica({ oscuro, onToggleTema }: Props) {
  const [abierto, setAbierto]       = useState<string | null>(null); // id del desplegable
  const [menuMovil, setMenuMovil]   = useState(false);
  const [submovil, setSubmovil]     = useState<string | null>(null);
  const navRef                      = useRef<HTMLElement>(null);

  // Cerrar al clic fuera
  useEffect(() => {
    function cerrar(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setAbierto(null);
      }
    }
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setAbierto(null); setMenuMovil(false); }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function toggleDropdown(id: string) {
    setAbierto((prev) => (prev === id ? null : id));
  }

  return (
    <header className="nav-pub-header" ref={navRef}>
      {/* ── Brand ──────────────────────────────────────── */}
      <Link href="/" className="brand" aria-label="SIGEP — Inicio">
        <Image
          src="/escudo-unsch.png"
          alt="Escudo de la UNSCH"
          width={56}
          height={74}
          priority
        />
        <div className="brand-text">
          <div className="brand-title serif">SIGEP</div>
          <div className="brand-sub">
            UNIVERSIDAD NACIONAL DE SAN CRISTÓBAL DE HUAMANGA
          </div>
        </div>
      </Link>

      {/* ── Nav escritorio ─────────────────────────────── */}
      <nav className="nav-pub-desktop" aria-label="Navegación principal">
        {MENU_ITEMS.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            abierto={abierto === item.id}
            onToggle={() => item.items ? toggleDropdown(item.id) : setAbierto(null)}
          />
        ))}

        {/* Ayuda */}
        <Link
          href="/ayuda"
          className="nav-pub-ayuda"
          aria-label="Ayuda"
          title="Ayuda"
        >
          <AyudaIcon />
        </Link>

        {/* Toggle tema */}
        <button
          className="toggle-tema"
          onClick={onToggleTema}
          aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          title={oscuro ? "Modo claro" : "Modo oscuro"}
          type="button"
        >
          {oscuro ? "☀" : "🌙"}
        </button>

        {/* CTA Ingresar */}
        <Link href="/login" className="nav-pub-cta">
          INGRESAR
        </Link>
      </nav>

      {/* ── Botón hamburguesa (móvil) ──────────────────── */}
      <div className="nav-pub-movil-controles">
        <button
          className="toggle-tema"
          onClick={onToggleTema}
          aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          type="button"
        >
          {oscuro ? "☀" : "🌙"}
        </button>
        <button
          className="nav-pub-hamburguesa"
          type="button"
          aria-label={menuMovil ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuMovil}
          aria-controls="nav-movil"
          onClick={() => setMenuMovil((v) => !v)}
        >
          {menuMovil ? "✕" : (
            <span className="hamburguesa-icon" aria-hidden="true">
              <span /><span /><span />
            </span>
          )}
        </button>
      </div>

      {/* ── Menú móvil ─────────────────────────────────── */}
      {menuMovil && (
        <nav
          id="nav-movil"
          className="nav-pub-movil"
          aria-label="Menú móvil"
        >
          {MENU_ITEMS.map((item) => (
            <div key={item.id} className="nav-movil-grupo">
              {item.items ? (
                <>
                  <button
                    type="button"
                    className="nav-movil-btn"
                    aria-expanded={submovil === item.id}
                    onClick={() => setSubmovil((v) => v === item.id ? null : item.id)}
                  >
                    {item.label}
                    <span className="nav-dropdown-chevron" aria-hidden="true">
                      {submovil === item.id ? "▲" : "▼"}
                    </span>
                  </button>
                  {submovil === item.id && (
                    <ul className="nav-movil-sub" role="list">
                      {item.items.map((sub) => (
                        <li key={sub.href}>
                          <Link
                            href={sub.href}
                            className="nav-movil-sub-link"
                            onClick={() => setMenuMovil(false)}
                          >
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className="nav-movil-btn"
                  onClick={() => setMenuMovil(false)}
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}

          <Link
            href="/ayuda"
            className="nav-movil-btn"
            onClick={() => setMenuMovil(false)}
          >
            AYUDA
          </Link>
          <Link
            href="/login"
            className="nav-movil-cta"
            onClick={() => setMenuMovil(false)}
          >
            INGRESAR
          </Link>
        </nav>
      )}
    </header>
  );
}

// ── Ítem de menú con desplegable ─────────────────────────────
function NavItem({
  item,
  abierto,
  onToggle,
}: {
  item: MenuItem;
  abierto: boolean;
  onToggle: () => void;
}) {
  if (!item.items) {
    return (
      <Link href={item.href} className="nav-pub-link">
        {item.label}
      </Link>
    );
  }

  return (
    <div className="nav-pub-dropdown-wrap">
      <button
        type="button"
        className={`nav-pub-link nav-pub-link-btn${abierto ? " nav-pub-link-activo" : ""}`}
        aria-haspopup="true"
        aria-expanded={abierto}
        onClick={onToggle}
      >
        {item.label}
        <span className="nav-dropdown-chevron" aria-hidden="true">▾</span>
      </button>

      {abierto && (
        <ul
          className="nav-pub-dropdown"
          role="menu"
          aria-label={item.label}
        >
          {item.items.map((sub) => (
            <li key={sub.href} role="none">
              <Link
                href={sub.href}
                className="nav-pub-dropdown-item"
                role="menuitem"
                onClick={onToggle}
              >
                {sub.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Icono de ayuda (signo de interrogación) ───────────────────
function AyudaIcon() {
  return (
    <svg
      width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
