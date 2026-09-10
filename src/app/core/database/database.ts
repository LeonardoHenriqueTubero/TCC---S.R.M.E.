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

const SEMEAR_DADOS_DE_AMOSTRA = false;

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

  private readonly _versaoDados = signal(0);
  readonly versaoDados = this._versaoDados.asReadonly();

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

  private async contar(tabela: string): Promise<number> {
    const { values } = await this.db.query(`SELECT COUNT(*) as total FROM ${tabela};`);
    return values?.[0]?.total ?? 0;
  }

  private async abrirConexao(): Promise<SQLiteDBConnection> {
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

  async persistir(): Promise<void> {
    if (this.usaArmazenamentoWeb) {
      await this.sqlite.saveToStore(NOME_BANCO);
    }

    this._versaoDados.update((versao) => versao + 1);
  }

  getConexao(): SQLiteDBConnection {
    return this.db;
  }

  get nome(): string {
    return NOME_BANCO;
  }

  async exportar(): Promise<JsonSQLite> {
    const { export: dados } = await this.db.exportToJson('full');

    if (!dados) {
      throw new Error('O banco não devolveu nada para exportar.');
    }

    return dados;
  }

  async restaurar(dados: JsonSQLite): Promise<number> {
    const completo: JsonSQLite = { ...dados, mode: 'full', overwrite: true };

    await this.sqlite.closeConnection(NOME_BANCO, false);

    const { changes } = await this.sqlite.importFromJson(JSON.stringify(completo));

    this.db = await this.abrirConexao();
    await this.db.open();
    await this.criarTabelas();
    await this.migrarEsquema();
    await this.persistir();

    return changes?.changes ?? 0;
  }
}
