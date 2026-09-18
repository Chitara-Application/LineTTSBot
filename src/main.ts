import path from "node:path";

import dotenv from "dotenv";

import {
  Application
} from "./app/application.js";

import {
  getErrorMessage
} from "./utils/errors.js";

dotenv.config({
  path: path.resolve(
    process.cwd(),
    ".env"
  )
});

const app =
  new Application();

let shutdownPromise:
  Promise<void> | null = null;

async function shutdown(
  reason: string,
  exitCode = 0
): Promise<void> {
  if (
    shutdownPromise === null
  ) {
    shutdownPromise =
      app.shutdown(reason);
  }

  await shutdownPromise;

  process.exitCode =
    exitCode;
}

process.once(
  "SIGINT",
  () => {
    void shutdown(
      "SIGINT"
    );
  }
);

process.once(
  "SIGTERM",
  () => {
    void shutdown(
      "SIGTERM"
    );
  }
);

process.on(
  "uncaughtException",
  (error) => {
    const logger =
      app.getLogger();

    if (logger !== null) {
      logger.fatal(
        {
          error:
            getErrorMessage(error)
        },
        "未処理の例外が発生しました。"
      );
    } else {
      console.error(
        error
      );
    }

    void shutdown(
      "uncaughtException",
      1
    );
  }
);

process.on(
  "unhandledRejection",
  (reason) => {
    const logger =
      app.getLogger();

    if (logger !== null) {
      logger.fatal(
        {
          error:
            getErrorMessage(reason)
        },
        "未処理のPromise rejectionが発生しました。"
      );
    } else {
      console.error(
        reason
      );
    }

    void shutdown(
      "unhandledRejection",
      1
    );
  }
);

try {
  await app.start();
} catch (error) {
  const logger =
    app.getLogger();

  if (logger !== null) {
    logger.fatal(
      {
        error:
          getErrorMessage(error)
      },
      "Applicationの起動に失敗しました。"
    );
  } else {
    console.error(
      "Applicationの起動に失敗しました:",
      error
    );
  }

  await shutdown(
    "startup failure",
    1
  );
}