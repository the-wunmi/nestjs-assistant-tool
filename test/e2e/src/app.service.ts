import { Injectable } from "@nestjs/common";
import { AssistantTool } from "../../../lib";

@Injectable()
export class AppService {
  constructor() {}

  async list(): Promise<number[]> {
    return [0, 4, 5, 7];
  }

  @AssistantTool("this is a demo function")
  async demo(): Promise<string> {
    return "demo stuff";
  }
}
