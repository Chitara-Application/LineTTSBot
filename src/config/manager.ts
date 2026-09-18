import {
  mkdir,
  readFile,
  writeFile
} from "node:fs/promises";

import path from "node:path";

import {
  AppConfigSchema,
  createDefaultConfig,
  type AppConfig
} from "./schema.js";

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {
    ...base
  };

  for (const [key, value] of Object.entries(override)) {
    const baseValue = result[key];

    if (
      isRecord(baseValue) &&
      isRecord(value)
    ) {
      result[key] = deepMerge(
        baseValue,
        value
      );

      continue;
    }

    result[key] = value;
  }

  return result;
}

export class ConfigManager {
  private config: AppConfig | null = null;

  public constructor(
    private readonly filePath: string
  ) {}

  public async load(): Promise<AppConfig> {
    await mkdir(
      path.dirname(this.filePath),
      {
        recursive: true
      }
    );

    try {
      const text = await readFile(
        this.filePath,
        "utf8"
      );

      const parsedJson: unknown =
        JSON.parse(text);

      if (!isRecord(parsedJson)) {
        throw new Error(
          "設定ファイルのルートはJSONオブジェクトである必要があります。"
        );
      }

      const defaults =
        createDefaultConfig();

      const merged = deepMerge(
        defaults as unknown as Record<string, unknown>,
        parsedJson
      );

      const result =
        AppConfigSchema.safeParse(
          merged
        );

      if (!result.success) {
        throw new Error(
          [
            "設定ファイルの検証に失敗しました。",
            result.error.issues
              .map(
                (issue) =>
                  `${issue.path.join(".")}: ${issue.message}`
              )
              .join("\n")
          ].join("\n")
        );
      }

      this.config = result.data;

      await this.save();

      return this.config;
    } catch (error) {
      if (
        error instanceof SyntaxError
      ) {
        throw new Error(
          `設定ファイルのJSON形式が壊れています: ${this.filePath}`,
          {
            cause: error
          }
        );
      }

      throw error;
    }
  }

  public get(): AppConfig {
    if (this.config === null) {
      throw new Error(
        "設定がまだ読み込まれていません。"
      );
    }

    return this.config;
  }

  public async reload(): Promise<AppConfig> {
    this.config = null;
    return this.load();
  }

  public async save(): Promise<void> {
    if (this.config === null) {
      throw new Error(
        "保存する設定がありません。"
      );
    }

    await mkdir(
      path.dirname(this.filePath),
      {
        recursive: true
      }
    );

    await writeFile(
      this.filePath,
      `${JSON.stringify(
        this.config,
        null,
        2
      )}\n`,
      "utf8"
    );
  }

  public async update(
    updater: (
      config: AppConfig
    ) => AppConfig
  ): Promise<AppConfig> {
    const current = this.get();

    const updated = updater(
      structuredClone(current)
    );

    const parsed =
      AppConfigSchema.parse(updated);

    this.config = parsed;

    await this.save();

    return this.config;
  }
}