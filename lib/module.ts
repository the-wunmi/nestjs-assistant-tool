import { Module } from "@nestjs/common";
import { ConfigurableModuleClass } from "./module.definition";
import { AssistantToolService } from "./service";
import { DiscoveryService } from "@nestjs/core";

@Module({
  providers: [AssistantToolService, DiscoveryService],
  exports: [AssistantToolService],
})
export class AssistantToolModule extends ConfigurableModuleClass {}
