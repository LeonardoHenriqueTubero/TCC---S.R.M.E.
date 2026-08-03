import { inject, Injectable } from '@angular/core';
import { Database } from '../database/database';
import { Relatorio, SecaoRelatorio } from '../../shared/services/pdf.service';

/** Linha crua de músico com os nomes já resolvidos pelos JOINs. */
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

/**
 * Monta o conteúdo dos quatro relatórios.
 *
 * Cada método devolve um `Relatorio` pronto para o PdfService — a tela só
 * escolhe qual gerar. As consultas vivem aqui (e não nas telas) porque
 * relatório é leitura própria: precisa de JOIN para trocar os ids pelos nomes
 * e de agrupamentos que as listagens comuns não fazem.
 */
@Injectable({
  providedIn: 'root',
})
export class RelatorioService {
  private readonly dbService = inject(Database);

  // Um músico por linha, com instrumento e casa de oração já pelo nome.
  async porMusico(): Promise<Relatorio> {
    const musicos = await this.buscarMusicos();

    return {
      titulo: 'Relatório por Músico',
      subtitulo: this.contar(musicos.length, 'músico ativo', 'músicos ativos'),
      nomeArquivo: 'relatorio-musicos',
      secoes: [
        {
          colunas: ['Nome', 'Instrumento', 'Casa de Oração', 'Cargo', 'Oficializado', 'Batizado'],
          linhas: musicos.map((m) => [
            m.nome,
            m.instrumento ?? SEM_VALOR,
            m.casa ?? SEM_VALOR,
            m.cargo,
            m.oficializado,
            m.batizado,
          ]),
        },
      ],
    };
  }

  // Uma tabela por casa de oração, com os músicos que pertencem a ela.
  async porCasaOracao(): Promise<Relatorio> {
    const musicos = await this.buscarMusicos();

    const casas = await this.dbService
      .getConexao()
      .query('SELECT nome, cidade FROM casaOracao WHERE ativo = 1 ORDER BY nome;');

    const secoes: SecaoRelatorio[] = ((casas.values ?? []) as { nome: string; cidade: string }[]).map(
      (casa) => {
        const daCasa = musicos.filter((m) => m.casa === casa.nome);

        return {
          titulo: `${casa.nome} — ${casa.cidade} (${this.contar(daCasa.length, 'músico', 'músicos')})`,
          colunas: ['Nome', 'Instrumento', 'Cargo', 'Oficializado'],
          linhas: daCasa.map((m) => [
            m.nome,
            m.instrumento ?? SEM_VALOR,
            m.cargo,
            m.oficializado,
          ]),
        };
      }
    );

    return {
      titulo: 'Relatório por Casa de Oração',
      subtitulo: this.contar(secoes.length, 'casa de oração', 'casas de oração'),
      nomeArquivo: 'relatorio-casas-oracao',
      secoes,
    };
  }

  // Uma tabela por família (Cordas, Madeiras, Metais), mostrando quantos
  // músicos tocam cada instrumento dela.
  async porFamiliaInstrumento(): Promise<Relatorio> {
    const resultado = await this.dbService.getConexao().query(`
      SELECT i.familia, i.nome,
             (SELECT COUNT(*) FROM musico m WHERE m.instrumento = i.id AND m.ativo = 1) AS musicos
      FROM instrumento i
      WHERE i.ativo = 1
      ORDER BY i.familia, i.nome;
    `);

    const instrumentos = (resultado.values ?? []) as {
      familia: string;
      nome: string;
      musicos: number;
    }[];

    // Agrupa mantendo a ordem que veio do ORDER BY: instrumentos da mesma
    // família chegam em sequência.
    const secoes: SecaoRelatorio[] = [];
    for (const instrumento of instrumentos) {
      let secao = secoes.find((s) => s.titulo?.startsWith(instrumento.familia));
      if (!secao) {
        secao = { titulo: instrumento.familia, colunas: ['Instrumento', 'Músicos'], linhas: [] };
        secoes.push(secao);
      }
      secao.linhas.push([instrumento.nome, instrumento.musicos]);
    }

    // Agora que os totais existem, completa o título de cada família.
    for (const secao of secoes) {
      const total = secao.linhas.reduce((soma, linha) => soma + Number(linha[1]), 0);
      secao.titulo = `${secao.titulo} (${this.contar(total, 'músico', 'músicos')})`;
    }

    return {
      titulo: 'Relatório por Família de Instrumentos',
      subtitulo: this.contar(secoes.length, 'família', 'famílias'),
      nomeArquivo: 'relatorio-familias-instrumentos',
      secoes,
    };
  }

  // Um lançamento por linha, com os músicos presentes na última coluna.
  async porLancamento(): Promise<Relatorio> {
    const conexao = this.dbService.getConexao();

    const resultado = await conexao.query(`
      SELECT l.id, l.data, e.nome AS evento, c.nome AS casa
      FROM lancamento l
      JOIN evento e ON e.id = l.evento
      JOIN casaOracao c ON c.id = l.local
      WHERE l.ativo = 1
      ORDER BY l.data DESC;
    `);

    const lancamentos = (resultado.values ?? []) as {
      id: number;
      data: string;
      evento: string;
      casa: string;
    }[];

    const linhas: (string | number)[][] = [];
    for (const lancamento of lancamentos) {
      // Sem filtro por m.ativo: o lançamento é histórico, então quem participou
      // continua aparecendo mesmo que o músico tenha sido excluído depois.
      const presentes = await conexao.query(
        `
        SELECT m.nome
        FROM musico m
        JOIN lancamento_musico lm ON lm.id_musico = m.id
        WHERE lm.id_lancamento = ?
        ORDER BY m.nome;
        `,
        [lancamento.id]
      );

      const nomes = ((presentes.values ?? []) as { nome: string }[]).map((m) => m.nome);

      linhas.push([
        this.formatarData(lancamento.data),
        lancamento.evento,
        lancamento.casa,
        nomes.length,
        nomes.length > 0 ? nomes.join(', ') : SEM_VALOR,
      ]);
    }

    return {
      titulo: 'Relatório por Lançamento',
      subtitulo: this.contar(linhas.length, 'lançamento', 'lançamentos'),
      nomeArquivo: 'relatorio-lancamentos',
      secoes: [
        {
          colunas: ['Data', 'Evento', 'Casa de Oração', 'Qtd.', 'Músicos presentes'],
          linhas,
        },
      ],
    };
  }

  // Consulta única de músicos reaproveitada por dois relatórios. LEFT JOIN
  // porque o instrumento ou a casa podem ter sido excluídos depois.
  private async buscarMusicos(): Promise<LinhaMusico[]> {
    const resultado = await this.dbService.getConexao().query(`
      SELECT m.nome, m.cargo, m.oficializado, m.batizado,
             i.nome AS instrumento, i.familia AS familia,
             c.nome AS casa, c.cidade AS cidade
      FROM musico m
      LEFT JOIN instrumento i ON i.id = m.instrumento
      LEFT JOIN casaOracao c ON c.id = m.comum_congregacao
      WHERE m.ativo = 1
      ORDER BY m.nome;
    `);

    return (resultado.values ?? []) as LinhaMusico[];
  }

  // "1 músico" / "3 músicos" / "nenhum músico".
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
}
