import { inject, Injectable } from '@angular/core';
import { Database } from '../database/database';
import { CasaOracao } from '../models/casa-oracao.model';

@Injectable({
  providedIn: 'root',
})
export class CasaOracaoService {
  private dbService = inject(Database);

  // Só traz os ativos: excluir() apenas marca ativo = 0 (exclusão lógica).
  async listarTodos(): Promise<CasaOracao[]> {
    const resultado = await this.dbService
      .getConexao()
      .query('SELECT * FROM casaOracao WHERE ativo = 1 ORDER BY nome;');
    return (resultado.values ?? []) as CasaOracao[];
  }

  async buscarPorId(id: number): Promise<CasaOracao | undefined> {
    const resultado = await this.dbService
      .getConexao()
      .query('SELECT * FROM casaOracao WHERE id = ? AND ativo = 1;', [id]);
    return resultado.values?.[0];
  }

  // Omit de id (autoincremento) e ativo (nasce 1 pelo DEFAULT da tabela).
  async criar(casa: Omit<CasaOracao, 'id' | 'ativo'>): Promise<void> {
    await this.dbService
      .getConexao()
      .run('INSERT INTO casaOracao (nome, cidade) VALUES (?, ?)', [casa.nome, casa.cidade]);
    await this.dbService.persistir();
  }

  async atualizar(id: number, casa: Omit<CasaOracao, 'id' | 'ativo'>): Promise<void> {
    await this.dbService
      .getConexao()
      .run('UPDATE casaOracao SET nome = ?, cidade = ? WHERE id = ?', [casa.nome, casa.cidade, id]);
    await this.dbService.persistir();
  }

  // Descreve quem ainda usa esta casa de oração, ou null se ninguém usa.
  // Serve para bloquear a exclusão e explicar o motivo ao usuário.
  // Conta apenas registros ativos: um músico já excluído não impede nada.
  async descreverUsos(id: number): Promise<string | null> {
    const conexao = this.dbService.getConexao();

    const musicos = await conexao.query(
      'SELECT COUNT(*) AS total FROM musico WHERE comum_congregacao = ? AND ativo = 1;',
      [id]
    );
    const lancamentos = await conexao.query(
      'SELECT COUNT(*) AS total FROM lancamento WHERE local = ? AND ativo = 1;',
      [id]
    );

    const totalMusicos = musicos.values?.[0]?.total ?? 0;
    const totalLancamentos = lancamentos.values?.[0]?.total ?? 0;

    const partes: string[] = [];
    if (totalMusicos > 0) {
      partes.push(`${totalMusicos} músico(s)`);
    }
    if (totalLancamentos > 0) {
      partes.push(`${totalLancamentos} lançamento(s)`);
    }

    return partes.length > 0 ? partes.join(' e ') : null;
  }

  // Exclusão lógica: o registro continua no banco (lançamentos e músicos antigos
  // seguem apontando para ele), mas some das listagens.
  async excluir(id: number): Promise<void> {
    await this.dbService.getConexao().run('UPDATE casaOracao SET ativo = 0 WHERE id = ?', [id]);
    await this.dbService.persistir();
  }
}
