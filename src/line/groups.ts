import type { LineClient } from "./client.js";

export class LineGroupService {
  public constructor(
    private readonly client: LineClient
  ) {}

  public async getJoinedGroups() {
    const chats =
      await this.client.getJoinedChats();

    return chats;
  }

  public async getGroup(groupId: string) {
    return this.client.getChat(groupId);
  }
}