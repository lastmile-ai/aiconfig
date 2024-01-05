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
import { CallbackEvent } from "aiconfig/dist/lib/callback";

// Use require since there's no module declaration for this package
const inclusion = require("inclusion");

const DEFAULT_MODEL_DIR = path.join(process.cwd(), "models");

export type ModelOptions = Omit<LlamaModelOptions, "modelPath">;

export interface LlamaCompletionParams extends LLamaChatPromptOptions {
  model: string; // e.g. "llama-2-7b-chat"
  prompt: string;

  // Used when constructing the session to perform the prompt
  conversationHistory?: ConversationInteraction[];
  systemPrompt?: string;
}

/**
 * A model parser for LLaMA models, leveraging llama-node API. Construct this parser with the absolute
 * path to the directory containing the LLaMA model GGUF format (.gguf) files for the supported models.
 * The file names must contain the model name, e.g. "llama-2-7b-chat.Q4_K_M.gguf" contains llama-2-7b-chat.
 * e.g. The following commands will download working LLaMA models to the ./models directory:
 * curl -L https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf --output ./models/llama-2-7b-chat.Q4_K_M.gguf
 * curl -L https://huggingface.co/TheBloke/Llama-2-13B-chat-GGUF/resolve/main/llama-2-13b-chat.Q4_K_M.gguf --output ./models/llama-2-13b-chat.Q4_K_M.gguf
 * curl -L https://huggingface.co/TheBloke/CodeUp-Llama-2-13B-Chat-HF-GGUF/resolve/main/codeup-llama-2-13b-chat-hf.Q4_K_M.gguf --output ./models/codeup-llama-2-13b-chat-hf.Q4_K_M.gguf
 */
export class LlamaModelParser extends ParameterizedModelParser<LlamaCompletionParams> {
  _id = "LLaMA";

  modelDir: string = DEFAULT_MODEL_DIR;
  modelOptions?: ModelOptions;

  private modelContexts: Map<string, LlamaContext> = new Map();

  public constructor(modelDir?: string, modelOptions?: ModelOptions) {
    super();
    this.modelDir = modelDir ?? this.modelDir;
    this.modelOptions = modelOptions;
  }

  private async getModelSession(
    model: string,
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
  ): Prompt[] {
    const startEvent = {
      name: "on_serialize_start",
      file: __filename,
      data: {
        promptName,
        data,
        params,
      },
    } as CallbackEvent;
    aiConfig.callbackManager.runCallbacks(startEvent);

    const { prompt: input, conversationHistory, ...completionParams } = data;

    // Metadata is constructed by obtaining any default metadata for the model
    // from the AIConfig and overriding with the completionParams here
    const modelMetadata = aiConfig.getModelMetadata(
      completionParams,
      completionParams.model
    );

    const prompts: Prompt[] = [];

    if (conversationHistory && conversationHistory.length > 0) {
      let i = 0;
      while (i < conversationHistory.length) {
        const message = conversationHistory[i];
        const prompt: Prompt = {
          name: `history_${promptName}_${prompts.length + 1}`,
          input: message.prompt,
          metadata: {
            model: modelMetadata,
            parameters: params,
            remember_chat_context: true,
          },
          outputs: [
            {
              output_type: "execute_result",
              data: message.response,
            },
          ],
        };

        prompts.push(prompt);
        i++;
      }
    }

    const newPrompt: Prompt = {
      name: promptName,
      input,
      metadata: {
        model: modelMetadata,
        parameters: params,
        remember_chat_context: (conversationHistory?.length ?? 0) > 0,
      },
    };
    prompts.push(newPrompt);

    const endEvent = {
      name: "on_serialize_end",
      file: __filename,
      data: { prompts },
    };
    aiConfig.callbackManager.runCallbacks(endEvent);

    return prompts;
  }

  public refineCompletionParams(
    input: string,
    params: JSONObject
  ): LlamaCompletionParams {
    return {
      model: params.model as string,
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
    const startEvent = {
      name: "on_deserialize_start",
      file: __filename,
      data: {
        prompt,
        params,
      },
    } as CallbackEvent;
    aiConfig.callbackManager.runCallbacks(startEvent);

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

    const result = {
      ...promptParams,
      conversationHistory,
    };

    const endEvent = {
      name: "on_deserialize_end",
      file: __filename,
      data: {
        result,
      },
    } as CallbackEvent;
    aiConfig.callbackManager.runCallbacks(endEvent);

    return result;
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
  ): Promise<Output[]> {
    const startEvent = {
      name: "on_run_start",
      file: __filename,
      data: {
        prompt,
        options,
        params,
      },
    } as CallbackEvent;
    await aiConfig.callbackManager.runCallbacks(startEvent);

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
    const outputs = [
      {
        output_type: "execute_result",
        data: response,
        execution_count: 0,
        metadata: {},
      } as ExecuteResult,
    ];

    prompt.outputs = outputs;

    const endEvent = {
      name: "on_run_end",
      file: __filename,
      data: {
        result: outputs,
      },
    } as CallbackEvent;
    await aiConfig.callbackManager.runCallbacks(endEvent);

    return outputs;
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
