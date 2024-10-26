import { Injectable } from "@nestjs/common";
import { AssistantTool, AssistantToolParameter } from "../../../lib";

@Injectable()
export class AppService {
  constructor() {}

  @AssistantTool({
    strict: false,
    description:
      "returns the user information, including their username, languages they speak, and the registered country.",
  })
  async getUser(
    @AssistantToolParameter({
      description:
        "the provided user's username. if you do not have the user's username, you should prompt the user to provide their username",
    })
    username?: string
  ) {
    if (!username) throw new Error("username is required");
    const users = [
      {
        username: "the-wunmi",
        languages: ["en", "sw"],
        country: "NGA",
      },
    ];
    return users.find((user) => user.username === username);
  }
}
