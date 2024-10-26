import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AssistantToolService } from "../../lib/service";
import { AppModule } from "./src/app.module";

describe("Assistant Tool", () => {
  let app: INestApplication;
  let assistantToolService: AssistantToolService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    assistantToolService =
      module.get<AssistantToolService>(AssistantToolService);
  });

  it("should be defined", () => {
    expect(app).toBeDefined();
  });

  it("should use the available tools to retrieve the country belonging to an existing user", async () => {
    const response = await assistantToolService.completeChat({
      messages: [
        {
          role: "user",
          content:
            "What country do you have registered on my account, with username the-wunmi?",
        },
      ],
      model: "gpt-4",
    });

    expect(response.choices[0].message.content).toMatch(/(NGA|Nigeria)/i);
  });

  afterAll(async () => {
    await app.close();
  });
});
