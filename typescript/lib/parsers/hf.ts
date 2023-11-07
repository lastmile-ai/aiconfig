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
  ModelMetadata,
  ExecuteResult,
} from "../../types";
import { CompletionCreateParams } from "openai/resources";
import _ from "lodash";
import { getAPIKeyFromEnv } from "../utils";
import { ParameterizedModelParser } from "../parameterizedModelParser";
import { JSONObject } from "../../common";
import { AIConfigRuntime } from "../config";
import { InferenceOptions } from "../modelParser";

export class HuggingFaceTextGenerationModelParser extends ParameterizedModelParser<TextGenerationArgs> {
  private hfClient: HfInference;

  public constructor(modelId: string, use_api_token?: Boolean) {
    super();
    let token = use_api_token
      ? getAPIKeyFromEnv("HUGGING_FACE_API_TOKEN")
      : undefined;
    this.hfClient = new HfInference(token);
    this.id = modelId;
  }

  public serialize(
    promptName: string,
    data: TextGenerationArgs,
    aiConfig: AIConfigRuntime,
    params?: JSONObject | undefined
  ): Prompt | Prompt[] {
    const input: PromptInput = data.inputs;

    let modelMetadata: ModelMetadata | string;
    const promptModelMetadata: JSONObject = { ...data.parameters };

    // Check if AIConfig already has the model settings in its metadata
    const modelName = data.model ?? this.id;

    modelMetadata = aiConfig.getModelMetadata(
      data.parameters as JSONObject,
      this.id
    );

    const prompt: Prompt = {
      name: promptName,
      input,
      metadata: {
        model: modelMetadata,
        parameters: params ?? {},
      },
    };

    return [prompt];
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
    // Resolve the prompt template with the given parameters, and update the completion params
    const resolvedPrompt = this.resolvePromptTemplate(
      prompt.input as string,
      prompt,
      aiConfig,
      params
    );

    // Build the text generation args
    const modelMetadata = this.getModelSettings(prompt, aiConfig) ?? {};
    return this.refineCompletionParams(resolvedPrompt, modelMetadata);
  }

  public async run(
    prompt: Prompt,
    aiConfig: AIConfigRuntime,
    options?: InferenceOptions | undefined,
    params?: JSONObject | undefined
  ): Promise<Output | Output[]> {
    const textGenerationArgs = this.deserialize(prompt, aiConfig, params);

    // if no options are passed in, don't stream because streaming is dependent on a callback handler
    const stream = options ? (options.stream ? options.stream : true) : false;

    if (stream) {
      const response = await this.hfClient.textGenerationStream(
        textGenerationArgs
      );
      const output = await ConstructStreamOutput(
        response,
        options as InferenceOptions
      );
      return output;
    } else {
      const response = await this.hfClient.textGeneration(textGenerationArgs);
      const output = constructOutput(response);
      return output;
    }
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

/**
 * Handles and constructs the output for a stream response.
 * @param response
 * @param options
 * @returns
 */
async function ConstructStreamOutput(
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
      data: delta,
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
    data: data,
    execution_count: 0,
    metadata: metadata,
  } as ExecuteResult;

  return output;
}
