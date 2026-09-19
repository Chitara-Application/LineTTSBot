export interface BotCoreAdapter {
  start(): Promise<void>;
  stop(): Promise<void>;
}

interface ApplicationLike {
  start?: () => Promise<void> | void;
  initialize?: () => Promise<void> | void;
  stop?: () => Promise<void> | void;
  shutdown?: () => Promise<void> | void;
  dispose?: () => Promise<void> | void;
}

export class Phase0CoreAdapter implements BotCoreAdapter {
  private application: ApplicationLike | null = null;

  public async start(): Promise<void> {
    if (this.application) {
      return;
    }

    const module = await import("../app/application.js");

    const ApplicationClass = (
      module as {
        Application?: new () => ApplicationLike;
      }
    ).Application;

    if (!ApplicationClass) {
      throw new Error(
        "Application export was not found in src/app/application.ts."
      );
    }

    const application = new ApplicationClass();
    this.application = application;

    if (typeof application.start === "function") {
      await application.start();
      return;
    }

    if (typeof application.initialize === "function") {
      await application.initialize();
      return;
    }

    this.application = null;

    throw new Error(
      "Application has neither start() nor initialize()."
    );
  }

  public async stop(): Promise<void> {
    if (!this.application) {
      return;
    }

    const application = this.application;

    if (typeof application.stop === "function") {
      await application.stop();
      this.application = null;
      return;
    }

    if (typeof application.shutdown === "function") {
      await application.shutdown();
      this.application = null;
      return;
    }

    if (typeof application.dispose === "function") {
      await application.dispose();
      this.application = null;
      return;
    }

    throw new Error(
      "Application has no supported stop lifecycle method. " +
      "Expected stop(), shutdown(), or dispose()."
    );
  }
}