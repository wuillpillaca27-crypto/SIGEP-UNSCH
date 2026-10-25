import type { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario" | "peligro" | "borde";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  cargando?: boolean;
}

const clases: Record<Variante, string> = {
  primario:   "btn btn-rojo",
  secundario: "btn btn-carbon",
  peligro:    "btn btn-peligro",
  borde:      "btn btn-borde-carbon",
};

export default function Boton({
  variante = "primario",
  cargando = false,
  children,
  disabled,
  ...props
}: Props) {
  return (
    <button
      {...props}
      disabled={disabled || cargando}
      className={`${clases[variante]} ${props.className ?? ""}`}
      aria-busy={cargando}
    >
      {cargando ? "Cargando…" : children}
    </button>
  );
}
