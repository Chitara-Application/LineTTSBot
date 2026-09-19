import { z } from "zod";

const GroupConfigSchema = z.object({
  enabled: z.boolean().default(true),
  autoJoin: z.boolean().default(true),
  autoLeave: z.boolean().default(true),

  announceJoin: z.boolean().default(true),
  announceLeave: z.boolean().default(true),

  defaultSpeaker: z
    .number()
    .int()
    .nonnegative()
    .nullable()
    .default(null),

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

const LineAuthSchema = z.object({
  mode: z
    .enum([
      "qr",
      "password",
      "token"
    ])
    .default("qr")
});

const LineDeviceSchema = z.enum([
  "DESKTOPWIN",
  "DESKTOPMAC",
  "ANDROID",
  "ANDROIDSECONDARY",
  "IOS",
  "IOSIPAD",
  "WATCHOS",
  "WEAROS"
]);
const LineConfigSchema = z.object({
  device: LineDeviceSchema.default(
    "DESKTOPWIN"
  ),

  sessionFile: z.string().default(
    "data/session/line.json"
  ),

  auth: LineAuthSchema.default(
    LineAuthSchema.parse({})
  )
});
const VoicevoxConfigSchema = z.object({
  enabled: z.boolean().default(true),

  host: z
    .string()
    .default("127.0.0.1"),

  port: z
    .number()
    .int()
    .positive()
    .default(50021),

  autoStart: z
    .boolean()
    .default(true),

  required: z
    .boolean()
    .default(false),

  executable: z
    .string()
    .default("VOICEVOX/run.exe"),

  args: z
    .array(z.string())
    .default([]),

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

  stopOnExit: z
    .boolean()
    .default(true)
});

const SpeakersConfigSchema = z.object({
  default: z
    .number()
    .int()
    .nonnegative()
    .default(1),

  users: z
    .record(
      z.string(),
      z.number().int().nonnegative()
    )
    .default({})
});

const FiltersConfigSchema = z.object({
  ignoreEmpty: z
    .boolean()
    .default(true),

  ignoreOwnMessages: z
    .boolean()
    .default(true),

  ignoreBotMessages: z
    .boolean()
    .default(true),

  ignoreCommands: z
    .boolean()
    .default(true),

  maxMessageLength: z
    .number()
    .int()
    .positive()
    .default(500),

  blockedWords: z
    .array(z.string())
    .default([]),

  blockedUsers: z
    .array(z.string())
    .default([])
});

const QueueConfigSchema = z.object({
  maxSize: z
    .number()
    .int()
    .positive()
    .default(20),

  overflowPolicy: z
    .enum([
      "drop-oldest",
      "drop-newest"
    ])
    .default("drop-oldest"),

  interruptCurrent: z
    .boolean()
    .default(false)
});

const ReconnectConfigSchema = z.object({
  enabled: z
    .boolean()
    .default(true),

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
});

const CallConfigSchema = z.object({
  autoJoin: z
    .boolean()
    .default(true),

  autoLeave: z
    .boolean()
    .default(true),

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
});

const AudioConfigSchema = z.object({
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
});

const NotificationsConfigSchema = z.object({
  entry: z
    .boolean()
    .default(true),

  exit: z
    .boolean()
    .default(true)
});

const RateLimitConfigSchema = z.object({
  enabled: z
    .boolean()
    .default(true),

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
});

const LoggingConfigSchema = z.object({
  level: z
    .enum([
      "debug",
      "info",
      "warn",
      "error"
    ])
    .default("info"),

  file: z
    .string()
    .default("logs/app.log"),

  console: z
    .boolean()
    .default(true)
});

const GuiConfigSchema = z.object({
  enabled: z
    .boolean()
    .default(true),

  closeToTray: z
    .boolean()
    .default(true),

  startMinimized: z
    .boolean()
    .default(false),

  tray: z
    .boolean()
    .default(true)
});

export const AppConfigSchema = z.object({
  version: z
    .literal(1)
    .default(1),

  line: LineConfigSchema.default(
    LineConfigSchema.parse({})
  ),

  voicevox: VoicevoxConfigSchema.default(
    VoicevoxConfigSchema.parse({})
  ),

  groups: z
    .record(
      z.string(),
      GroupConfigSchema
    )
    .default({}),

  speakers: SpeakersConfigSchema.default(
    SpeakersConfigSchema.parse({})
  ),

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

  filters: FiltersConfigSchema.default(
    FiltersConfigSchema.parse({})
  ),

  queue: QueueConfigSchema.default(
    QueueConfigSchema.parse({})
  ),

  reconnect: ReconnectConfigSchema.default(
    ReconnectConfigSchema.parse({})
  ),

  call: CallConfigSchema.default(
    CallConfigSchema.parse({})
  ),

  audio: AudioConfigSchema.default(
    AudioConfigSchema.parse({})
  ),

  notifications:
    NotificationsConfigSchema.default(
      NotificationsConfigSchema.parse({})
    ),

  rateLimit:
    RateLimitConfigSchema.default(
      RateLimitConfigSchema.parse({})
    ),

  logging:
    LoggingConfigSchema.default(
      LoggingConfigSchema.parse({})
    ),

  gui:
    GuiConfigSchema.default(
      GuiConfigSchema.parse({})
    )
});

export type AppConfig =
  z.infer<typeof AppConfigSchema>;

export function createDefaultConfig(): AppConfig {
  return AppConfigSchema.parse({});
}