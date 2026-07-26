import { inject, Injectable } from '@angular/core';
import { Database } from '../database/database';
import { Instrumento } from '../models/instrumento.model';

@Injectable({
  providedIn: 'root',
})
export class InstrumentoService {
  private dbService = inject(Database);

  async listarTodos(): Promise<Instrumento[]> {
    // Ordena por família e depois por nome — a tela agrupa a lista por família.
    const resultado = await this.dbService
      .getConexao()
      .query('SELECT * FROM instrumento ORDER BY familia, nome;');
    return (resultado.values ?? []) as Instrumento[];
  }

  async criar(instrumento: Instrumento): Promise<void> {
    await this.dbService
      .getConexao()
      .run('INSERT INTO instrumento (nome, familia) VALUES (?, ?)', [
        instrumento.nome,
        instrumento.familia,
      ]);
    await this.dbService.persistir();
  }
}
