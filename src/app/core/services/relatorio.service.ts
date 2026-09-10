import { inject, Injectable } from '@angular/core';
import { Database } from '../database/database';
import { Relatorio, SecaoRelatorio } from '../../shared/services/pdf.service';

interface LinhaMusico {
  nome: string;
  instrumento: string | null;
  familia: string | null;
  casa: string | null;
  cidade: string | null;
  cargo: string;
  oficializado: string;
  batizado: string;
}

const SEM_VALOR = '—';

export interface FiltroPeriodo {
  dataInicial: string;
  dataFinal: string;
}

export interface FiltroMusico extends FiltroPeriodo {
  musicoId: number;
}

export interface FiltroEvento extends FiltroPeriodo {
  casaId: number | null;
}

export interface FiltroFamilia {
  familias: string[];
  casaId: number | null;
}

export interface FiltroCasa {
  casaId: number | null;
}

interface CasaDaRelacao {
  id: number;
  nome: string;
}

interface ParticipanteDoEvento {
  lancamentoId: number;
  nome: string;
  instrumento: string | null;
  familia: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class RelatorioService {
  private readonly dbService = inject(Database);

  async porMusico(filtro: FiltroMusico): Promise<Relatorio> {
    const conexao = this.dbService.getConexao();

    const musico = await conexao.query('SELECT nome FROM musico WHERE id = ?;', [filtro.musicoId]);
    const nome = ((musico.values ?? [])[0] as { nome: string } | undefined)?.nome ?? 'Músico';

    const resultado = await conexao.query(
      `
      SELECT l.data, e.nome AS evento, c.nome AS casa
      FROM lancamento l
      JOIN lancamento_musico lm ON lm.id_lancamento = l.id
      LEFT JOIN evento e ON e.id = l.evento
      LEFT JOIN casaOracao c ON c.id = l.local
      WHERE lm.id_musico = ? AND l.ativo = 1 AND l.data BETWEEN ? AND ?
      ORDER BY l.data;
      `,
      [filtro.musicoId, filtro.dataInicial, filtro.dataFinal]
    );

    const participacoes = (resultado.values ?? []) as {
      data: string;
      evento: string | null;
      casa: string | null;
    }[];

    return {
      titulo: 'Relatório por Músico',
      subtitulo: `${nome} · ${this.descreverPeriodo(filtro)} · ${this.contar(participacoes.length, 'evento', 'eventos')}`,
      nomeArquivo: `relatorio-musico-${this.apelidar(nome)}`,
      secoes: [
        {
          colunas: ['Data', 'Evento', 'Casa de Oração'],
          linhas: participacoes.map((p) => [
            this.formatarData(p.data),
            p.evento ?? SEM_VALOR,
            p.casa ?? SEM_VALOR,
          ]),
        },
      ],
    };
  }

  async porCasaOracao(filtro: FiltroCasa): Promise<Relatorio> {
    const musicos = await this.buscarMusicos(filtro.casaId);

    const casas = await this.dbService
      .getConexao()
      .query(
        `SELECT nome, cidade FROM casaOracao
         WHERE ativo = 1 ${filtro.casaId !== null ? 'AND id = ?' : ''}
         ORDER BY nome;`,
        filtro.casaId !== null ? [filtro.casaId] : []
      );

    const listaCasas = (casas.values ?? []) as { nome: string; cidade: string }[];

    const secoes: SecaoRelatorio[] = listaCasas.map((casa) => {
      const daCasa = musicos.filter((m) => m.casa === casa.nome);

      return {
        titulo: `${casa.nome} — ${casa.cidade} (${this.contar(daCasa.length, 'músico', 'músicos')})`,
        colunas: ['Nome', 'Instrumento', 'Cargo', 'Oficializado'],
        linhas: daCasa.map((m) => [m.nome, m.instrumento ?? SEM_VALOR, m.cargo, m.oficializado]),
      };
    });

    if (listaCasas.length > 0) {
      const totais: (string | number)[][] = listaCasas.map((casa) => [
        casa.nome,
        musicos.filter((m) => m.casa === casa.nome).length,
      ]);

      if (listaCasas.length > 1) {
        totais.push(['TOTAL', musicos.length]);
      }

      secoes.push({
        titulo: 'Total de músicos por casa',
        colunas: ['Casa de Oração', 'Músicos'],
        linhas: totais,
      });
    }

    return {
      titulo: 'Relatório por Casa de Oração',
      subtitulo: this.contar(listaCasas.length, 'casa de oração', 'casas de oração'),
      nomeArquivo: 'relatorio-casas-oracao',
      secoes,
    };
  }

  async listarFamilias(): Promise<string[]> {
    const resultado = await this.dbService
      .getConexao()
      .query('SELECT DISTINCT familia FROM instrumento WHERE ativo = 1 ORDER BY familia;');

    return ((resultado.values ?? []) as { familia: string }[]).map((f) => f.familia);
  }

  async porFamiliaInstrumento(filtro: FiltroFamilia): Promise<Relatorio> {
    const conexao = this.dbService.getConexao();
    const porCasa = filtro.casaId !== null;

    const espacos = filtro.familias.map(() => '?').join(', ');

    const resultado = await conexao.query(
      `
      SELECT m.nome, i.nome AS instrumento, i.familia, c.nome AS casa
      FROM musico m
      JOIN instrumento i ON i.id = m.instrumento
      LEFT JOIN casaOracao c ON c.id = m.comum_congregacao
      WHERE m.ativo = 1 AND i.familia IN (${espacos})
        ${porCasa ? 'AND m.comum_congregacao = ?' : ''}
      ORDER BY i.familia, m.nome;
      `,
      porCasa ? [...filtro.familias, filtro.casaId] : [...filtro.familias]
    );

    const musicos = (resultado.values ?? []) as {
      nome: string;
      instrumento: string;
      familia: string;
      casa: string | null;
    }[];

    const secoes: SecaoRelatorio[] = filtro.familias.map((familia) => {
      const daFamilia = musicos.filter((m) => m.familia === familia);

      return {
        titulo: `${familia} (${this.contar(daFamilia.length, 'músico', 'músicos')})`,
        colunas: ['Nome', 'Instrumento', ...(porCasa ? [] : ['Casa de Oração'])],
        linhas: daFamilia.map((m) => [
          m.nome,
          m.instrumento,
          ...(porCasa ? [] : [m.casa ?? SEM_VALOR]),
        ]),
      };
    });

    const relacao = await this.relacaoDasOrquestras(filtro);
    if (relacao) {
      secoes.push(relacao);
    }

    return {
      titulo: 'Relatório por Família de Instrumentos',
      subtitulo: [
        filtro.familias.join(', '),
        porCasa ? await this.nomeDaCasa(filtro.casaId as number) : null,
        this.contar(musicos.length, 'músico', 'músicos'),
      ]
        .filter((parte) => parte !== null)
        .join(' · '),
      nomeArquivo: 'relatorio-familias-instrumentos',
      secoes,
    };
  }

  private async relacaoDasOrquestras(filtro: FiltroFamilia): Promise<SecaoRelatorio | null> {
    const conexao = this.dbService.getConexao();
    const porCasa = filtro.casaId !== null;

    const casasConsulta = await conexao.query(
      `
      SELECT c.id, c.nome
      FROM casaOracao c
      WHERE c.ativo = 1 ${porCasa ? 'AND c.id = ?' : ''}
      ORDER BY c.nome;
      `,
      porCasa ? [filtro.casaId] : []
    );

    const casas = (casasConsulta.values ?? []) as CasaDaRelacao[];
    if (casas.length === 0) {
      return null;
    }

    const espacos = filtro.familias.map(() => '?').join(', ');
    const contagemConsulta = await conexao.query(
      `
      SELECT m.comum_congregacao AS casaId, i.familia, COUNT(*) AS total
      FROM musico m
      JOIN instrumento i ON i.id = m.instrumento
      WHERE m.ativo = 1 AND i.familia IN (${espacos})
        ${porCasa ? 'AND m.comum_congregacao = ?' : ''}
      GROUP BY m.comum_congregacao, i.familia;
      `,
      porCasa ? [...filtro.familias, filtro.casaId] : [...filtro.familias]
    );

    const contagens = (contagemConsulta.values ?? []) as {
      casaId: number;
      familia: string;
      total: number;
    }[];

    const quantos = (casaId: number, familia: string): number =>
      contagens.find((c) => c.casaId === casaId && c.familia === familia)?.total ?? 0;

    const nasFamilias = (casaId: number): number =>
      filtro.familias.reduce((soma, familia) => soma + quantos(casaId, familia), 0);

    const linhas: (string | number)[][] = casas.map((casa) => [
      casa.nome,
      ...filtro.familias.map((familia) =>
        this.percentual(quantos(casa.id, familia), nasFamilias(casa.id))
      ),
      nasFamilias(casa.id),
    ]);

    if (casas.length > 1) {
      const efetivo = casas.reduce((soma, casa) => soma + nasFamilias(casa.id), 0);
      linhas.push([
        'TOTAL',
        ...filtro.familias.map((familia) => {
          const somaFamilia = casas.reduce((soma, casa) => soma + quantos(casa.id, familia), 0);
          return this.percentual(somaFamilia, efetivo);
        }),
        efetivo,
      ]);
    }

    return {
      titulo: 'Relação final das orquestras',
      colunas: ['Casa de Oração', ...filtro.familias, 'Músicos nas famílias'],
      linhas,
    };
  }

  private percentual(parte: number, total: number): string {
    if (total === 0) {
      return SEM_VALOR;
    }
    return `${((parte / total) * 100).toFixed(1).replace('.', ',')}%`;
  }

  async porEvento(filtro: FiltroEvento): Promise<Relatorio> {
    const conexao = this.dbService.getConexao();

    const porCasa = filtro.casaId !== null;

    const resultado = await conexao.query(
      `
      SELECT l.id, l.data, e.nome AS evento, c.nome AS casa
      FROM lancamento l
      LEFT JOIN evento e ON e.id = l.evento
      LEFT JOIN casaOracao c ON c.id = l.local
      WHERE l.ativo = 1 AND l.data BETWEEN ? AND ?
        ${porCasa ? 'AND l.local = ?' : ''}
      ORDER BY l.data;
      `,
      porCasa
        ? [filtro.dataInicial, filtro.dataFinal, filtro.casaId]
        : [filtro.dataInicial, filtro.dataFinal]
    );

    const lancamentos = (resultado.values ?? []) as {
      id: number;
      data: string;
      evento: string | null;
      casa: string | null;
    }[];

    const participantes = await this.participantesDe(lancamentos.map((l) => l.id));

    const secoes: SecaoRelatorio[] = lancamentos.map((lancamento) => {
      const doEvento = participantes.filter((p) => p.lancamentoId === lancamento.id);

      return {
        titulo: `${lancamento.evento ?? SEM_VALOR} — ${this.formatarData(lancamento.data)} — ${
          lancamento.casa ?? SEM_VALOR
        } (${this.contar(doEvento.length, 'músico', 'músicos')})`,
        colunas: ['Músico', 'Instrumento', 'Família'],
        linhas: doEvento.map((p) => [
          p.nome,
          p.instrumento ?? SEM_VALOR,
          p.familia ?? SEM_VALOR,
        ]),
      };
    });

    const relacao = await this.relacaoDosEventos(lancamentos, participantes);
    if (relacao) {
      secoes.push(relacao);
    }

    const nomeCasa = porCasa ? await this.nomeDaCasa(filtro.casaId as number) : null;

    return {
      titulo: 'Relatório por Evento',
      subtitulo: [
        this.descreverPeriodo(filtro),
        nomeCasa,
        this.contar(lancamentos.length, 'evento', 'eventos'),
      ]
        .filter((parte) => parte !== null)
        .join(' · '),
      nomeArquivo: 'relatorio-eventos',
      secoes,
    };
  }

  private async participantesDe(lancamentoIds: number[]): Promise<ParticipanteDoEvento[]> {
    if (lancamentoIds.length === 0) {
      return [];
    }

    const espacos = lancamentoIds.map(() => '?').join(', ');
    const resultado = await this.dbService.getConexao().query(
      `
      SELECT lm.id_lancamento AS lancamentoId, m.nome,
             i.nome AS instrumento, i.familia
      FROM lancamento_musico lm
      JOIN musico m ON m.id = lm.id_musico
      LEFT JOIN instrumento i ON i.id = m.instrumento
      WHERE lm.id_lancamento IN (${espacos})
      ORDER BY m.nome;
      `,
      lancamentoIds
    );

    return (resultado.values ?? []) as ParticipanteDoEvento[];
  }

  private async relacaoDosEventos(
    lancamentos: { id: number; data: string; evento: string | null }[],
    participantes: ParticipanteDoEvento[]
  ): Promise<SecaoRelatorio | null> {
    if (lancamentos.length === 0) {
      return null;
    }

    const familias = await this.listarFamilias();
    if (familias.length === 0) {
      return null;
    }

    const quantos = (lancamentoId: number, familia: string): number =>
      participantes.filter((p) => p.lancamentoId === lancamentoId && p.familia === familia).length;

    const totalDe = (lancamentoId: number): number =>
      participantes.filter((p) => p.lancamentoId === lancamentoId).length;

    const linhas: (string | number)[][] = lancamentos.map((lancamento) => [
      this.formatarData(lancamento.data),
      lancamento.evento ?? SEM_VALOR,
      ...familias.map((familia) =>
        this.percentual(quantos(lancamento.id, familia), totalDe(lancamento.id))
      ),
      totalDe(lancamento.id),
    ]);

    if (lancamentos.length > 1) {
      const efetivo = participantes.length;
      linhas.push([
        'TOTAL',
        '',
        ...familias.map((familia) =>
          this.percentual(participantes.filter((p) => p.familia === familia).length, efetivo)
        ),
        efetivo,
      ]);
    }

    return {
      titulo: 'Relação final da orquestra',
      colunas: ['Data', 'Evento', ...familias, 'Músicos'],
      linhas,
    };
  }

  private async nomeDaCasa(id: number): Promise<string> {
    const resultado = await this.dbService
      .getConexao()
      .query('SELECT nome FROM casaOracao WHERE id = ?;', [id]);

    return ((resultado.values ?? [])[0] as { nome: string } | undefined)?.nome ?? 'Casa de oração';
  }

  private async buscarMusicos(casaId: number | null): Promise<LinhaMusico[]> {
    const resultado = await this.dbService.getConexao().query(
      `
      SELECT m.nome, m.cargo, m.oficializado, m.batizado,
             i.nome AS instrumento, i.familia AS familia,
             c.nome AS casa, c.cidade AS cidade
      FROM musico m
      LEFT JOIN instrumento i ON i.id = m.instrumento
      LEFT JOIN casaOracao c ON c.id = m.comum_congregacao
      WHERE m.ativo = 1 ${casaId !== null ? 'AND m.comum_congregacao = ?' : ''}
      ORDER BY m.nome;
      `,
      casaId !== null ? [casaId] : []
    );

    return (resultado.values ?? []) as LinhaMusico[];
  }

  private contar(total: number, singular: string, plural: string): string {
    if (total === 0) {
      return `Nenhum registro`;
    }
    return `${total} ${total === 1 ? singular : plural}`;
  }

  private formatarData(data: string): string {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  private descreverPeriodo(filtro: FiltroPeriodo): string {
    return `${this.formatarData(filtro.dataInicial)} a ${this.formatarData(filtro.dataFinal)}`;
  }

  private apelidar(nome: string): string {
    return nome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
