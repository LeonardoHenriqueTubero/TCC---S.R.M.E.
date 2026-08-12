import { Musico } from "./musico.model";

/**
 * Músico de um lançamento com o instrumento já pelo nome, para o card da
 * listagem não precisar cruzar o id na tela.
 *
 * Traz menos que o MusicoListado, que resolve também a casa de oração: o card
 * do lançamento não mostra a casa, e o JOIN a mais custaria uma vez por
 * lançamento da tela.
 *
 * Nulo quando o músico não tem instrumento ou quando o instrumento foi
 * excluído depois de vinculado.
 */
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
