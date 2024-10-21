import { Inject, Injectable, RequestMethod } from "@nestjs/common";
import { MODULE_OPTIONS_TOKEN } from "./module.definition";
import { DiscoveryService } from "@nestjs/core";
import {
  DataType,
  DESIGN_TYPE_METADATA,
  TOOL,
  TOOL_PARAMETER,
} from "./constants";
import {
  METHOD_METADATA,
  PARAMTYPES_METADATA,
  PATH_METADATA,
  ROUTE_ARGS_METADATA,
} from "@nestjs/common/constants";
import { FunctionDefinition } from "openai/resources";
import { RouteParamtypes } from "@nestjs/common/enums/route-paramtypes.enum";
import { ValidationTypes } from "class-validator";
import * as _ from "lodash";
import { targetConstructorToSchema } from "class-validator-jsonschema";
import { InstanceWrapper } from "@nestjs/core/injector/instance-wrapper";
import { ValidationMetadata } from "class-validator/types/metadata/ValidationMetadata";
import { IOptions } from "class-validator-jsonschema/build/options";
import { AssistantToolType } from "./decorators";

function mapEnumToObject(enumObj: any) {
  return Object.fromEntries(
    Object.entries(enumObj).map(([key, value]) => [value, key])
  );
}

function mergeArrayCustomizer(objValue: any, srcValue: any) {
  return _.isArray(objValue) ? objValue.concat(srcValue) : undefined;
}

export type Tool = {
  type: "function";
  function: {
    name: `${string}-${string}`;
    description: string;
    parameters: FunctionDefinition["parameters"];
    strict: boolean;
  };
};

const requestMethodMap = mapEnumToObject(RequestMethod);
const routeParamtypesMap = mapEnumToObject(RouteParamtypes);

@Injectable()
export class AssistantToolService {
  private readonly tools: Tool[] = [];
  private readonly services = new Map();
  private readonly controllers = new Map();

  constructor(
    @Inject(MODULE_OPTIONS_TOKEN) private readonly options: any,
    private readonly discoveryService: DiscoveryService
  ) {
    this.initializeTools();
  }

  private initializeTools() {
    const controllers = this.discoveryService.getControllers();
    const providers = this.discoveryService.getProviders();

    controllers.forEach((controller) => this.processController(controller));
    providers.forEach((provider) => this.processProvider(provider));
  }

  // Process methods from controllers
  private processController(controller: InstanceWrapper) {
    const instance = controller.metatype?.prototype;
    if (!instance) return;
    const properties = Object.getOwnPropertyNames(instance);

    properties.forEach((prop) => {
      if (prop !== "constructor") {
        this.processControllerMethod(controller.name, prop, instance);
      }
    });
  }

  // Process methods from providers (services)
  private processProvider(provider: InstanceWrapper) {
    const instance = provider.metatype?.prototype;
    if (!instance) return;
    const properties = Object.getOwnPropertyNames(instance);

    properties.forEach((prop) => {
      if (prop !== "constructor") {
        this.processServiceMethod(provider.name, prop, instance);
      }
    });
  }

  // Handle method processing for controllers
  private processControllerMethod(name: string, prop: string, instance: any) {
    const method = instance[prop];
    const data = this.getMethodData(instance, method);

    if (!data) return;

    const args = this.getMethodArgs(instance, method);
    const types = this.getMethodParamTypes(instance, method);

    const parameters = this.buildParameters(types, args);

    const description = typeof data === "string" ? data : data.description;
    const strict = typeof data === "string" ? true : data.strict;

    const tool: Tool = {
      type: "function",
      function: {
        name: `${name}-${prop}`,
        description,
        strict: strict ?? true,
        parameters: this.traverseSchema({
          type: DataType.OBJECT,
          properties: parameters,
          required: Object.keys(parameters),
          additionalProperties: false,
        }),
      },
    };

    if (this.controllers.has(tool.function.name))
      throw new Error(`Duplicate tool name ${tool.function.name}`);
    this.controllers.set(tool.function.name, instance);
    this.tools.push(tool);
  }

  // Handle method processing for services
  private processServiceMethod(name: string, prop: string, instance: any) {
    // Skip getters by checking if the property has a getter in its descriptor
    const descriptor = Object.getOwnPropertyDescriptor(instance, prop);
    if (descriptor?.get) return; // Skip if it's a getter

    const method = instance[prop];

    if (!method.name) return;
    const data = this.getMethodData(instance, method);

    if (!data) return;

    const args = this.getMethodArgs(instance, method);
    const types = this.getMethodParamTypes(instance, method);
    const parameters = this.buildParameters(types, args);

    const description = typeof data === "string" ? data : data.description;
    const strict = typeof data === "string" ? true : data.strict;

    const tool: Tool = {
      type: "function",
      function: {
        name: `${name}-${prop}`,
        description,
        strict: strict ?? true,
        parameters: this.traverseSchema({
          type: DataType.OBJECT,
          properties: parameters,
          required: Object.keys(parameters),
          additionalProperties: false,
        }),
      },
    };
    if (this.services.has(tool.function.name))
      throw new Error(`Duplicate tool name ${tool.function.name}`);
    this.services.set(tool.function.name, instance);
    this.tools.push(tool);
  }

  private getMethodData(instance: any, method: any) {
    return Reflect.getMetadata(
      TOOL,
      instance[method.name]
    ) as AssistantToolType;
  }

