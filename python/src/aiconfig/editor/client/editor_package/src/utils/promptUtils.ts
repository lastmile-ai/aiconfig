import { JSONObject, JSONValue, Prompt } from "aiconfig";
import { OpenAIChatModelParserPromptSchema } from "../shared/prompt_schemas/OpenAIChatModelParserPromptSchema";
import { OpenAIChatVisionModelParserPromptSchema } from "../shared/prompt_schemas/OpenAIChatVisionModelParserPromptSchema";
import { DalleImageGenerationParserPromptSchema } from "../shared/prompt_schemas/DalleImageGenerationParserPromptSchema";
import { PaLMTextParserPromptSchema } from "../shared/prompt_schemas/PaLMTextParserPromptSchema";
import { PaLMChatParserPromptSchema } from "../shared/prompt_schemas/PaLMChatParserPromptSchema";
import { HuggingFaceTextGenerationParserPromptSchema } from "../shared/prompt_schemas/HuggingFaceTextGenerationParserPromptSchema";
import { AnyscaleEndpointPromptSchema } from "../shared/prompt_schemas/AnyscaleEndpointPromptSchema";
import { HuggingFaceText2ImageDiffusorPromptSchema } from "../shared/prompt_schemas/HuggingFaceText2ImageDiffusorPromptSchema";
import { HuggingFaceTextGenerationTransformerPromptSchema } from "../shared/prompt_schemas/HuggingFaceTextGenerationTransformerPromptSchema";
import { HuggingFaceAutomaticSpeechRecognitionPromptSchema } from "../shared/prompt_schemas/HuggingFaceAutomaticSpeechRecognitionPromptSchema";
import { HuggingFaceTextSummarizationTransformerPromptSchema } from "../shared/prompt_schemas/HuggingFaceTextSummarizationTransformerPromptSchema";
import { HuggingFaceImage2TextTransformerPromptSchema } from "../shared/prompt_schemas/HuggingFaceImage2TextTransformerPromptSchema";
import { HuggingFaceText2SpeechTransformerPromptSchema } from "../shared/prompt_schemas/HuggingFaceText2SpeechTransformerPromptSchema";

/**
 * Get the name of the model for the specified prompt. The name will either be specified in the prompt's
 * model metadata, or as the default_model in the aiconfig metadata
 * @param prompt The Prompt to get the model name for
 * @param defaultConfigModelName The default model name specified in the AIConfig metadata (if specified)
 * @returns string The name of the model for the specified prompt
 */
export function getPromptModelName(
  prompt: Prompt,
  defaultConfigModelName?: string
): string | undefined {
  const promptMetadataModel = prompt.metadata?.model;
  if (promptMetadataModel) {
    if (typeof promptMetadataModel === "string") {
      return promptMetadataModel;
    } else {
      return promptMetadataModel.name;
    }
  }

  // Model must be specified as default if not specified for the Prompt
  return defaultConfigModelName;
}

