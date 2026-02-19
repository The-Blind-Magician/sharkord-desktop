import { app, BrowserWindow } from 'electron';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import log from 'electron-log';
import path from 'path';

log.transports.file.level = 'info';
autoUpdater.logger = log;

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join('./preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the remote URL
  mainWindow.loadURL('https://sharkord.thehooligans.net');

  // Open DevTools in development (optional, remove for production)
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.on('ready', () => {
  createWindow();

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
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
