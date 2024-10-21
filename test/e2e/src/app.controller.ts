import { Body, Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { AssistantTool, AssistantToolParameter } from "../../../lib";

@Controller("app")
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @AssistantTool("this lists an array of numbers")
  list(): Promise<number[]> {
    return this.appService.list();
  }
}
