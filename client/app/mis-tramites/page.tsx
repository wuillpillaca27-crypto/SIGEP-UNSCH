"use client";
// /mis-tramites — hub de trámites (requiere autenticación)
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const OPCIONES = [
  {
    icono: "📝",
    titulo: "Nueva solicitud",
    desc:   "Registra una nueva solicitud de grado, título o certificación.",
    href:   "/mis-tramites/nueva-solicitud",
  },
  {
    icono: "📋",
    titulo: "Mis solicitudes",
    desc:   "Consulta todas las solicitudes que has registrado.",
    href:   "/mis-tramites/solicitudes",
  },
  {
    icono: "🗂️",
    titulo: "Estado de expediente",
    desc:   "Consulta el estado actual de tu expediente en proceso.",
    href:   "/mis-tramites/expedientes",
  },
  {
    icono: "⚠️",
    titulo: "Observaciones pendientes",
    desc:   "Revisa las observaciones que requieren tu atención.",
    href:   "/mis-tramites/observaciones",
  },
  {
    icono: "📎",
    titulo: "Subsanar documentos",
    desc:   "Adjunta o corrige los documentos observados.",
    href:   "/mis-tramites/subsanacion",
  },
  {
    icono: "🕐",
    titulo: "Historial de trámites",
    desc:   "Revisa el historial completo de tus trámites anteriores.",
    href:   "/mis-tramites/historial",
  },
];

export default function MisTramitesPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<{ nombre: string } | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("sigep-usuario");
    if (!raw) {
      // Redirige al login guardando la URL destino para continuar tras autenticarse
      router.replace("/login?continuar=/mis-tramites");
      return;
    }
    try { setUsuario(JSON.parse(raw)); } catch { /* ignore */ }
    setCargando(false);
  }, [router]);

  if (cargando) {
    return (
      <main className="pub-contenido">
        <div className="pub-hero-mini">
          <span className="eyebrow">MIS TRÁMITES</span>
          <h1 className="serif">Verificando sesión…</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="pub-contenido">
      <div className="pub-hero-mini">
        <span className="eyebrow">ESCUELA DE POSGRADO · UNSCH</span>
        <h1 className="serif">Mis Trámites</h1>
        {usuario && (
          <p>Bienvenido, <strong>{usuario.nombre}</strong>. Gestiona tus solicitudes y expedientes desde aquí.</p>
        )}
      </div>

      <div className="pub-secciones">
        <div className="tramites-grid">
          {OPCIONES.map((op) => (
            <Link key={op.href} href={op.href} className="tramite-card">
              <span className="tramite-icono" aria-hidden="true">{op.icono}</span>
              <span className="tramite-titulo">{op.titulo}</span>
              <span className="tramite-desc">{op.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
