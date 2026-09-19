import {
  Client,
  loginWithAuthToken,
  loginWithPassword,
  loginWithQR,
  type InitOptions
} from "@evex/linejs";
import { FileStorage } from "@evex/linejs/storage";

import type { AppConfig } from "../config/schema.js";

export type LineConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "disconnecting"
  | "error";

export interface LineAuthCredentials {
  email?: string;
  password?: string;
  authToken?: string;
}

export interface LineClientEvents {
  stateChanged: (state: LineConnectionState) => void;
  qr: (url: string) => void;
  pin: (pin: string) => void;
  authToken: (token: string) => void;
  error: (error: Error) => void;
}

export class LineClient {
  private client: Client | null = null;
  private state: LineConnectionState = "disconnected";

  private readonly config: AppConfig;
  private readonly credentials: LineAuthCredentials;

  private listeners: {
    [K in keyof LineClientEvents]: Set<LineClientEvents[K]>;
  } = {
    stateChanged: new Set(),
    qr: new Set(),
    pin: new Set(),
    authToken: new Set(),
    error: new Set()
  };

  public constructor(
    config: AppConfig,
    credentials: LineAuthCredentials = {}
  ) {
    this.config = config;
    this.credentials = credentials;
  }

  public get connectionState(): LineConnectionState {
    return this.state;
  }

  public get isConnected(): boolean {
    return this.client !== null && this.state === "connected";
  }

  public get rawClient(): Client | null {
    return this.client;
  }

  public async connect(): Promise<void> {
    if (this.state === "connected") {
      return;
    }

    this.setState("connecting");

    try {
      const storage = new FileStorage(
        this.config.line.sessionFile
      );

      const init: InitOptions = {
        device: this.config.line.device,
        storage
      };

      const mode = this.config.line.auth.mode;

      if (mode === "qr") {
        this.client = await loginWithQR(
          {
            onReceiveQRUrl: (url) => {
              this.emit("qr", url);
            },

            onPincodeRequest: (pin) => {
              this.emit("pin", pin);
            }
          },
          init
        );
      } else if (mode === "password") {
        if (
          !this.credentials.email ||
          !this.credentials.password
        ) {
          throw new Error(
            "LINE password authentication requires email and password."
          );
        }

        this.client = await loginWithPassword(
          {
            email: this.credentials.email,
            password: this.credentials.password,

            onPincodeRequest: (pin) => {
              this.emit("pin", pin);
            }
          },
          init
        );
      } else {
        if (!this.credentials.authToken) {
          throw new Error(
            "LINE auth-token authentication requires an auth token."
          );
        }

        this.client = await loginWithAuthToken(
          this.credentials.authToken,
          init
        );
      }

      this.attachClientEvents();

      this.setState("connected");
    } catch (error) {
      this.client = null;

      const normalized =
        error instanceof Error
          ? error
          : new Error(String(error));

      this.emit("error", normalized);
      this.setState("error");

      throw normalized;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.client) {
      this.setState("disconnected");
      return;
    }

    this.setState("disconnecting");

    try {
      /*
       * LINEJSの現在のClient APIに存在しない
       * close()/disconnect()などを仮定しない。
       *
       * 実際の接続停止処理は、現行APIの型を確認した上で
       * Phase 2の接続実装時に確定する。
       */
      this.client = null;
      this.setState("disconnected");
    } catch (error) {
      const normalized =
        error instanceof Error
          ? error
          : new Error(String(error));

      this.emit("error", normalized);
      this.setState("error");

      throw normalized;
    }
  }

  public async getProfile() {
    this.requireClient();
    return this.client!.getMyProfile();
  }

  public async getJoinedChats() {
    this.requireClient();
    return this.client!.fetchJoinedChats();
  }

  public async getChat(chatId: string) {
    this.requireClient();
    return this.client!.getChat(chatId);
  }

  public listen(): void {
    this.requireClient();
    this.client!.listen();
  }

  public on<K extends keyof LineClientEvents>(
    event: K,
    listener: LineClientEvents[K]
  ): () => void {
    this.listeners[event].add(listener);

    return () => {
      this.listeners[event].delete(listener);
    };
  }

  private attachClientEvents(): void {
    if (!this.client) {
      return;
    }

    this.client.base.on(
      "update:authtoken",
      (token) => {
        this.emit("authToken", token);
      }
    );
  }

  private requireClient(): Client {
    if (!this.client) {
      throw new Error(
        "LINE client is not connected."
      );
    }

    return this.client;
  }

  private setState(
    state: LineConnectionState
  ): void {
    this.state = state;
    this.emit("stateChanged", state);
  }

  private emit<K extends keyof LineClientEvents>(
    event: K,
    ...args: Parameters<LineClientEvents[K]>
  ): void {
    for (const listener of this.listeners[event]) {
      listener(...args);
    }
  }
}