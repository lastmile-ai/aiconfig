import { TextServiceClient, protos } from "@google-ai/generativelanguage";
import { JSONObject } from "../../common";
import { Prompt, Output, ModelMetadata, ExecuteResult } from "../../types";
import { AIConfigRuntime } from "../config";
import { InferenceOptions } from "../modelParser";
import { ParameterizedModelParser } from "../parameterizedModelParser";
import { GoogleAuth } from "google-auth-library";
import { getAPIKeyFromEnv } from "../utils";
import { google } from "@google-ai/generativelanguage/build/protos/protos";
import _ from "lodash";

/**
 * Model Parser for PaLM Text Generation. PaLM API Currently does not support streaming
 * PaLM Text Generation API: https://developers.generativeai.google/models/language#model_variations
 * Only supports one model: models/text-bison-001
 */

export class PaLMTextParser extends ParameterizedModelParser {
  private client: TextServiceClient | null = null;
  _id = "models/text-bison-001";

  public constructor() {
    super();
  }

  public serialize(promptName: string, data: JSONObject, aiConfig: AIConfigRuntime, params?: JSONObject | undefined): Prompt | Prompt[] {
    // input type was found by looking at the impl of text generation api. When calling textGeneration, step into the defintion of the function and look at the type of the input parameter
    // ModelParser abstract method types data as JSONObject, but we know that the data is going to be of type protos.google.ai.generativelanguage.v1beta2.IGenerateTextRequest.
    const input = data as protos.google.ai.generativelanguage.v1beta2.IGenerateTextRequest;

    const prompt = input.prompt?.text as string;
    const modelName = input.model as string;

    let modelMetadata: ModelMetadata;
    // Once relevant attributes are parsed, we no longer need them. These attributes get moved to their respective fields and the rest of the attributes are passed to the model as settings (model metadata).
    modelMetadata = aiConfig.getModelMetadata(_.omit(input, ["model", "prompt"]) as JSONObject, modelName);

    // Super simple since palm text generation is just one shot prompting.
    const prompts: Prompt[] = [
      {
        name: promptName,
        input: prompt,
        metadata: {
          model: modelMetadata,
          parameters: params ?? {},
        },
      },
    ];
    return prompts;
  }

  public deserialize(prompt: Prompt, aiConfig: AIConfigRuntime, params?: JSONObject | undefined): any {
    // TODO: @ankush-lastmile PaLM unable to set output type to Text Generation API request type, `protos.google.ai.generativelanguage.v1beta2.IGenerateTextRequest` looks like it conforms to JSONObject type but it doesn't. Returns any for now.

    const completionParams = this.getModelSettings(prompt, aiConfig) ?? {};

    // Get Prompt Template (aka prompt string), paramaterize it, and set it in completionParams
    const promptTemplate = prompt.input as string;
    const promptText = this.resolvePromptTemplate(promptTemplate, prompt, aiConfig, params);
    completionParams.prompt = { text: promptText };

    const refinedCompletionParams = refineTextGenerationParams(completionParams);

    return refinedCompletionParams;
  }

  public async run(
    prompt: Prompt,
    aiConfig: AIConfigRuntime,
    options?: InferenceOptions | undefined,
    params?: JSONObject | undefined
  ): Promise<Output[]> {
    if (!this.client) {
      const apiKey = getAPIKeyFromEnv("PALM_KEY");
      this.client = new TextServiceClient({
        authClient: new GoogleAuth().fromAPIKey(apiKey),
      });
    }

    const completionParams = this.deserialize(prompt, aiConfig, params);
    // Palm doesn't support streaming. See api docs link at the top of the file
    // API Response object is a list of [response, request, Object]. Destructure it to get the actual response
    const [response] = await this.client.generateText(completionParams);

    const outputs: ExecuteResult[] = constructOutputs(response);

    return outputs;
  }

  public getOutputText(aiConfig: AIConfigRuntime, output?: Output, prompt?: Prompt): string {
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
 *  Refines the completion params for the PALM text generation api. Removes any unsupported params.
 *  The supported keys were found by looking at the PaLM text generation api. `INSERT TYPE HERE`
 */
export function refineTextGenerationParams(params: JSONObject): protos.google.ai.generativelanguage.v1beta2.IGenerateTextRequest {
  return {
    model: params.model as string | null,
    prompt: params.prompt as google.ai.generativelanguage.v1beta2.ITextPrompt | null,
    temperature: params.temperature != null ? (params.temperature as number) : null,
    candidateCount: params.candidateCount != null ? (params.candidateCount as number) : null,
    maxOutputTokens: params.maxOutputTokens != null ? (params.maxOutputTokens as number) : null,
    topP: params.topP != null ? (params.topP as number) : null,
    topK: params.topK != null ? (params.topK as number) : null,
    safetySettings: params.safetySettings !== undefined ? (params.safetySettings as google.ai.generativelanguage.v1beta2.ISafetySetting[]) : null,
    stopSequences: params.stopSequences !== undefined ? (params.stopSequences as string[]) : null,
  };
}

function constructOutputs(response: protos.google.ai.generativelanguage.v1beta2.IGenerateTextResponse): ExecuteResult[] {
  if (!response.candidates) {
    return [];
  }

  const outputs: ExecuteResult[] = [];

  for (let i = 0; i < response.candidates.length; i++) {
    const candidate = response.candidates[i];
    const output: ExecuteResult = {
      output_type: "execute_result",
      data: candidate.output,
      execution_count: i,
      metadata: _.omit(candidate, ["output"])
    };

    outputs.push(output);
  }

  return outputs;
}
