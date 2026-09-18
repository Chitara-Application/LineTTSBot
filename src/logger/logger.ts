import pino, { type Logger } from "pino";
import pretty from "pino-pretty";
import path from "node:path";
import { mkdir } from "node:fs/promises";

export interface LoggerOptions {
  level: "debug" | "info" | "warn" | "error";
  filePath: string;
  console: boolean;
}

export async function createLogger(
  options: LoggerOptions
): Promise<Logger> {
  await mkdir(
    path.dirname(options.filePath),
    { recursive: true }
  );

  const fileStream = pino.destination({
    dest: options.filePath,
    mkdir: true,
    sync: false
  });

  if (options.console) {
    const consoleStream = pretty({
      colorize: true,
      translateTime: "SYS:standard",
      singleLine: true
    });

    return pino(
      {
        level: options.level,
        base: { app: "LineTTSBot" }
      },
      pino.multistream([
        { stream: fileStream },
        { stream: consoleStream }
      ])
    );
  }

  return pino(
    {
      level: options.level,
      base: { app: "LineTTSBot" }
    },
    fileStream
  );
}