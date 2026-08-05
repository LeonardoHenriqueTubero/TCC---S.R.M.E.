// O tipo vem do plugin do Electron, e não do @capacitor/cli: é ele que
// acrescenta a seção "electron" ao formato padrão da configuração.
import type { CapacitorElectronConfig } from '@capacitor-community/electron';

const config: CapacitorElectronConfig = {
  appId: 'io.ionic.starter',
  appName: 'srme',
  webDir: 'www',
  plugins: {
    // O plugin de SQLite do Electron le estas chaves ainda no construtor, sem
    // valor padrao: sem a secao `plugins.CapacitorSQLite` o app quebra logo na
    // inicializacao com "Cannot read properties of undefined". As *Location
    // apontam a pasta (dentro de ~/Documents, Documentos etc.) onde o arquivo
    // .db fica gravado no desktop.
    CapacitorSQLite: {
      electronIsEncryption: false,
      electronLinuxLocation: 'Databases',
      electronWindowsLocation: 'Databases',
      electronMacLocation: 'Databases',
    },
  },
};

export default config;
