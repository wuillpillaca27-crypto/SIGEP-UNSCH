import { notFound } from "next/navigation";
import Orientacion from "../orientacion";
import { esTramite, tramites } from "../tramites";

export function generateStaticParams() {
  return [...Object.keys(tramites), "requisitos"].map((tramite) => ({ tramite }));
}

export default async function PaginaTramite({ params }: { params: Promise<{ tramite: string }> }) {
  const { tramite } = await params;
  if (tramite === "requisitos") return <Orientacion />;
  if (!esTramite(tramite)) notFound();
  return <Orientacion inicial={tramite} />;
}
