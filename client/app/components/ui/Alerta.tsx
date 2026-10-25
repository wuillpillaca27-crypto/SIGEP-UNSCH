type Tipo = "exito" | "error" | "advertencia" | "info";

interface Props {
  tipo?: Tipo;
  mensaje: string;
}

const clases: Record<Tipo, string> = {
  exito:       "alerta alerta-exito",
  error:       "alerta alerta-error",
  advertencia: "alerta alerta-advertencia",
  info:        "alerta alerta-info",
};

export default function Alerta({ tipo = "info", mensaje }: Props) {
  return (
    <div className={clases[tipo]} role="alert">
      {mensaje}
    </div>
  );
}
