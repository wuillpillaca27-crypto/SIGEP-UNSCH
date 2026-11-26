"use client";

interface Props {
  paginaActual: number;
  total: number;
  porPagina: number;
  onChange: (pagina: number) => void;
}

export default function Paginacion({ paginaActual, total, porPagina, onChange }: Props) {
  const totalPaginas = Math.ceil(total / porPagina);
  if (totalPaginas <= 1) return null;

  return (
    <nav className="paginacion" aria-label="Paginación">
      <button
        className="pag-btn"
        disabled={paginaActual === 1}
        onClick={() => onChange(paginaActual - 1)}
        aria-label="Página anterior"
      >
        ‹
      </button>

      {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          className={`pag-btn${p === paginaActual ? " pag-activa" : ""}`}
          onClick={() => onChange(p)}
          aria-current={p === paginaActual ? "page" : undefined}
        >
          {p}
        </button>
      ))}

      <button
        className="pag-btn"
        disabled={paginaActual === totalPaginas}
        onClick={() => onChange(paginaActual + 1)}
        aria-label="Página siguiente"
      >
        ›
      </button>
    </nav>
  );
}
