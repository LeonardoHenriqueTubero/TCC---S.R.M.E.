import { inject, Injectable } from '@angular/core';
import { Database } from '../database/database';
import { Lancamento } from '../models/lancamento.model';
import { LancamentoComMusicos } from '../models/lancamento-musico.model';
import { Musico } from '../models/musico.model';

@Injectable({
  providedIn: 'root',
})
export class LancamentoService {
  private dbService = inject(Database);

  // Retorna cada lançamento já com o nome do evento, o nome da casa de oração
  // e a lista de músicos que participaram — pronto para exibir na tela.
  async listarComMusicos(): Promise<LancamentoComMusicos[]> {
    const conexao = this.dbService.getConexao();

    // 1) os lançamentos, trocando os ids (evento/local) pelos nomes via JOIN.
    const resultado = await conexao.query(`
      SELECT l.id, l.data, e.nome AS nomeEvento, c.nome AS nomeCasaOracao
      FROM lancamento l
      JOIN evento e ON e.id = l.evento
      JOIN casaOracao c ON c.id = l.local
      ORDER BY l.data DESC;
    `);

    const lancamentos = (resultado.values ?? []) as Omit<LancamentoComMusicos, 'musicos'>[];

    // 2) para cada lançamento, busca os músicos ligados pela tabela lancamento_musico.
    // (Uma consulta por lançamento; simples e suficiente para a quantidade de dados aqui.)
    const completos: LancamentoComMusicos[] = [];
    for (const lancamento of lancamentos) {
      const musicosResultado = await conexao.query(
        `
        SELECT m.*
        FROM musico m
        JOIN lancamento_musico lm ON lm.id_musico = m.id
        WHERE lm.id_lancamento = ?
        ORDER BY m.nome;
        `,
        [lancamento.id]
      );

      completos.push({
        ...lancamento,
        musicos: (musicosResultado.values ?? []) as Musico[],
      });
    }

    return completos;
  }

  // Cria o lançamento e, em seguida, liga cada músico selecionado a ele na
  // tabela lancamento_musico. O id do lançamento recém-inserido vem do lastId
  // retornado pelo run() do INSERT.
  // Omit de id (autoincremento) e ativo (nasce 1 pelo DEFAULT da tabela).
  async criar(lancamento: Omit<Lancamento, 'id' | 'ativo'>, musicoIds: number[]): Promise<void> {
    const conexao = this.dbService.getConexao();

    const resultado = await conexao.run(
      'INSERT INTO lancamento (data, local, evento) VALUES (?, ?, ?)',
      [lancamento.data, lancamento.local, lancamento.evento]
    );

    const lancamentoId = resultado.changes?.lastId;
    if (lancamentoId === undefined || lancamentoId < 0) {
      throw new Error('Não foi possível obter o id do lançamento criado.');
    }

    for (const musicoId of musicoIds) {
      await conexao.run(
        'INSERT INTO lancamento_musico (id_lancamento, id_musico) VALUES (?, ?)',
        [lancamentoId, musicoId]
      );
    }

    await this.dbService.persistir();
  }
}
