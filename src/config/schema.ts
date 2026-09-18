import { z } from "zod";

const GroupConfigSchema = z.object({
  enabled: z.boolean().default(true),
  autoJoin: z.boolean().default(true),
  autoLeave: z.boolean().default(true),

  announceJoin: z.boolean().default(true),
  announceLeave: z.boolean().default(true),

  defaultSpeaker: z.number().int().nonnegative().nullable().default(null),

  maxMessageLength: z
    .number()
    .int()
    .positive()
    .default(500)
});

const ReplaceRuleSchema = z.object({
  enabled: z.boolean().default(true),
  pattern: z.string().min(1),
  replacement: z.string(),
  flags: z.string().default("gu")
});

export const AppConfigSchema = z.object({
  version: z.literal(1).default(1),

  line: z.object({
    device: z.string().default("DESKTOPWIN"),
    sessionFile: z.string().default("data/session/line.json"),

    auth: z.object({
      mode: z.enum([
        "password",
        "token"
      ]).default("password")
    })
  }).default({}),

  voicevox: z.object({
    enabled: z.boolean().default(true),

    host: z.string().default("127.0.0.1"),
    port: z.number().int().positive().default(50021),

    autoStart: z.boolean().default(true),
    required: z.boolean().default(false),

    executable: z.string().default("VOICEVOX/run.exe"),
    args: z.array(z.string()).default([]),

    startupTimeoutMs: z
      .number()
      .int()
      .positive()
      .default(90000),

    requestTimeoutMs: z
      .number()
      .int()
      .positive()
      .default(10000),

    stopOnExit: z.boolean().default(true)
  }).default({}),

  groups: z
    .record(GroupConfigSchema)
    .default({}),

  speakers: z.object({
    default: z.number().int().nonnegative().default(1),

    users: z
      .record(z.number().int().nonnegative())
      .default({})
  }).default({}),

  replaceRules: z
    .array(ReplaceRuleSchema)
    .default([
      {
        enabled: true,
        pattern: "https?://\\S+",
        replacement: "「URL」",
        flags: "giu"
      },
      {
        enabled: true,
        pattern: "w+",
        replacement: "わら",
        flags: "giu"
      }
    ]),

  filters: z.object({
    ignoreEmpty: z.boolean().default(true),
    ignoreOwnMessages: z.boolean().default(true),
    ignoreBotMessages: z.boolean().default(true),
    ignoreCommands: z.boolean().default(true),

    maxMessageLength: z
      .number()
      .int()
      .positive()
      .default(500),

    blockedWords: z.array(z.string()).default([]),

    blockedUsers: z.array(z.string()).default([])
  }).default({}),

  queue: z.object({
    maxSize: z.number().int().positive().default(20),

    overflowPolicy: z
      .enum([
        "drop-oldest",
        "drop-newest"
      ])
      .default("drop-oldest"),

    interruptCurrent: z.boolean().default(false)
  }).default({}),

  reconnect: z.object({
    enabled: z.boolean().default(true),

    maxAttempts: z
      .number()
      .int()
      .nonnegative()
      .default(10),

    delayMs: z
      .number()
      .int()
      .positive()
      .default(5000),

    maxDelayMs: z
      .number()
      .int()
      .positive()
      .default(60000)
  }).default({}),

  call: z.object({
    autoJoin: z.boolean().default(true),

    autoLeave: z.boolean().default(true),

    joinDelayMs: z
      .number()
      .int()
      .nonnegative()
      .default(1000),

    reconnectDelayMs: z
      .number()
      .int()
      .positive()
      .default(3000)
  }).default({}),

  audio: z.object({
    sampleRate: z
      .number()
      .int()
      .positive()
      .default(48000),

    channels: z
      .number()
      .int()
      .positive()
      .default(1),

    frameDurationMs: z
      .number()
      .int()
      .positive()
      .default(20)
  }).default({}),

  notifications: z.object({
    entry: z.boolean().default(true),
    exit: z.boolean().default(true)
  }).default({}),

  rateLimit: z.object({
    enabled: z.boolean().default(true),

    maxMessages: z
      .number()
      .int()
      .positive()
      .default(20),

    windowMs: z
      .number()
      .int()
      .positive()
      .default(10000)
  }).default({}),

  logging: z.object({
    level: z
      .enum([
        "debug",
        "info",
        "warn",
        "error"
      ])
      .default("info"),

    file: z.string().default("logs/app.log"),

    console: z.boolean().default(true)
  }).default({}),

  gui: z.object({
    enabled: z.boolean().default(true),

    closeToTray: z.boolean().default(true),

    startMinimized: z.boolean().default(false),

    tray: z.boolean().default(true)
  }).default({})
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

export function createDefaultConfig(): AppConfig {
  return AppConfigSchema.parse({});
}