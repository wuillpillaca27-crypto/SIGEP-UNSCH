"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../lib/api";
import { estadoVisible, type Solicitud } from "../grados-titulos/solicitudes-api";
import { tramitesAcademicos } from "../grados-titulos/tramites";
import styles from "../grados-titulos/orientacion.module.css";

type Fila = { tipoTramite: string; estado: string; total: number };

function tipoVisible(tipo: string) {
  return Object.values(tramitesAcademicos).find((item) => item.tipo === tipo)?.nombre ?? tipo;
}

function campoCSV(valor: string) {
  const seguro = /^\s*[=+\-@\t\r\n]/.test(valor) ? "'" + valor : valor;
  return '"' + seguro.replaceAll('"', '""') + '"';
}

export default function ReportesPanel({ titulo, exportar = false }: { titulo: string; exportar?: boolean }) {
  const [datos, setDatos] = useState<Fila[]>();
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => {
    let activo = true;
    api.get<Fila[]>("/revision-grados/reporte").then((r) => {
      if (activo) { setDatos(r.datos); setError(r.error ?? ""); }
    });
    return () => { activo = false; };
  }, []);

  async function descargar() {
    setOcupado(true);
    setError("");
    try {
      const filas = [["Código", "Tipo", "Programa", "Fecha de emisión"]];
      for (let pagina = 1; pagina <= 10000; pagina++) {
        const r = await api.get<{ datos: Solicitud[]; siguiente: boolean }>(`/revision-grados?estado=emitido&pagina=${pagina}`);
        if (!r.datos) throw new Error(r.error ?? "No se pudo cargar la exportación.");
        for (const doc of r.datos.datos) {
          const emision = doc.historial.findLast((item) => item.estadoDespues === "emitido");
          filas.push([doc.codigo, tipoVisible(doc.tipoTramite), doc.programa.nombre, emision?.creadoEn ?? ""]);
        }
        if (!r.datos.siguiente) break;
        if (pagina === 10000) throw new Error("La exportación supera el límite de registros.");
      }
      const url = URL.createObjectURL(new Blob(["\uFEFF", filas.map((fila) => fila.map(campoCSV).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = "sigep-documentos-emitidos.csv";
      enlace.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo exportar."); }
    finally { setOcupado(false); }
  }

  return (
    <main className={styles.pagina}>
      <h1 className="serif">{titulo}</h1>
      {error && <p role="alert">{error}</p>}
      <section className={styles.panel}>
        {exportar ? <>
          <h2>Registro local de documentos emitidos</h2>
          <p>Descarga un CSV para revisión. El archivo no se remite a SUNEDU.</p>
          <button type="button" disabled={ocupado} onClick={descargar}>{ocupado ? "Preparando archivo…" : "Descargar CSV de emitidos"}</button>
        </> : <>
          <h2>Expedientes presentados por modalidad y estado</h2>
          <p><Link href="/admin/expedientes">Abrir expedientes</Link></p>
          {!datos && !error && <p role="status">Consultando expedientes…</p>}
          {datos?.length === 0 && <p>No hay expedientes presentados.</p>}
          {datos && datos.length > 0 && <ul className={styles.lista}>{datos.map((item) => (
            <li key={`${item.tipoTramite}/${item.estado}`}>{tipoVisible(item.tipoTramite)} · {estadoVisible(item.estado)} · <strong>{item.total}</strong></li>
          ))}</ul>}
        </>}
      </section>
    </main>
  );
}
