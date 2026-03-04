import { app, BrowserWindow, Menu, Tray } from 'electron';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import log from 'electron-log';
import path from 'path';

log.transports.file.level = 'info';
autoUpdater.logger = log;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

const trayIconPath = path.join(app.getAppPath(), 'public', 'icon.ico');
const preloadPath = path.join(app.getAppPath(), 'dist', 'preload.js');

const singletonLock = app.requestSingleInstanceLock();

if (!singletonLock) {
    app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
  app.on('ready', () => {
    createWindow();
    createTray();

    if (app.isPackaged) {
      autoUpdater.autoDownload = false;
      autoUpdater.checkForUpdates();

      autoUpdater.on('update-available', () => {
        // optionally prompt the user, then:
        autoUpdater.downloadUpdate();
      });

      autoUpdater.on('download-progress', (p) => {
        // emit progress to renderer or log
        log.info(`Download progress: ${p.percent}%`);
      });

      autoUpdater.on('update-downloaded', () => {
        // prompt user then:
        autoUpdater.quitAndInstall();
      });

      autoUpdater.on('error', (err) => {
        log.error('Updater error', err);
      });
    }
    
    showMainWindow();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('before-quit', () => {
    isQuitting = true;
    mainWindow = null;
    if (tray) {
      tray.destroy();
      tray = null;
    }
  });

  // app.on('activate', () => {

  //   if (mainWindow === null) {
  //     createWindow();
  //   } else {
  //     showMainWindow();
  //   }
  // });

}

const showMainWindow = () => {
  if (mainWindow === null) {
    createWindow();
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  mainWindow.show();
  mainWindow.focus();
};

const createTray = () => {
  if (tray !== null) return;

  tray = new Tray(trayIconPath);
  tray.setToolTip('Sharkord');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: 'Open Sharkord',
        click: () => showMainWindow(),
      },
      {
        label: 'Quit',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ])
  );

  tray.on('click', showMainWindow);
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    titleBarStyle: 'default',
    autoHideMenuBar: true,
    icon: trayIconPath,
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the remote URL
  mainWindow.loadURL('https://sharkord.thehooligans.net');

  mainWindow.on('close', (event) => {
    if (isQuitting) {
      return;
    }

    event.preventDefault();
    mainWindow?.hide();
  });
};
