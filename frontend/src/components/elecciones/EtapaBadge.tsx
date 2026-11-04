import Badge from "../ui/Badge";
import { infoEtapa } from "../../utils/etapa";

/** Badge de la etapa de una elección (en vez de nombre_estado). */
export function EtapaBadge({ etapa }: { etapa: string }) {
  const { etiqueta, tono } = infoEtapa(etapa);
  return <Badge tone={tono}>{etiqueta}</Badge>;
}

export default EtapaBadge;