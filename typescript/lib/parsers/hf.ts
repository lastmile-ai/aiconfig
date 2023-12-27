import {
  HfInference,
  TextGenerationArgs,
  TextGenerationOutput,
  TextGenerationStreamOutput,
} from "@huggingface/inference";

import _ from "lodash";
import { ParameterizedModelParser } from "../parameterizedModelParser";
import { AIConfigRuntime } from "../config";
import {
  ExecuteResult,
  ModelMetadata,
  Output,
  OutputData,
  Prompt,
  PromptInput,
} from "../../types";
import { InferenceOptions } from "../modelParser";
import { JSONObject } from "../../common";
import { getAPIKeyFromEnv } from "../utils";
import { CallbackEvent } from "../callback";

/**
 * A model parser for HuggingFace text generation models.
 * Set the environment variable HUGGING_FACE_API_TOKEN to use your HuggingFace API token.
 * A HuggingFace API token is not required to use this model parser.
 */
export class HuggingFaceTextGenerationParser extends ParameterizedModelParser<TextGenerationArgs> {
  private hfClient: HfInference | undefined;
  _id = "HuggingFaceTextGenerationParser";

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
      if (output.data?.hasOwnProperty("value")) {
        const outputData = output.data as OutputData;
        if (typeof outputData.value === "string") {
          return outputData.value;
        }
        // Sarmad + Ryan, let me know if you prefer I do something else
        // Was basing this off existing code for function calls in openai.ts
        return JSON.stringify(outputData.value);
      } else if (typeof output.data === "string") {
        return output.data;
      }

      // Doing this to be backwards-compatible with old output format
      // where we used to save the response in output.data
      if (output.data?.hasOwnProperty("generated_text")) {
        return (
          output.data as TextGenerationOutput | TextGenerationStreamOutput
        ).generated_text as string;
      }
    }
    return "";
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
    const newText = iteration.token.text;
    const metadata = iteration;

    accumulatedMessage += newText;
    const index = 0;
    options.callbacks!.streamCallback(newText, accumulatedMessage, 0);

    const data: OutputData = {
      kind: "string",
      // TODO: Investigate if we should use the accumulated message instead
      // of newText: https://github.com/lastmile-ai/aiconfig/issues/620
      value: newText,
    };
    output = {
      output_type: "execute_result",
      data,
      execution_count: index,
      metadata,
    } as ExecuteResult;
  }
  return output;
}

function constructOutput(response: TextGenerationOutput): Output {
  const data: OutputData = {
    kind: "string",
    value: response.generated_text,
  };
  const output = {
    output_type: "execute_result",
    data,
    execution_count: 0,
    metadata: { rawResponse: response },
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
