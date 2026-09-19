import {
  app,
  BrowserWindow,
  Menu,
  Tray,
  ipcMain,
  nativeImage
} from "electron";

import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BotController,
  type GuiBotState
} from "./bot-controller.cjs";

import {
  Phase0CoreAdapter
} from "./core-adapter.cjs";

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

let mainWindow:
  | BrowserWindow
  | null = null;

let tray:
  | Tray
  | null = null;

let isQuitting = false;

const botController =
  new BotController(
    new Phase0CoreAdapter()
  );

const trayIconDataUrl =
  "data:image/png;base64," +
  "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8" +
  "/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0I" +
  "Ars4c6QAAAARnQU1BAACxjwv8YQUAAACTSURBVHgB" +
  "pZKBCYAgEEV/TeAIjuIIbdQIuUGt0CS1gW1iZ2jIV" +
  "aTnhw+Cvs8/OYDJA4Y8kR3ZR2/kmazxJbpUEfQ/Dm" +
  "/UG7wVwHkjlQdMFfDdJMFaACebnjJGyDWgcnZu1/" +
  "lCrl6NCoEHJBrDwEr5NrT6ko/UV8xdLAC2N49mlc5" +
  "CylpYh8wCwqrvbBGLoKGvz8Bfq0QPWEUo/EAAAAAS" +
  "UVORK5CYII=";

function sendState(
  state: GuiBotState
): void {
  mainWindow?.webContents.send(
    "bot:state-changed",
    state
  );

  updateTrayMenu();
}

function createWindow(): void {
  mainWindow =
    new BrowserWindow({
      width: 920,
      height: 720,
      minWidth: 760,
      minHeight: 600,
      backgroundColor: "#0c0f14",
      show: false,
      autoHideMenuBar: true,

      webPreferences: {
        preload: path.join(
          __dirname,
          "preload.cjs"
        ),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    });

  mainWindow.loadFile(
    path.join(
      __dirname,
      "renderer",
      "index.html"
    )
  );

  mainWindow.once(
    "ready-to-show",
    () => {
      mainWindow?.show();
    }
  );

  mainWindow.on(
    "close",
    (event) => {
      if (isQuitting) {
        return;
      }

      event.preventDefault();
      mainWindow?.hide();
    }
  );

  mainWindow.on(
    "closed",
    () => {
      mainWindow = null;
    }
  );
}

function showWindow(): void {
  if (!mainWindow) {
    createWindow();
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  mainWindow.show();
  mainWindow.focus();
}

function createTray(): void {
  const icon =
    nativeImage.createFromDataURL(
      trayIconDataUrl
    );

  tray = new Tray(icon);

  tray.setToolTip(
    "LineTTSBot"
  );

  tray.on(
    "double-click",
    () => {
      showWindow();
    }
  );

  updateTrayMenu();
}

function updateTrayMenu(): void {
  if (!tray) {
    return;
  }

  const state =
    botController.getState();

  const menu =
    Menu.buildFromTemplate([
      {
        label: "LineTTSBot",
        enabled: false
      },

      { type: "separator" },

      {
        label: "Open",
        click: () => {
          showWindow();
        }
      },

      { type: "separator" },

      {
        label: "Bot Start",
        enabled:
          state !== "STARTING" &&
          state !== "READY",
        click: () => {
          void botController
            .start()
            .catch(() => undefined);
        }
      },

      {
        label: "Bot Stop",
        enabled:
          state !== "OFFLINE" &&
          state !== "STOPPING",
        click: () => {
          void botController
            .stop()
            .catch(() => undefined);
        }
      },

      {
        label: "Bot Restart",
        enabled:
          state !== "STARTING" &&
          state !== "STOPPING",
        click: () => {
          void botController
            .restart()
            .catch(() => undefined);
        }
      },

      { type: "separator" },

      {
        label: "Exit",
        click: () => {
          app.quit();
        }
      }
    ]);

  tray.setContextMenu(menu);
}

function registerIpc(): void {
  ipcMain.handle(
    "bot:start",
    async () => {
      await botController.start();
    }
  );

  ipcMain.handle(
    "bot:stop",
    async () => {
      await botController.stop();
    }
  );

  ipcMain.handle(
    "bot:restart",
    async () => {
      await botController.restart();
    }
  );

  ipcMain.handle(
    "bot:get-state",
    () => {
      return botController.getState();
    }
  );

  ipcMain.handle(
    "window:minimize",
    () => {
      mainWindow?.minimize();
    }
  );

  ipcMain.handle(
    "window:toggle-maximize",
    () => {
      if (!mainWindow) {
        return false;
      }

      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
        return false;
      }

      mainWindow.maximize();
      return true;
    }
  );

  ipcMain.handle(
    "window:close-to-tray",
    () => {
      mainWindow?.hide();
    }
  );
}

function registerControllerEvents(): void {
  botController.on(
    "stateChanged",
    (state) => {
      sendState(state);
    }
  );

  botController.on(
    "log",
    (event) => {
      mainWindow?.webContents.send(
        "bot:log",
        event
      );
    }
  );

  botController.on(
    "error",
    (message) => {
      mainWindow?.webContents.send(
        "bot:error",
        message
      );
    }
  );
}

const gotSingleInstanceLock =
  app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on(
    "second-instance",
    () => {
      showWindow();
    }
  );

  app.whenReady().then(() => {
    registerIpc();
    registerControllerEvents();

    createWindow();
    createTray();

    app.on(
      "activate",
      () => {
        showWindow();
      }
    );
  });

  app.on(
    "window-all-closed",
    () => {
      /*
       * タスクトレイ常駐のため終了しない。
       */
    }
  );

  app.on(
    "before-quit",
    (event) => {
      if (isQuitting) {
        return;
      }

      event.preventDefault();
      isQuitting = true;

      void botController
        .stop()
        .catch(() => undefined)
        .finally(() => {
          app.exit(0);
        });
    }
  );
}