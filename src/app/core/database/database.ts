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

    await this.persistir();
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

  async persistir(): Promise<void> {
    if (this.plataforma === 'web' || this.plataforma === 'electron') {
      await this.sqlite.saveToStore(NOME_BANCO);
    }
  }

  getConexao(): SQLiteDBConnection {
    return this.db;
  }
}
