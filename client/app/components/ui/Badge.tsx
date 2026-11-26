import type { EstadoExpediente } from "../../types";
import { infoEstado } from "../../lib/utils";

interface Props {
  estado: EstadoExpediente;
}

export default function Badge({ estado }: Props) {
  const { label, clase } = infoEstado(estado);
  return <span className={`badge ${clase}`}>{label}</span>;
}
