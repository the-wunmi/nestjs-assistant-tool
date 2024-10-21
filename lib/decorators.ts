import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from "@nestjs/common";
import { TOOL, TOOL_PARAMETER } from "./constants";

export type AssistantToolType =
  | string
  | { description: string; strict?: boolean };
export const AssistantTool = (data: AssistantToolType) =>
  SetMetadata(TOOL, data);

export type AssistantToolParameterType = string | { description: string };
export const AssistantToolParameter = createParamDecorator(
  function AssistantToolParameter(data: AssistantToolParameterType) {
    return data;
  }
);
