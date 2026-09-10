import { inject, Injectable } from '@angular/core';
import { Database } from '../database/database';
import { Evento } from '../models/evento.model';

@Injectable({
  providedIn: 'root',
})
export class EventoService {
  private dbService = inject(Database);

  async listarTodos(): Promise<Evento[]> {
    const resultado = await this.dbService
      .getConexao()
      .query('SELECT * FROM evento WHERE ativo = 1 ORDER BY nome;');
    return (resultado.values ?? []) as Evento[];
  }

  async buscarPorId(id: number): Promise<Evento | undefined> {
    const resultado = await this.dbService
      .getConexao()
      .query('SELECT * FROM evento WHERE id = ? AND ativo = 1;', [id]);
    return resultado.values?.[0];
  }

  async criar(evento: Omit<Evento, 'id' | 'ativo'>): Promise<void> {
    await this.dbService.getConexao().run('INSERT INTO evento (nome) VALUES (?)', [evento.nome]);
    await this.dbService.persistir();
  }

  async atualizar(id: number, evento: Omit<Evento, 'id' | 'ativo'>): Promise<void> {
    await this.dbService
      .getConexao()
      .run('UPDATE evento SET nome = ? WHERE id = ?', [evento.nome, id]);
    await this.dbService.persistir();
  }

  async descreverUsos(id: number): Promise<string | null> {
    const resultado = await this.dbService
      .getConexao()
      .query('SELECT COUNT(*) AS total FROM lancamento WHERE evento = ? AND ativo = 1;', [id]);

    const total = resultado.values?.[0]?.total ?? 0;
    return total > 0 ? `${total} lançamento(s)` : null;
  }

  async excluir(id: number): Promise<void> {
    await this.dbService.getConexao().run('UPDATE evento SET ativo = 0 WHERE id = ?', [id]);
    await this.dbService.persistir();
  }
}
