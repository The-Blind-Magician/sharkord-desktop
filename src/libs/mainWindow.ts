import { BrowserWindow, shell } from 'electron';
import type { SharkordFrameGuard } from './sharkordSecurity.js';

type CreateMainWindowOptions = {
  sharkordUrl: string | null;
  trayIconPath: string;
  preloadPath: string;
  isSharkordFrame: SharkordFrameGuard;
  isQuitting: () => boolean;
};

const createMainWindow = ({
  sharkordUrl,
  trayIconPath,
  preloadPath,
  isSharkordFrame,
  isQuitting,
}: CreateMainWindowOptions) => {
  if (sharkordUrl === null) {
    throw new Error('Sharkord destination URL has not been loaded.');
  }

  const window = new BrowserWindow({
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

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isSharkordFrame(url)) {
      return { action: 'allow' };
    }

    shell.openExternal(url);
    return { action: 'deny' };
  });

  window.webContents.on('will-navigate', (event, url) => {
    if (!isSharkordFrame(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  window.on('close', (event) => {
    if (isQuitting()) {
      return;
    }

    event.preventDefault();
    window.hide();
  });

  window.loadURL(sharkordUrl);

  return window;
};

const showOrCreateMainWindow = (
  currentWindow: BrowserWindow | null,
  createWindow: () => BrowserWindow
) => {
  const window = currentWindow ?? createWindow();

  if (window.isMinimized()) {
    window.restore();
  }

  window.show();
  window.focus();

  return window;
};

export { createMainWindow, showOrCreateMainWindow };
