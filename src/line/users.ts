import type { LineClient } from "./client.js";

export class LineUserService {
  public constructor(
    private readonly client: LineClient
  ) {}

  public async getMyProfile() {
    return this.client.getProfile();
  }

  public async getUser(userId: string) {
    const raw = this.client.rawClient;

    if (!raw) {
      throw new Error(
        "LINE client is not connected."
      );
    }

    return raw.getUser(userId);
  }

  public async getFriends() {
    const raw = this.client.rawClient;

    if (!raw) {
      throw new Error(
        "LINE client is not connected."
      );
    }

    return raw.fetchUsers();
  }
}