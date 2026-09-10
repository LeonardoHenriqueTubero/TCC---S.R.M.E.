import { inject, Injectable } from '@angular/core';
import { Database } from '../database/database';

export interface Fatia {
  nome: string;
  total: number;
}

export interface LancamentoRecente {
  id: number;
  data: string;
  evento: string | null;
  casa: string | null;
  musicos: number;
}

export interface ResumoPainel {
  musicos: number;
  casas: number;
  eventos: number;
  instrumentos: number;
  lancamentos: number;
  porFamilia: Fatia[];
  porCasa: Fatia[];
  recentes: LancamentoRecente[];
}

@Injectable({
  providedIn: 'root',
})
export class PainelService {
  private readonly dbService = inject(Database);

  async carregar(): Promise<ResumoPainel> {
    const conexao = this.dbService.getConexao();

    const contar = async (tabela: string): Promise<number> => {
      const { values } = await conexao.query(
        `SELECT COUNT(*) AS total FROM ${tabela} WHERE ativo = 1;`
      );
      return values?.[0]?.total ?? 0;
    };

    const [musicos, casas, eventos, instrumentos, lancamentos] = await Promise.all([
      contar('musico'),
      contar('casaOracao'),
      contar('evento'),
      contar('instrumento'),
      contar('lancamento'),
    ]);

    const familiaConsulta = await conexao.query(`
      SELECT i.familia AS nome, COUNT(*) AS total
      FROM musico m
      JOIN instrumento i ON i.id = m.instrumento
      WHERE m.ativo = 1 AND i.ativo = 1
      GROUP BY i.familia
      ORDER BY total DESC, i.familia;
    `);

    const casaConsulta = await conexao.query(`
      SELECT c.nome AS nome, COUNT(m.id) AS total
      FROM casaOracao c
      LEFT JOIN musico m ON m.comum_congregacao = c.id AND m.ativo = 1
      WHERE c.ativo = 1
      GROUP BY c.id
      ORDER BY total DESC, c.nome;
    `);

    const recenteConsulta = await conexao.query(`
      SELECT l.id, l.data, e.nome AS evento, c.nome AS casa,
             (SELECT COUNT(*) FROM lancamento_musico lm WHERE lm.id_lancamento = l.id) AS musicos
      FROM lancamento l
      LEFT JOIN evento e ON e.id = l.evento
      LEFT JOIN casaOracao c ON c.id = l.local
      WHERE l.ativo = 1
      ORDER BY l.data DESC, l.id DESC
      LIMIT 5;
    `);

    return {
      musicos,
      casas,
      eventos,
      instrumentos,
      lancamentos,
      porFamilia: (familiaConsulta.values ?? []) as Fatia[],
      porCasa: (casaConsulta.values ?? []) as Fatia[],
      recentes: (recenteConsulta.values ?? []) as LancamentoRecente[],
    };
  }
}
