import { Menu, Tray } from 'electron';

type CreateAppTrayOptions = {
  trayIconPath: string;
  onOpen: () => void;
  onQuit: () => void;
};

const createAppTray = ({ trayIconPath, onOpen, onQuit }: CreateAppTrayOptions) => {
  const tray = new Tray(trayIconPath);

  tray.setToolTip('Sharkord');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: 'Open Sharkord',
        click: onOpen,
      },
      {
        label: 'Quit',
        click: onQuit,
      },
    ])
  );

  tray.on('click', onOpen);

  return tray;
};

export { createAppTray };
