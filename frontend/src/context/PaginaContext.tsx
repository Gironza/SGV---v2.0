import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface PaginaInfo {
  titulo: string;
  subtitulo?: string;
  /** Si se define, el header muestra un enlace "← Volver" a esa ruta. */
  volverA?: string;
}

interface PaginaContextType {
  pagina: PaginaInfo;
  setPagina: (p: PaginaInfo) => void;
}

const VACIA: PaginaInfo = { titulo: "" };
const PaginaContext = createContext<PaginaContextType | undefined>(undefined);

export function PaginaProvider({ children }: { children: ReactNode }) {
  const [pagina, setPagina] = useState<PaginaInfo>(VACIA);
  return (
    <PaginaContext.Provider value={{ pagina, setPagina }}>
      {children}
    </PaginaContext.Provider>
  );
}

export function usePagina() {
  const ctx = useContext(PaginaContext);
  if (!ctx) throw new Error("usePagina debe usarse dentro de <PaginaProvider>");
  return ctx.pagina;
}

/** Cada página declara su título/subtítulo para el header:
 *    useTituloPagina("Elecciones", "Configura y modera tus votaciones");
 *  Con `volverA` aparece el enlace "← Volver". */
export function useTituloPagina(titulo: string, subtitulo?: string, volverA?: string) {
  const ctx = useContext(PaginaContext);
  if (!ctx) throw new Error("useTituloPagina debe usarse dentro de <PaginaProvider>");
  const { setPagina } = ctx;
  useEffect(() => {
    setPagina({ titulo, subtitulo, volverA });
  }, [titulo, subtitulo, volverA, setPagina]);
}