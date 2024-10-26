import { Body, Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { AssistantTool, AssistantToolParameter } from "../../../lib";

@Controller("app")
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getUser() {
    return this.appService.getUser();
  }
}
