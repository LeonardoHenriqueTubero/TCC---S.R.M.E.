import { Musico } from "./musico.model";

export interface LancamentoComMusicos {
  id: number;
  data: string;
  nomeEvento: string;
  nomeCasaOracao: string;
  musicos: Musico[];
}