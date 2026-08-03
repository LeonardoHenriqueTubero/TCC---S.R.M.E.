import { inject, Injectable } from '@angular/core';
import { Database } from '../database/database';
import { Evento } from '../models/evento.model';

@Injectable({
  providedIn: 'root',
})
export class EventoService {
  private dbService = inject(Database);

  async listarTodos(): Promise<Evento[]> {
    const resultado = await this.dbService.getConexao().query('SELECT * FROM evento ORDER BY nome;');
    return (resultado.values ?? []) as Evento[];
  }

  // Omit de id (autoincremento) e ativo (nasce 1 pelo DEFAULT da tabela).
  async criar(evento: Omit<Evento, 'id' | 'ativo'>): Promise<void> {
    await this.dbService.getConexao().run('INSERT INTO evento (nome) VALUES (?)', [evento.nome]);
    await this.dbService.persistir();
  }
}
