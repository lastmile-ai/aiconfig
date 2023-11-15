import {
  Prompt,
  Output,
  ExecuteResult,
  AIConfigRuntime,
  InferenceOptions,
  ParameterizedModelParser,
} from "aiconfig";
import path from "path";

import { JSONObject } from "aiconfig/dist/common";
import { readdir } from "fs/promises";
import {
  ConversationInteraction,
  LLamaChatPromptOptions,
  LlamaChatSession,
  LlamaChatSessionRepeatPenalty,
  LlamaContext,
  LlamaGrammar,
  LlamaModel,
  LlamaModelOptions,
  Token,
} from "node-llama-cpp";

// Use require since there's no module declaration for this package
const inclusion = require("inclusion");

const DEFAULT_MODEL_DIR = path.join(process.cwd(), "models");

export const SUPPORTED_MODELS: LlamaModelName[] = ["llama-2-7b-chat"];

export type ModelOptions = Omit<LlamaModelOptions, "modelPath">;
export type LlamaModelName = "llama-2-7b-chat";

export interface LlamaCompletionParams extends LLamaChatPromptOptions {
  model: LlamaModelName;
  prompt: string;

  // Used when constructing the session to perform the prompt
  conversationHistory?: ConversationInteraction[];
  systemPrompt?: string;
}

/**
 * A model parser for LLaMA models, leveraging llama-node API. Construct this parser with the absolute
 * path to the directory containing the LLaMA model GGUF format (.gguf) files for the supported models.
 * The file names must contain the LlamaModelName, e.g. "llama-2-7b-chat.ggmlv3.q4_K_M.bin".
 * e.g. curl -L https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf --output ./models/llama-2-7b-chat.Q4_K_M.gguf
 */
export class LlamaModelParser extends ParameterizedModelParser<LlamaCompletionParams> {
  _id = "LLaMA";

  modelDir: string = DEFAULT_MODEL_DIR;
  modelOptions?: ModelOptions;

  private modelContexts: Map<LlamaModelName, LlamaContext> = new Map();

  public constructor(modelDir?: string, modelOptions?: ModelOptions) {
    super();
    this.modelDir = modelDir ?? this.modelDir;
    this.modelOptions = modelOptions;
  }

  private async getModelSession(
    model: LlamaModelName,
    systemPrompt?: string,
    conversationHistory?: ConversationInteraction[]
  ): Promise<LlamaChatSession> {
    if (!this.modelContexts.has(model)) {
      // Need to dynamic import ES module to use in our CommonJS module
      const { LlamaModel, LlamaContext } = await inclusion("node-llama-cpp");

      let modelPath;

      const modelFiles = await readdir(this.modelDir);
      for (const file of modelFiles) {
        if (path.extname(file) === ".gguf" && file.includes(model)) {
          modelPath = path.join(this.modelDir, file);
          break;
        }
      }

      if (!modelPath) {
        throw new Error(`Could not find model ${model} in ${this.modelDir}`);
      }

      const llamaModel: LlamaModel = new LlamaModel({
        ...this.modelOptions,
        modelPath,
      });

      const context: LlamaContext = new LlamaContext({ model: llamaModel });
      this.modelContexts.set(model, context);
    }

    const context = this.modelContexts.get(model)!;
    const { LlamaChatSession } = await inclusion("node-llama-cpp");

    return new LlamaChatSession({ context, conversationHistory, systemPrompt });
  }

  public serialize(
    promptName: string,
    data: LlamaCompletionParams,
    aiConfig: AIConfigRuntime,
    params?: JSONObject | undefined
  ): Prompt | Prompt[] {
    const { prompt: input, conversationHistory, ...completionParams } = data;

    // Metadata is constructed by obtaining any default metadata for the model
    // from the AIConfig and overriding with the completionParams here
    const modelMetadata = aiConfig.getModelMetadata(
      completionParams,
      completionParams.model
    );

    const prompt: Prompt = {
      name: promptName,
      input,
      metadata: {
        model: modelMetadata,
        parameters: params ?? {},
        remember_chat_context: (conversationHistory?.length ?? 0) > 0,
      },
    };

    return [prompt];
  }

