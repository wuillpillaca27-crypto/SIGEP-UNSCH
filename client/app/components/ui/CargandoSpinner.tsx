export default function CargandoSpinner({ texto = "Cargando…" }: { texto?: string }) {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <span className="spinner-texto">{texto}</span>
    </div>
  );
}
