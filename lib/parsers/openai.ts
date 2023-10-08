import { JSONObject, JSONValue } from "../../common";
import { Prompt, Output, PromptInput, ModelMetadata } from "../../types";
import { AIConfigRuntime } from "../config";
import { ParameterizedModelParser } from "../parameterizedModelParser";
import OpenAI, { ClientOptions } from "openai";
import { getAPIKeyFromEnv } from "../utils";
import { encode as gpt3Encode, decode as gpt3Decode } from "gpt-3-encoder";
import { CompletionCreateParams, Chat } from "openai/resources";
import _ from "lodash";

export class OpenAIModelParser extends ParameterizedModelParser<CompletionCreateParams> {
  private openai: OpenAI;

  public constructor(options?: ClientOptions) {
    super();
    const apiKey = getAPIKeyFromEnv("OPENAI_API_KEY");
    this.openai = new OpenAI({ apiKey, ...(options || {}) });
  }

  public serialize(
    promptName: string,
    data: CompletionCreateParams,
    aiConfig: AIConfigRuntime,
    params?: JSONObject
  ): Prompt {
    // Serialize prompt input
    let input: PromptInput;
    if (typeof data.prompt === "string") {
      input = data.prompt;
    } else {
      input = {
        data: data.prompt,
      };
    }

    // Serialize model metadata
    let modelMetadata: ModelMetadata | string;
    const promptModelMetadata: JSONObject = { ...data };
    // Remove the prompt from the model data since that is not part of the model settings
    delete promptModelMetadata.prompt;

    // Check if AIConfig already has the model settings in its metadata
    // TODO: saqadri - can the model ID be the data.model?
    // (i.e. should globalModelMetada = aiConfig.metadata.models?.[data.model] ?? aiConfig.metadata.models?.[this.id];)
    const globalModelMetadata = aiConfig.metadata.models?.[this.id];

    if (globalModelMetadata != null) {
      // Check if the model settings from the input data are the same as the global model settings

      // Compute the difference between the global model settings and the model settings from the input data
      // If there is a difference, then we need to add the different model settings as overrides on the prompt's metadata
      const keys = _.union(
        _.keys(globalModelMetadata),
        _.keys(promptModelMetadata)
      );
      const overrides = _.reduce(
        keys,
        (result: JSONObject, key) => {
          if (!_.isEqual(globalModelMetadata[key], promptModelMetadata[key])) {
            result[key] = promptModelMetadata[key];
          }
          return result;
        },
        {}
      );

      if (Object.keys(overrides).length > 0) {
        modelMetadata = {
          name: this.id,
          settings: overrides,
        };
      } else {
        modelMetadata = this.id;
      }
    } else {
      modelMetadata = {
        name: this.id,
        settings: promptModelMetadata,
      };
    }

    const prompt: Prompt = {
      name: promptName,
      input,
      metadata: {
        model: modelMetadata,
        parameters: params ?? {},
      },
    };

    return prompt;
  }

  public deserialize(
    prompt: Prompt,
    aiConfig: AIConfigRuntime,
    params?: JSONObject
  ): CompletionCreateParams {
    // Build the completion params
    const modelMetadata = this.getModelSettings(prompt, aiConfig);
    const completionParams: CompletionCreateParams = refineCompletionParams(
      modelMetadata ?? {}
    );

    // Resolve the prompt template with the given parameters, and update the completion params
    let resolvedPrompt: string | JSONValue;
    if (typeof prompt.input === "string") {
      resolvedPrompt = this.resolvePromptTemplate(
        prompt.input,
        prompt,
        aiConfig,
        params
      );
    } else if (typeof prompt.input?.data === "string") {
      resolvedPrompt = this.resolvePromptTemplate(
        prompt.input.data,
        prompt,
        aiConfig,
        params
      );
    } else {
      resolvedPrompt = prompt.input?.data ?? null;
    }

    completionParams.prompt = resolvedPrompt as
      | string
      | Array<string>
      | Array<number>
      | Array<Array<number>>
      | null;

    return completionParams;
  }

  public run(
    prompt: Prompt,
    aiConfig: AIConfigRuntime,
    params?: JSONObject | undefined
  ): Promise<Output> {
    throw new Error("Method not implemented.");
  }
}

export class OpenAIChatModelParser extends ParameterizedModelParser<Chat.ChatCompletionCreateParams> {
  private openai: OpenAI;

  public constructor(options?: ClientOptions) {
    super();
    const apiKey = getAPIKeyFromEnv("OPENAI_API_KEY");
    this.openai = new OpenAI({ apiKey, ...(options || {}) });
  }

  public getPromptTemplate(prompt: Prompt, aiConfig: AIConfigRuntime): string {
    if (typeof prompt.input === "string") {
      return prompt.input;
    } else if (typeof prompt.input?.data === "string") {
      return prompt.input?.data;
    } else {
      const message = prompt.input as Chat.ChatCompletionMessageParam;
      return message.content ?? "";
    }
  }

