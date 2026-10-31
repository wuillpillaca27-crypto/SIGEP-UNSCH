"use client";
// ─────────────────────────────────────────────────────────────
//  NavbarPublica — pixel-perfect respecto a la imagen de referencia
//
//  FILA 1  nb-brand-bar  (carbón #2b2c30)
//    [escudo] | [SIGEP-UNSCH | Escuela de Posgrado]
//               [Sistema Integral de Gestión…]
//
//  FILA 2  nb-nav-bar  (rojo #b8202c)
//    GRADOS Y TÍTULOS ▾  CERTIFICACIONES ▾  MIS TRÁMITES  VERIFICAR DOCUMENTO
//                                                          [?]  |  [→ INGRESAR]
// ─────────────────────────────────────────────────────────────
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* ── Definición de menús ──────────────────────────────────── */
const MENU_ITEMS = [
  {
    id:    "grados",
    label: "GRADOS Y TÍTULOS",
    href:  "/grados-titulos",
    icon:  <IcoGrados />,
    items: [
      { label: "Grado de Maestro",                  href: "/grados-titulos#maestro",              icon: <IcoGrados /> },
      { label: "Grado de Doctor",                   href: "/grados-titulos#doctor",               icon: <IcoDoctor /> },
      { label: "Título de Segunda Especialidad",    href: "/grados-titulos#segunda-especialidad", icon: <IcoSegEsp /> },
      { label: "Requisitos y Procedimiento",        href: "/grados-titulos#requisitos",           icon: <IcoReq /> },
      { label: "Iniciar Solicitud",                 href: "/mis-tramites/nueva-solicitud",        icon: <IcoEditar /> },
    ],
  },
  {
    id:    "certificaciones",
    label: "CERTIFICACIONES",
    href:  "/certificaciones",
    icon:  <IcoCert />,
    items: [
      { label: "Diplomados de Posgrado",      href: "/certificaciones#diplomados", icon: <IcoCert /> },
      { label: "Certificaciones por Módulos", href: "/certificaciones#modulos",    icon: <IcoModulos /> },
      { label: "Requisitos de Certificación", href: "/certificaciones#requisitos", icon: <IcoReq /> },
      { label: "Programas y Procedimientos",  href: "/certificaciones#programas",  icon: <IcoLibro /> },
    ],
  },
  {
    id:    "tramites",
    label: "MIS TRÁMITES",
    href:  "/mis-tramites",
    icon:  <IcoTramites />,
    items: [
      { label: "Nueva Solicitud",           href: "/mis-tramites/nueva-solicitud", icon: <IcoEditar /> },
      { label: "Mis Solicitudes",           href: "/mis-tramites/solicitudes",     icon: <IcoLista /> },
      { label: "Estado de Expediente",      href: "/mis-tramites/expedientes",     icon: <IcoCarpeta /> },
      { label: "Observaciones Pendientes",  href: "/mis-tramites/observaciones",   icon: <IcoAlerta /> },
      { label: "Subsanar Documentos",       href: "/mis-tramites/subsanacion",     icon: <IcoSubsanar /> },
      { label: "Historial de Trámites",     href: "/mis-tramites/historial",       icon: <IcoReloj /> },
    ],
    requiresAuth: true,
  },
  {
    id:    "verificar",
    label: "VERIFICAR DOCUMENTO",
    href:  "/verificar-documento",
    icon:  <IcoQR />,
    items: null,
  },
] as const;

type MenuItem = (typeof MENU_ITEMS)[number];

interface Props {
  oscuro: boolean;
  onToggleTema: () => void;
}

