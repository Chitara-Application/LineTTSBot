import {
  EventEmitter
} from "node:events";

export enum BotState {
  OFFLINE = "OFFLINE",

  STARTING = "STARTING",

  READY = "READY",

  CONNECTING = "CONNECTING",

  ONLINE = "ONLINE",

  WAITING_CALL = "WAITING_CALL",

  JOINING = "JOINING",

  IN_CALL = "IN_CALL",

  SENDING_AUDIO = "SENDING_AUDIO",

  RECONNECTING = "RECONNECTING",

  ERROR = "ERROR",

  STOPPING = "STOPPING"
}

export interface StateSnapshot {
  state: BotState;
  changedAt: string;
  reason?: string;
}

export interface StateChangeEvent {
  previous: BotState;
  current: BotState;
  reason?: string;
  changedAt: string;
}

export class StateManager
  extends EventEmitter
{
  private state =
    BotState.OFFLINE;

  private changedAt =
    new Date().toISOString();

  public get current(): BotState {
    return this.state;
  }

  public get snapshot(): StateSnapshot {
    return {
      state: this.state,
      changedAt: this.changedAt
    };
  }

  public set(
    next: BotState,
    reason?: string
  ): void {
    const previous =
      this.state;

    if (
      previous === next
    ) {
      return;
    }

    this.state = next;

    this.changedAt =
      new Date().toISOString();

    const event: StateChangeEvent = {
      previous,
      current: next,
      reason,
      changedAt: this.changedAt
    };

    this.emit(
      "change",
      event
    );
  }

  public onChange(
    listener: (
      event: StateChangeEvent
    ) => void
  ): void {
    this.on(
      "change",
      listener
    );
  }
}