  public serialize(
    promptName: string,
    data: Chat.ChatCompletionCreateParams,
    aiConfig: AIConfigRuntime,
    params?: JSONObject
  ): Prompt[] {
    // Chat completion comes as an array of messages. We can serialize each message as a Prompt.

    // Get the system prompt from the messages
    const systemPrompt = data.messages.find((message) => {
      message.role === "system";
    });

    // Serialize model metadata
    let modelMetadata: ModelMetadata | string;
    const promptModelMetadata: JSONObject = _.omit(data, "messages");
    // Add the system prompt as part of the model settings
    promptModelMetadata.system_prompt = systemPrompt;

    // Check if AIConfig already has the model settings in its metadata
    // TODO: saqadri - can the model ID be the data.model?
    // (i.e. should globalModelMetada = aiConfig.metadata.models?.[data.model] ?? aiConfig.metadata.models?.[this.id];)
    const globalModelMetadata = aiConfig.metadata.models?.[this.id];

    if (globalModelMetadata != null) {
      // Check if the model settings from the input data are the same as the global model settings

      // Compute the difference between the global model settings and the model settings from the input data
      // If there is a difference, then we need to add the different model settings as overrides on the prompt's metadata
      const keys = _.union(
        _.keys(globalModelMetadata),
        _.keys(promptModelMetadata)
      );
      const overrides = _.reduce(
        keys,
        (result: JSONObject, key) => {
          if (!_.isEqual(globalModelMetadata[key], promptModelMetadata[key])) {
            result[key] = promptModelMetadata[key];
          }
          return result;
        },
        {}
      );

      if (Object.keys(overrides).length > 0) {
        modelMetadata = {
          name: this.id,
          settings: overrides,
        };
      } else {
        modelMetadata = this.id;
      }
    } else {
      modelMetadata = {
        name: this.id,
        settings: promptModelMetadata,
      };
    }

    let prompts: Prompt[] = [];
    let i = 0;
    while (i < data.messages.length) {
      const message = data.messages[i];
      if (message.role === "user" || message.role == "function") {
        // Serialize user message as prompt, and save the assistant response as an output
        let assistantResponse: Chat.ChatCompletionMessageParam | null = null;
        if (i + 1 < data.messages.length) {
          const nextMessage = data.messages[i + 1];
          if (nextMessage.role === "assistant") {
            assistantResponse = nextMessage;
          }
        }

        const prompt: Prompt = {
          name: `${promptName}_${prompts.length + 1}`,
          input: message,
          metadata: {
            model: modelMetadata,
            parameters: params ?? {},
            remember_chat_context: true,
          },
          outputs:
            assistantResponse != null ? [{ ...assistantResponse }] : undefined,
        };

        prompts.push(prompt);
      }

      i++;
    }

    return prompts;
  }

  public deserialize(
    prompt: Prompt,
    aiConfig: AIConfigRuntime,
    params?: JSONObject
  ): Chat.ChatCompletionCreateParams {
    // Build the completion params
    const modelMetadata = this.getModelSettings(prompt, aiConfig) ?? {};
    const completionParams: Chat.ChatCompletionCreateParams =
      refineChatCompletionParams(modelMetadata);

    if (completionParams.messages == null) {
      // In the case that messages weren't saved as part of the model settings, we will build messages from the other prompts in the AIConfig
      let messages: Chat.ChatCompletionMessageParam[] = [];

      // Add system prompt
      if (modelMetadata.system_prompt != null) {
        const systemPrompt: Chat.ChatCompletionMessageParam =
          typeof modelMetadata.system_prompt === "string"
            ? { content: modelMetadata.system_prompt, role: "system" }
            : (modelMetadata.system_prompt as Chat.ChatCompletionMessageParam);

        // Resolve the system prompt template with the given parameters
        systemPrompt.content = this.resolvePromptTemplate(
          systemPrompt.content ?? "",
          prompt,
          aiConfig,
          params
        );

        messages.push(systemPrompt);
      }

      if (modelMetadata?.remember_chat_context === true) {
        // Loop through the prompts in the AIConfig and add the user messages to the messages array

        for (let i = 0; i < aiConfig.prompts.length; i++) {
          const currentPrompt = aiConfig.prompts[i];

          if (
            OpenAIChatModelParser.getModelName(currentPrompt) ===
            OpenAIChatModelParser.getModelName(prompt)
          ) {
            // Get the prompt template string
            let promptTemplate: string = this.getPromptTemplate(
              currentPrompt,
              aiConfig
            );

            this.addPromptAsMessage(currentPrompt, aiConfig, messages, params);

            if (currentPrompt.name === prompt.name) {
              // If this is the current prompt, then we have reached the end of the chat history
              break;
            }
          }
        }

        // Update the completion params with the resolved messages
        completionParams.messages = messages;
      }
    } else {
      // If messages are already specified, then just resolve the prompt template with the given parameters and append the latest message

      for (let i = 0; i < completionParams.messages.length; i++) {
        completionParams.messages[i].content = this.resolvePromptTemplate(
          completionParams.messages[i].content ?? "",
          prompt,
          aiConfig,
          params
        );
      }

      // Add the latest message to the messages array
      // Resolve the prompt with the given parameters, and add it to the messages array
      this.addPromptAsMessage(
        prompt,
        aiConfig,
        completionParams.messages,
        params
      );
    }

    return completionParams;
  }

