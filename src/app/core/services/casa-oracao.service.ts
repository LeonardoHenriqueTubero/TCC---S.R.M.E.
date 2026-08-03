import { inject, Injectable } from '@angular/core';
import { Database } from '../database/database';
import { CasaOracao } from '../models/casa-oracao.model';

@Injectable({
  providedIn: 'root',
})
export class CasaOracaoService {
  private dbService = inject(Database);

  async listarTodos(): Promise<CasaOracao[]> {
    const resultado = await this.dbService.getConexao().query('SELECT * FROM casaOracao ORDER BY nome;');
    return (resultado.values ?? []) as CasaOracao[];
  }

  // Omit de id (autoincremento) e ativo (nasce 1 pelo DEFAULT da tabela).
  async criar(casa: Omit<CasaOracao, 'id' | 'ativo'>): Promise<void> {
    await this.dbService
      .getConexao()
      .run('INSERT INTO casaOracao (nome, cidade) VALUES (?, ?)', [casa.nome, casa.cidade]);
    await this.dbService.persistir();
  }
}
