import {
  spawn,
  type ChildProcess
} from "node:child_process";

import {
  existsSync
} from "node:fs";

import path from "node:path";

import type { Logger } from "pino";

import type { AppConfig } from "../config/schema.js";

import type { AppPaths } from "../utils/paths.js";

import { sleep } from "../utils/sleep.js";

export class VoicevoxEngine {
  private process:
    ChildProcess | null = null;

  private startedByUs =
    false;

  public constructor(
    private readonly config: AppConfig,
    private readonly paths: AppPaths,
    private readonly logger: Logger
  ) {}

  public get baseUrl(): string {
    return `http://${this.config.voicevox.host}:${this.config.voicevox.port}`;
  }

  public get runningByUs(): boolean {
    return this.startedByUs;
  }

  public async isReady(): Promise<boolean> {
    try {
      const response =
        await fetch(
          `${this.baseUrl}/speakers`,
          {
            method: "GET",
            signal:
              AbortSignal.timeout(
                this.config.voicevox.requestTimeoutMs
              )
          }
        );

      return response.ok;
    } catch {
      return false;
    }
  }

  public async ensureReady(): Promise<boolean> {
    if (!this.config.voicevox.enabled) {
      this.logger.info(
        "VOICEVOX Engineは設定で無効化されています。"
      );

      return false;
    }

    if (await this.isReady()) {
      this.logger.info(
        "VOICEVOX Engineは既に起動しています。既存プロセスを使用します。"
      );

      return true;
    }

    if (!this.config.voicevox.autoStart) {
      this.logger.warn(
        "VOICEVOX Engineは未起動で、自動起動も無効です。"
      );

      return false;
    }

    const executable =
      this.resolveExecutable();

    if (!existsSync(executable)) {
      this.logger.warn(
        {
          executable
        },
        "VOICEVOX Engineの実行ファイルが見つかりません。"
      );

      return false;
    }

    await this.start(
      executable
    );

    try {
      await this.waitUntilReady();

      this.logger.info(
        "VOICEVOX Engineの起動を確認しました。"
      );

      return true;
    } catch (error) {
      this.logger.error(
        {
          error:
            error instanceof Error
              ? error.message
              : String(error)
        },
        "VOICEVOX Engineの起動確認に失敗しました。"
      );

      await this.stop();

      return false;
    }
  }

  private resolveExecutable(): string {
    const configured =
      this.config.voicevox.executable;

    if (
      path.isAbsolute(
        configured
      )
    ) {
      return path.normalize(
        configured
      );
    }

    return path.resolve(
      this.paths.root,
      configured
    );
  }

  private async start(
    executable: string
  ): Promise<void> {
    if (
      this.process !== null &&
      !this.process.killed
    ) {
      return;
    }

    this.logger.info(
      {
        executable
      },
      "VOICEVOX Engineを起動します。"
    );

    const child =
      spawn(
        executable,
        this.config.voicevox.args,
        {
          cwd: path.dirname(
            executable
          ),

          windowsHide: true,

          stdio: "ignore"
        }
      );

    this.process = child;

    this.startedByUs = true;

    child.once(
      "error",
      (error) => {
        this.logger.error(
          {
            error: error.message
          },
          "VOICEVOX Engineプロセスでエラーが発生しました。"
        );
      }
    );

    child.once(
      "exit",
      (
        code,
        signal
      ) => {
        this.logger.info(
          {
            code,
            signal
          },
          "VOICEVOX Engineプロセスが終了しました。"
        );

        this.process = null;
      }
    );
  }

  private async waitUntilReady(): Promise<void> {
    const timeout =
      this.config.voicevox.startupTimeoutMs;

    const interval = 500;

    const startedAt =
      Date.now();

    while (
      Date.now() - startedAt <
      timeout
    ) {
      if (
        await this.isReady()
      ) {
        return;
      }

      await sleep(interval);
    }

    throw new Error(
      `VOICEVOX Engineが${timeout}ms以内にReadyになりませんでした。`
    );
  }

  public async stop(): Promise<void> {
    if (
      !this.startedByUs
    ) {
      return;
    }

    const child =
      this.process;

    if (
      child === null ||
      child.killed
    ) {
      this.process = null;
      this.startedByUs = false;

      return;
    }

    this.logger.info(
      "Botが起動したVOICEVOX Engineを終了します。"
    );

    child.kill();

    await Promise.race([
      new Promise<void>(
        (resolve) => {
          child.once(
            "exit",
            () => resolve()
          );
        }
      ),
      sleep(3000)
    ]);

    this.process = null;
    this.startedByUs = false;
  }
}