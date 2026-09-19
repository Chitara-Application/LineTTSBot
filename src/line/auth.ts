import type { AppConfig } from "../config/schema.js";
import type { LineAuthCredentials } from "./client.js";

export function createLineCredentials(
  config: AppConfig
): LineAuthCredentials {
  switch (config.line.auth.mode) {
    case "qr":
      return {};

    case "password": {
      const email = process.env.LINE_EMAIL;
      const password = process.env.LINE_PASSWORD;

      if (!email || !password) {
        throw new Error(
          "LINE_EMAIL and LINE_PASSWORD are required."
        );
      }

      return {
        email,
        password
      };
    }

    case "token": {
      const authToken =
        process.env.LINE_AUTH_TOKEN;

      if (!authToken) {
        throw new Error(
          "LINE_AUTH_TOKEN is required."
        );
      }

      return {
        authToken
      };
    }
  }
}