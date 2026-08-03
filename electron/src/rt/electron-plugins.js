/* eslint-disable @typescript-eslint/no-var-requires */
const sqlite = require('../../../node_modules/@capacitor-community/sqlite/electron/dist/plugin.js');

// O @capacitor-community/sqlite v8 e empacotado como ESM->CJS, entao as classes
// ficam sob `default`. Tanto o setupCapacitorElectronPlugins (main) quanto o
// electron-rt (preload) percorrem as chaves deste objeto ignorando `default`,
// entao sem o unwrap abaixo nenhum handler IPC e registrado e o app quebra com
// '"CapacitorSQLite" plugin is not implemented on electron'.
// ATENCAO: este arquivo e regerado por `cap sync`; se isso acontecer, reaplicar.
const CapacitorCommunitySqlite = sqlite.default ?? sqlite;

module.exports = {
  CapacitorCommunitySqlite,
}
