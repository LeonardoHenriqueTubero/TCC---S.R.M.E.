import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  CapacitorSQLite,
  JsonSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';

const NOME_BANCO = 'srme';
const VERSAO_BANCO = 1;

// Liga e desliga os dados de amostra. Com `false` o app abre com todas as
// tabelas vazias, como na mão de quem o instala pela primeira vez — é assim que
// dá para testar o caminho do usuário novo, inclusive os avisos de "cadastre
// uma casa de oração antes".
//
// ATENÇÃO: isto não apaga nada. Um banco já semeado continua com os dados; para
// começar limpo é preciso remover o arquivo .db (desktop) ou limpar os dados do
// app (Android).
const SEMEAR_DADOS_DE_AMOSTRA = false;

// SQL dos dados iniciais de cada tabela, separado da lógica para o seed ficar
// fácil de ler e editar. A coluna `ativo` não é preenchida aqui de propósito:
// a tabela já a define com DEFAULT 1, então todo registro semeado nasce ativo.
const SEED_INSTRUMENTOS = `
  INSERT INTO instrumento (nome, familia) VALUES ('Violino', 'Cordas');
  INSERT INTO instrumento (nome, familia) VALUES ('Viola', 'Cordas');
  INSERT INTO instrumento (nome, familia) VALUES ('Violoncelo', 'Cordas');
  INSERT INTO instrumento (nome, familia) VALUES ('Contrabaixo', 'Cordas');
  INSERT INTO instrumento (nome, familia) VALUES ('Flauta', 'Madeiras');
  INSERT INTO instrumento (nome, familia) VALUES ('Oboé', 'Madeiras');
  INSERT INTO instrumento (nome, familia) VALUES ('Clarinete', 'Madeiras');
  INSERT INTO instrumento (nome, familia) VALUES ('Clarone', 'Madeiras');
  INSERT INTO instrumento (nome, familia) VALUES ('Fagote', 'Madeiras');
  INSERT INTO instrumento (nome, familia) VALUES ('Sax Alto', 'Madeiras');
  INSERT INTO instrumento (nome, familia) VALUES ('Sax Tenor', 'Madeiras');
  INSERT INTO instrumento (nome, familia) VALUES ('Trompete', 'Metais');
  INSERT INTO instrumento (nome, familia) VALUES ('Trompa', 'Metais');
  INSERT INTO instrumento (nome, familia) VALUES ('Trombone', 'Metais');
  INSERT INTO instrumento (nome, familia) VALUES ('Bombardino', 'Metais');
  INSERT INTO instrumento (nome, familia) VALUES ('Tuba', 'Metais');
  INSERT INTO instrumento (nome, familia) VALUES ('Órgão', 'Teclas');
`;

const SEED_CASAS_ORACAO = `
  INSERT INTO casaOracao (nome, cidade) VALUES ('Central', 'São Paulo');
  INSERT INTO casaOracao (nome, cidade) VALUES ('Vila Maria', 'São Paulo');
  INSERT INTO casaOracao (nome, cidade) VALUES ('Jardim Brasil', 'Guarulhos');
`;

const SEED_EVENTOS = `
  INSERT INTO evento (nome) VALUES ('Ensaio Regional');
  INSERT INTO evento (nome) VALUES ('Ensaio Local');
  INSERT INTO evento (nome) VALUES ('Reunião de Jovens e Menores');
  INSERT INTO evento (nome) VALUES ('Culto Oficial');
  INSERT INTO evento (nome) VALUES ('Santa Ceia');
`;

