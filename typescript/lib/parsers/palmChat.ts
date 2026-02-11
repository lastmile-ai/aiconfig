import { DiscussServiceClient, protos } from "@google-ai/generativelanguage";
import { JSONObject } from "../../common";
import { Prompt, Output, ModelMetadata, ExecuteResult } from "../../types";
import { AIConfigRuntime } from "../config";
import { InferenceOptions } from "../modelParser";
import { ParameterizedModelParser } from "../parameterizedModelParser";
import { GoogleAuth } from "google-auth-library";
import { getAPIKeyFromEnv } from "../utils";
import { google } from "@google-ai/generativelanguage/build/protos/protos";
import _ from "lodash";
import { CallbackEvent } from "../callback";

/**
 * Model Parser for PaLM Text Generation. PaLM API Currently does not support streaming
 * PaLM Text Generation API: https://developers.generativeai.google/models/language#model_variations
 * Only supports one model: models/text-bison-001
 */

const PALM_CHAT_MODEL_ID = "models/chat-bison-001";

export class PaLMChatParser extends ParameterizedModelParser {
  private client: DiscussServiceClient | null = null;
  _id = "models/chat-bison-001";

  public constructor() {
    super();
  }

  public serialize(promptName: string, data: any, aiConfig: AIConfigRuntime, params?: JSONObject | undefined): Prompt | Prompt[] {
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

    // input type was found by looking at the impl of text generation api. When calling textGeneration, step into the defintion of the function and look at the type of the input parameter
    // ModelParser abstract method types data as JSONObject, but we know that the data is going to be of type protos.google.ai.generativelanguage.v1beta2.IGenerateMessageRequest.
    const typedData = data as protos.google.ai.generativelanguage.v1beta2.IGenerateMessageRequest;
    const modelName = data.model as string;

    let modelMetadata: ModelMetadata = aiConfig.getModelMetadata(_.omit(typedData, ["prompt"]) as JSONObject, modelName);
    // Once relevant attributes are parsed, we no longer need them. These attributes get moved to their respective fields and the rest of the attributes are passed to the model as settings (model metadata).

    // PaLM Chat API supports multi shot.
    const prompts: Prompt[] = [];
    const systemPromptTemplate = typedData.prompt?.context || null;
    // Examples is a an object used by PaLM api to provide example inputs or outputs. If specified in the config, it will be passed forward to the api call.
    const examples = typedData.prompt?.examples || null;
    let i = 0;
    const messagesLength = typedData.prompt?.messages?.length ?? 0;
    while (i < messagesLength) {
      //Palm API supports citations. We don't support citations in our config, so we just pass null
      const promptTemplate = typedData.prompt?.messages?.[i]?.content;
      // PaLM API mandates a back and forth conversation. Can always expect a message from the user and a response from the model. If there's no latest response, the output will be undefined.
      const output = typedData.prompt?.messages?.[i + 1]?.content;
      const prompt: Prompt = {
        name: promptName,
        // This input shouldn't need to be type casted because this while loop will only run if there is a message from the user. Not sure why this is happening. TODO: Investigate @ankush-lastmile
        input: promptTemplate as string,
        metadata: modelMetadata,
        outputs: output ? [{ output_type: "execute_result", data: output }] : undefined,
      };
      prompts.push(prompt);
      i += 2;
    }

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

  public deserialize(prompt: Prompt, aiConfig: AIConfigRuntime, params?: JSONObject): any {
    const event = {
      name: "on_deserialize_start",
      file: __filename,
      data: {
        prompt,
        params,
      },
    };
    aiConfig.callbackManager.runCallbacks(event);

    const completionParams = this.getModelSettings(prompt, aiConfig) ?? {};
    let messages: google.ai.generativelanguage.v1beta2.IMessage[] = [];

    // Get and Set context AKA System Prompt
    let systemPromptTemplate = prompt.metadata?.context || null;
    if (systemPromptTemplate) {
      systemPromptTemplate = this.resolvePromptTemplate(systemPromptTemplate, prompt, aiConfig, params);
    }

    // Build Chat History
    // Default to true if remember_chat_context is not specified
    if (prompt.metadata?.remember_chat_context || true) {
      for (let i = 0; i < aiConfig.prompts.length; i++) {
        const previousPrompt = aiConfig.prompts[i];
        // Stop building chat history if we reach the current prompt
        if (previousPrompt.name === prompt.name) {
          break;
        }
        // Chat History is only built with prompts from the same model
        if (aiConfig.getModelName(previousPrompt) === this.id) {
          // PaLM Api requires a back and forth conversation. If there's no previous output, skip that prompt.
          if (previousPrompt.outputs!.length > 0) {
            const promptTemplate = this.getPromptTemplate(prompt, aiConfig);
            const resolvedPromptTemplate = this.resolvePromptTemplate(promptTemplate, prompt, aiConfig, params);

            const prevPromptOutputText = aiConfig.getOutputText(previousPrompt, aiConfig.getLatestOutput(previousPrompt));

            messages.push({ content: resolvedPromptTemplate, author: "0" });
            messages.push({ content: prevPromptOutputText, author: "1" });
          }
        }
      }
    }

    const currentPromptTemplate = this.getPromptTemplate(prompt, aiConfig);
    const resolvedCurrentPromptTemplate = this.resolvePromptTemplate(currentPromptTemplate, prompt, aiConfig, params);
    messages.push({ content: resolvedCurrentPromptTemplate, author: "0" });

    completionParams.prompt = {
      context: systemPromptTemplate,
      messages,
      examples: completionParams.examples || null,
    };

    const refinedCompletionParams = refineGenerateMessageParams(completionParams);

    const endEvent = {
      name: "on_deserialize_end",
      file: __filename,
      data: {
        result: refinedCompletionParams,
      },
    };
    aiConfig.callbackManager.runCallbacks(endEvent);

    return refinedCompletionParams;
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

    if (!this.client) {
      const apiKey = getAPIKeyFromEnv("PALM_KEY");
      this.client = new DiscussServiceClient({
        authClient: new GoogleAuth().fromAPIKey(apiKey),
      });
    }

    const completionParams = this.deserialize(prompt, aiConfig, params);
    // Palm doesn't support streaming. See api docs link at the top of the file
    // API Response object is a list of [response, request, Object]. Destructure it to get the actual response
    const [response] = await this.client.generateMessage(completionParams);

    const outputs: ExecuteResult[] = constructOutputs(response);
    const endEvent = {
      name: "on_run_end",
      file: __filename,
      data: {
        result: outputs,
      },
    } as CallbackEvent;
    await aiConfig.callbackManager.runCallbacks(endEvent);

    prompt.outputs = outputs;

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

  //   public constructConversationHistory(aiconfig: AIConfigRuntime, prompt: Prompt, params: JSONObject): any {
  //     if (prompt.metadata!.remember_chat_context) {
  //       for (let i = 0; i < aiconfig.prompts.length; i++) {
  //         let prevPrompt = aiconfig.prompts[i];

  //         if (prevPrompt.name === prompt.name) {
  //           break;
  //         }

  //         if (aiconfig.get_model_name(prevPrompt) === self.id) {
  //           const resolvedPrevPrompt = this.resolvePromptTemplate(prevPrompt.input, params, aiConfig);
  //           completionParams.messages.push({ content: resolvedPrevPrompt, author: "0" });

  //           const outputText = aiConfig.get_output_text(prevPrompt, aiConfig.get_latest_output(prevPrompt));
  //           completionParams["messages"].push({ content: outputText, author: "1" });
  //         }
  //       }
  //     }
  //     completionParams["messages"].push({ content: resolvePrompt(prompt, params, aiConfig), author: "0" });
  //   }
}

/**
 *  Refines the completion params for the PALM chat generation api. Removes any unsupported params.
 *  The supported keys were found by looking at the PaLM chat api. `INSERT TYPE HERE`
 */
export function refineGenerateMessageParams(params: any): protos.google.ai.generativelanguage.v1beta2.IGenerateMessageRequest {
  return {
    model: params.model as string | null,
    prompt: params.prompt as google.ai.generativelanguage.v1beta2.IMessagePrompt | null,
    temperature: params.temperature != null ? (params.temperature as number) : null,
    candidateCount: params.candidateCount != null ? (params.candidateCount as number) : null,
    topP: params.topP != null ? (params.topP as number) : null,
    topK: params.topK != null ? (params.topK as number) : null,
  };
}

function constructOutputs(response: protos.google.ai.generativelanguage.v1beta2.IGenerateMessageResponse): ExecuteResult[] {
  if (!response.candidates) {
    return [];
  }

  const outputs: ExecuteResult[] = [];

  for (let i = 0; i < response.candidates.length; i++) {
    const candidate = response.candidates[i];
    const output: ExecuteResult = {
      output_type: "execute_result",
      data: candidate.content,
      execution_count: i,
      metadata: _.omit(candidate, ["output"]),
    };

    outputs.push(output);
  }

  return outputs;
}
