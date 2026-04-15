type UpdaterLike = {
  autoDownload: boolean;
  checkForUpdates: () => void;
  downloadUpdate: () => void;
  quitAndInstall: () => void;
  on: (...args: any[]) => unknown;
};

type LoggerLike = {
  info: (...args: any[]) => void;
  error: (...args: any[]) => void;
};

const setupAutoUpdater = (autoUpdater: UpdaterLike, log: LoggerLike) => {
  autoUpdater.autoDownload = false;
  autoUpdater.checkForUpdates();

  autoUpdater.on('update-available', () => {
    autoUpdater.downloadUpdate();
  });

  autoUpdater.on('download-progress', (progress: { percent: number }) => {
    log.info(`Download progress: ${progress.percent}%`);
  });

  autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall();
  });

  autoUpdater.on('error', (error: unknown) => {
    log.error('Updater error', error);
  });
};

export { setupAutoUpdater };
