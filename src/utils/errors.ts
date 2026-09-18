export class AppError extends Error {
  public constructor(
    message: string,
    public readonly code: string,
    options?: {
      cause?: unknown;
    }
  ) {
    super(
      message,
      options
    );

    this.name = "AppError";
  }
}

export function getErrorMessage(
  error: unknown
): string {
  if (
    error instanceof Error
  ) {
    return error.message;
  }

  if (
    typeof error === "string"
  ) {
    return error;
  }

  try {
    return JSON.stringify(
      error
    );
  } catch {
    return String(error);
  }
}