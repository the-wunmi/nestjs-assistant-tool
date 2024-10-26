import { Module } from "@nestjs/common";
import { AssistantToolModule } from "../../../lib";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import OpenAI from "openai";

@Module({
  imports: [
    AssistantToolModule.register({
      openAIClient: new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
        defaultHeaders: process.env.OPENAI_DEFAULT_HEADERS
          ? JSON.parse(process.env.OPENAI_DEFAULT_HEADERS)
          : {},
        defaultQuery: process.env.OPENAI_DEFAULT_QUERY
          ? JSON.parse(process.env.OPENAI_DEFAULT_QUERY)
          : {},
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