// Depende de casaOracao (comum_congregacao) e instrumento já semeados.
// Os ids batem com a ordem de inserção acima (casas 1-3, instrumentos 1-17).
const SEED_MUSICOS = `
  INSERT INTO musico (nome, oficializado, batizado, cargo, ativo, comum_congregacao, instrumento) VALUES ('João Silva', 'Sim', 'Sim', 'Músico', 1, 1, 1);
  INSERT INTO musico (nome, oficializado, batizado, cargo, ativo, comum_congregacao, instrumento) VALUES ('Pedro Santos', 'Sim', 'Sim', 'Instrutor', 1, 1, 12);
  INSERT INTO musico (nome, oficializado, batizado, cargo, ativo, comum_congregacao, instrumento) VALUES ('Lucas Almeida', 'Não', 'Sim', 'Músico', 1, 2, 7);
  INSERT INTO musico (nome, oficializado, batizado, cargo, ativo, comum_congregacao, instrumento) VALUES ('Tiago Costa', 'Sim', 'Sim', 'Músico', 1, 2, 5);
  INSERT INTO musico (nome, oficializado, batizado, cargo, ativo, comum_congregacao, instrumento) VALUES ('André Souza', 'Sim', 'Sim', 'Encarregado Local', 1, 3, 14);
  INSERT INTO musico (nome, oficializado, batizado, cargo, ativo, comum_congregacao, instrumento) VALUES ('Rafael Lima', 'Não', 'Não', 'Músico', 1, 3, 10);
  INSERT INTO musico (nome, oficializado, batizado, cargo, ativo, comum_congregacao, instrumento) VALUES ('Marcos Pereira', 'Sim', 'Sim', 'Músico', 1, 1, 3);
  INSERT INTO musico (nome, oficializado, batizado, cargo, ativo, comum_congregacao, instrumento) VALUES ('Felipe Rocha', 'Não', 'Não', 'Candidato', 1, 2, 16);
  INSERT INTO musico (nome, oficializado, batizado, cargo, ativo, comum_congregacao, instrumento) VALUES ('Maria Oliveira', 'Sim', 'Sim', 'Organista', 1, 1, 17);
`;

// Depende de casaOracao (local), evento e musico já semeados.
// Semeia lancamento e lancamento_musico juntos porque um não faz sentido sem o outro.
const SEED_LANCAMENTOS = `
  INSERT INTO lancamento (data, local, evento) VALUES ('2026-06-07', 1, 1);
  INSERT INTO lancamento (data, local, evento) VALUES ('2026-06-14', 2, 2);
  INSERT INTO lancamento (data, local, evento) VALUES ('2026-06-21', 3, 4);

  INSERT INTO lancamento_musico (id_lancamento, id_musico) VALUES (1, 1);
  INSERT INTO lancamento_musico (id_lancamento, id_musico) VALUES (1, 2);
  INSERT INTO lancamento_musico (id_lancamento, id_musico) VALUES (1, 3);
  INSERT INTO lancamento_musico (id_lancamento, id_musico) VALUES (1, 4);
  INSERT INTO lancamento_musico (id_lancamento, id_musico) VALUES (1, 5);
  INSERT INTO lancamento_musico (id_lancamento, id_musico) VALUES (1, 7);
  INSERT INTO lancamento_musico (id_lancamento, id_musico) VALUES (1, 9);
  INSERT INTO lancamento_musico (id_lancamento, id_musico) VALUES (2, 3);
  INSERT INTO lancamento_musico (id_lancamento, id_musico) VALUES (2, 4);
  INSERT INTO lancamento_musico (id_lancamento, id_musico) VALUES (2, 8);
  INSERT INTO lancamento_musico (id_lancamento, id_musico) VALUES (3, 5);
  INSERT INTO lancamento_musico (id_lancamento, id_musico) VALUES (3, 6);
`;

// Cada entrada só é inserida se a tabela estiver vazia (o seed é idempotente).
// A ORDEM importa por causa das chaves estrangeiras: as tabelas referenciadas
// vêm antes das que dependem delas.
const SEEDS: { tabela: string; sql: string }[] = [
  { tabela: 'instrumento', sql: SEED_INSTRUMENTOS },
  { tabela: 'casaOracao', sql: SEED_CASAS_ORACAO },
  { tabela: 'evento', sql: SEED_EVENTOS },
  { tabela: 'musico', sql: SEED_MUSICOS },
  { tabela: 'lancamento', sql: SEED_LANCAMENTOS },
];

