import { HfInference, TextGenerationArgs } from "@huggingface/inference";
import { JSONObject } from "../common";
import { AIConfigRuntime } from "../lib/config";
import { InferenceOptions } from "../lib/modelParser";
import { ModelParserRegistry } from "../lib/modelParserRegistry";
import { ParameterizedModelParser } from "../lib/parameterizedModelParser";
import {
  Prompt,
  Output,
  PromptInput,
  ModelMetadata,
  ExecuteResult,
} from "../types";
import { CompletionCreateParams } from "openai/resources";
import _ from "lodash";

// For this demo, we'll create a model parser for HuggingFace text generation models,
// which will support text generation models accessible in Hugging Face Inference API.

/**
 * NOTES:
 * 1. Added new class extending ParameterizedModelParser and just used the code lens option
 * to auto-add the required methods
 * *
 * 2. [Painpoint] HF API has TextGenerationArgs type, but got Type 'JSONObject' is not assignable to type 'TextGenerationArgs'.
 * Realized from example that the class definition need the data type specified when extending the base parser.
 * Suggestion: Just make clear in the documentation
 *
 * 3. [Painpoint] In serialize, the PromptInput returned can be string or semi-arbitrary object if more complex data is needed. It
 * is not clear why to use complex prompt data vs just using metadata for the Prompt. We should have a clear example / explanation
 * for this or consider removing to reduce confusion
 *
 * 4. [Thought] TextGenerationArgs has data.accessToken to use for the request, but we don't want to serialize that into the prompt
 * contents if it will be saved to disk. Need to figure out how to get this through to the run call
 *
 * 5. [Thought] TextGenerationArgs has optional model -- HF endpoint will use the default model for the task if no model is provided.
 * How are we thinking of persisting the model in the aiconfig if we don't know it until response time? Also related - ModelParser
 * is supposed to have an id set but not enforced for ModelParser creation, seems like it only gets hit if no model is specified in
 * the data
 *
 * 6. [Painpoint] Handling global model metada overrides with provided data in serialize needs to be pulled into a reusable helper or
 * part of the base class so it doesn't need to be repeated. Even the params handling could probably be made easier since I basically
 * just want to define how I get the input data and metadata from completion params and then pass through params as-is and just want
 * the metadata to be what I've defined overriding the global. i.e can have default implementation of serialize which just gets
 * input and metadata from abstract functions and then does the params and metadata overrides behind the scenes. getModelSettings
 * can also reuse the same helper
 *
 * 7. For run, function signature has options before params. I use params but not options (non streaming). Should have
 * options last so I can ignore it when calling run for my parser
 *
 * 8. Should we support run returning both single or array of outputs? Confusing which to do. Probably better to require array and just
 * have implementation wrap single output with array as needed
 *
 * 9. getOutputText can probably just have a default implementation that handles execute_result outputs by default
 *
 * 10. Can we have a .run() for the aiconfig to run all cells from top to bottom sequentially?
 *
 * 11. In https://github.com/lastmile-ai/aiconfig/pull/24/commits/cfd0cda2f823609b4366e3747efebb81574b58a1 I want to run the prompt
 * I added but the config doesn't have it despite me specying the name on add. Serialized config has name as prompt2
 */

class HuggingFaceTextGenerationModelParser extends ParameterizedModelParser<TextGenerationArgs> {
  private hfClient: HfInference;

  public constructor(apiKey?: string) {
    super();
    this.hfClient = new HfInference(apiKey /* TODO: Support options */);
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
    const globalModelMetadata = aiConfig.metadata.models?.[modelName];

    if (globalModelMetadata != null) {
      // Check if the model settings from the input data are the same as the global model settings

      // Compute the difference between the global model settings and the model settings from the input data
      // If there is a difference, then we need to add the different model settings as overrides on the prompt's metadata
      const keys = _.union(
        _.keys(globalModelMetadata),
        _.keys(promptModelMetadata)
      );
      const overrides = _.reduce(
        keys,
        (result: JSONObject, key) => {
          if (!_.isEqual(globalModelMetadata[key], promptModelMetadata[key])) {
            result[key] = promptModelMetadata[key];
          }
          return result;
        },
        {}
      );

      if (Object.keys(overrides).length > 0) {
        modelMetadata = {
          name: modelName,
          settings: overrides,
        };
      } else {
        modelMetadata = modelName;
      }
    } else {
      modelMetadata = {
        name: modelName,
        settings: promptModelMetadata,
      };
    }

    const prompt: Prompt = {
      name: promptName,
      input,
      metadata: {
        model: modelMetadata,
        parameters: params ?? {},
      },
    };

    return prompt;
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
    const response = await this.hfClient.textGeneration(textGenerationArgs);
    const output: ExecuteResult = {
      output_type: "execute_result",
      data: { ...response }, // generated_text: "..."
      execution_count: 0,
    };

    return output;
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

async function addModelParser() {
  const mistralModelName = "mistralai/Mistral-7B-v0.1";

  ModelParserRegistry.registerModelParser(
    new HuggingFaceTextGenerationModelParser(),
    [mistralModelName]
  );

  const data = {
    model: mistralModelName,
    inputs: "This is a test HF run",
  };

  const aiConfig = AIConfigRuntime.create(
    "addModelParserDemo",
    "this is a demo AIConfig with a new model parser added"
  );

  const result: Prompt = (await aiConfig.serialize(
    mistralModelName,
    data
  )) as Prompt;

  aiConfig.addPrompt(result, "prompt2");

  aiConfig.save("demo/addModelParserDemo.aiconfig.json", {
    serializeOutputs: true,
  });

  await aiConfig.run("prompt2");

  // This is a Demo test.
  console.log(aiConfig.getOutputText("prompt2"));
}

addModelParser();
