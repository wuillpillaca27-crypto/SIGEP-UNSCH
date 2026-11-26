"use client";
// /verificar-documento — verificación pública por código único o QR
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { documentosService, type DocumentoVerificado } from "../services/documentos.service";

type TipoDocumento =
  | "grado_maestro"
  | "grado_doctor"
  | "titulo_segunda_especialidad"
  | "certificado_diplomado"
  | "certificacion_modulos";

const TIPOS: { value: TipoDocumento; label: string }[] = [
  { value: "grado_maestro",               label: "Diploma de Maestría" },
  { value: "grado_doctor",                label: "Diploma de Doctorado" },
  { value: "titulo_segunda_especialidad",  label: "Título de Segunda Especialidad" },
  { value: "certificado_diplomado",        label: "Certificado de Diplomado" },
  { value: "certificacion_modulos",        label: "Certificación por Módulos" },
];

type Consulta = { codigo: string; tipo: string };
type Resultado = { consulta: Consulta; documento?: DocumentoVerificado; error?: "no-encontrado" | "error-servidor" | "invalido" };

function extraerCodigo(texto: string) {
  const valor = texto.trim();
  if (!/^https?:\/\//i.test(valor)) return valor;
  try {
    const enlace = new URL(valor);
    return enlace.pathname.replace(/\/$/, "") === "/verificar-documento" ? enlace.searchParams.get("codigo")?.trim() ?? "" : "";
  } catch {
    return "";
  }
}

export default function VerificarDocumentoPage() {
  return <Suspense fallback={<main className="pub-contenido"><p role="status">Cargando verificación…</p></main>}><VerificadorDesdeEnlace /></Suspense>;
}

function VerificadorDesdeEnlace() {
  const inicial = useSearchParams().get("codigo") ?? "";
  return <Verificador key={inicial} inicial={inicial} />;
}

function Verificador({ inicial }: { inicial: string }) {
  const [codigo, setCodigo] = useState(inicial);
  const [tipo, setTipo] = useState("");
  const [consulta, setConsulta] = useState<Consulta | null>(inicial ? { codigo: extraerCodigo(inicial), tipo: "" } : null);
  const [resultado, setResultado] = useState<Resultado>();
  const vigente = resultado?.consulta === consulta ? resultado : undefined;
  const valido = !consulta || /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/i.test(consulta.codigo) && consulta.codigo.length >= 6 && consulta.codigo.length <= 80;
  const estado = !consulta ? "idle" : !valido ? "invalido" : !vigente ? "cargando" : vigente.error ?? "encontrado";
  const documento = vigente?.documento;

  useEffect(() => {
    if (!consulta || !valido) return;
    let activa = true;
    documentosService.verificarQr(consulta.codigo, consulta.tipo).then((respuesta) => {
      if (!activa) return;
      const error = respuesta.estadoHttp === 404 ? "no-encontrado" : respuesta.estadoHttp === 400 ? "invalido" : "error-servidor";
      setResultado(respuesta.datos ? { consulta, documento: respuesta.datos } : { consulta, error });
    });
    return () => { activa = false; };
  }, [consulta, valido]);

  function handleVerificar(e: React.FormEvent) {
    e.preventDefault();
    if (codigo.trim()) setConsulta({ codigo: extraerCodigo(codigo), tipo });
  }

  function limpiar() {
    setCodigo("");
    setTipo("");
    setConsulta(null);
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
                onChange={(e) => { setTipo(e.target.value); setConsulta(null); }}
              >
                <option value="">Todos los tipos</option>
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
                placeholder="Código impreso o enlace QR"
                value={codigo}
                onChange={(e) => { setCodigo(e.target.value); setConsulta(null); }}
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
          {documento && (
            <div className={`alerta ${documento.demostracion ? "alerta-advertencia" : "alerta-exito"} verificar-resultado`} role="status">
              <strong>{documento.demostracion ? "Código de demostración encontrado" : "Documento verificado"}</strong>
              {documento.demostracion && <p>Registro de prueba sin validez oficial.</p>}
              <p><strong>Código</strong> {documento.codigo}</p>
              <p><strong>Tipo</strong> {TIPOS.find(({ value }) => value === documento.tipoTramite)?.label}</p>
              <p><strong>Programa</strong> {documento.programa}</p>
              {documento.emitidoEn && <p><strong>Fecha de emisión</strong> {new Intl.DateTimeFormat("es-PE", { dateStyle: "long", timeZone: "America/Lima" }).format(new Date(documento.emitidoEn))}</p>}
            </div>
          )}
          {estado === "invalido" && <p className="alerta alerta-advertencia verificar-resultado" role="alert">Ingresa el código impreso o un enlace QR válido de Verificar Documento.</p>}
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

          <div className="pub-info-pendiente" style={{ marginTop: 32 }}>
            <InfoIcon />
            Para documentos sin código o emitidos fuera del sistema, comunícate con la Oficina de Grados y Títulos.
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