@Injectable({
  providedIn: 'root',
})
export class Database {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db!: SQLiteDBConnection;
  private plataforma: string = Capacitor.getPlatform();

  // Contador que aumenta a cada gravação no banco. As telas de listagem
  // observam este sinal para se recarregarem sozinhas quando algo é criado,
  // editado ou excluído — sem precisar recarregar a página.
  private readonly _versaoDados = signal(0);
  readonly versaoDados = this._versaoDados.asReadonly();

  // Só o navegador precisa do jeep-sqlite: ele emula o SQLite sobre IndexedDB.
  // No Electron o plugin roda no processo principal com SQLite de verdade
  // (better-sqlite3), gravando um arquivo .db em disco — chamar initWebStore lá
  // quebra com "No handler registered for 'CapacitorSQLite-initWebStore'",
  // porque esse método simplesmente não existe fora da web.
  private get usaArmazenamentoWeb(): boolean {
    return this.plataforma === 'web';
  }

  async iniciar(): Promise<void> {
    if (this.usaArmazenamentoWeb) {
      await customElements.whenDefined('jeep-sqlite');
      await this.sqlite.initWebStore();
    }

    this.db = await this.abrirConexao();
    await this.db.open();

    await this.criarTabelas();
    await this.migrarEsquema();
    await this.semear();

    await this.persistir();
  }

  // O CREATE TABLE IF NOT EXISTS só cria a tabela quando ela ainda não existe —
  // ele não altera tabelas já criadas. Então um banco gravado antes da coluna
  // `ativo` existir continuaria sem ela (e as telas quebrariam com
  // "no such column"). Aqui a coluna é adicionada quando faltar, preservando os
  // dados já salvos: as linhas antigas assumem o DEFAULT 1, ou seja, ficam ativas.
  private async migrarEsquema(): Promise<void> {
    const tabelasComAtivo = ['instrumento', 'casaOracao', 'evento', 'lancamento'];

    for (const tabela of tabelasComAtivo) {
      if (!(await this.temColuna(tabela, 'ativo'))) {
        await this.db.execute(`ALTER TABLE ${tabela} ADD COLUMN ativo INTEGER DEFAULT 1;`);
      }
    }
  }

  private async temColuna(tabela: string, coluna: string): Promise<boolean> {
    const { values } = await this.db.query(`PRAGMA table_info(${tabela});`);
    return (values ?? []).some((c: { name: string }) => c.name === coluna);
  }

  // Percorre a lista de seeds (já na ordem certa de dependências) e insere só
  // o que ainda não existe. Toda a repetição que antes ficava em vários métodos
  // agora está concentrada aqui.
  private async semear(): Promise<void> {
    if (!SEMEAR_DADOS_DE_AMOSTRA) {
      return;
    }

    for (const { tabela, sql } of SEEDS) {
      if ((await this.contar(tabela)) === 0) {
        await this.db.execute(sql);
      }
    }
  }

  // Retorna quantas linhas a tabela já tem — usado para não semear de novo.
  private async contar(tabela: string): Promise<number> {
    const { values } = await this.db.query(`SELECT COUNT(*) as total FROM ${tabela};`);
    return values?.[0]?.total ?? 0;
  }

  private async abrirConexao(): Promise<SQLiteDBConnection> {
    // Alinha o registro de conexões do lado nativo com o do JavaScript. No
    // Android o plugin nativo vive no processo do app, não na WebView: se só a
    // WebView recarregar, o nativo continua com a conexão aberta enquanto o
    // JavaScript começa do zero e acha que não existe nenhuma. Sem esta chamada
    // o createConnection abaixo falha com "Connection srme already exists", o
    // provideAppInitializer quebra e o app abre em branco.
    await this.sqlite.checkConnectionsConsistency();

    const { result: jaExiste } = await this.sqlite.isConnection(NOME_BANCO, false);

    if (jaExiste) {
      return this.sqlite.retrieveConnection(NOME_BANCO, false);
    }

    return this.sqlite.createConnection(NOME_BANCO, false, 'no-encryption', VERSAO_BANCO, false);
  }

