import { JSONObject } from "../common";
import { Prompt, Output } from "../types";
import { AIConfigRuntime } from "./config";
import { InferenceOptions, ModelParser } from "./modelParser";
import {
  PromptNode,
  getDependencyGraph,
  resolvePromptString,
} from "./parameterize";

/**
 * An abstract ModelParser that handles parameterized prompts that contain Handlebars templates.
 * For more information on Handlebars, see https://handlebarsjs.com/guide/#basic-usage.
 * This class provides the core functionality for deserializing and parsing prompts, resolving parameters and managing references between prompts.
 * However, it does not implement any model-specific logic.
 */
export abstract class ParameterizedModelParser<
  T = JSONObject,
  R = T
> extends ModelParser<T, R> {
  /**
   * Resolves a templated string with the provided parameters (applied from the AIConfig as well as passed in params).
   * @param promptTemplate The template string to resolve.
   * @param prompt The prompt object that the template string belongs to (if any).
   * @param aiConfig The AIConfig that the template string belongs to (if any).
   * @param params Optional parameters resolve the template string with.
   * @returns The resolved string.
   */
  public resolvePromptTemplate(
    promptTemplate: string,
    prompt?: Prompt,
    aiConfig?: AIConfigRuntime,
    params?: JSONObject
  ): string {
    return resolvePromptString(promptTemplate, prompt, aiConfig, params);
  }

  /**
   * Get the prompt template string from a prompt.
   */
  public getPromptTemplate(prompt: Prompt, aiConfig: AIConfigRuntime): string {
    if (typeof prompt.input === "string") {
      return prompt.input;
    } else if (typeof prompt.input?.data === "string") {
      return prompt.input?.data;
    } else {
      throw new Error(
        `Cannot get prompt template string from prompt: ${JSON.stringify(
          prompt.input
        )}`
      );
    }
  }

  /**
   * Re-runs all prompt dependencies. Dependencies are determined using parameter references in the prompt.
   * @param promptName The name of the prompt to run, along with its dependencies.
   * @example "If you have a prompt P2 that depends on another prompt P1's output, this function will run P1 first,\
   * then use the output of P1 to resolve P2 and run it. Concretely, it executes inference on the DAG of prompt dependencies."
   */
  public async runWithDependencies(
    promptName: string,
    aiConfig: AIConfigRuntime,
    options?: InferenceOptions,
    params: JSONObject = {}
  ): Promise<Output[] | undefined> {
    const dependencyGraph = getDependencyGraph(aiConfig);

    return await this.runWithDependenciesInternal(
      promptName,
      aiConfig,
      params,
      dependencyGraph,
      /*alreadyExecutedPrompts*/ new Set<string>(),
      options
    );
  }

  private async runWithDependenciesInternal(
    promptName: string,
    aiConfig: AIConfigRuntime,
    params: JSONObject = {},
    dependencyGraph: {
      graph: Map<string, PromptNode>;
      graphObj: {
        [x: string]: {
          promptName: string;
          parents: string[];
          children: string[];
        };
      };
      start: PromptNode[];
    },
    alreadyExecutedPrompts: Set<string>,
    options?: InferenceOptions
  ) {
    if (alreadyExecutedPrompts.has(promptName)) {
      // It is possible to visit the same node multiple times dependending on the graph.
      // In that case we don't want to re-execute the same node multiple times.
      return;
    }

    const promptNode = dependencyGraph.graph.get(promptName);
    if (promptNode == null) {
      throw new Error(`Prompt ${promptName} not found in dependency graph`);
    }

    const promises = [];
    for (var parentPromptName of Array.from(promptNode.parents.values())) {
      const parentPrompt = aiConfig.getPrompt(parentPromptName);
      promises.push(
        this.runWithDependenciesInternal(
          parentPromptName,
          aiConfig,
          params,
          dependencyGraph,
          alreadyExecutedPrompts,
          options
        )
      );
    }

    // First execute all the parent dependencies recursively...

    // TODO: saqadri - switch to Promise.all
    for (const promptExecutionPromise of promises) {
      await promptExecutionPromise;
    }

    // Next execute self...
    const prompt = aiConfig.getPrompt(promptName);
    if (prompt == null) {
      throw new Error(`Prompt ${promptName} not found in AIConfig`);
    }
    const result = await this.run(prompt, aiConfig, options, params);
    alreadyExecutedPrompts.add(promptName);

    return result;
  }
}
