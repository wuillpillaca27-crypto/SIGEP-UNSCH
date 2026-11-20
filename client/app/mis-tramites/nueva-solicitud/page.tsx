"use client";
// /mis-tramites/nueva-solicitud — requiere autenticación
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("sigep-usuario") && !localStorage.getItem("token")) {
      router.replace("/grados-titulos/iniciar-solicitud");
    }
  }, [router]);

  return (
    <main className="pub-contenido">
      <div className="pub-hero-mini">
        <span className="eyebrow">MIS TRÁMITES</span>
        <h1 className="serif">Nueva Solicitud</h1>
        <p>Registra una nueva solicitud de grado, título o certificación.</p>
      </div>
      <div className="pub-secciones">
        <div className="pub-seccion">
          <Link href="/grados-titulos/iniciar-solicitud" className="pub-btn-accion">Iniciar una solicitud de grado o título</Link>
          <div className="pub-info-pendiente pub-info-construccion">
            <span>🔧</span>
            Las solicitudes de certificación aún no están disponibles en esta página.
          </div>
          <Link href="/mis-tramites" className="pub-btn-volver">← Volver a Mis Trámites</Link>
        </div>
      </div>
    </main>
  );
}
