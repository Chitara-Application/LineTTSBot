import path from "node:path";

import {
  mkdir
} from "node:fs/promises";

export interface AppPaths {
  root: string;

  configDir: string;
  configFile: string;

  dataDir: string;
  sessionDir: string;
  cacheDir: string;

  logsDir: string;
  logFile: string;

  tempDir: string;

  toolsDir: string;
  ffmpegDir: string;
  ffmpegExecutable: string;
}

function expandEnvironmentVariables(
  value: string
): string {
  return value.replace(
    /%([^%]+)%/g,
    (_, key: string) =>
      process.env[key] ?? `%${key}%`
  );
}

export function resolveAppPath(
  root: string,
  value: string
): string {
  const expanded =
    expandEnvironmentVariables(value);

  if (path.isAbsolute(expanded)) {
    return path.normalize(
      expanded
    );
  }

  return path.resolve(
    root,
    expanded
  );
}

export function createAppPaths(): AppPaths {
  const root =
    process.env.LINETTSBOT_ROOT
      ? path.resolve(
          process.env.LINETTSBOT_ROOT
        )
      : process.cwd();

  const configDir =
    path.join(root, "config");

  const dataDir =
    path.join(root, "data");

  const sessionDir =
    path.join(dataDir, "session");

  const cacheDir =
    path.join(dataDir, "cache");

  const logsDir =
    path.join(root, "logs");

  const tempDir =
    path.join(root, "temp");

  const toolsDir =
    path.join(root, "tools");

  const ffmpegDir =
    path.join(toolsDir, "ffmpeg");

  return {
    root,

    configDir,
    configFile: path.join(
      configDir,
      "config.json"
    ),

    dataDir,
    sessionDir,
    cacheDir,

    logsDir,
    logFile: path.join(
      logsDir,
      "app.log"
    ),

    tempDir,

    toolsDir,
    ffmpegDir,
    ffmpegExecutable: path.join(
      ffmpegDir,
      "ffmpeg.exe"
    )
  };
}

export async function ensureAppDirectories(
  paths: AppPaths
): Promise<void> {
  const directories = [
    paths.configDir,
    paths.dataDir,
    paths.sessionDir,
    paths.cacheDir,
    paths.logsDir,
    paths.tempDir,
    paths.toolsDir,
    paths.ffmpegDir
  ];

  await Promise.all(
    directories.map(
      (directory) =>
        mkdir(directory, {
          recursive: true
        })
    )
  );
}