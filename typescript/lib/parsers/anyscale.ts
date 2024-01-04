import { JSONObject } from "../../common";
import { Output, Prompt } from "../../types";
import { AIConfigRuntime } from "../config";
import OpenAI from "openai";
import { InferenceOptions } from "../modelParser";
import { OpenAIChatModelParser } from "./openai";

export class AnyscaleEndpointModelParser extends OpenAIChatModelParser {
  public async run(
    prompt: Prompt,
    aiConfig: AIConfigRuntime,
    options?: InferenceOptions,
    params?: JSONObject | undefined
  ): Promise<Output[]> {
    if (!this.openai) {
      const apiKey =
        process.env.ANYSCALE_ENDPOINT_API_KEY ?? process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error(
          "Missing API key ANYSCALE_ENDPOINT_API_KEY or OPENAI_API_KEY in environment. Please set one of these environment variables to utilize Anyscale Endpoints. You can get your API key from https://docs.endpoints.anyscale.com/guides/authenticate"
        );
      }

      this.openai = new OpenAI({
        apiKey,
        baseURL: "https://api.endpoints.anyscale.com/v1",
        ...(this.openaiOptions || {}),
      });
    }

    return super.run(prompt, aiConfig, options, params);
  }
}
