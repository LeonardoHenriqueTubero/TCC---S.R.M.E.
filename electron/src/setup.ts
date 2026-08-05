import type { CapacitorElectronConfig } from '@capacitor-community/electron';
import {
  CapElectronEventEmitter,
  setupCapacitorElectronPlugins,
} from '@capacitor-community/electron';
import chokidar from 'chokidar';
import type { MenuItemConstructorOptions } from 'electron';
import { app, BrowserWindow, Menu, MenuItem, nativeImage, Tray, session } from 'electron';
import electronIsDev from 'electron-is-dev';
import electronServe from 'electron-serve';
import windowStateKeeper from 'electron-window-state';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Define components for a watcher to detect when the webapp is changed so we can reload in Dev mode.
const reloadWatcher = {
  debouncer: null,
  ready: false,
  watcher: null,
};
export function setupReloadWatcher(electronCapacitorApp: ElectronCapacitorApp): void {
  reloadWatcher.watcher = chokidar
    .watch(join(app.getAppPath(), 'app'), {
      ignored: /[/\\]\./,
      persistent: true,
    })
    .on('ready', () => {
      reloadWatcher.ready = true;
    })
    .on('all', (_event, _path) => {
      if (reloadWatcher.ready) {
        clearTimeout(reloadWatcher.debouncer);
        reloadWatcher.debouncer = setTimeout(async () => {
          electronCapacitorApp.getMainWindow().webContents.reload();
          reloadWatcher.ready = false;
          clearTimeout(reloadWatcher.debouncer);
          reloadWatcher.debouncer = null;
          reloadWatcher.watcher = null;
          setupReloadWatcher(electronCapacitorApp);
        }, 1500);
      }
    });
}

// Define our class to manage our app.
export class ElectronCapacitorApp {
  private MainWindow: BrowserWindow | null = null;
  private SplashWindow: BrowserWindow | null = null;
  private TrayIcon: Tray | null = null;
  private CapacitorFileConfig: CapacitorElectronConfig;
  private TrayMenuTemplate: (MenuItem | MenuItemConstructorOptions)[] = [
    new MenuItem({ label: 'Quit App', role: 'quit' }),
  ];
  private AppMenuBarMenuTemplate: (MenuItem | MenuItemConstructorOptions)[] = [
    { role: process.platform === 'darwin' ? 'appMenu' : 'fileMenu' },
    { role: 'viewMenu' },
  ];
  private mainWindowState;
  private loadWebApp;
  private customScheme: string;

  constructor(
    capacitorFileConfig: CapacitorElectronConfig,
    trayMenuTemplate?: (MenuItemConstructorOptions | MenuItem)[],
    appMenuBarMenuTemplate?: (MenuItemConstructorOptions | MenuItem)[]
  ) {
    this.CapacitorFileConfig = capacitorFileConfig;

    this.customScheme = this.CapacitorFileConfig.electron?.customUrlScheme ?? 'capacitor-electron';

    if (trayMenuTemplate) {
      this.TrayMenuTemplate = trayMenuTemplate;
    }

    if (appMenuBarMenuTemplate) {
      this.AppMenuBarMenuTemplate = appMenuBarMenuTemplate;
    }

    // Setup our web app loader, this lets us load apps like react, vue, and angular without changing their build chains.
    this.loadWebApp = electronServe({
      directory: join(app.getAppPath(), 'app'),
      scheme: this.customScheme,
    });
  }

  // Helper function to load in the app.
  private async loadMainWindow(thisRef: any) {
    await thisRef.loadWebApp(thisRef.MainWindow);
  }

