import Link from "next/link";

export default function Pagina() {
  return <main className="content"><h1 className="serif">Verificación QR</h1><p>Consulta el código impreso o el enlace QR de un documento registrado como emitido.</p><Link className="btn btn-rojo" href="/verificar-documento">Abrir verificador de documentos</Link></main>;
}
