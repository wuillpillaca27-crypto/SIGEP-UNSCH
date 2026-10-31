"use client";
// /verificar-documento — verificación pública por código único o QR
import { useState } from "react";

type TipoDocumento =
  | "diploma_maestria"
  | "diploma_doctorado"
  | "titulo_segunda_especialidad"
  | "certificado_diplomado"
  | "certificacion_modulos";

const TIPOS: { value: TipoDocumento; label: string }[] = [
  { value: "diploma_maestria",             label: "Diploma de Maestría" },
  { value: "diploma_doctorado",            label: "Diploma de Doctorado" },
  { value: "titulo_segunda_especialidad",  label: "Título de Segunda Especialidad" },
  { value: "certificado_diplomado",        label: "Certificado de Diplomado" },
  { value: "certificacion_modulos",        label: "Certificación por Módulos" },
];

type EstadoVerificacion = "idle" | "cargando" | "no-encontrado" | "error-servidor";

export default function VerificarDocumentoPage() {
  const [codigo, setCodigo]       = useState("");
  const [tipo, setTipo]           = useState<TipoDocumento>("diploma_maestria");
  const [estado, setEstado]       = useState<EstadoVerificacion>("idle");

  function handleVerificar(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim()) return;

    setEstado("cargando");

    // Llamada real al backend (cuando exista el endpoint)
    fetch(`/api/documentos/verificar-qr/${encodeURIComponent(codigo.trim())}`)
      .then(async (res) => {
        if (res.status === 404) { setEstado("no-encontrado"); return; }
        if (!res.ok)            { setEstado("error-servidor"); return; }
        // El backend aún no está implementado; la respuesta real se procesará aquí
        setEstado("no-encontrado");
      })
      .catch(() => setEstado("error-servidor"));
  }

  function limpiar() {
    setCodigo("");
    setEstado("idle");
  }

  return (
    <main className="pub-contenido">
      <div className="pub-hero-mini">
        <span className="eyebrow">ESCUELA DE POSGRADO · UNSCH</span>
        <h1 className="serif">Verificar Documento</h1>
        <p>
          Comprueba la autenticidad de diplomas, títulos y certificados
          emitidos por la Escuela de Posgrado de la UNSCH.
        </p>
      </div>

      <div className="pub-secciones">
        <section className="pub-seccion verificar-seccion">
          <h2 className="serif">Ingresa el código del documento</h2>
          <p className="verificar-desc">
            El código único se encuentra impreso en el documento original,
            generalmente al reverso o en el pie de página, junto al código QR.
          </p>

          <form className="verificar-form" onSubmit={handleVerificar} noValidate>
            <div className="campo">
              <label htmlFor="tipo-doc" className="campo-label">
                Tipo de documento
              </label>
              <select
                id="tipo-doc"
                className="campo-input campo-select"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoDocumento)}
              >
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="codigo-doc" className="campo-label">
                Código único de verificación
              </label>
              <input
                id="codigo-doc"
                type="text"
                className="campo-input"
                placeholder="Ejemplo: SIGEP-2024-GT-00123"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                required
              />
            </div>

            <div className="verificar-acciones">
              <button
                type="submit"
                className="btn btn-rojo verificar-btn"
                disabled={estado === "cargando" || !codigo.trim()}
                aria-busy={estado === "cargando"}
              >
                {estado === "cargando" ? (
                  <>
                    <span className="btn-google-spinner" style={{ borderTopColor: "#fff" }} aria-hidden="true" />
                    Verificando…
                  </>
                ) : (
                  "VERIFICAR DOCUMENTO"
                )}
              </button>
              {estado !== "idle" && estado !== "cargando" && (
                <button type="button" className="btn btn-borde-carbon" onClick={limpiar}>
                  Nueva verificación
                </button>
              )}
            </div>
          </form>

          {/* Resultado */}
          {estado === "no-encontrado" && (
            <div className="alerta alerta-advertencia verificar-resultado" role="alert">
              <strong>Documento no encontrado.</strong>{" "}
              El código ingresado no corresponde a ningún documento registrado en el sistema.
              Verifica el código e inténtalo nuevamente. Si el problema persiste, comunícate
              con la Oficina de Grados y Títulos.
            </div>
          )}

          {estado === "error-servidor" && (
            <div className="alerta alerta-error verificar-resultado" role="alert">
              <strong>Error de conexión.</strong>{" "}
              No fue posible conectar con el servidor de verificación. Por favor, inténtalo
              en unos minutos.
            </div>
          )}

          {/* Aviso de servicio en implementación */}
          <div className="pub-info-pendiente" style={{ marginTop: 32 }}>
            <InfoIcon />
            El servicio de verificación en línea estará completamente disponible una vez
            que el módulo de emisión de documentos sea habilitado por la Oficina de Grados
            y Títulos. Los documentos emitidos con anterioridad al sistema deben verificarse
            de forma presencial.
          </div>
        </section>

        {/* Tipos de documentos verificables */}
        <section className="pub-seccion">
          <h2 className="serif">Documentos verificables</h2>
          <ul className="verificar-lista-tipos">
            {TIPOS.map((t) => (
              <li key={t.value} className="verificar-tipo-item">
                <DocumentoIcon />
                {t.label}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

function DocumentoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}
