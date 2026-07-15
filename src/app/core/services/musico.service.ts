import { inject, Injectable } from '@angular/core';
import { Database } from '../database/database';
import { Musico } from '../models/musico.model';

@Injectable({
  providedIn: 'root',
})
export class MusicoService {
  private dbService = inject(Database);

  async listarTodos(): Promise<Musico[]> {
    const resultado = await this.dbService.getConexao().query('SELECT * FROM musico WHERE ativo = 1;');
    return (resultado.values ?? []) as Musico[];
  }

  async buscarPorId(id: number): Promise<Musico | undefined> {
    const resultado = await this.dbService.getConexao().query('SELECT * FROM musico WHERE id = ? AND ativo = 1', [id]);
    return resultado.values?.[0];
  }

  async criar(musico: Musico): Promise<void> {
    await this.dbService.getConexao().run(
      'INSERT INTO musico (nome, oficializado, batizado, cargo, ativo, comum_congregacao, instrumento) VALUES (?, ?, ?, ?, 1, ?, ?)',
      [musico.nome, musico.oficializado, musico.batizado, musico.cargo, musico.comum_congregacao, musico.instrumento]
    );
    await this.dbService.persistir();
  }

  async atualizar(musico: Musico): Promise<void> {
    await this.dbService.getConexao().run('UPDATE musico SET nome=?, oficializado=?, batizado=?, cargo=?, comum_congregacao=?, instrumento=? WHERE id=?', [musico.nome, musico.oficializado, musico.batizado, musico.cargo, musico.comum_congregacao, musico.instrumento, musico.id]);
    await this.dbService.persistir();
  }

  async excluir(id: number): Promise<void> {
    await this.dbService.getConexao().run('UPDATE musico SET ativo=0 WHERE id=?', [id]);
    await this.dbService.persistir();
  }
}
