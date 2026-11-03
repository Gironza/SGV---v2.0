import { useTituloPagina } from "../../context/PaginaContext";

interface Props {
  titulo: string;
  subtitulo?: string;
  etapa?: string; // ej. "1A"
}

/** Placeholder de las páginas que aún no se construyen. */
export function PaginaEnConstruccion({ titulo, subtitulo, etapa }: Props) {
  useTituloPagina(titulo, subtitulo);
  return (
    <div className="panel-box" style={{ textAlign: "center", padding: "48px 24px" }}>
      <i className="fa-solid fa-person-digging" style={{ fontSize: 32, color: "var(--sgv-muted)" }}></i>
      <h4 style={{ marginTop: 14 }}>En construcción</h4>
      <p style={{ color: "var(--sgv-muted)", margin: 0 }}>
        Esta sección se implementa en la etapa {etapa ?? "siguiente"}.
      </p>
    </div>
  );
}

export default PaginaEnConstruccion;