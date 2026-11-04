import { useState, type FormEvent } from "react";
import Alerta from "../feedback/Alerta";
import SelectorCursos from "./SelectorCursos";
import { aInputFecha, deInputFecha } from "../../utils/fechas";
import type { EleccionCreate } from "../../types/eleccion";

import "../../styles/elecciones.css";

interface FormularioEleccionProps {
  /** Para editar (etapa 1B); vacío al crear. Fechas en formato API. */
  valoresIniciales?: Partial<EleccionCreate>;
  cursosDisponibles: string[];
  enviando?: boolean;
  textoEnviar?: string;
  /** En edición: si se desmarcan todos los cursos, enviar [] (en vez de omitir). */
  enviarCursosVacios?: boolean;
  onSubmit: (datos: EleccionCreate) => void;
  onCancelar?: () => void;
}

/** Formulario de elección, reutilizable para crear (1A) y editar (1B). */
export function FormularioEleccion({
  valoresIniciales = {},
  cursosDisponibles,
  enviando = false,
  textoEnviar = "Crear elección",
  enviarCursosVacios = false,
  onSubmit,
  onCancelar,
}: FormularioEleccionProps) {
  const v = valoresIniciales;
  const [titulo, setTitulo] = useState(v.titulo ?? "");
  const [descripcion, setDescripcion] = useState(v.descripcion ?? "");
  const [inicioInsc, setInicioInsc] = useState(aInputFecha(v.fecha_inicio_inscripcion));
  const [finInsc, setFinInsc] = useState(aInputFecha(v.fecha_fin_inscripcion));
  const [inicio, setInicio] = useState(aInputFecha(v.fecha_inicio));
  const [fin, setFin] = useState(aInputFecha(v.fecha_fin));
  const [cursosPost, setCursosPost] = useState<string[]>(v.cursos_postulacion ?? []);
  const [cursosVot, setCursosVot] = useState<string[]>(v.cursos_votacion ?? []);
  const [error, setError] = useState("");

  // Los valores "YYYY-MM-DDTHH:mm" se comparan como texto: sin new Date(),
  // para no mover las fechas por la zona horaria del navegador.
  function validar(): string {
    if (!titulo.trim()) return "El título es obligatorio.";
    if (titulo.trim().length > 150) return "El título no puede superar 150 caracteres.";
    if (!inicioInsc || !finInsc || !inicio || !fin) return "Completa las 4 fechas.";
    if (inicioInsc >= finInsc) return "El fin de la postulación debe ser posterior a su inicio.";
    if (finInsc > inicio) return "La votación debe empezar cuando termina la postulación o después.";
    if (inicio >= fin) return "El cierre de la votación debe ser posterior a su inicio.";
    return "";
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const msg = validar();
    setError(msg);
    if (msg) return;

    onSubmit({
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || null,
      fecha_inicio_inscripcion: deInputFecha(inicioInsc),
      fecha_fin_inscripcion: deInputFecha(finInsc),
      fecha_inicio: deInputFecha(inicio),
      fecha_fin: deInputFecha(fin),
      // Al crear, sin selección se omite el campo (el backend no restringe).
      cursos_postulacion: cursosPost.length || enviarCursosVacios ? cursosPost : undefined,
      cursos_votacion: cursosVot.length || enviarCursosVacios ? cursosVot : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="form-eleccion" noValidate>
      {error && <Alerta tono="error" onCerrar={() => setError("")}>{error}</Alerta>}

      <div className="form-campo">
        <label htmlFor="el-titulo">Título *</label>
        <input id="el-titulo" className="form-control" value={titulo} maxLength={150}
          onChange={(e) => setTitulo(e.target.value)} placeholder="Ej. Personero estudiantil 2026" />
      </div>

      <div className="form-campo">
        <label htmlFor="el-desc">Descripción</label>
        <textarea id="el-desc" className="form-control" rows={3} value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)} />
      </div>

      <div className="form-grid">
        <fieldset className="form-bloque">
          <legend>Postulación de candidatos</legend>
          <div className="form-campo">
            <label htmlFor="el-ii">Inicio *</label>
            <input id="el-ii" type="datetime-local" className="form-control" value={inicioInsc}
              onChange={(e) => setInicioInsc(e.target.value)} />
          </div>
          <div className="form-campo">
            <label htmlFor="el-fi">Fin *</label>
            <input id="el-fi" type="datetime-local" className="form-control" value={finInsc}
              onChange={(e) => setFinInsc(e.target.value)} />
          </div>
        </fieldset>

        <fieldset className="form-bloque">
          <legend>Votación</legend>
          <div className="form-campo">
            <label htmlFor="el-i">Inicio *</label>
            <input id="el-i" type="datetime-local" className="form-control" value={inicio}
              onChange={(e) => setInicio(e.target.value)} />
          </div>
          <div className="form-campo">
            <label htmlFor="el-f">Cierre *</label>
            <input id="el-f" type="datetime-local" className="form-control" value={fin}
              onChange={(e) => setFin(e.target.value)} />
          </div>
        </fieldset>
      </div>

      <div className="form-grid">
        <SelectorCursos etiqueta="Cursos que pueden postularse" cursos={cursosDisponibles}
          seleccion={cursosPost} onChange={setCursosPost} />
        <SelectorCursos etiqueta="Cursos que pueden votar" cursos={cursosDisponibles}
          seleccion={cursosVot} onChange={setCursosVot} />
      </div>

      <div className="form-acciones">
        {onCancelar && (
          <button type="button" className="fb-btn fb-btn-ghost" onClick={onCancelar} disabled={enviando}>
            Cancelar
          </button>
        )}
        <button type="submit" className="fb-btn fb-btn-primary" disabled={enviando}>
          {enviando && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
          {textoEnviar}
        </button>
      </div>
    </form>
  );
}

export default FormularioEleccion;