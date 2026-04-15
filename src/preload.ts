import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
});

contextBridge.exposeInMainWorld('sharkordDesktop', {
  getScreencastSources: () => ipcRenderer.invoke('screencast:get-sources'),
  startScreencastOverlay: () => Promise.resolve(),
  stopScreencastOverlay: () => Promise.resolve(),
});
