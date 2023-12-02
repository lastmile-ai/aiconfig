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
 * models/chat-bison-001
 */

export class PaLMParser extends ParameterizedModelParser {
  private client: TextServiceClient | null = null;
  _id = "PaLMTextParser";

  //constructor
  public constructor() {
    super();
  }

  public serialize(promptName: string, data: JSONObject, aiConfig: AIConfigRuntime, params?: JSONObject | undefined): Prompt | Prompt[] {
    // input type conforms to protos.google.ai.generativelanguage.v1beta2.IGenerateTextRequest
    const input = data as protos.google.ai.generativelanguage.v1beta2.IGenerateTextRequest;

    // get prompt out of data
    const prompt = input.prompt?.text as string;

    let modelMetadata: ModelMetadata;

    // Check if AIConfig already has the model settings in its metadata
    const modelName = input.model as string;

    modelMetadata = aiConfig.getModelMetadata(_.omit(input, ["model", "prompt"]) as JSONObject, modelName);

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

    const response = (await this.client.generateText(completionParams))[0];

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
    safetySettings: params.safetySettings as google.ai.generativelanguage.v1beta2.ISafetySetting[] | null,
    stopSequences: params.stopSequences as string[] | null,
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
      metadata: candidate,
    };

    outputs.push(output);
  }

  return outputs;
}
