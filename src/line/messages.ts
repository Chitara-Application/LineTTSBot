import type { LineClient } from "./client.js";

export interface LineMessageHandler {
  (message: unknown): void | Promise<void>;
}

export class LineMessageService {
  public constructor(
    private readonly client: LineClient
  ) {}

  public start(
    handler: LineMessageHandler
  ): void {
    const raw = this.client.rawClient;

    if (!raw) {
      throw new Error(
        "LINE client is not connected."
      );
    }

    raw.on("message", (message) => {
      void handler(message);
    });

    this.client.listen();
  }
}