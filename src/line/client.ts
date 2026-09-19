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
  stateChanged: (
    state: LineConnectionState
  ) => void;

  qr: (
    url: string
  ) => void;

  pin: (
    pin: string
  ) => void;

  authToken: (
    token: string
  ) => void;

  error: (
    error: Error
  ) => void;
}

export class LineClient {
  private client: Client | null = null;

  private state: LineConnectionState =
    "disconnected";

  private readonly config: AppConfig;
  private readonly credentials: LineAuthCredentials;

  private readonly stateListeners =
    new Set<
      LineClientEvents["stateChanged"]
    >();

  private readonly qrListeners =
    new Set<
      LineClientEvents["qr"]
    >();

  private readonly pinListeners =
    new Set<
      LineClientEvents["pin"]
    >();

  private readonly authTokenListeners =
    new Set<
      LineClientEvents["authToken"]
    >();

  private readonly errorListeners =
    new Set<
      LineClientEvents["error"]
    >();

  public constructor(
    config: AppConfig,
    credentials: LineAuthCredentials = {}
  ) {
    this.config = config;
    this.credentials = credentials;
  }

  public get connectionState():
    LineConnectionState {
    return this.state;
  }

  public get isConnected(): boolean {
    return (
      this.client !== null &&
      this.state === "connected"
    );
  }

  public get rawClient():
    Client | null {
    return this.client;
  }

  public async connect(): Promise<void> {
    if (this.state === "connected") {
      return;
    }

    this.setState("connecting");

    try {
      const storage =
        new FileStorage(
          this.config.line.sessionFile
        );

      const init: InitOptions = {
        device: this.config.line.device,
        storage
      };

      const mode =
        this.config.line.auth.mode;

      if (mode === "qr") {
        this.client =
          await loginWithQR(
            {
              onReceiveQRUrl: (url) => {
                this.emitQR(url);
              },

              onPincodeRequest: (pin) => {
                this.emitPin(pin);
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

        this.client =
          await loginWithPassword(
            {
              email:
                this.credentials.email,

              password:
                this.credentials.password,

              onPincodeRequest: (pin) => {
                this.emitPin(pin);
              }
            },
            init
          );
      } else {
        if (
          !this.credentials.authToken
        ) {
          throw new Error(
            "LINE auth-token authentication requires an auth token."
          );
        }

        this.client =
          await loginWithAuthToken(
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

      this.emitError(normalized);
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

    /*
     * 実際のLINEJSの接続終了APIは、
     * 接続Phaseで現行APIを確認して実装する。
     *
     * 現段階ではAPI境界だけ維持する。
     */

    this.client = null;

    this.setState("disconnected");
  }

  public async getProfile() {
    this.requireClient();

    return this.client.getMyProfile();
  }

  public async getJoinedChats() {
    this.requireClient();

    return this.client.fetchJoinedChats();
  }

  public async getChat(
    chatId: string
  ) {
    this.requireClient();

    return this.client.getChat(chatId);
  }

  public listen(): void {
    this.requireClient();

    this.client.listen();
  }

  public on(
    event: "stateChanged",
    listener: LineClientEvents["stateChanged"]
  ): () => void;

  public on(
    event: "qr",
    listener: LineClientEvents["qr"]
  ): () => void;

  public on(
    event: "pin",
    listener: LineClientEvents["pin"]
  ): () => void;

  public on(
    event: "authToken",
    listener: LineClientEvents["authToken"]
  ): () => void;

  public on(
    event: "error",
    listener: LineClientEvents["error"]
  ): () => void;

  public on(
    event: keyof LineClientEvents,
    listener:
      | LineClientEvents["stateChanged"]
      | LineClientEvents["qr"]
      | LineClientEvents["pin"]
      | LineClientEvents["authToken"]
      | LineClientEvents["error"]
  ): () => void {
    switch (event) {
      case "stateChanged": {
        const typed =
          listener as LineClientEvents["stateChanged"];

        this.stateListeners.add(typed);

        return () => {
          this.stateListeners.delete(typed);
        };
      }

      case "qr": {
        const typed =
          listener as LineClientEvents["qr"];

        this.qrListeners.add(typed);

        return () => {
          this.qrListeners.delete(typed);
        };
      }

      case "pin": {
        const typed =
          listener as LineClientEvents["pin"];

        this.pinListeners.add(typed);

        return () => {
          this.pinListeners.delete(typed);
        };
      }

      case "authToken": {
        const typed =
          listener as LineClientEvents["authToken"];

        this.authTokenListeners.add(typed);

        return () => {
          this.authTokenListeners.delete(typed);
        };
      }

      case "error": {
        const typed =
          listener as LineClientEvents["error"];

        this.errorListeners.add(typed);

        return () => {
          this.errorListeners.delete(typed);
        };
      }
    }
  }

  private attachClientEvents(): void {
    if (!this.client) {
      return;
    }

    this.client.base.on(
      "update:authtoken",
      (token) => {
        this.emitAuthToken(token);
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

    for (
      const listener of this.stateListeners
    ) {
      listener(state);
    }
  }

  private emitQR(
    url: string
  ): void {
    for (
      const listener of this.qrListeners
    ) {
      listener(url);
    }
  }

  private emitPin(
    pin: string
  ): void {
    for (
      const listener of this.pinListeners
    ) {
      listener(pin);
    }
  }

  private emitAuthToken(
    token: string
  ): void {
    for (
      const listener of this.authTokenListeners
    ) {
      listener(token);
    }
  }

  private emitError(
    error: Error
  ): void {
    for (
      const listener of this.errorListeners
    ) {
      listener(error);
    }
  }
}