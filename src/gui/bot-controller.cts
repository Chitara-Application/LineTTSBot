export type GuiBotState =
  | "OFFLINE"
  | "STARTING"
  | "READY"
  | "STOPPING"
  | "ERROR";

export interface GuiLogEvent {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
}

export interface BotControllerEvents {
  stateChanged: (state: GuiBotState) => void;
  log: (event: GuiLogEvent) => void;
  error: (message: string) => void;
}

export interface BotCoreAdapter {
  start(): Promise<void>;
  stop(): Promise<void>;
}

export class BotController {
  private state: GuiBotState = "OFFLINE";

  private readonly listeners: {
    stateChanged: Set<BotControllerEvents["stateChanged"]>;
    log: Set<BotControllerEvents["log"]>;
    error: Set<BotControllerEvents["error"]>;
  } = {
    stateChanged: new Set(),
    log: new Set(),
    error: new Set()
  };

  public constructor(
    private readonly core: BotCoreAdapter
  ) {}

  public getState(): GuiBotState {
    return this.state;
  }

  public async start(): Promise<void> {
    if (
      this.state === "STARTING" ||
      this.state === "READY"
    ) {
      return;
    }

    this.setState("STARTING");
    this.writeLog("INFO", "Bot Coreを起動しています。");

    try {
      await this.core.start();

      this.setState("READY");
      this.writeLog(
        "INFO",
        "Bot Coreの初期化が完了しました。"
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      this.setState("ERROR");
      this.writeLog(
        "ERROR",
        `Bot Coreの起動に失敗しました: ${message}`
      );

      this.emit("error", message);

      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (
      this.state === "OFFLINE" ||
      this.state === "STOPPING"
    ) {
      return;
    }

    this.setState("STOPPING");
    this.writeLog("INFO", "Bot Coreを停止しています。");

    try {
      await this.core.stop();

      this.setState("OFFLINE");
      this.writeLog(
        "INFO",
        "Bot Coreを停止しました。"
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      this.setState("ERROR");
      this.writeLog(
        "ERROR",
        `Bot Coreの停止に失敗しました: ${message}`
      );

      this.emit("error", message);

      throw error;
    }
  }

  public async restart(): Promise<void> {
    this.writeLog("INFO", "Bot Coreを再起動します。");

    if (this.state !== "OFFLINE") {
      await this.stop();
    }

    await this.start();
  }

  public on<K extends keyof BotControllerEvents>(
    event: K,
    listener: BotControllerEvents[K]
  ): () => void {
    this.listeners[event].add(listener);

    return () => {
      this.listeners[event].delete(listener);
    };
  }

  private setState(state: GuiBotState): void {
    this.state = state;

    this.emit(
      "stateChanged",
      state
    );
  }

  private writeLog(
    level: GuiLogEvent["level"],
    message: string
  ): void {
    this.emit("log", {
      timestamp: new Date().toISOString(),
      level,
      message
    });
  }

  private emit<K extends keyof BotControllerEvents>(
    event: K,
    ...args: Parameters<BotControllerEvents[K]>
  ): void {
    for (const listener of this.listeners[event]) {
      listener(...args);
    }
  }
}