/* ── Componente principal ──────────────────────────────────── */
export default function NavbarPublica({ oscuro, onToggleTema }: Props) {
  const [abierto, setAbierto]     = useState<string | null>(null);
  const [menuMovil, setMenuMovil] = useState(false);
  const [submovil, setSubmovil]   = useState<string | null>(null);
  const headerRef                 = useRef<HTMLElement>(null);

  /* Cerrar al hacer clic fuera */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setAbierto(null);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Cerrar con Escape */
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") { setAbierto(null); setMenuMovil(false); }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <header className="nb-header" ref={headerRef}>

      {/* ══════════════════════════════════════════════
          FILA 1 — Brand bar
          ══════════════════════════════════════════════ */}
      <div className="nb-brand-bar">

        <Link href="/" className="nb-brand" aria-label="SIGEP-UNSCH — Inicio">
          {/* Escudo con fondo blanco */}
          <div className="nb-escudo-wrap">
            <Image
              src="/escudo-unsch.png"
              alt="Escudo UNSCH"
              width={34}
              height={44}
              priority
            />
          </div>

          {/* Separador vertical */}
          <div className="nb-brand-sep" aria-hidden="true" />

          {/* Bloque de 2 líneas: título + subtítulo */}
          <div className="nb-brand-textblock">
            {/* Línea 1: SIGEP-UNSCH | Escuela de Posgrado */}
            <div className="nb-brand-linea1">
              <span className="nb-sigep">
                SIGEP<span className="nb-unsch">-UNSCH</span>
              </span>
              <span className="nb-brand-pipe" aria-hidden="true">|</span>
              <span className="nb-escuela">Escuela de Posgrado</span>
            </div>
            {/* Línea 2: subtítulo */}
            <span className="nb-subtitulo-block">
              Sistema Integral de Gestión y Validación de Grados, Títulos y Certificaciones
            </span>
          </div>
        </Link>

        {/* Spacer */}
        <div style={{ flex: 1 }} aria-hidden="true" />

        {/* Toggle tema */}
        <button
          className="nb-toggle-tema"
          type="button"
          onClick={onToggleTema}
          aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          title={oscuro ? "Modo claro" : "Modo oscuro"}
        >
          {oscuro ? "☀" : "🌙"}
        </button>
      </div>

      {/* ══════════════════════════════════════════════
          FILA 2 — Nav bar
          ══════════════════════════════════════════════ */}
      <nav className="nb-nav-bar" aria-label="Navegación principal">

        {/* Ítems de menú */}
        <ul className="nb-menu" role="menubar">
          {MENU_ITEMS.map((item) => (
            <ItemEscritorio
              key={item.id}
              item={item}
              abierto={abierto === item.id}
              onToggle={() =>
                item.items
                  ? setAbierto((p) => (p === item.id ? null : item.id))
                  : setAbierto(null)
              }
            />
          ))}
        </ul>

        {/* Lado derecho */}
        <div className="nb-derecha">
          <Link
            href="/ayuda"
            className="nb-ayuda-btn"
            aria-label="Centro de ayuda"
            title="Ayuda"
          >
            <IcoAyuda />
          </Link>
          <span className="nb-sep-vert" aria-hidden="true" />
          <Link href="/login" className="nb-ingresar">
            <IcoIngresar />
            INGRESAR
          </Link>
        </div>

        {/* Hamburguesa (móvil) */}
        <button
          className="nb-hamburguesa"
          type="button"
          aria-label={menuMovil ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuMovil}
          aria-controls="nb-menu-movil"
          onClick={() => setMenuMovil((v) => !v)}
        >
          {menuMovil ? <IcoCerrar /> : <><span /><span /><span /></>}
        </button>
      </nav>

      {/* ══════════════════════════════════════════════
          MENÚ MÓVIL
          ══════════════════════════════════════════════ */}
      {menuMovil && (
        <nav
          id="nb-menu-movil"
          className="nb-movil"
          aria-label="Menú principal"
        >
          {MENU_ITEMS.map((item) => (
            <div key={item.id} className="nb-movil-grupo">
              {item.items ? (
                <>
                  <button
                    type="button"
                    className="nb-movil-btn"
                    aria-expanded={submovil === item.id}
                    onClick={() =>
                      setSubmovil((v) => (v === item.id ? null : item.id))
                    }
                  >
                    <span className="nb-movil-icono">{item.icon}</span>
                    {item.label}
                    <span className="nb-movil-chevron" aria-hidden="true">
                      {submovil === item.id ? "▲" : "▼"}
                    </span>
                  </button>
                  {submovil === item.id && (
                    <ul className="nb-movil-sub" role="list">
                      {item.items.map((sub) => (
                        <li key={sub.href}>
                          <Link
                            href={sub.href}
                            className="nb-movil-sub-link"
                            onClick={() => setMenuMovil(false)}
                          >
                            <span className="nb-movil-icono">{sub.icon}</span>
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
                  className="nb-movil-btn"
                  onClick={() => setMenuMovil(false)}
                >
                  <span className="nb-movil-icono">{item.icon}</span>
                  {item.label}
                </Link>
              )}
            </div>
          ))}
          <div className="nb-movil-footer">
            <Link href="/ayuda" className="nb-movil-ayuda" onClick={() => setMenuMovil(false)}>
              <IcoAyuda /> Ayuda
            </Link>
            <Link href="/login" className="nb-movil-ingresar" onClick={() => setMenuMovil(false)}>
              <IcoIngresar /> INGRESAR
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

/* ── Ítem de escritorio ───────────────────────────────────── */
function ItemEscritorio({
  item, abierto, onToggle,
}: { item: MenuItem; abierto: boolean; onToggle: () => void }) {

  if (!item.items) {
    return (
      <li role="none" className="nb-item">
        <Link href={item.href} className="nb-item-btn" role="menuitem">
          <span className="nb-item-icono">{item.icon}</span>
          {item.label}
        </Link>
      </li>
    );
  }

  return (
    <li
      role="none"
      className={`nb-item nb-item-drop${abierto ? " nb-item-abierto" : ""}`}
    >
      <button
        type="button"
        className="nb-item-btn"
        role="menuitem"
        aria-haspopup="true"
        aria-expanded={abierto}
        onClick={onToggle}
      >
        <span className="nb-item-icono">{item.icon}</span>
        {item.label}
        <span className="nb-chevron" aria-hidden="true">▾</span>
      </button>

      {abierto && (
        <ul className="nb-dropdown" role="menu" aria-label={item.label}>
          {item.items.map((sub) => (
            <li key={sub.href} role="none">
              <Link
                href={sub.href}
                className="nb-dropdown-item"
                role="menuitem"
                onClick={onToggle}
              >
                <span className="nb-dropdown-icono">{sub.icon}</span>
                {sub.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/* ══════════════════════════════════════════════════════════════
   ICONOS SVG  (stroke, sin fill, tamaño uniforme)
   ══════════════════════════════════════════════════════════════ */

/* Birrete académico — GRADOS Y TÍTULOS */
function IcoGrados() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}
/* Medalla/estrella — CERTIFICACIONES */
function IcoCert() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="6"/>
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  );
}
/* Portapapeles — MIS TRÁMITES */
function IcoTramites() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  );
}
/* QR/escáner — VERIFICAR DOCUMENTO */
function IcoQR() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <path d="M14 14h2v2h-2zM18 14h3M14 18h2M18 18h3v3M18 21h3"/>
    </svg>
  );
}
/* Pregunta — Ayuda */
function IcoAyuda() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}
/* Flecha ingresar */
function IcoIngresar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
      <polyline points="10 17 15 12 10 7"/>
      <line x1="15" y1="12" x2="3" y2="12"/>
    </svg>
  );
}
/* X cerrar */
function IcoCerrar() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

/* ── Sub-ítems ─────────────────────────────────────────────── */
function IcoDoctor()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>; }
function IcoSegEsp()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8L2 7h20z"/></svg>; }
function IcoReq()      { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>; }
function IcoEditar()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>; }
function IcoModulos()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="3" width="5" height="5"/><rect x="9.5" y="3" width="5" height="5"/><rect x="17" y="3" width="5" height="5"/><rect x="2" y="10.5" width="5" height="5"/><rect x="9.5" y="10.5" width="5" height="5"/></svg>; }
function IcoLibro()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>; }
function IcoLista()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>; }
function IcoCarpeta()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>; }
function IcoAlerta()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function IcoSubsanar() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>; }
function IcoReloj()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5V15h5"/></svg>; }
