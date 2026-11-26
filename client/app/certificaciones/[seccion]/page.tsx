import { notFound } from "next/navigation";
import Orientacion from "../../grados-titulos/orientacion";
import { certificaciones, esCertificacion } from "../../grados-titulos/tramites";

export function generateStaticParams() {
  return [...Object.keys(certificaciones), "requisitos", "programas"].map((seccion) => ({ seccion }));
}

export default async function Pagina({ params }: { params: Promise<{ seccion: string }> }) {
  const { seccion } = await params;
  if (esCertificacion(seccion)) return <Orientacion inicial={seccion} seccion="certificaciones" />;
  if (seccion === "requisitos" || seccion === "programas") {
    return <Orientacion seccion="certificaciones" programasDestacados={seccion === "programas"} />;
  }
  notFound();
}
