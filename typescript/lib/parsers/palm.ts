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
class PaLMParser extends ParameterizedModelParser {
  private client: DiscussServiceClient | null;

  //constructor
  public constructor() {
    super();
  }

  public serialize(promptName: string, data: JSONObject, aiConfig: AIConfigRuntime, params?: JSONObject | undefined): Prompt | Prompt[] {
    throw new Error("Method not implemented.");
  }
  public async deserialize(prompt: Prompt, aiConfig: AIConfigRuntime, params?: JSONObject | undefined): JSONObject {
    throw new Error("Method not implemented.");
  }
  public async run(
    prompt: Prompt,
    aiConfig: AIConfigRuntime,
    options?: InferenceOptions | undefined,
    params?: JSONObject | undefined
  ): Promise<Output[]> {
    if (!this.client) {
      const apiKey = getAPIKeyFromEnv("GOOGLE_API_KEY");
      this.client = new DiscussServiceClient({
        authClient: new GoogleAuth().fromAPIKey(apiKey),
      });
    }

    const completionParams = this.deserialize(prompt, aiConfig, params);

    const response = await this.client.generateMessage(completionParams);

    console.log(inspect(response, false, null, true /* enable colors */));


  }
  public getOutputText(aiConfig: AIConfigRuntime, output?: Output | undefined, prompt?: Prompt | undefined): string {
    throw new Error("Method not implemented.");
  }
}
function inspect(response: Promise<[import("@google-ai/generativelanguage/build/protos/protos").google.ai.generativelanguage.v1beta2.IGenerateMessageResponse, import("@google-ai/generativelanguage/build/protos/protos").google.ai.generativelanguage.v1beta2.IGenerateMessageRequest | undefined, {} | undefined]>, arg1: boolean, arg2: null, arg3: boolean): any {
    throw new Error("Function not implemented.");
}

