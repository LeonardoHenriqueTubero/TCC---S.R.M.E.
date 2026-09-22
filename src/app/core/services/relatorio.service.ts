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

const FAMILIAS_FORA_DO_PERCENTUAL = ['Teclas'];

export interface FiltroPeriodo {
  dataInicial: string;
  dataFinal: string;
}

export interface FiltroPresenca {
  ano: number;
  mes: number;
  eventoId: number;
  casaId: number | null;
  somenteMusicosDaCasa: boolean;
}

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

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

  async porMusico(filtro: FiltroPresenca): Promise<Relatorio> {
    const conexao = this.dbService.getConexao();
    const porCasa = filtro.casaId !== null;
    const musicosDaCasa = porCasa && filtro.somenteMusicosDaCasa;

    const mes = String(filtro.mes).padStart(2, '0');
    const dataInicial = `${filtro.ano}-${mes}-01`;
    const dataFinal = `${filtro.ano}-${mes}-31`;

    const lancamentosConsulta = await conexao.query(
      `
      SELECT l.id, l.data, c.nome AS casa
      FROM lancamento l
      LEFT JOIN casaOracao c ON c.id = l.local
      WHERE l.ativo = 1 AND l.evento = ? AND l.data BETWEEN ? AND ?
        ${porCasa ? 'AND l.local = ?' : ''}
      ORDER BY l.data, c.nome;
      `,
      porCasa
        ? [filtro.eventoId, dataInicial, dataFinal, filtro.casaId]
        : [filtro.eventoId, dataInicial, dataFinal]
    );

    const lancamentos = (lancamentosConsulta.values ?? []) as {
      id: number;
      data: string;
      casa: string | null;
    }[];

    const presencas = new Set<string>();
    if (lancamentos.length > 0) {
      const espacos = lancamentos.map(() => '?').join(', ');
      const presencasConsulta = await conexao.query(
        `SELECT id_lancamento, id_musico FROM lancamento_musico WHERE id_lancamento IN (${espacos});`,
        lancamentos.map((l) => l.id)
      );
      for (const p of (presencasConsulta.values ?? []) as {
        id_lancamento: number;
        id_musico: number;
      }[]) {
        presencas.add(`${p.id_lancamento}-${p.id_musico}`);
      }
    }

    const idsPresentes = [...new Set([...presencas].map((chave) => Number(chave.split('-')[1])))];
    const espacosPresentes = idsPresentes.map(() => '?').join(', ');
    const musicosConsulta = await conexao.query(
      `
      SELECT id, nome
      FROM musico
      WHERE (ativo = 1 ${idsPresentes.length > 0 ? `OR id IN (${espacosPresentes})` : ''})
        ${musicosDaCasa ? 'AND comum_congregacao = ?' : ''}
      ORDER BY nome;
      `,
      musicosDaCasa ? [...idsPresentes, filtro.casaId] : idsPresentes
    );

    const musicos = (musicosConsulta.values ?? []) as { id: number; nome: string }[];

    const cabecalho = (l: { data: string; casa: string | null }): string => {
      const [, mesData, dia] = l.data.split('-');
      return porCasa ? `${dia}/${mesData}` : `${dia}/${mesData}\n${l.casa ?? SEM_VALOR}`;
    };

    const linhas: (string | number)[][] =
      lancamentos.length === 0
        ? []
        : musicos.map((musico) => {
            const marcas = lancamentos.map((l) =>
              presencas.has(`${l.id}-${musico.id}`) ? 'P' : 'F'
            );
            const presentes = marcas.filter((marca) => marca === 'P').length;
            return [musico.nome, ...marcas, presentes, marcas.length - presentes];
          });

    const evento = await conexao.query('SELECT nome FROM evento WHERE id = ?;', [filtro.eventoId]);
    const nomeEvento =
      ((evento.values ?? [])[0] as { nome: string } | undefined)?.nome ?? 'Evento';
    const nomeCasa = porCasa ? await this.nomeDaCasa(filtro.casaId as number) : 'Todas as casas';

    return {
      titulo: 'Relatório de Presença por Músico',
      subtitulo: [
        `${MESES[filtro.mes - 1]} de ${filtro.ano}`,
        nomeEvento,
        nomeCasa,
        this.contar(lancamentos.length, 'data', 'datas'),
      ].join(' · '),
      nomeArquivo: `relatorio-presenca-${filtro.ano}-${mes}-${this.apelidar(nomeEvento)}`,
      paisagem: lancamentos.length > 6,
      secoes: [
        {
          colunas: ['Músico', ...lancamentos.map(cabecalho), 'Presenças', 'Faltas'],
          linhas,
          centralizarAPartirDe: 1,
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
    const familias = this.familiasDoPercentual(filtro.familias);
    if (casas.length === 0 || familias.length === 0) {
      return null;
    }

    const espacos = familias.map(() => '?').join(', ');
    const contagemConsulta = await conexao.query(
      `
      SELECT m.comum_congregacao AS casaId, i.familia, COUNT(*) AS total
      FROM musico m
      JOIN instrumento i ON i.id = m.instrumento
      WHERE m.ativo = 1 AND i.familia IN (${espacos})
        ${porCasa ? 'AND m.comum_congregacao = ?' : ''}
      GROUP BY m.comum_congregacao, i.familia;
      `,
      porCasa ? [...familias, filtro.casaId] : [...familias]
    );

    const contagens = (contagemConsulta.values ?? []) as {
      casaId: number;
      familia: string;
      total: number;
    }[];

    const quantos = (casaId: number, familia: string): number =>
      contagens.find((c) => c.casaId === casaId && c.familia === familia)?.total ?? 0;

    const nasFamilias = (casaId: number): number =>
      familias.reduce((soma, familia) => soma + quantos(casaId, familia), 0);

    const linhas: (string | number)[][] = casas.map((casa) => [
      casa.nome,
      ...familias.map((familia) =>
        this.percentual(quantos(casa.id, familia), nasFamilias(casa.id))
      ),
      nasFamilias(casa.id),
    ]);

    if (casas.length > 1) {
      const efetivo = casas.reduce((soma, casa) => soma + nasFamilias(casa.id), 0);
      linhas.push([
        'TOTAL',
        ...familias.map((familia) => {
          const somaFamilia = casas.reduce((soma, casa) => soma + quantos(casa.id, familia), 0);
          return this.percentual(somaFamilia, efetivo);
        }),
        efetivo,
      ]);
    }

    return {
      titulo: 'Relação final das orquestras',
      colunas: ['Casa de Oração', ...familias, 'Músicos nas famílias'],
      linhas,
    };
  }

  private familiasDoPercentual(familias: string[]): string[] {
    return familias.filter((familia) => !FAMILIAS_FORA_DO_PERCENTUAL.includes(familia));
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

    const familias = this.familiasDoPercentual(await this.listarFamilias());
    if (familias.length === 0) {
      return null;
    }

    const contados = participantes.filter(
      (p) => p.familia !== null && familias.includes(p.familia)
    );

    const quantos = (lancamentoId: number, familia: string): number =>
      contados.filter((p) => p.lancamentoId === lancamentoId && p.familia === familia).length;

    const totalDe = (lancamentoId: number): number =>
      contados.filter((p) => p.lancamentoId === lancamentoId).length;

    const linhas: (string | number)[][] = lancamentos.map((lancamento) => [
      this.formatarData(lancamento.data),
      lancamento.evento ?? SEM_VALOR,
      ...familias.map((familia) =>
        this.percentual(quantos(lancamento.id, familia), totalDe(lancamento.id))
      ),
      totalDe(lancamento.id),
    ]);

    if (lancamentos.length > 1) {
      const efetivo = contados.length;
      linhas.push([
        'TOTAL',
        '',
        ...familias.map((familia) =>
          this.percentual(contados.filter((p) => p.familia === familia).length, efetivo)
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
