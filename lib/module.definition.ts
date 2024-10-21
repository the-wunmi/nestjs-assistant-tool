import { ConfigurableModuleBuilder } from "@nestjs/common";

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<any>()
    .setExtras(
      {
        isGlobal: true,
        strict: true,
      },
      (definition, extras) => ({
        ...definition,
        global: extras.isGlobal,
        strict: extras.strict,
      })
    )
    .build();