  private async criarTabelas(): Promise<void> {
    const sql = `
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS instrumento (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome VARCHAR(50) NOT NULL,
        familia VARCHAR(30) NOT NULL,
        ativo INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS casaOracao (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome VARCHAR(100) NOT NULL,
        cidade VARCHAR(50) NOT NULL,
        ativo INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS evento (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome VARCHAR (100) NOT NULL,
        ativo INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS musico (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome VARCHAR(100) NOT NULL,
        oficializado VARCHAR(30) NOT NULL,
        batizado VARCHAR(30) NOT NULL,
        cargo VARCHAR(30) NOT NULL,
        ativo INTEGER DEFAULT 1,
        comum_congregacao INTEGER,
        instrumento INTEGER,
        FOREIGN KEY (comum_congregacao) REFERENCES casaOracao(id),
        FOREIGN KEY (instrumento) REFERENCES instrumento(id)
      );

      CREATE TABLE IF NOT EXISTS lancamento (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL,
        local INTEGER,
        evento INTEGER,
        ativo INTEGER DEFAULT 1,
        FOREIGN KEY (local) REFERENCES casaOracao(id),
        FOREIGN KEY (evento) REFERENCES evento(id)
      );

      CREATE TABLE IF NOT EXISTS lancamento_musico (
        id_lancamento INTEGER NOT NULL,
        id_musico INTEGER NOT NULL,
        PRIMARY KEY (id_lancamento, id_musico),
        FOREIGN KEY (id_lancamento) REFERENCES lancamento(id),
        FOREIGN KEY (id_musico) REFERENCES musico(id)
      );
    `;
    await this.db.execute(sql);
  }

  // Chamado por todo serviço depois de gravar algo. Na web ainda é preciso
  // despejar o banco no IndexedDB; no Electron e no Android a escrita já foi
  // direto no arquivo. Em todas as plataformas avisa as telas de que os dados
  // mudaram.
  async persistir(): Promise<void> {
    if (this.usaArmazenamentoWeb) {
      await this.sqlite.saveToStore(NOME_BANCO);
    }

    this._versaoDados.update((versao) => versao + 1);
  }

  getConexao(): SQLiteDBConnection {
    return this.db;
  }

  /** O nome do banco, para quem precisa conferir se um arquivo é deste app. */
  get nome(): string {
    return NOME_BANCO;
  }

  /** Todo o conteúdo do banco — esquema e linhas — no formato do plugin. */
  async exportar(): Promise<JsonSQLite> {
    const { export: dados } = await this.db.exportToJson('full');

    if (!dados) {
      throw new Error('O banco não devolveu nada para exportar.');
    }

    return dados;
  }

  /**
   * Troca TODO o banco pelo conteúdo de um backup. Nada é mesclado: o que
   * existia antes deixa de existir.
   *
   * Devolve quantas linhas foram gravadas.
   */
  async restaurar(dados: JsonSQLite): Promise<number> {
    // `overwrite` não é capricho. Em modo 'full' o plugin compara a versão do
    // banco aberto com a do arquivo e, quando são iguais, devolve "0
    // alterações" sem gravar nada — a restauração falharia calada, que é o
    // pior jeito de um backup falhar. Com `overwrite` ele apaga o arquivo do
    // banco e o recria a partir do JSON.
    const completo: JsonSQLite = { ...dados, mode: 'full', overwrite: true };

    // O arquivo do banco está prestes a ser apagado; uma conexão aberta
    // apontando para ele ficaria escrevendo num arquivo que não existe mais.
    await this.sqlite.closeConnection(NOME_BANCO, false);

    const { changes } = await this.sqlite.importFromJson(JSON.stringify(completo));

    this.db = await this.abrirConexao();
    await this.db.open();
    // O backup pode ser antigo, de antes de alguma coluna existir; as mesmas
    // rotinas da abertura do app põem o esquema em dia.
    await this.criarTabelas();
    await this.migrarEsquema();
    await this.persistir();

    return changes?.changes ?? 0;
  }
}