  private getMethodArgs(instance: any, method: any) {
    return (
      Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        instance.constructor,
        method.name
      ) || {}
    );
  }

  private getMethodParamTypes(instance: any, method: any) {
    return Reflect.getMetadata(PARAMTYPES_METADATA, instance, method.name);
  }

  private buildPath(instance: any, method: any) {
    return [
      Reflect.getMetadata(PATH_METADATA, instance.constructor),
      Reflect.getMetadata(PATH_METADATA, instance[method.name]),
    ]
      .filter(Boolean)
      .join("/")
      .replace(/\/+/g, "/");
  }

  private getRequestMethod(instance: any, method: any) {
    return requestMethodMap[
      Reflect.getMetadata(METHOD_METADATA, instance[method.name])
    ];
  }

  private buildParameters(types: any[], args: any) {
    const items = AssistantToolService.getParamItems(types, args);

    return items.reduce<Tool["function"]["parameters"]>((acc, item) => {
      if (!acc || !item.section || !item.schema) return acc;

      acc[item.section] = acc[item.section]
        ? _.mergeWith(acc[item.section], item.schema, mergeArrayCustomizer)
        : item.schema;

      return acc;
    }, {});
  }

  private traverseSchema(currentObj: any): FunctionDefinition["parameters"] {
    for (const key in currentObj) {
      this.cleanUnsupportedSchemaKeys(currentObj, key);
      if (
        typeof currentObj[key] === DataType.OBJECT &&
        currentObj[key] !== null
      ) {
        if (key === "properties") {
          if (currentObj.additionalProperties !== false) {
            currentObj.additionalProperties = false;
          }
          const keys = Object.keys(currentObj[key]);
          if (!currentObj.required) {
            keys.forEach(
              (k) =>
                (currentObj[key][k].type =
                  typeof currentObj[key][k].type === "string"
                    ? [currentObj[key][k].type, "null"]
                    : ["null"])
            );
            currentObj.required = keys;
          } else {
            keys.forEach(
              (k) =>
                (currentObj[key][k].type =
                  typeof currentObj[key][k].type === "string" &&
                  !currentObj.required.includes(k)
                    ? [currentObj[key][k].type, "null"]
                    : currentObj[key][k].type)
            );
            currentObj.required = [
              ...new Set(currentObj.required.concat(keys)),
            ];
          }
        }
        this.traverseSchema(currentObj[key]);
      }
    }
    return currentObj as FunctionDefinition["parameters"];
  }

  private cleanUnsupportedSchemaKeys(currentObj: any, key: string) {
    const unsupported = [
      "minLength",
      "maxLength",
      "pattern",
      "format",
      "minimum",
      "maximum",
      "multipleOf",
      "uniqueItems",
      "unevaluatedItems",
      "contains",
      "minContains",
      "maxContains",
      "minItems",
      "maxItems",
      "patternProperties",
      "unevaluatedProperties",
      "propertyNames",
      "minProperties",
      "maxProperties",
      "oneOf",
      "not", // TODO
    ];

    if (unsupported.includes(key)) {
      delete currentObj[key];
    }
  }

  static getParamItems(types: any[], args: any = {}) {
    return types
      .map((type, index) => {
        const entries = Object.entries<any>(args);
        const item =
          entries.find(
            ([, value]) =>
              value.index === index &&
              value.factory?.name === "AssistantToolParameter"
          ) || entries.find(([, value]) => value.index === index);

        const section = String(index);
        const title = item?.[1].data?.description || item?.[1].data;
        const schema = this.getParamType(type, title);

        if (schema.type === DataType.OBJECT && !schema.properties) return null;

        return {
          schema,
          section,
          type,
        };
      })
      .filter(Boolean);
  }

  static getParamType(type: any, title?: any) {
    const typeMapping = {
      String: { title, type: DataType.STRING },
      Number: { title, type: DataType.NUMBER },
      Boolean: { title, type: DataType.BOOLEAN },
      Array: { title, type: DataType.ARRAY },
      Object: { title, type: DataType.OBJECT },
    };

    if (typeMapping[type.name]) {
      return typeMapping[type.name];
    }

    const object = targetConstructorToSchema(type, {
      additionalConverters: {
        [ValidationTypes.NESTED_VALIDATION]: this.nestedValidationConverter,
      },
    });

    if (Object.keys(object).length) {
      return object;
    }

    return { type: "string", const: type.name };
  }

  static nestedValidationConverter(
    meta: ValidationMetadata,
    options: IOptions
  ): any {
    if (typeof meta.target === "function") {
      const typeMeta = options.classTransformerMetadataStorage
        ? options.classTransformerMetadataStorage.findTypeMetadata(
            meta.target,
            meta.propertyName
          )
        : null;
      const childType = typeMeta
        ? typeMeta.typeFunction()
        : Reflect.getMetadata(
            DESIGN_TYPE_METADATA,
            meta.target.prototype,
            meta.propertyName
          );

      return targetConstructorToSchema(childType, options);
    }
  }

  getTools(): Tool[] {
    return this.tools;
  }

  getTool(name: Tool["function"]["name"]): Tool | undefined {
    return this.tools.find((tool) => tool.function.name === name);
  }

  getToolInstance(name: Tool["function"]["name"]) {
    return this.services.get(name) || this.controllers.get(name);
  }

  isProvider(name: Tool["function"]["name"]) {
    return this.services.has(name);
  }

  isController(name: Tool["function"]["name"]) {
    return this.controllers.has(name);
  }
}
