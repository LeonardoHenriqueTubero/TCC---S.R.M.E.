import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

const NOME_BANCO = 'srme';
const VERSAO_BANCO = 1;

@Injectable({
  providedIn: 'root',
})
export class Database {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db!: SQLiteDBConnection;
  private plataforma: string = Capacitor.getPlatform();

  async iniciar(): Promise<void> {
    if (this.plataforma === 'web' || this.plataforma === 'electron') {
      await customElements.whenDefined('jeep-sqlite');
      await this.sqlite.initWebStore();
    }

    this.db = await this.abrirConexao();
    await this.db.open();

    await this.criarTabelas();
    await this.semear();

    await this.persistir();
  }

  // Ordem importa por causa das chaves estrangeiras: primeiro as tabelas que
  // ninguém referencia (instrumento, casaOracao, evento), depois musico (que
  // depende de casaOracao e instrumento), depois lancamento (que depende de
  // casaOracao e evento) e por fim lancamento_musico (que liga os dois).
  private async semear(): Promise<void> {
    await this.semearInstrumentos();
    await this.semearCasasOracao();
    await this.semearEventos();
    await this.semearMusicos();
    await this.semearLancamentos();
  }

  // Retorna quantas linhas a tabela já tem — usado para não semear de novo.
  private async contar(tabela: string): Promise<number> {
    const { values } = await this.db.query(`SELECT COUNT(*) as total FROM ${tabela};`);
    return values?.[0]?.total ?? 0;
  }

  private async abrirConexao(): Promise<SQLiteDBConnection> {
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
        familia VARCHAR(30) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS casaOracao (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome VARCHAR(100) NOT NULL,
        cidade VARCHAR(50) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS evento (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome VARCHAR (100) NOT NULL
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

  private async semearInstrumentos(): Promise<void> {
    if ((await this.contar('instrumento')) > 0) {
      return;
    }

    await this.db.execute(`
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
    `);
  }

  private async semearCasasOracao(): Promise<void> {
    if ((await this.contar('casaOracao')) > 0) {
      return;
    }

    await this.db.execute(`
      INSERT INTO casaOracao (nome, cidade) VALUES ('Central', 'São Paulo');
      INSERT INTO casaOracao (nome, cidade) VALUES ('Vila Maria', 'São Paulo');
      INSERT INTO casaOracao (nome, cidade) VALUES ('Jardim Brasil', 'Guarulhos');
    `);
  }

  private async semearEventos(): Promise<void> {
    if ((await this.contar('evento')) > 0) {
      return;
    }

    await this.db.execute(`
      INSERT INTO evento (nome) VALUES ('Ensaio Regional');
      INSERT INTO evento (nome) VALUES ('Ensaio Local');
      INSERT INTO evento (nome) VALUES ('Reunião de Jovens e Menores');
      INSERT INTO evento (nome) VALUES ('Culto Oficial');
      INSERT INTO evento (nome) VALUES ('Santa Ceia');
    `);
  }

  // Depende de casaOracao (comum_congregacao) e instrumento já semeados.
  // Os ids abaixo batem com a ordem de inserção acima (casas 1-3, instrumentos 1-16).
  private async semearMusicos(): Promise<void> {
    if ((await this.contar('musico')) > 0) {
      return;
    }

    await this.db.execute(`
      INSERT INTO musico (nome, oficializado, batizado, cargo, ativo, comum_congregacao, instrumento) VALUES ('João Silva', 'Sim', 'Sim', 'Músico', 1, 1, 1);
      INSERT INTO musico (nome, oficializado, batizado, cargo, ativo, comum_congregacao, instrumento) VALUES ('Pedro Santos', 'Sim', 'Sim', 'Instrutor', 1, 1, 12);
      INSERT INTO musico (nome, oficializado, batizado, cargo, ativo, comum_congregacao, instrumento) VALUES ('Lucas Almeida', 'Não', 'Sim', 'Músico', 1, 2, 7);
      INSERT INTO musico (nome, oficializado, batizado, cargo, ativo, comum_congregacao, instrumento) VALUES ('Tiago Costa', 'Sim', 'Sim', 'Músico', 1, 2, 5);
      INSERT INTO musico (nome, oficializado, batizado, cargo, ativo, comum_congregacao, instrumento) VALUES ('André Souza', 'Sim', 'Sim', 'Encarregado Local', 1, 3, 14);
      INSERT INTO musico (nome, oficializado, batizado, cargo, ativo, comum_congregacao, instrumento) VALUES ('Rafael Lima', 'Não', 'Não', 'Músico', 1, 3, 10);
      INSERT INTO musico (nome, oficializado, batizado, cargo, ativo, comum_congregacao, instrumento) VALUES ('Marcos Pereira', 'Sim', 'Sim', 'Músico', 1, 1, 3);
      INSERT INTO musico (nome, oficializado, batizado, cargo, ativo, comum_congregacao, instrumento) VALUES ('Felipe Rocha', 'Não', 'Não', 'Candidato', 1, 2, 16);
    `);
  }

  // Depende de casaOracao (local), evento e musico já semeados.
  // Semeia lancamento e lancamento_musico juntos porque um não faz sentido sem o outro.
  private async semearLancamentos(): Promise<void> {
    if ((await this.contar('lancamento')) > 0) {
      return;
    }

    await this.db.execute(`
      INSERT INTO lancamento (data, local, evento) VALUES ('2026-06-07', 1, 1);
      INSERT INTO lancamento (data, local, evento) VALUES ('2026-06-14', 2, 2);
      INSERT INTO lancamento (data, local, evento) VALUES ('2026-06-21', 3, 4);

      INSERT INTO lancamento_musico (id_lancamento, id_musico) VALUES (1, 1);
      INSERT INTO lancamento_musico (id_lancamento, id_musico) VALUES (1, 2);
      INSERT INTO lancamento_musico (id_lancamento, id_musico) VALUES (1, 3);
      INSERT INTO lancamento_musico (id_lancamento, id_musico) VALUES (1, 4);
      INSERT INTO lancamento_musico (id_lancamento, id_musico) VALUES (1, 5);
      INSERT INTO lancamento_musico (id_lancamento, id_musico) VALUES (1, 7);
      INSERT INTO lancamento_musico (id_lancamento, id_musico) VALUES (2, 3);
      INSERT INTO lancamento_musico (id_lancamento, id_musico) VALUES (2, 4);
      INSERT INTO lancamento_musico (id_lancamento, id_musico) VALUES (2, 8);
      INSERT INTO lancamento_musico (id_lancamento, id_musico) VALUES (3, 5);
      INSERT INTO lancamento_musico (id_lancamento, id_musico) VALUES (3, 6);
    `);
  }

  async persistir(): Promise<void> {
    if (this.plataforma === 'web' || this.plataforma === 'electron') {
      await this.sqlite.saveToStore(NOME_BANCO);
    }
  }

  getConexao(): SQLiteDBConnection {
    return this.db;
  }
}