// TODO: Schemas should be statically defined with the model parsers and loaded alongside config, keyed on registered model names
// Notes here: We could technically just refine the full JSON schema for the prompt since we currently allow model parsers to have full control, including:
//   - defining metadata outside of model metadata --> e.g. remember_chat_context for openai parser
//   - placing responsibility for proper handling/serialization of core config properties on the model parser (parameters, tags)
// That would allow us to do some powerful things like:
//   - share JSON schema for model parser between languages
//   - validate serialization against it
// Long-term, maybe we just have model parser core class handle serialization of parameters/tags and concrete implementations just
// handle serialization of non-core metadata and model inference settings?
// In any case, below we are defining 3 keys in the schema:
//   - input: the prompt input, either string or more refined object including data / attachment types
//   - model_settings: supported settings for the model, will be serialized either in top-level model metadata or prompt.metadata.model.settings
//   - prompt_metadata: additional metadata for the prompt, EXCLUDES parameters, tags, model
// A couple reasons for doing this vs refinining full JSON schema:
//   - we may want to set constraints, like range of acceptable values, which aren't part of the prompt representation in JSON schema
//   - we can focus on the important 3 params defined above, instead of requiring re-definining the full JSON schema
// Should we define a JSON schema for PromptSchema type so we can safely serialize/deserialize them?
export const PROMPT_SCHEMAS: Record<string, PromptSchema> = {
  // OpenAIChatModelParser
  "gpt-4": OpenAIChatModelParserPromptSchema,
  "gpt-4-0314": OpenAIChatModelParserPromptSchema,
  "gpt-4-0613": OpenAIChatModelParserPromptSchema,
  "gpt-4-32k": OpenAIChatModelParserPromptSchema,
  "gpt-4-32k-0314": OpenAIChatModelParserPromptSchema,
  "gpt-4-32k-0613": OpenAIChatModelParserPromptSchema,
  "gpt-3.5-turbo": OpenAIChatModelParserPromptSchema,
  "gpt-3.5-turbo-16k": OpenAIChatModelParserPromptSchema,
  "gpt-3.5-turbo-0301": OpenAIChatModelParserPromptSchema,
  "gpt-3.5-turbo-0613": OpenAIChatModelParserPromptSchema,
  "gpt-3.5-turbo-16k-0613": OpenAIChatModelParserPromptSchema,

  // TODO: Add GPT4-V parser in AIConfig
  "gpt-4-vision-preview": OpenAIChatVisionModelParserPromptSchema,

  // DalleImageGenerationParser
  "dall-e-2": DalleImageGenerationParserPromptSchema,
  "dall-e-3": DalleImageGenerationParserPromptSchema,

  // HuggingFaceTextGenerationParser
  HuggingFaceTextGenerationParser: HuggingFaceTextGenerationParserPromptSchema,

  // PaLMTextParser
  "models/text-bison-001": PaLMTextParserPromptSchema,

  // PaLMChatParser
  "models/chat-bison-001": PaLMChatParserPromptSchema,

  // AnyscaleEndpoint
  AnyscaleEndpoint: AnyscaleEndpointPromptSchema,

  // Local HuggingFace Parsers
  HuggingFaceText2ImageDiffusor: HuggingFaceText2ImageDiffusorPromptSchema,
  TextGeneration: HuggingFaceTextGenerationTransformerPromptSchema,
  Text2Image: HuggingFaceText2ImageDiffusorPromptSchema,
  AutomaticSpeechRecognition: HuggingFaceAutomaticSpeechRecognitionPromptSchema,
  HuggingFaceTextSummarizationTransformer:
    HuggingFaceTextSummarizationTransformerPromptSchema,
  HuggingFaceTextTranslationTransformer:
    HuggingFaceTextGenerationTransformerPromptSchema,
  HuggingFaceImage2TextTransformer:
    HuggingFaceImage2TextTransformerPromptSchema,
  Text2Speech: HuggingFaceText2SpeechTransformerPromptSchema,
};

export type PromptInputSchema =
  | PromptInputStringSchema
  | PromptInputObjectSchema;

export type PromptInputStringSchema = {
  type: "string";
};

export type PromptInputObjectDataSchema = {
  type: string;
};

export type PromptInputObjectAttachmentsSchema = {
  type: "array";
  min_items?: number;
  max_items?: number;
  items: {
    type: "attachment";
    required: string[];
    mime_types: string[];
    max_size?: number;
    properties: {
      data: {
        type: string;
      };
      metadata?: GenericPropertiesSchema;
    };
  };
};

export type PromptInputObjectSchema = {
  type: "object";
  properties: {
    data?: PromptInputObjectDataSchema;
    attachments?: PromptInputObjectAttachmentsSchema;
  } & Record<string, JSONObject>;
  required?: string[] | undefined;
};

export type GenericPropertiesSchema = {
  type: "object";
  properties: Record<
    string,
    {
      [key: string]: JSONValue;
    }
  >;
  required?: string[] | undefined;
};

export type PromptSchema = {
  input: PromptInputSchema;
  model_settings?: GenericPropertiesSchema;
  prompt_metadata?: GenericPropertiesSchema;
};

export function getPromptSchema(
  prompt: Prompt,
  defaultConfigModelName?: string
): PromptSchema | undefined {
  const modelName = getPromptModelName(prompt, defaultConfigModelName);
  if (!modelName) {
    return undefined;
  }
  return PROMPT_SCHEMAS[modelName];
}

function isTextInputModality(prompt: Prompt): boolean {
  const schema = getPromptSchema(prompt);
  if (schema) {
    return schema.input.type === "string"; // TODO: Handle object case
  }

  return (
    // TODO: Handle case where data is object with values associated with mimetype?
    typeof prompt.input === "string" || typeof prompt.input.data === "string"
  );
}

export function checkParametersSupported(prompt: Prompt): boolean {
  return prompt.metadata?.parameters != null || isTextInputModality(prompt);
}

export function getDefaultPromptInputForModel(model: string) {
  const schema = PROMPT_SCHEMAS[model];
  if (schema) {
    if (schema.input.type === "string") {
      return "";
    } else {
      if (schema.input.properties.data) {
        return {
          data: schema.input.properties.data.type === "string" ? "" : {},
        };
      }
      return {};
    }
  }

  return "";
}
