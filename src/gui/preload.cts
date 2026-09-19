import {
  contextBridge,
  ipcRenderer
} from "electron";

const lineTTSApi = {
  bot: {
    start: (): Promise<void> =>
      ipcRenderer.invoke("bot:start"),

    stop: (): Promise<void> =>
      ipcRenderer.invoke("bot:stop"),

    restart: (): Promise<void> =>
      ipcRenderer.invoke("bot:restart"),

    getState: () =>
      ipcRenderer.invoke("bot:get-state")
  },

  window: {
    minimize: (): Promise<void> =>
      ipcRenderer.invoke("window:minimize"),

    toggleMaximize: (): Promise<boolean> =>
      ipcRenderer.invoke("window:toggle-maximize"),

    closeToTray: (): Promise<void> =>
      ipcRenderer.invoke("window:close-to-tray")
  },

  events: {
    onStateChanged(
      callback: (state: string) => void
    ): () => void {
      const listener = (
        _event: Electron.IpcRendererEvent,
        state: string
      ): void => {
        callback(state);
      };

      ipcRenderer.on(
        "bot:state-changed",
        listener
      );

      return () => {
        ipcRenderer.removeListener(
          "bot:state-changed",
          listener
        );
      };
    },

    onLog(
      callback: (event: {
        timestamp: string;
        level: "INFO" | "WARN" | "ERROR";
        message: string;
      }) => void
    ): () => void {
      const listener = (
        _event: Electron.IpcRendererEvent,
        log: {
          timestamp: string;
          level: "INFO" | "WARN" | "ERROR";
          message: string;
        }
      ): void => {
        callback(log);
      };

      ipcRenderer.on(
        "bot:log",
        listener
      );

      return () => {
        ipcRenderer.removeListener(
          "bot:log",
          listener
        );
      };
    },

    onError(
      callback: (message: string) => void
    ): () => void {
      const listener = (
        _event: Electron.IpcRendererEvent,
        message: string
      ): void => {
        callback(message);
      };

      ipcRenderer.on(
        "bot:error",
        listener
      );

      return () => {
        ipcRenderer.removeListener(
          "bot:error",
          listener
        );
      };
    }
  }
};

contextBridge.exposeInMainWorld(
  "lineTTS",
  lineTTSApi
);