type GuiState =
  | "OFFLINE"
  | "STARTING"
  | "READY"
  | "STOPPING"
  | "ERROR";

function getElement<T extends Element>(
  selector: string
): T {
  const element =
    document.querySelector<T>(selector);

  if (!element) {
    throw new Error(
      `GUI element not found: ${selector}`
    );
  }

  return element;
}

const statusText =
  getElement<HTMLDivElement>(
    "#statusText"
  );

const statusDescription =
  getElement<HTMLDivElement>(
    "#statusDescription"
  );

const statusIndicator =
  getElement<HTMLDivElement>(
    "#statusIndicator"
  );

const startButton =
  getElement<HTMLButtonElement>(
    "#startButton"
  );

const stopButton =
  getElement<HTMLButtonElement>(
    "#stopButton"
  );

const restartButton =
  getElement<HTMLButtonElement>(
    "#restartButton"
  );

const clearLogsButton =
  getElement<HTMLButtonElement>(
    "#clearLogsButton"
  );

const logContainer =
  getElement<HTMLDivElement>(
    "#logContainer"
  );

const minimizeButton =
  getElement<HTMLButtonElement>(
    "#minimizeButton"
  );

const maximizeButton =
  getElement<HTMLButtonElement>(
    "#maximizeButton"
  );

const closeButton =
  getElement<HTMLButtonElement>(
    "#closeButton"
  );

const stateDescriptions: Record<
  GuiState,
  string
> = {
  OFFLINE:
    "Botは停止しています",

  STARTING:
    "Botを起動しています",

  READY:
    "Botは動作可能です",

  STOPPING:
    "Botを停止しています",

  ERROR:
    "Botでエラーが発生しました"
};

function setState(
  state: GuiState
): void {
  statusText.textContent = state;

  statusDescription.textContent =
    stateDescriptions[state];

  statusIndicator.className =
    "status-indicator " +
    state.toLowerCase();

  startButton.disabled =
    state === "STARTING" ||
    state === "READY";

  stopButton.disabled =
    state === "OFFLINE" ||
    state === "STOPPING";

  restartButton.disabled =
    state === "STARTING" ||
    state === "STOPPING";
}

function addLog(
  event: {
    timestamp: string;
    level:
      | "INFO"
      | "WARN"
      | "ERROR";
    message: string;
  }
): void {
  const row =
    document.createElement("div");

  row.className = "log-entry";

  const date =
    new Date(event.timestamp);

  const time =
    date.toLocaleTimeString(
      "ja-JP",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }
    );

  const timeElement =
    document.createElement("span");

  timeElement.className =
    "log-time";

  timeElement.textContent =
    time;

  const levelElement =
    document.createElement("span");

  levelElement.className =
    `log-level ${event.level.toLowerCase()}`;

  levelElement.textContent =
    event.level;

  const messageElement =
    document.createElement("span");

  messageElement.className =
    "log-message";

  messageElement.textContent =
    event.message;

  row.append(
    timeElement,
    levelElement,
    messageElement
  );

  logContainer.appendChild(row);

  while (
    logContainer.children.length > 300
  ) {
    const firstChild =
      logContainer.firstElementChild;

    if (!firstChild) {
      break;
    }

    logContainer.removeChild(
      firstChild
    );
  }

  logContainer.scrollTop =
    logContainer.scrollHeight;
}

function addSystemLog(
  message: string
): void {
  addLog({
    timestamp:
      new Date().toISOString(),
    level: "INFO",
    message
  });
}

startButton.addEventListener(
  "click",
  async () => {
    try {
      await window.lineTTS.bot.start();
    } catch (error) {
      addLog({
        timestamp:
          new Date().toISOString(),

        level: "ERROR",

        message:
          error instanceof Error
            ? error.message
            : String(error)
      });
    }
  }
);

stopButton.addEventListener(
  "click",
  async () => {
    try {
      await window.lineTTS.bot.stop();
    } catch (error) {
      addLog({
        timestamp:
          new Date().toISOString(),

        level: "ERROR",

        message:
          error instanceof Error
            ? error.message
            : String(error)
      });
    }
  }
);

restartButton.addEventListener(
  "click",
  async () => {
    try {
      await window.lineTTS.bot.restart();
    } catch (error) {
      addLog({
        timestamp:
          new Date().toISOString(),

        level: "ERROR",

        message:
          error instanceof Error
            ? error.message
            : String(error)
      });
    }
  }
);

clearLogsButton.addEventListener(
  "click",
  () => {
    logContainer.replaceChildren();
  }
);

minimizeButton.addEventListener(
  "click",
  () => {
    void window.lineTTS.window.minimize();
  }
);

maximizeButton.addEventListener(
  "click",
  async () => {
    const maximized =
      await window.lineTTS.window
        .toggleMaximize();

    maximizeButton.textContent =
      maximized ? "❐" : "□";
  }
);

closeButton.addEventListener(
  "click",
  () => {
    void window.lineTTS.window
      .closeToTray();
  }
);

window.lineTTS.events.onStateChanged(
  (state) => {
    setState(state as GuiState);
  }
);

window.lineTTS.events.onLog(
  (event) => {
    addLog(event);
  }
);

window.lineTTS.events.onError(
  (message) => {
    addLog({
      timestamp:
        new Date().toISOString(),

      level: "ERROR",

      message
    });
  }
);

void window.lineTTS.bot
  .getState()
  .then((state) => {
    setState(state as GuiState);
  })
  .catch((error) => {
    addLog({
      timestamp:
        new Date().toISOString(),

      level: "ERROR",

      message:
        error instanceof Error
          ? error.message
          : String(error)
    });
  });

addSystemLog(
  "GUIを初期化しました。"
);