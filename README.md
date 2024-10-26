# NestJS Assistant Tool

A NestJS package designed to generate OpenAI-compatible tools from named controllers and providers. This package simplifies the integration of AI functionalities into your existing or new NestJS applications.

## Installation

To install the package, run:

```sh
npm install nestjs-assistant-tool
```

## Usage

To use the package, import it in your NestJS module and configure it as needed.

The package provides the following decorators:

`AssistantTool`: Used to mark a controller or provider method as an assistant tool.
`AssistantToolParameter`: Used to mark a parameter in a method as an assistant tool parameter.

## Example

Here's a basic example of how to set up the package in your NestJS application.

In your module file, import the AssistantToolModule and add it to the imports array.

app.module.ts

```typescript
import { Module } from "@nestjs/common";
import { AssistantToolModule } from "nestjs-assistant-tool";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import OpenAI from "openai";

@Module({
  imports: [
    AssistantToolModule.register({
      openAIClient: new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

app.service.ts

```typescript
@Injectable()
export class AppService {
  constructor(private readonly assistantToolService: AssistantToolService) {}

  @AssistantTool({
    description:
      "returns the user information, including their name, languages they speak, and the registered country.",
  })
  async getUser(
    @AssistantToolParameter({
      description:
        "the user's name. if name does not exist, user should provide one",
    })
    name: string
  ) {
    return {
      name: "the-wunmi",
      languages: ["en", "sw"],
      country: "NGA",
    };
  }
}
```

```typescript
@Injectable()
export class ChatService {
  constructor(private readonly assistantToolService: AssistantToolService) {}

  async message(text: string) {
    const response = await assistantToolService.completeChat({
      messages: [
        {
          role: "user",
          content: text,
        },
      ],
      model: "gpt-4",
    });
    return response;
  }
}
```
