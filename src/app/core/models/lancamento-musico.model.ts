import { Musico } from "./musico.model";

export interface MusicoDoLancamento extends Musico {
  instrumentoNome: string | null
}

export interface LancamentoComMusicos {
  id: number;
  data: string;
  nomeEvento: string;
  nomeCasaOracao: string;
  musicos: MusicoDoLancamento[];
}
