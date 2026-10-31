"use client";
// /mis-tramites/subsanacion — requiere autenticación
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("sigep-usuario")) {
      router.replace("/login?continuar=/mis-tramites/subsanacion");
    }
  }, [router]);

  return (
    <main className="pub-contenido">
      <div className="pub-hero-mini">
        <span className="eyebrow">MIS TRÁMITES</span>
        <h1 className="serif">Subsanar Documentos</h1>
        <p>Adjunta o corrige los documentos observados en tu expediente.</p>
      </div>
      <div className="pub-secciones">
        <div className="pub-seccion">
          <div className="pub-info-pendiente pub-info-construccion">
            <span>🔧</span>
            Este módulo está en construcción. Pronto estará disponible.
          </div>
          <Link href="/mis-tramites" className="pub-btn-volver">← Volver a Mis Trámites</Link>
        </div>
      </div>
    </main>
  );
}
