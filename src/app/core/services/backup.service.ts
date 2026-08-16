import { inject, Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { JsonSQLite } from '@capacitor-community/sqlite';
import { Database } from '../database/database';

/** O que um arquivo de backup traz dentro, para conferir antes de restaurar. */
export interface ConteudoDoBackup {
  dados: JsonSQLite;
  /** Quantas linhas por tabela, na ordem em que o usuário reconhece as telas. */
  resumo: { rotulo: string; total: number }[];
}

/** Erro com texto pronto para mostrar ao usuário. */
export class ErroDeBackup extends Error {}

// As tabelas com o nome que o usuário vê nas abas, no singular e no plural —
// a frase do resumo diz "1 evento", não "1 eventos". A `lancamento_musico`
// fica de fora de propósito: ela é a ligação entre lançamento e músico, não um
// cadastro que alguém reconheça numa lista.
const ROTULOS: { tabela: string; um: string; varios: string }[] = [
  { tabela: 'musico', um: 'músico', varios: 'músicos' },
  { tabela: 'casaOracao', um: 'casa de oração', varios: 'casas de oração' },
  { tabela: 'evento', um: 'evento', varios: 'eventos' },
  { tabela: 'instrumento', um: 'instrumento', varios: 'instrumentos' },
  { tabela: 'lancamento', um: 'lançamento', varios: 'lançamentos' },
];

/**
 * Guarda o cadastro inteiro num arquivo e o traz de volta.
 *
 * O arquivo é o JSON do próprio plugin de SQLite, e não uma cópia do `.db`,
 * por dois motivos: é o mesmo formato nas três plataformas (no Android o
 * arquivo do banco fica numa pasta privada do app, na web nem arquivo existe —
 * é IndexedDB), e um JSON pode ser aberto e conferido a olho nu.
 *
 * Por isso o backup atravessa plataformas: dá para exportar no computador e
 * restaurar no celular.
 */
@Injectable({
  providedIn: 'root',
})
export class BackupService {
  private readonly database = inject(Database);
  private readonly plataforma = Capacitor.getPlatform();

  /** Grava o cadastro num arquivo e devolve o nome dele. */
  async exportar(): Promise<string> {
    const dados = await this.database.exportar();
    const nome = `srme-backup-${this.carimboDeData()}.json`;

    await this.entregar(nome, JSON.stringify(dados, null, 2));
    return nome;
  }

  /**
   * Lê e confere um arquivo escolhido pelo usuário, sem tocar no banco.
   *
   * Separado do `restaurar` para a tela poder mostrar o que o arquivo tem
   * dentro antes de perguntar se pode substituir tudo.
   */
  async ler(arquivo: File): Promise<ConteudoDoBackup> {
    let dados: JsonSQLite;

    try {
      dados = JSON.parse(await arquivo.text());
    } catch {
      throw new ErroDeBackup(
        'Não consegui ler este arquivo. Escolha o arquivo .json gerado pela exportação.'
      );
    }

    if (!dados?.tables?.length) {
      throw new ErroDeBackup('Este arquivo não parece ser um backup do S.R.M.E.');
    }

    // Sem esta conferência, um backup de outro banco seria importado para um
    // arquivo com outro nome: o plugin não reclamaria, o app continuaria com
    // os dados antigos e o usuário acharia que restaurou.
    if (dados.database !== this.database.nome) {
      throw new ErroDeBackup(
        `Este backup é do banco "${dados.database}", não do S.R.M.E. Nada foi alterado.`
      );
    }

    const conta = (tabela: string): number =>
      dados.tables.find((t) => t.name === tabela)?.values?.length ?? 0;

    return {
      dados,
      resumo: ROTULOS.map(({ tabela, um, varios }) => {
        const total = conta(tabela);
        return { rotulo: total === 1 ? um : varios, total };
      }),
    };
  }

  /** Substitui o cadastro atual pelo do backup. Devolve quantas linhas entraram. */
  async restaurar(conteudo: ConteudoDoBackup): Promise<number> {
    try {
      return await this.database.restaurar(conteudo.dados);
    } catch (erro) {
      throw new ErroDeBackup(
        `A restauração falhou: ${erro instanceof Error ? erro.message : erro}`
      );
    }
  }

  // No computador o arquivo cai como download (o Electron abre o "Salvar
  // como" do sistema). No celular não há pasta de downloads alcançável pela
  // página, então gravamos no cache e abrimos o compartilhamento para o
  // usuário escolher o destino — Drive, e-mail, WhatsApp. É o mesmo caminho
  // que os relatórios em PDF já usam.
  private async entregar(nome: string, conteudo: string): Promise<void> {
    if (this.plataforma === 'web' || this.plataforma === 'electron') {
      const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = nome;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    const { uri } = await Filesystem.writeFile({
      path: nome,
      data: conteudo,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });

    await Share.share({ title: nome, url: uri });
  }

  // AAAA-MM-DD, para os backups ficarem em ordem quando listados por nome.
  private carimboDeData(): string {
    const agora = new Date();
    const doisDigitos = (n: number): string => String(n).padStart(2, '0');

    return [
      agora.getFullYear(),
      doisDigitos(agora.getMonth() + 1),
      doisDigitos(agora.getDate()),
    ].join('-');
  }
}
