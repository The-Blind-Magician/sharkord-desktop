import {
  app,
  dialog,
  BrowserWindow,
  Tray,
} from 'electron';
import log from 'electron-log';
import pkg from 'electron-updater';
import path from 'path';
import { loadAppConfig } from './config.js';
import { setupAutoUpdater } from './libs/updater.js';
import {
  createSharkordSecurity,
  type SharkordFrameGuard,
} from './libs/sharkordSecurity.js';
import {
  configureScreenCapture,
  registerScreencastIpc,
} from './libs/screencast.js';
import { createAppTray } from './libs/tray.js';
import { createMainWindow, showOrCreateMainWindow } from './libs/mainWindow.js';

const { autoUpdater } = pkg;

log.transports.file.level = 'info';
autoUpdater.logger = log;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let sharkordUrl: string | null = null;
let isSharkordFrame: SharkordFrameGuard = () => false;
let assertSharkordFrame: (url: string) => void = () => {
  throw new Error('Sharkord security is not initialized.');
};

const trayIconPath = path.join(app.getAppPath(), 'public', 'icon.ico');
const preloadPath = path.join(app.getAppPath(), 'dist', 'preload.js');

const singletonLock = app.requestSingleInstanceLock();

if (!singletonLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    showMainWindow();
  });

  app.on('ready', () => {
    try {
      const config = loadAppConfig();
      const security = createSharkordSecurity(new URL(config.sharkordUrl).origin);

      sharkordUrl = config.sharkordUrl;
      isSharkordFrame = security.isSharkordFrame;
      assertSharkordFrame = security.assertSharkordFrame;
      log.info(`Loaded Sharkord destination from ${config.configPath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      log.error('Failed to load Sharkord config', error);
      dialog.showErrorBox('Sharkord configuration error', message);
      app.quit();
      return;
    }

    registerScreencastIpc({ assertSharkordFrame });
    configureScreenCapture({
      isSharkordFrame,
      getMainWindow: () => mainWindow,
    });

    mainWindow = createMainWindow({
      sharkordUrl,
      trayIconPath,
      preloadPath,
      isSharkordFrame,
      isQuitting: () => isQuitting,
    });

    createTray();
    showMainWindow();

    if (app.isPackaged) {
      setupAutoUpdater(autoUpdater, log);
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('before-quit', () => {
    isQuitting = true;
    mainWindow = null;
    tray?.destroy();
    tray = null;
  });
}

const showMainWindow = () => {
  mainWindow = showOrCreateMainWindow(mainWindow, () =>
    createMainWindow({
      sharkordUrl,
      trayIconPath,
      preloadPath,
      isSharkordFrame,
      isQuitting: () => isQuitting,
    })
  );
};

const createTray = () => {
  if (tray !== null) return;

  tray = createAppTray({
    trayIconPath,
    onOpen: showMainWindow,
    onQuit: () => {
      isQuitting = true;
      app.quit();
    },
  });
};
