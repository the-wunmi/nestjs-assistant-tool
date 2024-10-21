import { Module } from "@nestjs/common";
import { AssistantToolModule } from "../../../lib";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [AssistantToolModule.register({})],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
