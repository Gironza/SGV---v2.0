import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type TipoToast = "exito" | "error" | "aviso" | "info";

interface Toast {
  id: number;
  tipo: TipoToast;
  mensaje: string;
}

interface ToastApi {
  exito: (mensaje: string) => void;
  error: (mensaje: string) => void;
  aviso: (mensaje: string) => void;
  info: (mensaje: string) => void;
}

const ICONO: Record<TipoToast, string> = {
  exito: "fa-solid fa-circle-check",
  error: "fa-solid fa-circle-exclamation",
  aviso: "fa-solid fa-triangle-exclamation",
  info: "fa-solid fa-circle-info",
};

const DURACION: Record<TipoToast, number> = {
  exito: 4000,
  info: 4000,
  aviso: 6000,
  error: 7000,
};

const ToastContext = createContext<ToastApi | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const siguienteId = useRef(1);
  const timers = useRef<Map<number, number>>(new Map());

  const quitar = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const mostrar = useCallback(
    (tipo: TipoToast, mensaje: string) => {
      const id = siguienteId.current++;
      setToasts((prev) => [...prev.slice(-3), { id, tipo, mensaje }]); // máx. 4 visibles
      timers.current.set(id, window.setTimeout(() => quitar(id), DURACION[tipo]));
    },
    [quitar]
  );

  // Limpia timers al desmontar.
  useEffect(() => {
    const actuales = timers.current;
    return () => {
      actuales.forEach((t) => window.clearTimeout(t));
      actuales.clear();
    };
  }, []);

  // API estable: se puede usar en dependencias de useEffect sin re-disparar.
  const api = useMemo<ToastApi>(
    () => ({
      exito: (m) => mostrar("exito", m),
      error: (m) => mostrar("error", m),
      aviso: (m) => mostrar("aviso", m),
      info: (m) => mostrar("info", m),
    }),
    [mostrar]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fb-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`fb-toast fb-toast-${t.tipo}`} role={t.tipo === "error" ? "alert" : "status"}>
            <i className={ICONO[t.tipo]} aria-hidden="true"></i>
            <span>{t.mensaje}</span>
            <button type="button" aria-label="Cerrar aviso" onClick={() => quitar(t.id)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Uso: const toast = useToast(); toast.exito("Elección creada");
//      catch (err) { toast.error(await mensajeError(err)); }
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}