import { inject, Injectable } from '@angular/core';
import { Database } from '../database/database';
import { Instrumento } from '../models/instrumento.model';

@Injectable({
  providedIn: 'root',
})
export class InstrumentoService {
  private dbService = inject(Database);

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

  async descreverUsos(id: number): Promise<string | null> {
    const resultado = await this.dbService
      .getConexao()
      .query('SELECT COUNT(*) AS total FROM musico WHERE instrumento = ? AND ativo = 1;', [id]);

    const total = resultado.values?.[0]?.total ?? 0;
    return total > 0 ? `${total} músico(s)` : null;
  }

  async excluir(id: number): Promise<void> {
    await this.dbService.getConexao().run('UPDATE instrumento SET ativo = 0 WHERE id = ?', [id]);
    await this.dbService.persistir();
  }
}
