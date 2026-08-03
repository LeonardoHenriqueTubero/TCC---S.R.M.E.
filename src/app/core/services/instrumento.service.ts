import { inject, Injectable } from '@angular/core';
import { Database } from '../database/database';
import { Instrumento } from '../models/instrumento.model';

@Injectable({
  providedIn: 'root',
})
export class InstrumentoService {
  private dbService = inject(Database);

  // Só traz os ativos: excluir() apenas marca ativo = 0 (exclusão lógica).
  // Ordena por família e depois por nome — a tela agrupa a lista por família.
  async listarTodos(): Promise<Instrumento[]> {
    const resultado = await this.dbService
      .getConexao()
      .query('SELECT * FROM instrumento WHERE ativo = 1 ORDER BY familia, nome;');
    return (resultado.values ?? []) as Instrumento[];
  }

  async buscarPorId(id: number): Promise<Instrumento | undefined> {
    const resultado = await this.dbService
      .getConexao()
      .query('SELECT * FROM instrumento WHERE id = ? AND ativo = 1;', [id]);
    return resultado.values?.[0];
  }

  // Omit de id (autoincremento) e ativo (nasce 1 pelo DEFAULT da tabela).
  async criar(instrumento: Omit<Instrumento, 'id' | 'ativo'>): Promise<void> {
    await this.dbService
      .getConexao()
      .run('INSERT INTO instrumento (nome, familia) VALUES (?, ?)', [
        instrumento.nome,
        instrumento.familia,
      ]);
    await this.dbService.persistir();
  }

  async atualizar(id: number, instrumento: Omit<Instrumento, 'id' | 'ativo'>): Promise<void> {
    await this.dbService
      .getConexao()
      .run('UPDATE instrumento SET nome = ?, familia = ? WHERE id = ?', [
        instrumento.nome,
        instrumento.familia,
        id,
      ]);
    await this.dbService.persistir();
  }

  // Descreve quem ainda usa este instrumento, ou null se ninguém usa.
  // Serve para bloquear a exclusão e explicar o motivo ao usuário.
  // Conta apenas registros ativos: um músico já excluído não impede nada.
  async descreverUsos(id: number): Promise<string | null> {
    const resultado = await this.dbService
      .getConexao()
      .query('SELECT COUNT(*) AS total FROM musico WHERE instrumento = ? AND ativo = 1;', [id]);

    const total = resultado.values?.[0]?.total ?? 0;
    return total > 0 ? `${total} músico(s)` : null;
  }

  // Exclusão lógica: o registro continua no banco (músicos antigos seguem
  // apontando para ele), mas some das listagens.
  async excluir(id: number): Promise<void> {
    await this.dbService.getConexao().run('UPDATE instrumento SET ativo = 0 WHERE id = ?', [id]);
    await this.dbService.persistir();
  }
}
