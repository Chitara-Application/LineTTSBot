export interface GuiLogEvent {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
}

export interface LineTTSApi {
  bot: {
    start(): Promise<void>;
    stop(): Promise<void>;
    restart(): Promise<void>;
    getState(): Promise<string>;
  };

  window: {
    minimize(): Promise<void>;
    toggleMaximize(): Promise<boolean>;
    closeToTray(): Promise<void>;
  };

  events: {
    onStateChanged(
      callback: (state: string) => void
    ): () => void;

    onLog(
      callback: (event: GuiLogEvent) => void
    ): () => void;

    onError(
      callback: (message: string) => void
    ): () => void;
  };
}

declare global {
  interface Window {
    lineTTS: LineTTSApi;
  }
}

export {};