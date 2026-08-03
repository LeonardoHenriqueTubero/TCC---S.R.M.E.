import { inject, Injectable } from '@angular/core';
import { Database } from '../database/database';
import { Musico } from '../models/musico.model';

@Injectable({
  providedIn: 'root',
})
export class MusicoService {
  private dbService = inject(Database);

  // Só traz os ativos: excluir() apenas marca ativo = 0 (exclusão lógica).
  async listarTodos(): Promise<Musico[]> {
    const resultado = await this.dbService
      .getConexao()
      .query('SELECT * FROM musico WHERE ativo = 1 ORDER BY nome;');
    return (resultado.values ?? []) as Musico[];
  }

  async buscarPorId(id: number): Promise<Musico | undefined> {
    const resultado = await this.dbService
      .getConexao()
      .query('SELECT * FROM musico WHERE id = ? AND ativo = 1;', [id]);
    return resultado.values?.[0];
  }

  // Omit de id (autoincremento) e ativo (todo músico novo nasce ativo).
  async criar(musico: Omit<Musico, 'id' | 'ativo'>): Promise<void> {
    await this.dbService
      .getConexao()
      .run(
        'INSERT INTO musico (nome, oficializado, batizado, cargo, ativo, comum_congregacao, instrumento) VALUES (?, ?, ?, ?, 1, ?, ?)',
        [
          musico.nome,
          musico.oficializado,
          musico.batizado,
          musico.cargo,
          musico.comum_congregacao,
          musico.instrumento,
        ]
      );
    await this.dbService.persistir();
  }

  async atualizar(id: number, musico: Omit<Musico, 'id' | 'ativo'>): Promise<void> {
    await this.dbService
      .getConexao()
      .run(
        'UPDATE musico SET nome = ?, oficializado = ?, batizado = ?, cargo = ?, comum_congregacao = ?, instrumento = ? WHERE id = ?',
        [
          musico.nome,
          musico.oficializado,
          musico.batizado,
          musico.cargo,
          musico.comum_congregacao,
          musico.instrumento,
          id,
        ]
      );
    await this.dbService.persistir();
  }

  // Exclusão lógica: o registro continua no banco (lançamentos antigos seguem
  // apontando para ele), mas some das listagens.
  async excluir(id: number): Promise<void> {
    await this.dbService.getConexao().run('UPDATE musico SET ativo = 0 WHERE id = ?', [id]);
    await this.dbService.persistir();
  }
}
