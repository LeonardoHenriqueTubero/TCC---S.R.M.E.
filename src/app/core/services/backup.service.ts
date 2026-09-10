import { inject, Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { JsonSQLite } from '@capacitor-community/sqlite';
import { Database } from '../database/database';

export interface ConteudoDoBackup {
  dados: JsonSQLite;
  resumo: { rotulo: string; total: number }[];
}

export class ErroDeBackup extends Error {}

const ROTULOS: { tabela: string; um: string; varios: string }[] = [
  { tabela: 'musico', um: 'músico', varios: 'músicos' },
  { tabela: 'casaOracao', um: 'casa de oração', varios: 'casas de oração' },
  { tabela: 'evento', um: 'evento', varios: 'eventos' },
  { tabela: 'instrumento', um: 'instrumento', varios: 'instrumentos' },
  { tabela: 'lancamento', um: 'lançamento', varios: 'lançamentos' },
];

@Injectable({
  providedIn: 'root',
})
export class BackupService {
  private readonly database = inject(Database);
  private readonly plataforma = Capacitor.getPlatform();

  async exportar(): Promise<string> {
    const dados = await this.database.exportar();
    const nome = `srme-backup-${this.carimboDeData()}.json`;

    await this.entregar(nome, JSON.stringify(dados, null, 2));
    return nome;
  }

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

  async restaurar(conteudo: ConteudoDoBackup): Promise<number> {
    try {
      return await this.database.restaurar(conteudo.dados);
    } catch (erro) {
      throw new ErroDeBackup(
        `A restauração falhou: ${erro instanceof Error ? erro.message : erro}`
      );
    }
  }

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
