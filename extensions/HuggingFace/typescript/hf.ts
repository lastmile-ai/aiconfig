import {
  HfInference,
  TextGenerationArgs,
  TextGenerationOutput,
  TextGenerationStreamOutput,
} from "@huggingface/inference";

import {
  Prompt,
  Output,
  PromptInput,
  ParameterizedModelParser,
  ModelMetadata,
  ExecuteResult,
  AIConfigRuntime,
  InferenceOptions,
  CallbackEvent,
} from "aiconfig";
import _ from "lodash";
import * as aiconfig from "aiconfig";
import { JSONObject } from "aiconfig/dist/common";

export function getAPIKeyFromEnv(apiKeyName: string) {
  const apiKeyValue = process.env[apiKeyName];
  if (!apiKeyValue) {
    throw new Error(`Missing API key ${apiKeyName} in environment`);
  }
  return apiKeyValue;
}

/**
 * A model parser for HuggingFace text generation models.
 * Set the environment variable HUGGING_FACE_API_TOKEN to use your HuggingFace API token.
 * A HuggingFace API token is not required to use this model parser.
 */
export class HuggingFaceTextGenerationModelParserExtension extends ParameterizedModelParser<TextGenerationArgs> {
  private hfClient: HfInference | undefined;
  _id = "HuggingFaceTextGenerationModelParserExtension";

  public constructor() {
    super();
  }

  public serialize(
    promptName: string,
    data: TextGenerationArgs,
    aiConfig: AIConfigRuntime,
    params?: JSONObject | undefined
  ): Prompt | Prompt[] {
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

    const input: PromptInput = data.inputs;

    let modelMetadata: ModelMetadata | string;

    // Check if AIConfig already has the model settings in its metadata
    const modelName = data.model ?? this.id;

    modelMetadata = aiConfig.getModelMetadata(
      data.parameters as JSONObject,
      modelName
    );

    const prompts: Prompt[] = [
      {
        name: promptName,
        input,
        metadata: {
          model: modelMetadata,
          parameters: params ?? {},
        },
      },
    ];

    const endEvent = {
      name: "on_serialize_end",
      file: __filename,
      data: {
        result: prompts,
      },
    };
    aiConfig.callbackManager.runCallbacks(endEvent);

    return prompts;
  }

  public refineCompletionParams(
    input: string,
    params: JSONObject
  ): TextGenerationArgs {
    return {
      model: params.model as string,
      inputs: input,
      parameters: {
        do_sample:
          params.do_sample != null ? (params.do_sample as boolean) : undefined,
        max_new_tokens:
          params.max_new_tokens != null
            ? (params.max_new_tokens as number)
            : undefined,
        max_time:
          params.max_time != null ? (params.max_time as number) : undefined,
        num_return_sequences:
          params.num_return_sequences != null
            ? (params.num_return_sequences as number)
            : undefined,
        repetition_penalty:
          params.repetition_penalty != null
            ? (params.repetition_penalty as number)
            : undefined,
        return_full_text:
          params.return_full_text != null
            ? (params.return_full_text as boolean)
            : undefined,
        temperature:
          params.temperature != null
            ? (params.temperature as number)
            : undefined,
        top_k: params.top_k != null ? (params.top_k as number) : undefined,
        top_p: params.top_p != null ? (params.top_p as number) : undefined,
        truncate:
          params.truncate != null ? (params.truncate as number) : undefined,
        stop_sequences:
          params.stop_sequences != null
            ? (params.stop_sequences as string[])
            : undefined,
      },
    };
  }

  public deserialize(
    prompt: Prompt,
    aiConfig: AIConfigRuntime,
    params?: JSONObject | undefined
  ): TextGenerationArgs {
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

    // Build the text generation args
    const modelMetadata = this.getModelSettings(prompt, aiConfig) ?? {};
    const completionParams = this.refineCompletionParams(
      resolvedPrompt,
      modelMetadata
    );

    const endEvent = {
      name: "on_deserialize_end",
      file: __filename,
      data: {
        result: completionParams,
      },
    } as CallbackEvent;
    aiConfig.callbackManager.runCallbacks(endEvent);

    return completionParams;
  }

  public async run(
    prompt: Prompt,
    aiConfig: AIConfigRuntime,
    options?: InferenceOptions | undefined,
    params?: JSONObject | undefined
  ): Promise<Output | Output[]> {
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

    const textGenerationArgs = this.deserialize(prompt, aiConfig, params);

    if (!this.hfClient) {
      this.hfClient = createHuggingFaceClient();
    }

    // if no options are passed in, don't stream because streaming is dependent on a callback handler
    const stream = options ? (options.stream ? options.stream : true) : false;

    let output: Output | undefined;

    if (stream) {
      const response = await this.hfClient.textGenerationStream(
        textGenerationArgs
      );
      output = await constructStreamOutput(
        response,
        options as InferenceOptions
      );
    } else {
      const response = await this.hfClient.textGeneration(textGenerationArgs);
      output = constructOutput(response);
    }

    prompt.outputs = [output];

    const endEvent = {
      name: "on_run_end",
      file: __filename,
      data: {
        result: prompt.outputs,
      },
    } as CallbackEvent;
    await aiConfig.callbackManager.runCallbacks(endEvent);

    return prompt.outputs;
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
      return output.data ?? "";
    } else {
      return "";
    }
  }
}

/**
 * Handles and constructs the output for a stream response.
 * @param response
 * @param options
 * @returns
 */
async function constructStreamOutput(
  response: AsyncGenerator<TextGenerationStreamOutput>,
  options: InferenceOptions
): Promise<Output> {
  let accumulatedMessage = "";
  let output = {} as ExecuteResult;

  for await (const iteration of response) {
    const data = iteration.token.text;
    const metadata = iteration;

    accumulatedMessage += data;
    const delta = data;
    const index = 0;
    options.callbacks!.streamCallback(delta, accumulatedMessage, 0);

    output = {
      output_type: "execute_result",
      data: accumulatedMessage,
      execution_count: index,
      metadata: metadata,
    } as ExecuteResult;
  }
  return output;
}

function constructOutput(response: TextGenerationOutput): Output {
  const metadata = {};
  const data = response;

  const output = {
    output_type: "execute_result",
    data: data.generated_text,
    execution_count: 0,
    metadata: metadata,
  } as ExecuteResult;

  return output;
}

/**
 * Creates a new HuggingFace Inference client. Checks for an api token in the environment variables. If no api token is found, the client is created without an api token.
 * @returns
 */
function createHuggingFaceClient() {
  let huggingFaceAPIToken;
  try {
    huggingFaceAPIToken = getAPIKeyFromEnv("HUGGING_FACE_API_TOKEN");
  } catch (err) {
  } finally {
    return new HfInference(huggingFaceAPIToken);
  }
}
