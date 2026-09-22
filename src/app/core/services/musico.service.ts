import { inject, Injectable } from '@angular/core';
import { Database } from '../database/database';
import { Musico, MusicoListado } from '../models/musico.model';
import { normalizar } from '../texto';

@Injectable({
  providedIn: 'root',
})
export class MusicoService {
  private dbService = inject(Database);

  async listarTodos(): Promise<Musico[]> {
    const resultado = await this.dbService
      .getConexao()
      .query('SELECT * FROM musico WHERE ativo = 1 ORDER BY nome;');
    return (resultado.values ?? []) as Musico[];
  }

  async listarComNomes(): Promise<MusicoListado[]> {
    const resultado = await this.dbService.getConexao().query(`
      SELECT m.*, i.nome AS instrumentoNome, c.nome AS casaNome
      FROM musico m
      LEFT JOIN instrumento i ON i.id = m.instrumento
      LEFT JOIN casaOracao c ON c.id = m.comum_congregacao
      WHERE m.ativo = 1
      ORDER BY m.nome;
    `);
    return (resultado.values ?? []) as MusicoListado[];
  }

  async buscarPorId(id: number): Promise<Musico | undefined> {
    const resultado = await this.dbService
      .getConexao()
      .query('SELECT * FROM musico WHERE id = ? AND ativo = 1;', [id]);
    return resultado.values?.[0];
  }

  async existeAtivoComNome(nome: string, ignorarId?: number): Promise<boolean> {
    const procurado = this.chaveNome(nome);
    const resultado = await this.dbService
      .getConexao()
      .query('SELECT id, nome FROM musico WHERE ativo = 1;');
    const ativos = (resultado.values ?? []) as Pick<Musico, 'id' | 'nome'>[];
    return ativos.some((m) => m.id !== ignorarId && this.chaveNome(m.nome) === procurado);
  }

  private chaveNome(nome: string): string {
    return normalizar(nome.trim().replace(/\s+/g, ' '));
  }

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

  async excluir(id: number): Promise<void> {
    await this.dbService.getConexao().run('UPDATE musico SET ativo = 0 WHERE id = ?', [id]);
    await this.dbService.persistir();
  }
}