  // Tela de abertura, desenhada aqui em vez de usar o CapacitorSplashScreen do
  // @capacitor-community/electron: o HTML daquele plugin põe a imagem como
  // fundo de uma <div> sem largura nem altura, cujo único conteúdo é um espaço.
  // A div fica do tamanho desse espaço e aparece só um fragmento da arte no
  // canto superior esquerdo de uma janela branca.
  //
  // A imagem entra embutida em base64 porque a janela é carregada como data:
  // URL — dali um caminho de arquivo do disco não resolve.
  private abrirSplash(): void {
    const arquivo = join(
      app.getAppPath(),
      'assets',
      this.CapacitorFileConfig.electron?.splashScreenImageName ?? 'splash.png'
    );
    if (!existsSync(arquivo)) {
      return;
    }

    const fundo = this.CapacitorFileConfig.electron?.backgroundColor ?? '#f5f7fa';
    this.SplashWindow = new BrowserWindow({
      width: 400,
      height: 400,
      frame: false,
      resizable: false,
      center: true,
      show: false,
      backgroundColor: fundo,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });

    const imagem = readFileSync(arquivo).toString('base64');
    const html = `<html><body style="margin:0;height:100vh;display:flex;
      align-items:center;justify-content:center;background:${fundo};overflow:hidden">
      <img src="data:image/png;base64,${imagem}"
           style="width:100%;height:100%;object-fit:contain"></body></html>`;

    this.SplashWindow.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(html)}`);
    this.SplashWindow.once('ready-to-show', () => this.SplashWindow?.show());
  }

  private fecharSplash(): void {
    if (this.SplashWindow && !this.SplashWindow.isDestroyed()) {
      this.SplashWindow.close();
    }
    this.SplashWindow = null;
  }

  // Expose the mainWindow ref for use outside of the class.
  getMainWindow(): BrowserWindow {
    return this.MainWindow;
  }

  getCustomURLScheme(): string {
    return this.customScheme;
  }

  async init(): Promise<void> {
    const icon = nativeImage.createFromPath(
      join(app.getAppPath(), 'assets', process.platform === 'win32' ? 'appIcon.ico' : 'appIcon.png')
    );
    this.mainWindowState = windowStateKeeper({
      defaultWidth: 1000,
      defaultHeight: 800,
    });
    // Setup preload script path and construct our main window.
    const preloadPath = join(app.getAppPath(), 'build', 'src', 'preload.js');
    this.MainWindow = new BrowserWindow({
      icon,
      show: false,
      x: this.mainWindowState.x,
      y: this.mainWindowState.y,
      width: this.mainWindowState.width,
      height: this.mainWindowState.height,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        // Use preload to inject the electron varriant overrides for capacitor plugins.
        // preload: join(app.getAppPath(), "node_modules", "@capacitor-community", "electron", "dist", "runtime", "electron-rt.js"),
        preload: preloadPath,
      },
    });
    this.mainWindowState.manage(this.MainWindow);

    if (this.CapacitorFileConfig.backgroundColor) {
      this.MainWindow.setBackgroundColor(this.CapacitorFileConfig.electron.backgroundColor);
    }

    // Fechar a janela principal leva a tela de abertura junto, se ela ainda
    // estiver de pé.
    this.MainWindow.on('closed', () => {
      this.fecharSplash();
    });

    // When the tray icon is enabled, setup the options.
    if (this.CapacitorFileConfig.electron?.trayIconAndMenuEnabled) {
      this.TrayIcon = new Tray(icon);
      this.TrayIcon.on('double-click', () => {
        if (this.MainWindow) {
          if (this.MainWindow.isVisible()) {
            this.MainWindow.hide();
          } else {
            this.MainWindow.show();
            this.MainWindow.focus();
          }
        }
      });
      this.TrayIcon.on('click', () => {
        if (this.MainWindow) {
          if (this.MainWindow.isVisible()) {
            this.MainWindow.hide();
          } else {
            this.MainWindow.show();
            this.MainWindow.focus();
          }
        }
      });
      this.TrayIcon.setToolTip(app.getName());
      this.TrayIcon.setContextMenu(Menu.buildFromTemplate(this.TrayMenuTemplate));
    }

    // Setup the main manu bar at the top of our window.
    Menu.setApplicationMenu(Menu.buildFromTemplate(this.AppMenuBarMenuTemplate));

    // Tela de abertura enquanto a janela principal carrega.
    if (this.CapacitorFileConfig.electron?.splashScreenEnabled) {
      this.abrirSplash();
    }
    this.loadMainWindow(this);

    // Os PDFs dos relatórios chegam aqui como download. Quem abre o "Salvar
    // como" é o próprio Electron; aqui só o rotulamos, senão o título da janela
    // vira a URL blob: que o jsPDF gera.
    //
    // Este diálogo precisa do Electron 30 ou mais novo. Nas versões antigas ele
    // não ficava preso à janela do app no Linux: bastava clicar no app para ele
    // ir para trás sem volta e, sendo modal, travar o programa — em tela cheia
    // prendia até a barra de tarefas.
    this.MainWindow.webContents.session.on('will-download', (_event, item) => {
      item.setSaveDialogOptions({
        title: 'Salvar relatório',
        defaultPath: join(app.getPath('downloads'), item.getFilename()),
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });
    });

    // Security
    this.MainWindow.webContents.setWindowOpenHandler((details) => {
      // O jsPDF entrega o relatório como blob: — e a URL dele carrega o nosso
      // esquema, então caía no 'allow' abaixo e abria uma janela vazia (o
      // Electron não tem visualizador de PDF). Negando aqui, o clique vira um
      // download de verdade, tratado pelo will-download acima.
      if (details.url.startsWith('blob:')) {
        return { action: 'deny' };
      }
      if (!details.url.includes(this.customScheme)) {
        return { action: 'deny' };
      } else {
        return { action: 'allow' };
      }
    });
    this.MainWindow.webContents.on('will-navigate', (event, _newURL) => {
      if (!this.MainWindow.webContents.getURL().includes(this.customScheme)) {
        event.preventDefault();
      }
    });

    // Link electron plugins into the system.
    setupCapacitorElectronPlugins();

    // When the web app is loaded we hide the splashscreen if needed and show the mainwindow.
    this.MainWindow.webContents.on('dom-ready', () => {
      if (this.CapacitorFileConfig.electron?.splashScreenEnabled) {
        this.fecharSplash();
      }
      if (!this.CapacitorFileConfig.electron?.hideMainWindowOnLaunch) {
        this.MainWindow.show();
      }
      setTimeout(() => {
        if (electronIsDev) {
          this.MainWindow.webContents.openDevTools();
        }
        CapElectronEventEmitter.emit('CAPELECTRON_DeeplinkListenerInitialized', '');
      }, 400);
    });
  }
}

// Set a CSP up for our application based on the custom scheme
export function setupContentSecurityPolicy(customScheme: string): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          electronIsDev
            ? `default-src ${customScheme}://* 'unsafe-inline' devtools://* 'unsafe-eval' data:`
            : `default-src ${customScheme}://* 'unsafe-inline' data:`,
        ],
      },
    });
  });
}
