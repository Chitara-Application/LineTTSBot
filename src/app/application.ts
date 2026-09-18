import type { Logger } from "pino";

import {
  ConfigManager
} from "../config/manager.js";

import type { AppConfig } from "../config/schema.js";

import {
  createLogger
} from "../logger/logger.js";

import {
  VoicevoxEngine
} from "../tts/voicevox.js";

import {
  BotState,
  StateManager
} from "./state.js";

import {
  getErrorMessage
} from "../utils/errors.js";

import {
  createAppPaths,
  ensureAppDirectories,
  type AppPaths
} from "../utils/paths.js";

export interface ApplicationStatus {
  state: BotState;
  startedAt: string | null;
  version: string;
  voicevox: {
    enabled: boolean;
    runningByUs: boolean;
  };
}

export class Application {
  private readonly paths: AppPaths;

  private readonly state =
    new StateManager();

  private readonly configManager: ConfigManager;

  private config:
    AppConfig | null = null;

  private logger:
    Logger | null = null;

  private voicevox:
    VoicevoxEngine | null = null;

  private startedAt:
    string | null = null;

  private shutdownStarted =
    false;

  public constructor() {
    this.paths =
      createAppPaths();

    this.configManager =
      new ConfigManager(
        this.paths.configFile
      );
  }

  public async start(): Promise<void> {
    if (
      this.shutdownStarted
    ) {
      throw new Error(
        "終了処理開始後のApplicationは起動できません。"
      );
    }

    await ensureAppDirectories(
      this.paths
    );

    this.state.set(
      BotState.STARTING,
      "Application startup"
    );

    this.config =
      await this.configManager.load();

    this.logger =
      await createLogger({
        level:
          this.config.logging.level,

        filePath:
          this.resolveConfiguredLogPath(
            this.config.logging.file
          ),

        console:
          this.config.logging.console
      });

    this.logger.info(
      {
        root: this.paths.root
      },
      "LineTTSBotを起動しています。"
    );

    this.logger.info(
      {
        config:
          this.paths.configFile
      },
      "設定を読み込みました。"
    );

    this.voicevox =
      new VoicevoxEngine(
        this.config,
        this.paths,
        this.logger
      );

    if (
      this.config.voicevox.enabled
    ) {
      const ready =
        await this.voicevox.ensureReady();

      if (
        !ready &&
        this.config.voicevox.required
      ) {
        throw new Error(
          "VOICEVOX Engineが利用可能になっていません。"
        );
      }

      if (!ready) {
        this.logger.warn(
          "VOICEVOX Engineは現時点では利用できません。"
        );
      }
    }

    /*
     * Phase 0ではここで終了。
     *
     * Phase 2:
     * LINE Client初期化
     *
     * Phase 3以降:
     * Group / Message / Call / TTSなどを登録
     */
    this.startedAt =
      new Date().toISOString();

    this.state.set(
      BotState.READY,
      "Phase 0 initialization complete"
    );

    this.logger.info(
      "Phase 0の初期化が完了しました。LINE接続はまだ開始していません。"
    );
  }

  public async shutdown(
    reason = "shutdown"
  ): Promise<void> {
    if (
      this.shutdownStarted
    ) {
      return;
    }

    this.shutdownStarted = true;

    this.state.set(
      BotState.STOPPING,
      reason
    );

    try {
      this.logger?.info(
        {
          reason
        },
        "LineTTSBotを終了します。"
      );

      if (
        this.voicevox !== null &&
        this.config?.voicevox.stopOnExit
      ) {
        await this.voicevox.stop();
      }
    } catch (error) {
      this.logger?.error(
        {
          error:
            getErrorMessage(error)
        },
        "終了処理中にエラーが発生しました。"
      );
    } finally {
      this.state.set(
        BotState.OFFLINE,
        "Shutdown complete"
      );

      this.logger?.flush();
    }
  }

  public getStateManager(): StateManager {
    return this.state;
  }

  public getLogger(): Logger | null {
    return this.logger;
  }

  public getConfig(): AppConfig {
    if (
      this.config === null
    ) {
      throw new Error(
        "Applicationがまだ起動していません。"
      );
    }

    return this.config;
  }

  public getStatus(): ApplicationStatus {
    return {
      state:
        this.state.current,

      startedAt:
        this.startedAt,

      version: "0.1.0",

      voicevox: {
        enabled:
          this.config?.voicevox.enabled ??
          false,

        runningByUs:
          this.voicevox?.runningByUs ??
          false
      }
    };
  }

  private resolveConfiguredLogPath(
    configuredPath: string
  ): string {
    if (
      configuredPath.match(
        /^[A-Za-z]:[\\/]/
      ) ||
      configuredPath.startsWith(
        "\\\\"
      )
    ) {
      return configuredPath;
    }

    return `${this.paths.root}/${configuredPath}`;
  }
}