  public refineCompletionParams(
    input: string,
    params: JSONObject
  ): LlamaCompletionParams {
    return {
      model: params.model as LlamaModelName,
      prompt: input,
      systemPrompt:
        params.systemPrompt != null
          ? (params.systemPrompt as string)
          : undefined,
      signal:
        params.signal != null ? (params.signal as AbortSignal) : undefined,
      maxTokens:
        params.maxTokens != null ? (params.maxTokens as number) : undefined,
      /**
       * Temperature is a hyperparameter that controls the randomness of the generated text.
       * It affects the probability distribution of the model's output tokens.
       * A higher temperature (e.g., 1.5) makes the output more random and creative,
       * while a lower temperature (e.g., 0.5) makes the output more focused, deterministic, and conservative.
       * The suggested temperature is 0.8, which provides a balance between randomness and determinism.
       * At the extreme, a temperature of 0 will always pick the most likely next token, leading to identical outputs in each run.
       *
       * Set to `0` to disable.
       * Disabled by default (set to `0`).
       */
      temperature:
        params.temperature != null ? (params.temperature as number) : undefined,
      /**
       * Limits the model to consider only the K most likely next tokens for sampling at each step of sequence generation.
       * An integer number between `1` and the size of the vocabulary.
       * Set to `0` to disable (which uses the full vocabulary).
       *
       * Only relevant when `temperature` is set to a value greater than 0.
       */
      topK: params.topK != null ? (params.topK as number) : undefined,
      /**
       * Dynamically selects the smallest set of tokens whose cumulative probability exceeds the threshold P,
       * and samples the next token only from this set.
       * A float number between `0` and `1`.
       * Set to `1` to disable.
       *
       * Only relevant when `temperature` is set to a value greater than `0`.
       */
      topP: params.topP != null ? (params.topP as number) : undefined,
      grammar:
        params.grammar != null ? (params.grammar as LlamaGrammar) : undefined,
      /**
       * Trim whitespace from the end of the generated text
       * Disabled by default.
       */
      trimWhitespaceSuffix:
        params.trimWhitespaceSuffix != null
          ? (params.trimWhitespaceSuffix as boolean)
          : undefined,
      repeatPenalty:
        params.repeatPenalty != null
          ? (params.repeatPenalty as false | LlamaChatSessionRepeatPenalty)
          : undefined,
    };
  }

  public deserialize(
    prompt: Prompt,
    aiConfig: AIConfigRuntime,
    params?: JSONObject
  ): LlamaCompletionParams {
    // Resolve the prompt template with the given parameters, and update the completion params
    const resolvedPrompt = this.resolvePromptTemplate(
      prompt.input as string,
      prompt,
      aiConfig,
      params
    );

    // Build the LlamaCompletionParams
    const modelMetadata = this.getModelSettings(prompt, aiConfig) ?? {};
    const promptParams = this.refineCompletionParams(
      resolvedPrompt,
      modelMetadata
    );

    let conversationHistory: ConversationInteraction[] | undefined;
    if (prompt.metadata.remember_chat_context === true) {
      conversationHistory = this.getConversationHistory(
        prompt,
        aiConfig,
        params
      );
    }

    return {
      ...promptParams,
      conversationHistory,
    };
  }

  private getConversationHistory(
    prompt: Prompt,
    aiConfig: AIConfigRuntime,
    params?: JSONObject
  ) {
    const conversationHistory: ConversationInteraction[] = [];

    for (let i = 0; i < aiConfig.prompts.length; i++) {
      const currentPrompt = aiConfig.prompts[i];
      if (
        aiConfig.getModelName(currentPrompt) === aiConfig.getModelName(prompt)
      ) {
        // Resolve the prompt with the given parameters, and add it to the messages array
        const promptTemplate = this.getPromptTemplate(prompt, aiConfig);

        const resolvedPrompt = this.resolvePromptTemplate(
          promptTemplate,
          prompt,
          aiConfig,
          params
        );

        let outputText = "";
        const output = aiConfig.getLatestOutput(prompt);
        if (output != null) {
          if (output.output_type === "execute_result") {
            outputText = output.data as string;
          }
        }

        const message: ConversationInteraction = {
          prompt: resolvedPrompt,
          response: outputText,
        };

        conversationHistory.push(message);
      }

      if (currentPrompt.name === prompt.name) {
        // If this is the current prompt, then we have reached the end of the chat history
        break;
      }
    }

    return conversationHistory;
  }

  public async run(
    prompt: Prompt,
    aiConfig: AIConfigRuntime,
    options?: InferenceOptions | undefined,
    params?: JSONObject | undefined
  ): Promise<Output | Output[]> {
    const {
      model,
      prompt: input,
      systemPrompt,
      conversationHistory,
      ...promptOptions
    } = this.deserialize(prompt, aiConfig, params);

    const session = await this.getModelSession(
      model,
      systemPrompt,
      conversationHistory
    );

    // if no options are passed in, don't stream because streaming is dependent on a callback handler
    const stream = options ? (options.stream ? options.stream : true) : false;
    const streamCallback = options?.callbacks?.streamCallback;

    let finalizedPromptOptions = promptOptions;

    if (stream && streamCallback) {
      let accumulatedData = "";

      const onToken = (tokens: Token[]) => {
        const currentText = session.context.decode(tokens);
        accumulatedData += currentText;
        streamCallback(currentText, accumulatedData, 0);
      };

      finalizedPromptOptions.onToken = onToken;
    }

    const response = await session.prompt(input, finalizedPromptOptions);

    return [
      {
        output_type: "execute_result",
        data: response,
        execution_count: 0,
        metadata: {},
      } as ExecuteResult,
    ];
  }

  public getOutputText(
    aiConfig: AIConfigRuntime,
    output?: Output,
    prompt?: Prompt
  ): string {
    if (output == null && prompt != null) {
      output = aiConfig.getLatestOutput(prompt);
    }

    if (output == null) {
      return "";
    }

    if (output.output_type === "execute_result") {
      return output.data as string;
    } else {
      return "";
    }
  }
}
