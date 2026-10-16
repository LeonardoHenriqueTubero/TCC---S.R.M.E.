import { Musico } from "./musico.model";

export interface MusicoDoLancamento extends Musico {
  instrumentoNome: string | null
  instrumentoFamilia: string | null
}

export interface Visita {
  nome: string | null;
  instrumento: number | null;
}

export interface VisitaDoLancamento {
  nome: string;
  anonima: boolean;
  instrumentoNome: string | null;
  instrumentoFamilia: string | null;
}

export interface LancamentoComMusicos {
  id: number;
  data: string;
  nomeEvento: string;
  nomeCasaOracao: string;
  musicos: MusicoDoLancamento[];
  visitas: VisitaDoLancamento[];
}
