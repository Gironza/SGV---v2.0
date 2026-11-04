import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import eleccionService from "../services/eleccion.service";
import votoService from "../services/voto.service";
import type { EleccionOut } from "../types/eleccion";
import { faseDe, type Fase } from "../utils/etapa";
import { mensajeError } from "../utils/errores";

export interface ItemEleccion {
  eleccion: EleccionOut;
  fase: Fase;
  yaVoto: boolean;
  /** Mi curso puede postularse / votar (lista vacía = sin restricción). */
  puedePostular: boolean;
  puedeVotar: boolean;
}

function enLista(lista: string[], curso: string | null): boolean {
  return lista.length === 0 || curso === null || lista.includes(curso);
}

// Primero lo accionable: votación, luego postulación, gracia y próximas.
const ORDEN: Record<Fase, number> = { votacion: 0, postulacion: 1, gracia: 2, antes: 3, desconocida: 4, finalizada: 5 };

/** Elecciones vigentes del estudiante con su fase. Las finalizadas no se
 *  incluyen: van al historial. */
export function useEleccionesEstudiante() {
  const { usuario } = useAuth();
  const curso = usuario?.curso ?? null;

  const [items, setItems] = useState<ItemEleccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const [elecciones, disponibles] = await Promise.all([
        eleccionService.listar(),
        votoService.disponibles().catch(() => []), // solo aporta "ya votó"
      ]);
      const yaVotoPor = new Map(disponibles.map((d) => [d.id_eleccion, d.ya_voto]));

      const lista = elecciones
        .map<ItemEleccion>((e) => ({
          eleccion: e,
          fase: faseDe(e),
          yaVoto: yaVotoPor.get(e.id_eleccion) ?? false,
          puedePostular: enLista(e.cursos_postulacion, curso),
          puedeVotar: enLista(e.cursos_votacion, curso),
        }))
        .filter((i) => i.fase !== "finalizada")
        .sort((a, b) => ORDEN[a.fase] - ORDEN[b.fase] || a.eleccion.fecha_fin.localeCompare(b.eleccion.fecha_fin));

      setItems(lista);
    } catch (err) {
      setError(await mensajeError(err, "No se pudieron cargar las votaciones."));
    } finally {
      setCargando(false);
    }
  }, [curso]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return { items, cargando, error, recargar: cargar };
}