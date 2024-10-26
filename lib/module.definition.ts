import { ConfigurableModuleBuilder } from "@nestjs/common";
import OpenAI from "openai";

export interface AssistantToolModuleOptions {
  isGlobal?: boolean;
  strict?: boolean;
  openAIClient?: OpenAI;
}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<AssistantToolModuleOptions>()
    .setExtras(
      {
        isGlobal: true,
      },
      (definition, extras) => {
        return {
          ...definition,
          global: extras.isGlobal,
        };
      }
    )
    .build();
