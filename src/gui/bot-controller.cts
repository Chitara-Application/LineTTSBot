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

  private readonly stateListeners =
    new Set<BotControllerEvents["stateChanged"]>();

  private readonly logListeners =
    new Set<BotControllerEvents["log"]>();

  private readonly errorListeners =
    new Set<BotControllerEvents["error"]>();

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
    this.writeLog(
      "INFO",
      "Bot Coreを起動しています。"
    );

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

      this.emitError(message);

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

    this.writeLog(
      "INFO",
      "Bot Coreを停止しています。"
    );

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

      this.emitError(message);

      throw error;
    }
  }

  public async restart(): Promise<void> {
    this.writeLog(
      "INFO",
      "Bot Coreを再起動します。"
    );

    if (this.state !== "OFFLINE") {
      await this.stop();
    }

    await this.start();
  }

  public on(
    event: "stateChanged",
    listener: BotControllerEvents["stateChanged"]
  ): () => void;

  public on(
    event: "log",
    listener: BotControllerEvents["log"]
  ): () => void;

  public on(
    event: "error",
    listener: BotControllerEvents["error"]
  ): () => void;

  public on(
    event: keyof BotControllerEvents,
    listener:
      | BotControllerEvents["stateChanged"]
      | BotControllerEvents["log"]
      | BotControllerEvents["error"]
  ): () => void {
    switch (event) {
      case "stateChanged": {
        const typedListener =
          listener as BotControllerEvents["stateChanged"];

        this.stateListeners.add(typedListener);

        return () => {
          this.stateListeners.delete(typedListener);
        };
      }

      case "log": {
        const typedListener =
          listener as BotControllerEvents["log"];

        this.logListeners.add(typedListener);

        return () => {
          this.logListeners.delete(typedListener);
        };
      }

      case "error": {
        const typedListener =
          listener as BotControllerEvents["error"];

        this.errorListeners.add(typedListener);

        return () => {
          this.errorListeners.delete(typedListener);
        };
      }
    }
  }

  private setState(
    state: GuiBotState
  ): void {
    this.state = state;

    for (const listener of this.stateListeners) {
      listener(state);
    }
  }

  private writeLog(
    level: GuiLogEvent["level"],
    message: string
  ): void {
    const event: GuiLogEvent = {
      timestamp: new Date().toISOString(),
      level,
      message
    };

    for (const listener of this.logListeners) {
      listener(event);
    }
  }

  private emitError(
    message: string
  ): void {
    for (const listener of this.errorListeners) {
      listener(message);
    }
  }
}