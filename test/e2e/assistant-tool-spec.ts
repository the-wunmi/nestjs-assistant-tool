import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AssistantToolService } from "../../lib/service";
import { AppModule } from "./src/app.module";
import { Server } from "http";

describe("Assistant Tool", () => {
  let app: INestApplication;
  let service: AssistantToolService;
  let server: Server;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
  });

  it("should be defined", () => {
    expect(app).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });
});
