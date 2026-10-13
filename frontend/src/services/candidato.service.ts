import api from "./api";
const candidatoService = {
  inscribir: (id_eleccion: number, propuesta?: string) =>
    api.post("/candidatos", { id_eleccion, propuesta }).then(r => r.data),
  retirar: (id_candidato: number) =>
    api.delete(`/candidatos/${id_candidato}`).then(r => r.data),
};
export default candidatoService;