  public run(
    prompt: Prompt,
    aiConfig: AIConfigRuntime,
    params?: JSONObject | undefined
  ): Promise<Output> {
    throw new Error("Method not implemented.");
  }

  private addPromptAsMessage(
    prompt: Prompt,
    aiConfig: AIConfigRuntime,
    messages: Chat.ChatCompletionMessageParam[],
    params?: JSONObject
  ) {
    // Resolve the prompt with the given parameters, and add it to the messages array
    const promptTemplate = this.getPromptTemplate(prompt, aiConfig);

    const resolvedPrompt = this.resolvePromptTemplate(
      promptTemplate,
      prompt,
      aiConfig,
      params
    );

    if (typeof prompt.input === "string") {
      messages.push({
        content: resolvedPrompt,
        role: "user",
      });
    } else {
      messages.push({
        content: resolvedPrompt,
        role: prompt.input?.role ?? "user",
        function_call: prompt.input?.function_call,
        name: prompt.input?.name,
      });
    }

    const output = OpenAIChatModelParser.getLatestOutput(prompt);
    if (output != null) {
      const outputMessage =
        output as unknown as Chat.ChatCompletionMessageParam;
      // If the prompt has output saved, add it to the messages array
      if (outputMessage.role === "assistant") {
        messages.push(outputMessage);
      }
    }

    return messages;
  }
}

//#region Utils

/**
 * Convert JSON object of completion params loaded from AIConfig to CompletionCreateParams type
 */
export function refineCompletionParams(
  params: JSONObject
): CompletionCreateParams {
  return {
    model: params.model as string,
    prompt: params.prompt as
      | string
      | Array<string>
      | Array<number>
      | Array<Array<number>>
      | null,
    temperature:
      params.temperature != null ? (params.temperature as number) : undefined,
    top_p: params.top_p != null ? (params.top_p as number) : undefined,
    n: params.n != null ? (params.n as number) : undefined,
    stream: params.stream != null ? (params.stream as boolean) : undefined,
    stop: params.stop as string | null | Array<string>,
    max_tokens: params.max_tokens as number,
    presence_penalty:
      params.presence_penalty != null
        ? (params.presence_penalty as number)
        : undefined,
    frequency_penalty:
      params.frequency_penalty != null
        ? (params.frequency_penalty as number)
        : undefined,
    logit_bias:
      params.logit_bias != null
        ? (params.logit_bias as Record<string, number>)
        : undefined,
    user: params.user as string,
  };
}

/**
 * Convert JSON object of chat completion params loaded from AIConfig to CompletionCreateParams type
 */
export function refineChatCompletionParams(
  params: JSONObject
): Chat.ChatCompletionCreateParams {
  return {
    model: params.model as string,
    messages: params.messages as unknown as Chat.ChatCompletionMessageParam[],
    functions:
      params.functions as unknown as Chat.ChatCompletionCreateParams.Function[],
    function_call:
      params.function_call != null
        ? (params.function_call as
            | "none"
            | "auto"
            | Chat.ChatCompletionCreateParams.FunctionCallOption)
        : undefined,
    temperature:
      params.temperature != null ? (params.temperature as number) : undefined,
    top_p: params.top_p != null ? (params.top_p as number) : undefined,
    n: params.n != null ? (params.n as number) : undefined,
    stream: params.stream != null ? (params.stream as boolean) : undefined,
    stop: params.stop as string | null | Array<string>,
    max_tokens: params.max_tokens as number,
    presence_penalty:
      params.presence_penalty != null
        ? (params.presence_penalty as number)
        : undefined,
    frequency_penalty:
      params.frequency_penalty != null
        ? (params.frequency_penalty as number)
        : undefined,
    logit_bias:
      params.logit_bias != null
        ? (params.logit_bias as Record<string, number>)
        : undefined,
    user: params.user as string,
  };
}

export function countTokens(text: string): number {
  const gpt3TokenCount = gpt3Encode(text).length;
  return gpt3TokenCount;
}

export function countCompletionTokens(
  completionParams: CompletionCreateParams
) {
  // A prompt can be encoded as a string, array of strings, array of tokens, or array of token arrays
  const prompt = completionParams.prompt;

  if (prompt == null) {
    return 0;
  }

  if (typeof prompt === "string") {
    // string
    return countTokens(prompt);
  } else if (Array.isArray(prompt)) {
    if (prompt.length === 0) {
      return 0;
    }

    if (typeof prompt[0] === "string") {
      // array of string
      const prompts = prompt as string[];
      return prompts.reduce((total, prompt) => total + countTokens(prompt), 0);
    } else {
      // array of tokens
      return prompt.length;
    }
  } else {
    console.log("Should not reach here");
    throw new Error("Invalid prompt type");
  }
}

export function countChatCompletionTokens(
  completionParams: Chat.ChatCompletionCreateParams
) {
  return completionParams.messages.reduce(
    (total, message) =>
      total + (message.content ? countTokens(message.content) : 0),
    0
  );
}

//#endregion
