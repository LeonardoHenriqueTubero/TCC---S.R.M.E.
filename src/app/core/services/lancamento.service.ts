import { inject, Injectable } from '@angular/core';
import { Database } from '../database/database';
import { Lancamento } from '../models/lancamento.model';
import { LancamentoComMusicos, MusicoDoLancamento } from '../models/lancamento-musico.model';

@Injectable({
  providedIn: 'root',
})
export class LancamentoService {
  private dbService = inject(Database);

  async listarComMusicos(): Promise<LancamentoComMusicos[]> {
    const conexao = this.dbService.getConexao();

    const resultado = await conexao.query(`
      SELECT l.id, l.data, e.nome AS nomeEvento, c.nome AS nomeCasaOracao
      FROM lancamento l
      JOIN evento e ON e.id = l.evento
      JOIN casaOracao c ON c.id = l.local
      WHERE l.ativo = 1
      ORDER BY l.data DESC;
    `);

    const lancamentos = (resultado.values ?? []) as Omit<LancamentoComMusicos, 'musicos'>[];

    const completos: LancamentoComMusicos[] = [];
    for (const lancamento of lancamentos) {
      const musicosResultado = await conexao.query(
        `
        SELECT m.*, i.nome AS instrumentoNome
        FROM musico m
        JOIN lancamento_musico lm ON lm.id_musico = m.id
        LEFT JOIN instrumento i ON i.id = m.instrumento
        WHERE lm.id_lancamento = ?
        ORDER BY m.nome;
        `,
        [lancamento.id]
      );

      completos.push({
        ...lancamento,
        musicos: (musicosResultado.values ?? []) as MusicoDoLancamento[],
      });
    }

    return completos;
  }

  async buscarPorId(id: number): Promise<Lancamento | undefined> {
    const resultado = await this.dbService
      .getConexao()
      .query('SELECT * FROM lancamento WHERE id = ? AND ativo = 1;', [id]);
    return resultado.values?.[0];
  }

  async listarMusicoIds(lancamentoId: number): Promise<number[]> {
    const resultado = await this.dbService
      .getConexao()
      .query('SELECT id_musico FROM lancamento_musico WHERE id_lancamento = ?;', [lancamentoId]);
    return (resultado.values ?? []).map((linha: { id_musico: number }) => linha.id_musico);
  }

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

    await this.ligarMusicos(lancamentoId, musicoIds);
    await this.dbService.persistir();
  }

  async atualizar(
    id: number,
    lancamento: Omit<Lancamento, 'id' | 'ativo'>,
    musicoIds: number[]
  ): Promise<void> {
    const conexao = this.dbService.getConexao();

    await conexao.run('UPDATE lancamento SET data = ?, local = ?, evento = ? WHERE id = ?', [
      lancamento.data,
      lancamento.local,
      lancamento.evento,
      id,
    ]);

    await conexao.run('DELETE FROM lancamento_musico WHERE id_lancamento = ?', [id]);
    await this.ligarMusicos(id, musicoIds);

    await this.dbService.persistir();
  }

  async excluir(id: number): Promise<void> {
    await this.dbService.getConexao().run('UPDATE lancamento SET ativo = 0 WHERE id = ?', [id]);
    await this.dbService.persistir();
  }

  private async ligarMusicos(lancamentoId: number, musicoIds: number[]): Promise<void> {
    const conexao = this.dbService.getConexao();

    for (const musicoId of musicoIds) {
      await conexao.run('INSERT INTO lancamento_musico (id_lancamento, id_musico) VALUES (?, ?)', [
        lancamentoId,
        musicoId,
      ]);
    }
  }
}
