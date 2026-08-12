import { inject, Injectable } from '@angular/core';
import { Database } from '../database/database';
import { Lancamento } from '../models/lancamento.model';
import { LancamentoComMusicos, MusicoDoLancamento } from '../models/lancamento-musico.model';

@Injectable({
  providedIn: 'root',
})
export class LancamentoService {
  private dbService = inject(Database);

  // Retorna cada lançamento já com o nome do evento, o nome da casa de oração
  // e a lista de músicos que participaram — pronto para exibir na tela.
  async listarComMusicos(): Promise<LancamentoComMusicos[]> {
    const conexao = this.dbService.getConexao();

    // 1) os lançamentos ativos, trocando os ids (evento/local) pelos nomes via JOIN.
    const resultado = await conexao.query(`
      SELECT l.id, l.data, e.nome AS nomeEvento, c.nome AS nomeCasaOracao
      FROM lancamento l
      JOIN evento e ON e.id = l.evento
      JOIN casaOracao c ON c.id = l.local
      WHERE l.ativo = 1
      ORDER BY l.data DESC;
    `);

    const lancamentos = (resultado.values ?? []) as Omit<LancamentoComMusicos, 'musicos'>[];

    // 2) para cada lançamento, busca os músicos ligados pela tabela lancamento_musico.
    // (Uma consulta por lançamento; simples e suficiente para a quantidade de dados aqui.)
    const completos: LancamentoComMusicos[] = [];
    for (const lancamento of lancamentos) {
      // Sem filtro por m.ativo: um lançamento é um registro histórico, então
      // quem participou continua listado mesmo que o músico tenha sido excluído
      // depois. (O músico some da aba Músicos e dos formulários, não daqui.)
      // LEFT JOIN no instrumento: o músico pode não ter um, e o cadastro dele
      // pode ter sido excluído depois de vinculado.
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

  // Ids dos músicos ligados ao lançamento — usado para marcar os checkboxes
  // ao abrir o formulário em modo de edição.
  async listarMusicoIds(lancamentoId: number): Promise<number[]> {
    const resultado = await this.dbService
      .getConexao()
      .query('SELECT id_musico FROM lancamento_musico WHERE id_lancamento = ?;', [lancamentoId]);
    return (resultado.values ?? []).map((linha: { id_musico: number }) => linha.id_musico);
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

    // A forma mais simples de refletir a nova seleção é apagar os vínculos
    // antigos e recriar. lancamento_musico é só uma tabela de ligação, então
    // não há exclusão lógica aqui.
    await conexao.run('DELETE FROM lancamento_musico WHERE id_lancamento = ?', [id]);
    await this.ligarMusicos(id, musicoIds);

    await this.dbService.persistir();
  }

  // Exclusão lógica: o lançamento some das listagens, mas continua no banco
  // junto com seus vínculos em lancamento_musico.
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
