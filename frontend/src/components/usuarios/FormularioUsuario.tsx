import { useId, useState, type FormEvent } from "react";

import Alerta from "../feedback/Alerta";
import { TIPOS_DOCUMENTO, type UsuarioOut } from "../../types/usuario";

import "../../styles/elecciones.css";
import "../../styles/usuarios.css";

export interface DatosUsuarioForm {
  documento: string;
  id_tipo_doc: number;
  nombre: string;
  apellido: string;
  correo: string;
  /** null = sin curso (docentes y administradores). */
  curso: string | null;
}

interface Props {
  /** Vacío al crear; el usuario a editar en edición. */
  usuario?: UsuarioOut;
  cursosDisponibles: string[];
  /** En estudiantes el curso es obligatorio. */
  cursoObligatorio: boolean;
  enviando?: boolean;
  textoEnviar: string;
  onSubmit: (datos: DatosUsuarioForm) => void;
  onCancelar: () => void;
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Formulario de usuario, usado para crear estudiantes y para editar. */
export function FormularioUsuario({ usuario, cursosDisponibles, cursoObligatorio, enviando = false, textoEnviar, onSubmit, onCancelar }: Props) {
  const idLista = useId();
  const [idTipoDoc, setIdTipoDoc] = useState(usuario?.id_tipo_doc ?? TIPOS_DOCUMENTO[0].id);
  const [documento, setDocumento] = useState(usuario?.documento ?? "");
  const [nombre, setNombre] = useState(usuario?.nombre ?? "");
  const [apellido, setApellido] = useState(usuario?.apellido ?? "");
  const [correo, setCorreo] = useState(usuario?.correo ?? "");
  const [curso, setCurso] = useState(usuario?.curso ?? "");
  const [error, setError] = useState("");

  function validar(): string {
    if (!documento.trim()) return "El documento es obligatorio.";
    if (documento.trim().length > 20) return "El documento no puede superar 20 caracteres.";
    if (!nombre.trim() || !apellido.trim()) return "Nombre y apellido son obligatorios.";
    if (!CORREO.test(correo.trim())) return "Escribe un correo válido.";
    if (cursoObligatorio && !curso.trim()) return "El curso es obligatorio para estudiantes.";
    if (curso.trim().length > 20) return "El curso no puede superar 20 caracteres.";
    return "";
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const msg = validar();
    setError(msg);
    if (msg) return;
    onSubmit({
      documento: documento.trim(),
      id_tipo_doc: idTipoDoc,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      correo: correo.trim(),
      curso: curso.trim() || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="usr-form">
      {error && <Alerta tono="error" onCerrar={() => setError("")}>{error}</Alerta>}

      <div className="usr-form-fila">
        <div className="form-campo">
          <label htmlFor="usr-tipo">Tipo de documento *</label>
          <select id="usr-tipo" className="form-select" value={idTipoDoc} onChange={(e) => setIdTipoDoc(Number(e.target.value))}>
            {TIPOS_DOCUMENTO.map((t) => (
              <option key={t.id} value={t.id}>{t.sigla} · {t.nombre}</option>
            ))}
          </select>
        </div>
        <div className="form-campo">
          <label htmlFor="usr-doc">Documento *</label>
          <input id="usr-doc" className="form-control" value={documento} maxLength={20} onChange={(e) => setDocumento(e.target.value)} />
        </div>
      </div>

      <div className="usr-form-fila">
        <div className="form-campo">
          <label htmlFor="usr-nombre">Nombre *</label>
          <input id="usr-nombre" className="form-control" value={nombre} maxLength={100} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="form-campo">
          <label htmlFor="usr-apellido">Apellido *</label>
          <input id="usr-apellido" className="form-control" value={apellido} maxLength={100} onChange={(e) => setApellido(e.target.value)} />
        </div>
      </div>

      <div className="form-campo">
        <label htmlFor="usr-correo">Correo *</label>
        <input id="usr-correo" type="email" className="form-control" value={correo} onChange={(e) => setCorreo(e.target.value)} />
      </div>

      <div className="form-campo">
        <label htmlFor="usr-curso">Curso{cursoObligatorio ? " *" : ""}</label>
        <input id="usr-curso" className="form-control" list={idLista} value={curso} maxLength={20}
          onChange={(e) => setCurso(e.target.value)} placeholder="Ej. 1001" />
        <datalist id={idLista}>
          {cursosDisponibles.map((c) => <option key={c} value={c} />)}
        </datalist>
      </div>

      <div className="form-acciones">
        <button type="button" className="fb-btn fb-btn-ghost" onClick={onCancelar} disabled={enviando}>Cancelar</button>
        <button type="submit" className="fb-btn fb-btn-primary" disabled={enviando}>
          {enviando && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
          {textoEnviar}
        </button>
      </div>
    </form>
  );
}

export default FormularioUsuario;