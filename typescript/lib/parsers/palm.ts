import { DiscussServiceClient } from "@google-ai/generativelanguage";
import { JSONObject } from "../../common";
import { Prompt, Output } from "../../types";
import { AIConfigRuntime } from "../config";
import { InferenceOptions } from "../modelParser";
import { ParameterizedModelParser } from "../parameterizedModelParser";
import { GoogleAuth } from "google-auth-library";
import { getAPIKeyFromEnv } from "../utils";

/**
 * Model Parser for PaLM Text Generation. PaLM API Currently does not support streaming
 * models/chat-bison-001
 */

export class PaLMParser extends ParameterizedModelParser {
  _id = "PaLMTextParser";

  public serialize(promptName: string, data: JSONObject, aiConfig: AIConfigRuntime, params?: JSONObject | undefined): Prompt | Prompt[] {
    throw new Error("Method not implemented.");
  }

  public deserialize(prompt: Prompt, aiConfig: AIConfigRuntime, params?: JSONObject | undefined): JSONObject {
    throw new Error("Method not implemented.");
  }

  public async run(
    prompt: Prompt,
    aiConfig: AIConfigRuntime,
    options?: InferenceOptions | undefined,
    params?: JSONObject | undefined
  ): Promise<Output[]> {
    throw new Error("Method not implemented.");
  }

  public getOutputText(aiConfig: AIConfigRuntime, output?: Output | undefined, prompt?: Prompt | undefined): string {
    throw new Error("Method not implemented.");
  }
}

/**
 *  Refines the completion params for the PALM text generation api. Removes any unsupported params.
 *  The supported keys were found by looking at the PaLM text generation api. `INSERT TYPE HERE`
 */
function refineTextGenerationParams() {
  throw new Error("Method not implemented.");
}

function constructOutputs() {

}
