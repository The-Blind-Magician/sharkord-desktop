import {
  BrowserWindow,
  desktopCapturer,
  ipcMain,
  session,
  type DesktopCapturerSource,
} from 'electron';
import log from 'electron-log';
import type { SharkordFrameGuard } from './sharkordSecurity.js';
import {
  buildScreencastPickerDataUrl,
  type ScreencastPickerSource,
} from '../components/screencastPicker.js';

const allowedSharkordPermissions = new Set([
  'clipboard-read',
  'clipboard-sanitized-write',
  'display-capture',
  'fullscreen',
  'media',
  'notifications',
  'speaker-selection',
]);

type ConfigureScreenCaptureOptions = {
  isSharkordFrame: SharkordFrameGuard;
  getMainWindow: () => BrowserWindow | null;
};

type RegisterScreencastIpcOptions = {
  assertSharkordFrame: (url: string) => void;
};

const isAllowedSharkordPermission = (permission: string) =>
  allowedSharkordPermissions.has(permission);

const getCaptureSources = () =>
  desktopCapturer.getSources({
    types: ['screen', 'window'],
    thumbnailSize: { width: 320, height: 180 },
    fetchWindowIcons: false,
  });

const selectCaptureSource = async (
  sources: DesktopCapturerSource[],
  parentWindow: BrowserWindow | null
) => {
  if (sources.length === 0) {
    return null;
  }

  return new Promise<DesktopCapturerSource | null>((resolve) => {
    let didResolve = false;
    const sourceById = new Map(sources.map((source) => [source.id, source]));
    const pickerWindow = new BrowserWindow({
      parent: parentWindow ?? undefined,
      modal: parentWindow !== null,
      title: 'Choose what to share',
      width: 820,
      height: 620,
      minWidth: 580,
      minHeight: 420,
      autoHideMenuBar: true,
      webPreferences: {
        sandbox: true,
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    const finish = (source: DesktopCapturerSource | null) => {
      if (didResolve) {
        return;
      }

      didResolve = true;
      resolve(source);

      if (!pickerWindow.isDestroyed()) {
        pickerWindow.close();
      }
    };

    pickerWindow.webContents.on('page-title-updated', (event, title) => {
      const prefix = 'sharkord-capture-source:';

      if (!title.startsWith(prefix)) {
        return;
      }

      event.preventDefault();
      const sourceId = title.slice(prefix.length);
      finish(sourceId === 'cancel' ? null : sourceById.get(sourceId) ?? null);
    });

    pickerWindow.on('closed', () => {
      finish(null);
    });

    const pickerSources: ScreencastPickerSource[] = sources.map((source) => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
      type: source.id.startsWith('screen:') ? 'Screen' : 'Window',
    }));

    pickerWindow.loadURL(buildScreencastPickerDataUrl(pickerSources));
  });
};

const registerScreencastIpc = ({
  assertSharkordFrame,
}: RegisterScreencastIpcOptions) => {
  ipcMain.handle('screencast:get-sources', async (event) => {
    assertSharkordFrame(event.senderFrame.url);

    const sources = await getCaptureSources();

    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
    }));
  });
};

const configureScreenCapture = ({
  isSharkordFrame,
  getMainWindow,
}: ConfigureScreenCaptureOptions) => {
  session.defaultSession.setPermissionCheckHandler(
    (_webContents, permission, requestingOrigin) =>
      isAllowedSharkordPermission(permission) && isSharkordFrame(requestingOrigin)
  );

  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      callback(
        isAllowedSharkordPermission(permission) &&
          isSharkordFrame(webContents.getURL())
      );
    }
  );

  session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
    try {
      if (
        !request.videoRequested ||
        !request.userGesture ||
        !isSharkordFrame(request.securityOrigin)
      ) {
        callback({});
        return;
      }

      const sources = await getCaptureSources();
      const selectedSource = await selectCaptureSource(sources, getMainWindow());

      if (!selectedSource) {
        callback({});
        return;
      }

      callback({
        video: selectedSource,
        audio:
          request.audioRequested && process.platform === 'win32'
            ? 'loopback'
            : undefined,
      });
    } catch (error) {
      log.error('Failed to select screencast source', error);
      callback({});
    }
  });
};

export { configureScreenCapture, registerScreencastIpc };
